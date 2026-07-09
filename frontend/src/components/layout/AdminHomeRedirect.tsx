"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isAdminUser } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";
import { Spinner } from "@/components/ui/Spinner";

/** Sends logged-in admins to the dashboard instead of the customer homepage. */
export function AdminHomeRedirect({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isLoading && isAuthenticated && isAdminUser(user)) {
      router.replace("/admin");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner label="Loading" />
      </div>
    );
  }

  if (isAuthenticated && isAdminUser(user)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner label="Opening admin dashboard" />
      </div>
    );
  }

  return <>{children}</>;
}
