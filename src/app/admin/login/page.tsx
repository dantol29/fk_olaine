"use client";

import { useRouter } from "next/navigation";
import { LoginDrawer } from "@/components/login-drawer";

export default function AdminLoginPage() {
  const router = useRouter();
  return <main className="min-h-dvh bg-black">
    <LoginDrawer initiallyOpen showTrigger={false} onClose={() => router.push("/")} />
  </main>;
}
