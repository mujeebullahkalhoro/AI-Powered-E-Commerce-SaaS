"use client";

import { usePathname } from "next/navigation";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { isAdminUser } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const isAdmin = isAdminUser(user);

  // Admin routes render their own dedicated dashboard chrome (header + sidebar),
  // so the customer-facing shopping UI must not appear there.
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdminRoute) {
    return <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
      <Footer />
      {!isAdmin ? <ChatWidget /> : null}
    </>
  );
}
