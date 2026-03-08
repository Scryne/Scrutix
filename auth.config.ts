import type { NextAuthConfig } from "next-auth";

/**
 * NextAuth.js v5 — Edge-compatible configuration.
 *
 * This file contains ONLY the parts that can run in Edge Runtime:
 * - Pages config
 * - Session strategy
 * - Callbacks (authorized, jwt, session)
 *
 * The `authorize` function (which uses bcryptjs) is in auth.ts,
 * which runs only in Node.js runtime.
 *
 * This separation prevents Edge Runtime warnings for bcryptjs/crypto.
 */
export default {
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },

  providers: [],  // Populated in auth.ts (credentials needs Node.js)

  callbacks: {
    /**
     * JWT callback — embed role into the token on sign-in.
     * Runs on every request that reads the session.
     */
    jwt({ token, user }) {
      if (user && user.id) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    /**
     * Session callback — expose role to the client.
     * Only expose what the client absolutely needs.
     */
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN";
      }
      return session;
    },

    /**
     * Authorized callback — used by middleware (runs in Edge).
     * This is the first line of defense for route protection.
     */
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const isAdminRoute = nextUrl.pathname.startsWith("/admin");
      const isLoginPage = nextUrl.pathname === "/admin/login";
      const isAuthApi = nextUrl.pathname.startsWith("/api/auth");
      const isAdminApiRoute = nextUrl.pathname.startsWith("/api/admin");

      // Allow auth API routes to pass through always
      if (isAuthApi) {
        return true;
      }

      // Admin routes (pages and APIs, except login) require authentication
      if ((isAdminRoute || isAdminApiRoute) && !isLoginPage) {
        if (!isLoggedIn) {
          return false; // → redirects to signIn page or blocks API
        }
        // Double-check role at the callback level
        if (session.user.role !== "ADMIN") {
          return false;
        }
        return true;
      }

      // If logged in admin visits login page, redirect to dashboard
      if (isLoginPage && isLoggedIn) {
        return Response.redirect(new URL("/admin", nextUrl));
      }

      // All other routes (public pages) are open
      return true;
    },
  },
} satisfies NextAuthConfig;
