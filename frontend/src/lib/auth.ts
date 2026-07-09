import type { User } from "@/lib/api/types";

/** Where to send a user after login or registration. */
export function getPostAuthPath(user: User | null | undefined): string {
  return user?.role === "admin" ? "/admin" : "/";
}

export function isAdminUser(user: User | null | undefined): boolean {
  return user?.role === "admin";
}
