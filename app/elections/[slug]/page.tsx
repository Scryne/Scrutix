import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { APP_URL } from "@/constants/app";
import { notFound } from "next/navigation";
import Script from "next/script";

interface ElectionDetailPageProps {
  params: { slug: string };
}

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: ElectionDetailPageProps): Promise<Metadata> {
  const election = await prisma.election.findUnique({
    where: { slug: params.slug },
  });

  if (!election) {
    return {
      title: "Seçim Bulunamadı",
      description: "Aradığınız seçim bulunamadı.",
    };
  }

  const url = `${APP_URL}/elections/${election.slug}`;
  const title = `${election.title} | Scrutix`;
  const description = election.description || `${election.title} için anket sonuçları, tahminler ve daha fazlası.`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(election.title)}`, // Generic fallback
          width: 1200,
          height: 630,
          alt: election.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ElectionDetailPage({ params }: ElectionDetailPageProps) {
  const election = await prisma.election.findUnique({
    where: { slug: params.slug },
  });

  if (!election) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": election.title,
    "description": election.description || `${election.title} detayları`,
    "startDate": election.date.toISOString(),
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": {
      "@type": "Place",
      "name": "Türkiye"
    }
  };

  return (
    <div className="container py-10">
      <Script
        id="election-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {election.title}
          </h1>
          <p className="text-muted-foreground mt-1">
            Anketler, adaylar ve sonuclar burada goruntulenecek.
          </p>
        </div>

        {/* Tabs: Overview, Polls, Results, Predictions, Map */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Anket Trendleri</h2>
              <p className="text-muted-foreground">Grafik burada goruntulenecek.</p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Sonuclar</h2>
              <p className="text-muted-foreground">Sonuclar burada goruntulenecek.</p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Adaylar</h2>
              <p className="text-muted-foreground">Aday listesi burada goruntulenecek.</p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Tahminler</h2>
              <p className="text-muted-foreground">Tahminler burada goruntulenecek.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
