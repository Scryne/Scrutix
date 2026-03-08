import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Anketler",
  description:
    "Turkiye secim anketlerini takip edin. Tum anket firmalari, sonuclari ve trend grafikleri.",
};

export const revalidate = 3600; // 1 saat cache

async function getPolls() {
  try {
    const pollFirms = await prisma.pollFirm.findMany({
      where: { isDeleted: false },
      include: {
        _count: { select: { pollResults: true } },
        pollResults: {
          where: { isDeleted: false },
          orderBy: { publishedAt: "desc" },
          take: 1,
          select: { publishedAt: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return pollFirms.map((firm) => ({
      id: firm.id,
      name: firm.name,
      slug: firm.slug,
      website: firm.website,
      methodology: firm.methodology,
      accuracyScore: firm.accuracyScore,
      totalPolls: firm._count.pollResults,
      lastPollDate: firm.pollResults[0]?.publishedAt ?? null,
    }));
  } catch {
    return [];
  }
}

export default async function PollsPage() {
  const pollFirms = await getPolls();

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              Anketler
            </h1>
            <p className="text-muted-foreground mt-1">
              Tum anket firmalarini ve sonuclarini takip edin.
            </p>
          </div>
        </div>

        {pollFirms.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pollFirms.map((firm) => (
              <Card key={firm.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{firm.name}</CardTitle>
                    {firm.accuracyScore && (
                      <Badge variant="secondary">
                        Dogruluk: %{firm.accuracyScore.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    {firm.methodology ?? "Metodoloji bilgisi yok"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Toplam Anket</span>
                    <span className="font-medium">{firm.totalPolls}</span>
                  </div>
                  {firm.lastPollDate && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Son Anket</span>
                      <span className="font-medium">
                        {new Date(firm.lastPollDate).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                  )}
                  {firm.website && (
                    <Link
                      href={firm.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Web Sitesi
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Henuz anket verisi bulunmuyor. Veriler eklendikce burada goruntulenecektir.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
