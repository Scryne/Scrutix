import { handlers } from "@/auth";

/**
 * NextAuth.js v5 API Route Handler.
 *
 * Handles all /api/auth/* routes:
 *   GET  /api/auth/signin
 *   GET  /api/auth/signout
 *   POST /api/auth/callback/admin-credentials
 *   GET  /api/auth/session
 *   GET  /api/auth/csrf
 *   etc.
 */
export const { GET, POST } = handlers;
