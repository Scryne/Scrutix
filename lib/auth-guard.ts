import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Server-side auth guard for admin pages.
 * Use in Server Components as a second layer of protection
 * (middleware is the first layer).
 *
 * @example
 * ```tsx
 * export default async function AdminSettingsPage() {
 *   const session = await requireAdmin();
 *   return <div>Hello {session.user.name}</div>;
 * }
 * ```
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  return session;
}

/**
 * Server-side helper to get the current session without redirecting.
 * Useful for components that need optional session data.
 */
export async function getSession() {
  return auth();
}
