import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell flex min-h-screen flex-col bg-[#fafafa] text-black lg:flex-row">
      <AdminSidebar />
      <main className="admin-content min-w-0 flex-1 overflow-x-auto px-5 py-8 sm:p-10 lg:px-12 lg:py-12"><div className="mx-auto max-w-[1600px]">{children}</div></main>
    </div>
  );
}
