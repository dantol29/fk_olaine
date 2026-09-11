"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
} from "@/lib/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

export async function login(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const headersList = await headers();
  // The reverse proxy (Apache/Passenger) appends the real client IP as the
  // LAST entry of X-Forwarded-For — any earlier entries are whatever the
  // client itself sent and are fully attacker-controlled, so reading the
  // first entry (as this used to) let anyone bypass the rate limit below
  // by sending a fresh fake value on every request.
  const forwardedFor = headersList.get("x-forwarded-for");
  const ip = forwardedFor?.split(",").map((part) => part.trim()).filter(Boolean).pop() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return { error: "Pārāk daudz mēģinājumu. Mēģini vēlreiz pēc 10 minūtēm." };
  }

  const password = String(formData.get("password") ?? "");

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return { error: "Nepareiza parole." };
  }

  resetRateLimit(ip);
  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect("/admin");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/admin/login");
}
