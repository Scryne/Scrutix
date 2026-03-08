"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, Target, TrendingUp, AlertTriangle } from "lucide-react";

interface GlobalMetrics {
    averagePlatformMae: number;
    totalElectionsTracked: number;
    overallRankAccuracy: number;
}

interface ScrutixAccuracy {
    mae: number;
    brierScore: number | null;
    rankAccuracy: number;
    isWinnerCorrect: boolean;
    details: {
        partyId: string;
        predicted: number;
        actual: number;
        error: number;
    }[];
}

interface CompetitorAccuracy {
    firmName: string;
    mae: number;
    rankAccuracy: number;
    isWinnerCorrect: boolean;
}

interface ElectionData {
    id: string;
    title: string;
    date: string;
    turnout: number | null;
    scrutixAccuracy: ScrutixAccuracy | null;
    competitors: CompetitorAccuracy[];
}

export default function AccuracyPage() {
    const [data, setData] = useState<{ globalMetrics: GlobalMetrics; elections: ElectionData[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Verileri public API'den çek
        fetch("/api/public/accuracy")
            .then((res) => res.json())
            .then((json) => {
                setData(json);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Hedef veri çekilemedi:", err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-100">
                <div className="animate-pulse space-y-4 flex flex-col items-center">
                    <div className="h-8 w-32 bg-zinc-800 rounded"></div>
                    <p className="text-zinc-500">Doğruluk metrikleri hesaplanıyor...</p>
                </div>
            </div>
        );
    }

    const hasData = data && data.elections && data.elections.length > 0;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* Başlık ve Metodoloji */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
                            <Target className="h-8 w-8 text-blue-500" />
                            Şeffaflık ve Doğruluk (Accuracy)
                        </h1>
                        <p className="text-zinc-400 max-w-3xl text-lg">
                            Scrutix tahmin modelinin gerçek seçim sonuçlarıyla karşılaştırmalarını ve endüstri standartlarındaki sapma metriklerini burada tüm şeffaflığıyla yayınlıyoruz.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-zinc-300">Ortalama Sapma (MAE)</CardTitle>
                                <CardDescription className="text-xs">Mean Absolute Error</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-zinc-400">
                                    Her parti için tahmin ile gerçek sonuç arasındaki <strong className="text-white">puan farklarının ortalamasıdır.</strong> Sıfıra ne kadar yakınsa, model o kadar başarılıdır.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-zinc-300">Brier Skoru</CardTitle>
                                <CardDescription className="text-xs">Olasılık Kalibrasyonu</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-zinc-400">
                                    &quot;%80 kazanır&quot; dediğimiz senaryonun gerçekleşme tutarlılığını ölçer. <strong className="text-white">Sıfıra (0) yakın olması</strong> modelin kendi belirsizlik oranlarını doğru yansıttığını gösterir.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-zinc-300">Sıralama Başarısı</CardTitle>
                                <CardDescription className="text-xs">Rank Accuracy</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-zinc-400">
                                    &quot;Birinci kim olacak? İkinci kim olacak?&quot; gibi partiler arası <strong className="text-white">sıralamayı doğru tutturma yüzdemizi</strong> ifade eder.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Global Platform Özeti */}
                {hasData ? (
                    <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-900/50 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold text-white">Genel Platform Performansı</h2>
                            <p className="text-sm text-zinc-400">{data.globalMetrics.totalElectionsTracked} Seçim Analiz Edildi</p>
                        </div>
                        <div className="flex items-center gap-8">
                            <div className="text-center">
                                <p className="text-sm text-zinc-400">Ortalama Sapma (MAE)</p>
                                <p className="text-3xl font-bold text-blue-400">{data.globalMetrics.averagePlatformMae}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-zinc-400">Ort. Sıralama Doğruluğu</p>
                                <p className="text-3xl font-bold text-green-400">%{data.globalMetrics.overallRankAccuracy}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Card className="bg-zinc-900/50 border-zinc-800 text-center py-12">
                        <Info className="h-10 w-10 text-zinc-500 mx-auto mb-4" />
                        <span className="text-zinc-400">Henüz sonuçlanmış bir seçim bulunmuyor. Tahmin doğruluk metrikleri seçim sonrasında burada yayınlanacaktır.</span>
                    </Card>
                )}

                {/* Seçim Seçim Detaylar */}
                {hasData && (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-semibold">Geçmiş Seçim Raporları</h2>
                        {data.elections.map((election) => {
                            const scutixMae = election.scrutixAccuracy?.mae ?? 0;
                            const isFailed = scutixMae > 3.0; // MAE 3.0 puan üzeriyse başarısız sayıyoruz

                            return (
                                <Card key={election.id} className="bg-zinc-900 border-zinc-800 overflow-hidden">
                                    <div className={`h-1.5 w-full ${isFailed ? "bg-red-500" : "bg-emerald-500"}`} />
                                    <CardHeader className="flex flex-row items-start justify-between">
                                        <div>
                                            <CardTitle className="text-xl text-white">{election.title}</CardTitle>
                                            <CardDescription>{new Date(election.date).toLocaleDateString("tr-TR")}</CardDescription>
                                        </div>
                                        {election.scrutixAccuracy && (
                                            <Badge variant={isFailed ? "destructive" : "default"} className={!isFailed ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : ""}>
                                                {isFailed ? "Geliştirilmesi Gerekli" : "Başarılı Tahmin"}
                                            </Badge>
                                        )}
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Özet Kartı */}
                                        {election.scrutixAccuracy && (
                                            <div className="bg-zinc-950 rounded-lg p-5 border border-zinc-800 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {isFailed ? <AlertTriangle className="text-red-400 h-6 w-6" /> : <TrendingUp className="text-emerald-400 h-6 w-6" />}
                                                    <div>
                                                        <p className="text-sm font-medium text-white">Bu seçimde <strong className={isFailed ? "text-red-400" : "text-emerald-400"}>{scutixMae}</strong> puan ortalama sapma (MAE) ile tahmin ettik.</p>
                                                        <p className="text-xs text-zinc-400 mt-1">
                                                            {election.scrutixAccuracy.isWinnerCorrect ? "Seçimi kazananı doğru bildik." : "Kazanan partiyi yanlış tahmin ettik."} Şeffaflık adına detaylar aşağıdadır.
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-zinc-500 mb-1">Brier Skoru</p>
                                                    <p className="font-mono text-sm">{election.scrutixAccuracy.brierScore ?? "Hesaplanamadı"}</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {/* Parti Bazlı Tablo */}
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-semibold text-zinc-300">Scrutix Parti Sapmaları</h4>
                                                <div className="rounded-md border border-zinc-800 overflow-hidden">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-zinc-950">
                                                            <tr className="border-b border-zinc-800 text-left text-zinc-400">
                                                                <th className="p-3 font-medium">Parti</th>
                                                                <th className="p-3 font-medium">Tahmin</th>
                                                                <th className="p-3 font-medium">Gerçek</th>
                                                                <th className="p-3 font-medium text-right">Sapma</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-zinc-800">
                                                            {election.scrutixAccuracy?.details.map((detail, idx) => (
                                                                <tr key={idx} className="bg-zinc-900">
                                                                    <td className="p-3 font-medium text-white">{detail.partyId}</td>
                                                                    <td className="p-3 text-zinc-300">%{detail.predicted}</td>
                                                                    <td className="p-3 text-zinc-300">%{detail.actual}</td>
                                                                    <td className="p-3 text-right">
                                                                        <span className={detail.error > 3 ? "text-red-400" : detail.error < 1 ? "text-emerald-400" : "text-yellow-400"}>
                                                                            &plusmn;{detail.error}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Rakiplerle Karşılaştırma */}
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-semibold text-zinc-300">Anket Firmaları ile Karşılaştırma</h4>
                                                <div className="rounded-md border border-zinc-800 overflow-hidden">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-zinc-950">
                                                            <tr className="border-b border-zinc-800 text-left text-zinc-400">
                                                                <th className="p-3 font-medium">Kurum</th>
                                                                <th className="p-3 font-medium">MAE</th>
                                                                <th className="p-3 font-medium text-right">Kazanma Tahmini</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-zinc-800">
                                                            <tr className="bg-blue-900/10">
                                                                <td className="p-3 font-semibold text-blue-400">Scrutix Model</td>
                                                                <td className="p-3 font-mono font-bold">{scutixMae}</td>
                                                                <td className="p-3 text-right">
                                                                    {election.scrutixAccuracy?.isWinnerCorrect ? <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">Doğru</Badge> : <Badge variant="outline" className="text-red-400 border-red-500/30">Yanlış</Badge>}
                                                                </td>
                                                            </tr>
                                                            {election.competitors.length > 0 ? (
                                                                election.competitors.slice(0, 5).map((comp, idx) => (
                                                                    <tr key={idx} className="bg-zinc-900">
                                                                        <td className="p-3 text-zinc-300">{comp.firmName}</td>
                                                                        <td className="p-3 font-mono">{comp.mae}</td>
                                                                        <td className="p-3 text-right">
                                                                            {comp.isWinnerCorrect ? <Badge variant="outline" className="text-emerald-400/50 border-emerald-500/20">Doğru</Badge> : <Badge variant="outline" className="text-red-400/50 border-red-500/20">Yanlış</Badge>}
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan={3} className="p-4 text-center text-zinc-500">
                                                                        Karşılaştırılacak güncel anket verisi bulunamadı.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>

                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
