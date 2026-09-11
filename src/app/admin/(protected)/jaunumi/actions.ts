"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { articles } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";
import { deleteUploadedPhoto, saveUploadedPhoto } from "@/lib/uploads";

const CATEGORIES = ["Klubs", "Komandas", "Spēles", "Treniņi", "Pasākumi"] as const;

function slugify(value: string): string {
  const withoutDiacritics = value
    .toLowerCase()
    .replace(/[āä]/g, "a")
    .replace(/[čć]/g, "c")
    .replace(/[ēé]/g, "e")
    .replace(/ģ/g, "g")
    .replace(/[īí]/g, "i")
    .replace(/ķ/g, "k")
    .replace(/ļ/g, "l")
    .replace(/ņ/g, "n")
    .replace(/[šś]/g, "s")
    .replace(/[ūü]/g, "u")
    .replace(/[žź]/g, "z");
  return withoutDiacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseArticleInput(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const teamIdRaw = String(formData.get("teamId") ?? "");
  const authorCoachIdRaw = String(formData.get("authorCoachId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const quoteText = String(formData.get("quoteText") ?? "").trim();
  const quoteAuthor = String(formData.get("quoteAuthor") ?? "").trim();
  const quoteRole = String(formData.get("quoteRole") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? "") || title);

  if (!title) return { error: "Virsraksts ir obligāts." } as const;
  if (!excerpt) return { error: "Ievads ir obligāts." } as const;
  if (!date) return { error: "Datums ir obligāts." } as const;
  if (!(CATEGORIES as readonly string[]).includes(category)) {
    return { error: "Jāizvēlas kategorija." } as const;
  }
  if (!body) return { error: "Raksta teksts ir obligāts." } as const;
  if (!slug) return { error: "Nederīgs virsraksts saites veidošanai." } as const;

  const bodyLines = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    slug,
    title,
    excerpt,
    date,
    category: category as (typeof CATEGORIES)[number],
    teamId: teamIdRaw ? Number(teamIdRaw) : null,
    authorCoachId: authorCoachIdRaw ? Number(authorCoachIdRaw) : null,
    body: bodyLines.join("\n"),
    quoteText: quoteText || null,
    quoteAuthor: quoteText ? quoteAuthor || null : null,
    quoteRole: quoteText ? quoteRole || null : null,
  } as const;
}

async function checkSlugAvailable(slug: string, excludeId?: number) {
  const [existing] = await db
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.slug, slug));
  if (existing && existing.id !== excludeId) {
    return `Saite "${slug}" jau tiek izmantota citam rakstam.`;
  }
  return null;
}

function parseHighlightFiles(formData: FormData): File[] {
  return formData
    .getAll("highlights")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

export async function createArticle(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parseArticleInput(formData);
  if ("error" in parsed) return parsed;

  const slugError = await checkSlugAvailable(parsed.slug);
  if (slugError) return { error: slugError };

  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return { error: "Attēls ir obligāts." };
  }
  let imageUrl: string;
  try {
    imageUrl = await saveUploadedPhoto(image, "articles");
  } catch (error) {
    return { error: (error as Error).message };
  }

  const highlightFiles = parseHighlightFiles(formData);
  const highlightUrls: string[] = [];
  try {
    for (const file of highlightFiles) {
      highlightUrls.push(await saveUploadedPhoto(file, "articles"));
    }
  } catch (error) {
    return { error: (error as Error).message };
  }

  await db.insert(articles).values({
    ...parsed,
    image: imageUrl,
    highlights: highlightUrls.length > 0 ? highlightUrls.join("\n") : null,
    createdAt: Date.now(),
  });

  revalidatePath("/admin/jaunumi");
  revalidatePath("/jaunumi");
  revalidatePath("/");
  redirect("/admin/jaunumi");
}

export async function updateArticle(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parseArticleInput(formData);
  if ("error" in parsed) return parsed;

  const slugError = await checkSlugAvailable(parsed.slug, id);
  if (slugError) return { error: slugError };

  const [existing] = await db.select().from(articles).where(eq(articles.id, id));
  if (!existing) return { error: "Raksts nav atrasts." };

  const image = formData.get("image");
  let imageUrl = existing.image;
  if (image instanceof File && image.size > 0) {
    try {
      imageUrl = await saveUploadedPhoto(image, "articles");
    } catch (error) {
      return { error: (error as Error).message };
    }
    await deleteUploadedPhoto(existing.image);
  }

  const removeHighlights = formData.get("removeHighlights") === "on";
  const highlightFiles = parseHighlightFiles(formData);
  let highlights = existing.highlights;
  if (removeHighlights || highlightFiles.length > 0) {
    if (existing.highlights) {
      for (const url of existing.highlights.split("\n").filter(Boolean)) {
        await deleteUploadedPhoto(url);
      }
    }
    highlights = null;
  }
  if (highlightFiles.length > 0) {
    const highlightUrls: string[] = [];
    try {
      for (const file of highlightFiles) {
        highlightUrls.push(await saveUploadedPhoto(file, "articles"));
      }
    } catch (error) {
      return { error: (error as Error).message };
    }
    highlights = highlightUrls.join("\n");
  }

  await db
    .update(articles)
    .set({ ...parsed, image: imageUrl, highlights })
    .where(eq(articles.id, id));

  revalidatePath("/admin/jaunumi");
  revalidatePath("/jaunumi");
  revalidatePath("/");
  revalidatePath(`/jaunumi/${existing.slug}`);
  if (existing.slug !== parsed.slug) revalidatePath(`/jaunumi/${parsed.slug}`);
  redirect("/admin/jaunumi");
}

export async function deleteArticle(id: number) {
  await requireAdminSession();

  const [existing] = await db.select().from(articles).where(eq(articles.id, id));
  if (existing) {
    await deleteUploadedPhoto(existing.image);
    if (existing.highlights) {
      for (const url of existing.highlights.split("\n").filter(Boolean)) {
        await deleteUploadedPhoto(url);
      }
    }
  }

  await db.delete(articles).where(eq(articles.id, id));
  revalidatePath("/admin/jaunumi");
  revalidatePath("/jaunumi");
  revalidatePath("/");
}
