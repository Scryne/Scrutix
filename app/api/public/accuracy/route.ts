import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { evaluateAccuracy } from '@/services/accuracy.service';
import type { AccuracyDataPoint } from '@/services/accuracy.service';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
        const { success } = await rateLimit.limit(ip);
        if (!success) {
            return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
        }
        // 1. Durumu COMPLETED olan tüm seçimleri geçmiş sonuçlarıyla birlikte çek
        const completedElections = await prisma.election.findMany({
            where: {
                status: 'COMPLETED',
                isDeleted: false,
            },
            include: {
                // Gerçek sonuçlar
                historicalResults: {
                    include: { party: true }
                },
                // Platformun kendi tahminleri (userId null olanlar ana model tahminleridir)
                predictions: {
                    where: { userId: null, isDeleted: false },
                    include: { party: true }
                },
                // Seçimden önceki son 14 gün içindeki anketler (rakip karşılaştırması için)
                pollResults: {
                    where: { isDeleted: false },
                    include: { pollFirm: true, party: true }
                }
            },
            orderBy: { date: 'desc' }
        });

        const responseData = {
            globalMetrics: {
                averagePlatformMae: 0,
                totalElectionsTracked: completedElections.length,
                overallRankAccuracy: 0,
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            elections: [] as any[]
        };

        if (completedElections.length === 0) {
            // Eğer henüz tamamlanmış seçim yoksa, UI test edilebilsin diye boş state dön.
            return NextResponse.json(responseData);
        }

        let totalMae = 0;
        let totalRankAccuracy = 0;

        for (const election of completedElections) {
            // a. Scrutix Verilerini Eşleştir
            const scrutixPoints: AccuracyDataPoint[] = [];
            const { historicalResults, predictions, pollResults } = election;

            const histMap = new Map(historicalResults.filter(h => h.partyId).map(h => [h.partyId!, h.percentage]));

            predictions.forEach(pred => {
                if (pred.partyId && histMap.has(pred.partyId)) {
                    scrutixPoints.push({
                        partyId: pred.party?.abbreviation || pred.partyId,
                        predictedPercentage: pred.mid,
                        actualPercentage: histMap.get(pred.partyId)!,
                        predictedWinProb: pred.confidence || undefined
                    });
                }
            });

            let scrutixAccuracy = null;
            if (scrutixPoints.length > 0) {
                scrutixAccuracy = evaluateAccuracy(scrutixPoints);
                totalMae += scrutixAccuracy.mae;
                totalRankAccuracy += scrutixAccuracy.rankAccuracy;
            }

            // b. Rakip Firmaları Eşleştir
            // Her firma için bu seçime dair son anketleri alacağız.
            // Basitleştirmek adına: Firmaya göre grupla, en güncel anket tarihini bul, o anketin parti sonuçlarını kullan.
            const firmsData = new Map<string, AccuracyDataPoint[]>();

            const latestFirmDates = new Map<string, number>();
            pollResults.forEach(poll => {
                const t = poll.publishedAt.getTime();
                if (!latestFirmDates.has(poll.pollFirm.id) || t > latestFirmDates.get(poll.pollFirm.id)!) {
                    latestFirmDates.set(poll.pollFirm.id, t);
                }
            });

            const finalPolls = pollResults.filter(p => p.publishedAt.getTime() === latestFirmDates.get(p.pollFirm.id));

            finalPolls.forEach(poll => {
                if (poll.partyId && histMap.has(poll.partyId)) {
                    const firmName = poll.pollFirm.name;
                    if (!firmsData.has(firmName)) firmsData.set(firmName, []);

                    firmsData.get(firmName)!.push({
                        partyId: poll.party?.abbreviation || poll.partyId,
                        predictedPercentage: poll.percentage,
                        actualPercentage: histMap.get(poll.partyId)!
                    });
                }
            });

            const competitorAccuracies = Array.from(firmsData.entries()).map(([firmName, points]) => {
                const result = evaluateAccuracy(points);
                return {
                    firmName,
                    mae: result.mae,
                    rankAccuracy: result.rankAccuracy,
                    isWinnerCorrect: result.isWinnerCorrect
                };
            }).sort((a, b) => a.mae - b.mae); // MAE'si en düşük (en iyi) olan en üstte

            responseData.elections.push({
                id: election.id,
                title: election.title,
                date: election.date,
                turnout: election.turnout,
                scrutixAccuracy,
                competitors: competitorAccuracies
            });
        }

        // Global Metrikleri Güncelle
        const validElections = responseData.elections.filter(e => e.scrutixAccuracy !== null).length;
        if (validElections > 0) {
            responseData.globalMetrics.averagePlatformMae = Number((totalMae / validElections).toFixed(2));
            responseData.globalMetrics.overallRankAccuracy = Number((totalRankAccuracy / validElections).toFixed(2));
        }

        return NextResponse.json(responseData);

    } catch (error) {
        console.error("[Accuracy API Error]", error);
        return NextResponse.json({ error: "İstatistikler hesaplanırken bir hata oluştu." }, { status: 500 });
    }
}
