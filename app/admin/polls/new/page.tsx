import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getElectionsForSelect,
  getPollFirmsForSelect,
} from "./actions";
import { PollEntryForm } from "./poll-form";

export const metadata = {
  title: "Yeni Anket Sonucu | Admin",
  robots: { index: false, follow: false },
};

/**
 * Admin — Yeni Anket Sonucu Giriş Sayfası.
 *
 * Server component: auth guard + dropdown verilerini prefetch eder.
 * Form mantığı PollEntryForm client component'ına delege edilir.
 */
export default async function NewPollPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  // Dropdown verileri server'da prefetch — form yüklenirken hazır olur
  const [elections, pollFirms] = await Promise.all([
    getElectionsForSelect(),
    getPollFirmsForSelect(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Sayfa Başlığı */}
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Yeni Anket Sonucu
        </h1>
        <p className="text-sm text-muted-foreground">
          Anket sirketinden alinan sonuclari girin. Kaynak URL zorunludur.
        </p>
      </div>

      {/* Form */}
      <PollEntryForm elections={elections} pollFirms={pollFirms} />
    </div>
  );
}
