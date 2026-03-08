import Link from "next/link";
import { APP_NAME } from "@/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/20">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-6 py-8">
        <div className="flex flex-col items-center md:items-start gap-2 max-w-lg text-center md:text-left">
          <p className="text-sm font-semibold text-foreground">
            &copy; {currentYear} {APP_NAME} — Bağımsız veri platformu.
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground mr-4">
            <strong>TR:</strong> Hiçbir siyasi partiyle, adayla veya kurumla ilişkisi yoktur. <br className="hidden md:inline" />
            <strong>EN:</strong> Independent data platform. Not affiliated with any political party, candidate, or institution.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
          <Link
            href="/legal/methodology"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            Metodoloji / Methodology
          </Link>
          <Link
            href="/legal/privacy"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            Gizlilik (KVKK) / Privacy
          </Link>
          <Link
            href="/legal/disclaimer"
            className="text-sm text-destructive/80 hover:text-destructive transition-colors underline-offset-4 hover:underline font-medium"
          >
            Sorumluluk Reddi / Disclaimer
          </Link>
        </div>
      </div>
    </footer>
  );
}
