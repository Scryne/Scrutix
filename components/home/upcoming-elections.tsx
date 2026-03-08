"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format, differenceInSeconds } from "date-fns";
import { tr } from "date-fns/locale";
import { Timer, ArrowRight, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Mock data (would be passed as props in a real implementation)
const MOCK_ELECTIONS = [
    {
        id: "1",
        title: "Cumhurbaskanligi Secimi 2028",
        date: new Date(2028, 4, 14, 8, 0, 0),
        type: "GENERAL",
        location: "Turkiye Geneli",
        description: "Turkiye Cumhuriyeti 14. Cumhurbaskani Secimi",
    },
    {
        id: "2",
        title: "Yerel Secimler 2029",
        date: new Date(2029, 2, 31, 8, 0, 0),
        type: "LOCAL",
        location: "Turkiye Geneli",
        description: "Belediye baskanlari, meclis uyeleri ve muhtar secimleri",
    },
];

export function UpcomingElections() {
    // We use client-side hydration for the countdown to avoid hydration mismatch
    const [mounted, setMounted] = useState(false);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        setMounted(true);
        const interval = setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Yaklasan Secimler</h2>
                    <p className="text-muted-foreground">Turkiye gundemindeki en yakin secimler</p>
                </div>
                <Button variant="ghost" className="hidden sm:flex gap-2" asChild>
                    <Link href="/elections">
                        Tumu <ArrowRight className="h-4 w-4" />
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {MOCK_ELECTIONS.map((election) => (
                    <ElectionCard
                        key={election.id}
                        election={election}
                        now={now}
                        mounted={mounted}
                    />
                ))}
            </div>

            <Button variant="outline" className="w-full sm:hidden" asChild>
                <Link href="/elections">Tum Secimleri Gor</Link>
            </Button>
        </section>
    );
}

interface MockElection {
    id: string;
    title: string;
    date: Date;
    type: string;
    location: string;
    description: string;
}

function ElectionCard({
    election,
    now,
    mounted
}: {
    election: MockElection,
    now: Date,
    mounted: boolean
}) {
    // Calculate remaining time
    const remainingSeconds = Math.max(0, differenceInSeconds(election.date, now));

    const days = Math.floor(remainingSeconds / (3600 * 24));
    const hours = Math.floor((remainingSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    return (
        <Card className="flex flex-col overflow-hidden transition-all hover:shadow-md border-primary/10">
            <CardHeader className="bg-muted/30 pb-4 border-b">
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-xl leading-tight">{election.title}</CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {format(election.date, "d MMMM yyyy", { locale: tr })}
                        </div>
                    </div>
                    <Badge variant={election.type === "GENERAL" ? "default" : "secondary"}>
                        {election.type === "GENERAL" ? "Genel" : "Yerel"}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-6">
                <p className="text-sm text-muted-foreground mb-6 line-clamp-2">
                    {election.description}
                </p>

                <div className="rounded-lg bg-primary/5 p-4 border border-primary/10">
                    <div className="flex items-center justify-center gap-2 mb-3 text-sm font-medium text-primary">
                        <Timer className="h-4 w-4" />
                        <span>Kalan Sure</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                        <TimeUnit value={mounted ? days : 0} label="Gun" />
                        <TimeUnit value={mounted ? hours : 0} label="Saat" />
                        <TimeUnit value={mounted ? minutes : 0} label="Dakika" />
                        <TimeUnit value={mounted ? seconds : 0} label="Saniye" />
                    </div>
                </div>
            </CardContent>

            <CardFooter className="pt-0 pb-6 px-6">
                <Button className="w-full" asChild>
                    <Link href={`/elections/${election.id}`}>Secim Detaylari</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center p-2 rounded bg-background border shadow-sm">
            <span className="text-xl md:text-2xl font-bold font-mono tracking-tighter">
                {value.toString().padStart(2, '0')}
            </span>
            <span className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {label}
            </span>
        </div>
    );
}
