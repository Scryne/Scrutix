import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Map, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_NAME } from "@/constants/app";
import { UpcomingElections } from "@/components/home/upcoming-elections";
import { LatestPolls } from "@/components/home/latest-polls";
import { FeaturedPrediction } from "@/components/home/featured-prediction";
import { PlatformStats } from "@/components/home/platform-stats";
import {
  UpcomingElectionsSkeleton,
  LatestPollsSkeleton,
  FeaturedPredictionSkeleton,
  PlatformStatsSkeleton
} from "@/components/home/skeletons";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-16 md:pt-24 pb-16">
        <div className="absolute inset-0 bg-primary/5 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        <div className="container relative z-10 flex flex-col items-center justify-center gap-6 text-center">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm text-primary dark:text-primary-foreground mb-4">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
            Turkiye&apos;nin Secim Veri Platformu
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tighter md:text-6xl lg:text-7xl max-w-[900px]">
            Secimleri Takip Et,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Gelecegi Tahmin Et
            </span>
          </h1>
          <p className="max-w-[700px] text-lg text-muted-foreground sm:text-xl mb-4">
            {APP_NAME} ile guvenilir anket verilerini analiz et, interaktif haritalari kesfet ve kendi secim tahminlerini toplulukla karsilastir.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-2">
            <Button size="lg" className="h-12 px-8 text-md shadow-lg" asChild>
              <Link href="/elections">
                Secimleri Kesfet
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-8 text-md" asChild>
              <Link href="/legal/methodology">
                <PlayCircle className="mr-2 h-4 w-4" />
                Nasil Calisir?
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="container py-8 md:py-12 space-y-12 md:space-y-16">

        {/* Top Fold: Upcoming Elections */}
        <Suspense fallback={<UpcomingElectionsSkeleton />}>
          <UpcomingElections />
        </Suspense>

        {/* Middle Fold: Latest Polls & Featured Prediction */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 flex flex-col h-full">
            <Suspense fallback={<LatestPollsSkeleton />}>
              <LatestPolls />
            </Suspense>
          </div>

          <div className="flex flex-col justify-start h-full">
            <Suspense fallback={<FeaturedPredictionSkeleton />}>
              <FeaturedPrediction />
            </Suspense>

            {/* Quick Links Card */}
            <Card className="mt-6 border-transparent bg-muted/30">
              <CardContent className="p-4 space-y-2">
                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" asChild>
                  <Link href="/map">
                    <Map className="mr-2 h-4 w-4 text-primary" />
                    Interaktif Secim Haritasi
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" asChild>
                  <Link href="/polls">
                    <BarChart3 className="mr-2 h-4 w-4 text-secondary" />
                    Tum Anket Firmalari
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom Fold: Platform Statistics */}
      <Suspense fallback={<PlatformStatsSkeleton />}>
        <PlatformStats />
      </Suspense>

    </div>
  );
}
