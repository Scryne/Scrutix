import NextAuth from "next-auth";
import authConfig from "@/auth.config";

/**
 * Middleware — Edge Runtime compatible.
 *
 * Uses auth.config.ts (without bcryptjs) to avoid Edge Runtime warnings.
 * The `authorized` callback in auth.config.ts handles route protection:
 *
 *   /admin/login    → Public (login form)
 *   /admin/*        → Requires ADMIN role (redirects to /admin/login)
 *   /api/auth/*     → NextAuth handlers (always open)
 *   /api/*          → Public API endpoints
 *   Everything else → Public pages (elections, map, etc.)
 */
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: [
    // Match admin routes + general pages, but exclude static assets
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
