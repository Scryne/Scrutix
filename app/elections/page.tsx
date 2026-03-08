import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Secimler",
  description: "Tum secimleri goruntuleyin, anketleri takip edin ve tahminlerinizi paylasm.",
};

export default function ElectionsPage() {
  return (
    <div className="container py-10">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Secimler</h1>
            <p className="text-muted-foreground mt-1">
              Yaklasan ve tamamlanmis secimleri takip edin.
            </p>
          </div>
        </div>

        {/* Election list will be rendered here with client component */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
            Secim verileri yuklenecek...
          </div>
        </div>
      </div>
    </div>
  );
}
