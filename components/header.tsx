"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, Shield, LogOut, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAIN_NAV, APP_NAME } from "@/constants/app";
import { useUIStore } from "@/stores";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo and Nav Links (Left side) */}
        <div className="flex items-center gap-6 md:gap-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">S</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-primary dark:text-primary-foreground">{APP_NAME}</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-6">
            {MAIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Actions (Right side) */}
        <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Add a search button/icon. In a full implementation, this could open a search modal */}
            <Button variant="ghost" size="icon" className="hidden md:flex text-muted-foreground hover:text-primary">
              <Search className="h-4 w-4" />
              <span className="sr-only">Arama Yap</span>
            </Button>
          </div>

          <ThemeToggle />

          {status === "loading" ? (
            <div className="h-9 w-20 animate-pulse rounded-md bg-muted hidden md:block" />
          ) : isAdmin ? (
            <>
              <Button variant="ghost" size="sm" className="hidden md:inline-flex gap-1.5" asChild>
                <Link href="/admin">
                  <Shield className="h-4 w-4" />
                  Panel
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hidden md:inline-flex gap-1.5"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="h-4 w-4" />
                Cikis
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" className="hidden md:inline-flex border-primary text-primary hover:bg-primary hover:text-primary-foreground dark:border-primary-foreground dark:text-primary-foreground" asChild>
              <Link href="/admin/login">Giris Yap</Link>
            </Button>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="border-t md:hidden">
          <nav className="container flex flex-col gap-2 py-4">
            <Link
              href="/"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Ana Sayfa
            </Link>
            {MAIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <div className="my-2 border-t border-border" />

            {/* Mobile Search - Visual Only for now */}
            <div className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer">
              <Search className="h-4 w-4" />
              <span>Arama Yap</span>
            </div>

            <div className="my-2 border-t border-border" />

            {isAdmin ? (
              <>
                <Link
                  href="/admin"
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Shield className="h-4 w-4" />
                  Yonetim Paneli
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full gap-1.5"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Cikis Yap
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" className="mt-2 w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground" asChild>
                <Link href="/admin/login" onClick={() => setMobileMenuOpen(false)}>
                  Giris Yap
                </Link>
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
