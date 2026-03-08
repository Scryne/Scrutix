import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminDashboard } from "@/components/admin/dashboard";

/**
 * Admin Dashboard — Server Component.
 * Session is verified server-side before rendering.
 * If somehow the middleware is bypassed, this is the second guard.
 */
export default async function AdminPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  return <AdminDashboard user={session.user} />;
}
