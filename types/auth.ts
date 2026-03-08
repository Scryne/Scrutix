import type { DefaultSession } from "next-auth";

// ─────────────────────────────────────────────
// NextAuth.js v5 Type Augmentation
// ─────────────────────────────────────────────

/**
 * Extend the built-in session/user types to include `role`.
 * This ensures TypeScript knows about `session.user.role`
 * throughout the application.
 *
 * JWT type extension is handled via `@auth/core/jwt` in v5 beta.
 * For credentials-only setups, we augment only the User and Session.
 */

declare module "next-auth" {
  interface User {
    role: "ADMIN";
  }

  interface Session {
    user: {
      id: string;
      role: "ADMIN";
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN";
  }
}

// ─────────────────────────────────────────────
// Application-level Auth Types
// ─────────────────────────────────────────────

/** Session user shape exposed to client components. */
export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: "ADMIN";
}

/** Auth state for components that consume session data. */
export interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: SessionUser | null;
}
