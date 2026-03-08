import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Sparkles, ArrowUpRight, Target, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PredictionDisclaimer } from "@/components/legal/PredictionDisclaimer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function FeaturedPrediction() {
    // Mock data representing the top aggregated prediction
    const prediction = {
        electionId: "1",
        title: "Cumhurbaskanligi Secimi 2028 - Turkiye Geneli",
        predictionDate: new Date(),
        totalPredictors: 12450,
        confidenceScore: 84,
        leader: {
            name: "Aday A",
            percentage: 51.2,
            trend: "up"
        },
        runnerUp: {
            name: "Aday B",
            percentage: 45.8,
            trend: "down"
        }
    };

    return (
        <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/10 border-primary/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Target className="w-32 h-32" />
            </div>

            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Sparkles className="h-5 w-5 text-secondary" />
                        Topluluk Tahmini
                    </CardTitle>
                    <Badge variant="secondary" className="bg-primary text-primary-foreground hover:bg-primary/90">
                        One Cikan
                    </Badge>
                </div>
                <p className="text-sm font-medium mt-2">{prediction.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>{prediction.totalPredictors.toLocaleString("tr-TR")} tahmin</span>
                    <span>•</span>
                    <span>Guncellenme: {format(prediction.predictionDate, "HH:mm", { locale: tr })}</span>
                </div>
            </CardHeader>

            <CardContent>
                <div className="mt-4 space-y-6">
                    {/* Main Prediction Display */}
                    <div className="flex items-end justify-between border-b pb-6">
                        <div className="space-y-1">
                            <span className="text-sm font-semibold text-muted-foreground">Lider Aday</span>
                            <div className="text-3xl font-bold text-foreground">
                                {prediction.leader.name}
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="flex items-center justify-end gap-1.5 text-primary">
                                <span className="text-4xl font-extrabold tracking-tighter">
                                    {prediction.leader.percentage}
                                </span>
                                <span className="text-2xl font-bold">%</span>
                            </div>
                            <Badge variant="outline" className="mt-1 text-green-600 bg-green-500/10 border-green-500/20">
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                Yukseliste
                            </Badge>
                        </div>
                    </div>

                    {/* Runner Up */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="text-xs text-muted-foreground">2. Sirada</span>
                            <div className="font-medium">{prediction.runnerUp.name}</div>
                        </div>
                        <div className="font-bold text-lg">
                            %{prediction.runnerUp.percentage}
                        </div>
                    </div>

                    <Button className="w-full gap-2 mt-4" asChild>
                        <Link href={`/predictions/elections/${prediction.electionId}`}>
                            <Target className="h-4 w-4" />
                            Kendi Tahminini Yap
                        </Link>
                    </Button>
                    <PredictionDisclaimer className="mt-4" />
                </div>
            </CardContent>
        </Card>
    );
}
