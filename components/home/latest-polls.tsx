import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { BarChart3, ChevronRight, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Mock data (would be passed as props in a real implementation)
const MOCK_POLLS = [
    {
        id: "1",
        firm: "ORC Arastirma",
        date: new Date(2028, 0, 15),
        election: "Cumhurbaskanligi 2028",
        sampleSize: 4250,
        results: [
            { candidate: "Aday A", percentage: 48.2, color: "bg-chart-1" },
            { candidate: "Aday B", percentage: 45.1, color: "bg-chart-2" },
            { candidate: "Diger", percentage: 6.7, color: "bg-muted" },
        ]
    },
    {
        id: "2",
        firm: "Metropoll",
        date: new Date(2028, 0, 10),
        election: "Cumhurbaskanligi 2028",
        sampleSize: 2100,
        results: [
            { candidate: "Aday B", percentage: 47.5, color: "bg-chart-2" },
            { candidate: "Aday A", percentage: 46.8, color: "bg-chart-1" },
            { candidate: "Diger", percentage: 5.7, color: "bg-muted" },
        ]
    },
    {
        id: "3",
        firm: "Konda",
        date: new Date(2027, 11, 28),
        election: "Genel Secimler",
        sampleSize: 3500,
        results: [
            { candidate: "Parti X", percentage: 35.2, color: "bg-chart-4" },
            { candidate: "Parti Y", percentage: 28.4, color: "bg-chart-3" },
            { candidate: "Parti Z", percentage: 12.1, color: "bg-chart-5" },
        ]
    }
];

export function LatestPolls() {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Son Anket Sonuclari
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/polls" className="hidden sm:flex items-center text-muted-foreground">
                            Tumu <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground">Platforma eklenen en guncel anket verileri</p>
            </CardHeader>

            <CardContent className="flex-1 p-0">
                <div className="divide-y">
                    {MOCK_POLLS.map((poll) => (
                        <PollRow key={poll.id} poll={poll} />
                    ))}
                </div>
            </CardContent>

            <CardFooter className="pt-4 pb-4 border-t bg-muted/20 flex flex-col gap-3">
                <Button variant="outline" className="w-full" asChild>
                    <Link href="/polls">Anketler Sayfasina Git</Link>
                </Button>
                <div className="text-[10px] text-muted-foreground text-center leading-tight">
                    Anket sonuclari derlemedir. <Link href="/legal/methodology" className="underline hover:text-primary">Metodoloji ve Sorumluluk Reddi</Link>
                </div>
            </CardFooter>
        </Card>
    );
}

interface MockPoll {
    id: string;
    firm: string;
    date: Date;
    election: string;
    sampleSize: number;
    results: {
        candidate: string;
        percentage: number;
        color: string;
    }[];
}

function PollRow({ poll }: { poll: MockPoll }) {
    // Find top candidate
    const sortedResults = [...poll.results].sort((a, b) => b.percentage - a.percentage);
    const total = sortedResults.reduce((sum, r) => sum + r.percentage, 0);

    return (
        <div className="p-4 hover:bg-muted/30 transition-colors group">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                        {poll.firm}
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-background">
                            n={poll.sampleSize}
                        </Badge>
                    </h4>
                    <div className="flex text-xs text-muted-foreground mt-1 gap-2">
                        <span>{format(poll.date, "d MMM yyyy", { locale: tr })}</span>
                        <span>•</span>
                        <span className="truncate max-w-[120px] sm:max-w-[200px]">{poll.election}</span>
                    </div>
                </div>

                <div className="text-right flex flex-col items-end">
                    <span className="text-sm font-bold flex items-center gap-1 text-primary">
                        {sortedResults[0]?.percentage ?? 0}%
                        <TrendingUp className="h-3 w-3" />
                    </span>
                    <span className="text-xs text-muted-foreground">{sortedResults[0]?.candidate ?? "Bilinmiyor"}</span>
                </div>
            </div>

            {/* Mini Bar Chart */}
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden flex">
                {sortedResults.map((result, i) => (
                    <div
                        key={i}
                        className={`h-full ${result.color}`}
                        style={{ width: `${(result.percentage / total) * 100}%` }}
                        title={`${result.candidate}: ${result.percentage}%`}
                    />
                ))}
            </div>

            {/* Legend */}
            <div className="flex gap-3 mt-2 text-[10px] sm:text-xs">
                {sortedResults.slice(0, 3).map((result, i) => (
                    <div key={i} className="flex items-center gap-1.5 truncate">
                        <span className={`w-2 h-2 rounded-full ${result.color}`} />
                        <span className="truncate text-muted-foreground">{result.candidate} <span className="font-medium text-foreground">{result.percentage}%</span></span>
                    </div>
                ))}
            </div>
        </div>
    );
}
