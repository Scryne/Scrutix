import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { loginSchema } from "@/lib/validators";
import authConfig from "@/auth.config";

/**
 * Scrutix — NextAuth.js v5 Full Configuration (Node.js runtime only).
 *
 * This file extends auth.config.ts with the Credentials provider,
 * which requires bcryptjs (a Node.js module not available in Edge Runtime).
 *
 * The split architecture:
 *   auth.config.ts → Edge-compatible (middleware uses this)
 *   auth.ts        → Node.js only (API routes + server components use this)
 *
 * Environment variables required:
 *   AUTH_SECRET          — Signing key for JWT (min 32 chars)
 *   ADMIN_EMAIL          — Admin login email
 *   ADMIN_PASSWORD_HASH  — bcrypt hash of admin password
 */

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,

  providers: [
    Credentials({
      id: "admin-credentials",
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        // ── 1. Validate input shape ──
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        // ── 2. Check against env variables ──
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

        if (!adminEmail || !adminPasswordHash) {
          console.error(
            "[auth] ADMIN_EMAIL or ADMIN_PASSWORD_HASH is not set in environment variables."
          );
          return null;
        }

        // ── 3. Case-insensitive email comparison ──
        if (email.toLowerCase() !== adminEmail.toLowerCase()) {
          return null;
        }

        // ── 4. Verify password with bcrypt (constant-time comparison) ──
        const isValid = await compare(password, adminPasswordHash);
        if (!isValid) {
          return null;
        }

        // ── 5. Return user object → embedded in JWT ──
        return {
          id: "admin",
          email: adminEmail,
          name: "Admin",
          role: "ADMIN" as const,
        };
      },
    }),
  ],
});
