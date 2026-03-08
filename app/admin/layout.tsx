import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Panel",
  robots: { index: false, follow: false },
};

/**
 * Admin layout wrapper.
 * Route protection is handled by middleware.ts — by the time this
 * layout renders, the user is already verified as ADMIN.
 *
 * robots: noindex/nofollow prevents search engines from indexing admin pages.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
