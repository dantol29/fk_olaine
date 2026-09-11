"use server";

import { eq } from "drizzle-orm";
import { disableTypes, imageSize } from "image-size";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { partners } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";
import { EXTENSION_BY_MIME_TYPE, deleteUploadedPhoto, saveUploadedPhoto } from "@/lib/uploads";

// Only jpg/png/webp uploads are ever accepted (see EXTENSION_BY_MIME_TYPE
// below) — disable every other format's decoder so a file whose *bytes*
// are crafted as one of them (the declared MIME type is client-supplied
// and trivially spoofable) can never reach a vulnerable parser. image-size
// has an unpatched DoS (infinite loop) in its ICNS/JXL/HEIF decoders —
// GHSA-w3rx-r6r6-pgpr / GHSA-5p2g-fcmc-qvqq — with no fixed version
// available, so parser-level disabling is the mitigation.
disableTypes([
  "bmp",
  "cur",
  "dds",
  "gif",
  "heif",
  "icns",
  "ico",
  "j2c",
  "jp2",
  "jxl",
  "jxl-stream",
  "ktx",
  "pnm",
  "psd",
  "svg",
  "tga",
  "tiff",
]);

// Every page that renders the marquee or the footer, both of which show
// the partners list — see src/components/partners-bar.tsx / site-footer.tsx.
const PARTNER_VISIBLE_PATHS = ["/", "/treneri", "/jaunumi", "/komandas"] as const;

function revalidatePartnerPaths() {
  revalidatePath("/admin/partners");
  for (const path of PARTNER_VISIBLE_PATHS) revalidatePath(path);
}

function parsePartnerInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const size = String(formData.get("size") ?? "lg");
  const needsWhite = formData.get("needsWhite") === "on";

  if (!name) return { error: "Nosaukums ir obligāts." } as const;
  if (size !== "lg" && size !== "sm") return { error: "Nederīgs izmērs." } as const;

  return { name, size, needsWhite } as const;
}

async function probeImageDimensions(file: File): Promise<{ width: number; height: number }> {
  if (!EXTENSION_BY_MIME_TYPE[file.type]) {
    throw new Error("Attēlam jābūt JPEG, PNG vai WebP formātā.");
  }

  const buffer = new Uint8Array(await file.arrayBuffer());
  const { width, height } = imageSize(buffer);
  if (!width || !height) {
    throw new Error("Neizdevās nolasīt attēla izmērus.");
  }
  return { width, height };
}

export async function createPartner(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parsePartnerInput(formData);
  if ("error" in parsed) return parsed;

  const logo = formData.get("logo");
  if (!(logo instanceof File) || logo.size === 0) {
    return { error: "Logotips ir obligāts." };
  }

  let logoUrl: string;
  let logoWidth: number;
  let logoHeight: number;
  try {
    const dimensions = await probeImageDimensions(logo);
    logoWidth = dimensions.width;
    logoHeight = dimensions.height;
    logoUrl = await saveUploadedPhoto(logo, "partners");
  } catch (error) {
    return { error: (error as Error).message };
  }

  await db.insert(partners).values({
    ...parsed,
    logoUrl,
    logoWidth,
    logoHeight,
    createdAt: Date.now(),
  });

  revalidatePartnerPaths();
  redirect("/admin/partners");
}

export async function updatePartner(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parsePartnerInput(formData);
  if ("error" in parsed) return parsed;

  const [existing] = await db.select().from(partners).where(eq(partners.id, id));
  if (!existing) return { error: "Partneris nav atrasts." };

  let logoUrl = existing.logoUrl;
  let logoWidth = existing.logoWidth;
  let logoHeight = existing.logoHeight;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    try {
      const dimensions = await probeImageDimensions(logo);
      logoWidth = dimensions.width;
      logoHeight = dimensions.height;
      logoUrl = await saveUploadedPhoto(logo, "partners");
    } catch (error) {
      return { error: (error as Error).message };
    }
    await deleteUploadedPhoto(existing.logoUrl);
  }

  await db
    .update(partners)
    .set({ ...parsed, logoUrl, logoWidth, logoHeight })
    .where(eq(partners.id, id));

  revalidatePartnerPaths();
  redirect("/admin/partners");
}

export async function deletePartner(id: number) {
  await requireAdminSession();

  const [existing] = await db.select().from(partners).where(eq(partners.id, id));
  if (existing) {
    await deleteUploadedPhoto(existing.logoUrl);
  }

  await db.delete(partners).where(eq(partners.id, id));
  revalidatePartnerPaths();
}
