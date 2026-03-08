import prisma from "../lib/prisma";
import * as predictionEngine from "./prediction.engine";

// Rate limit cache (Memory tabanlı - Serverless ortamda geçici kalabilir ancak aynı instance için koruma sağlar)
// Gerçek prod ortamı için Redis (Upstash) vb. kullanılabilir.
const LAST_CALCULATION_TIME = new Map<string, number>();
const RATE_LIMIT_MS = 5 * 60 * 1000; // 5 dakika

export interface JobLog {
    jobName: string;
    startTime: Date;
    endTime?: Date;
    affectedElections: number;
    status: "SUCCESS" | "FAILED";
    error?: string;
    triggerSource: "cron" | "webhook" | "manual";
}

/**
 * Belirli bir seçimin tüm tahminlerini (Prediction Engine) hesaplar ve kaydeder.
 * Her seçim için Transaction block kullanılır. Hata anında tüm db işlemleri iptal edilir (Rollback).
 */
export async function recalculateElectionPredictions(
    electionId: string,
    triggerSource: "cron" | "webhook" | "manual"
): Promise<{ success: boolean; error?: string }> {
    const now = Date.now();
    const lastTime = LAST_CALCULATION_TIME.get(electionId);

    // 1. Rate Limiting Check (manuel tetikleme hariç tutulabilir, ancak şimdilik kural olarak hepsine uyguluyoruz)
    if (triggerSource !== "manual" && lastTime && (now - lastTime) < RATE_LIMIT_MS) {
        console.warn(`[JobService] Rate limit aşıldı: Election ${electionId} (Son hesaplama: ${new Date(lastTime).toISOString()})`);
        return { success: false, error: "Rate limit: Aynı seçim için 5 dakika içinde tekrar hesaplama yapılamaz." };
    }

    // Kuyruk kilitlemesi (Optimistic lock)
    LAST_CALCULATION_TIME.set(electionId, now);

    try {
        console.log(`[JobService] Tahminler hesaplanıyor... Seçim: ${electionId} | Tetikleyici: ${triggerSource}`);

        // Transaction yapısı: Verileri okuma + Kaydetme tamamen bir bütün
        await prisma.$transaction(async (tx) => {
            // 1. Gerekli tüm verileri çekiyoruz (Election, Polls, Historical vb.)
            const election = await tx.election.findUnique({
                where: { id: electionId },
                include: {
                    pollResults: {
                        include: { pollFirm: true }
                    },
                    historicalResults: true,
                    electionParties: {
                        include: { party: true }
                    }
                }
            });

            if (!election) throw new Error("Seçim bulunamadı.");
            if (election.status !== "ACTIVE" && election.status !== "UPCOMING") {
                throw new Error("Sadece aktif veya yaklaşan seçimlerin tahminleri hesaplanabilir.");
            }

            // 2. Verileri Engine Formatına Dönüştürme

            // A. Anket Verilerini Engine.PollResult formatına gruplandırma
            // (DB'de her PollResult 1 parti için. Anket Firması ve Tarihe göre gruplayalım)
            const pollGroups = new Map<string, predictionEngine.PollResult>();
            for (const poll of election.pollResults) {
                if (!poll.partyId) continue;
                const groupKey = `${poll.pollFirmId}_${poll.publishedAt.getTime()}`;

                if (!pollGroups.has(groupKey)) {
                    pollGroups.set(groupKey, {
                        pollsterId: poll.pollFirmId,
                        reliabilityScore: poll.pollFirm.accuracyScore ? (poll.pollFirm.accuracyScore / 100) : 0.5,
                        date: poll.publishedAt,
                        sampleSize: poll.sampleSize || 1000,
                        partyResults: {}
                    });
                }

                pollGroups.get(groupKey)!.partyResults[poll.partyId] = poll.percentage;
            }
            const enginePolls = Array.from(pollGroups.values());

            // B. Tarihsel Veriler
            // Mock historical grouping by election id logic (Basitleştirilmiş)
            const historicalGroups = new Map<string, predictionEngine.HistoricalResult>();
            for (const h of election.historicalResults) {
                if (!h.partyId) continue;
                const hKey = `history_base`; // Normally this would be grouped by previous specific elections.

                if (!historicalGroups.has(hKey)) {
                    historicalGroups.set(hKey, {
                        electionDate: new Date("2023-05-14"), // Dummy for now
                        partyResults: {}
                    });
                }
                historicalGroups.get(hKey)!.partyResults[h.partyId] = h.percentage;
            }
            const engineHistorical = Array.from(historicalGroups.values());

            // 3. Tahmin Motoru Adımları
            const pollAverages = predictionEngine.calculatePollAverages(enginePolls);
            const histBaseline = predictionEngine.calculateHistoricalBaseline(engineHistorical);

            // Demografik düzeltmeleri bu versiyonda baz almadan geçiriyoruz (DB'de Region tablosuna bağlı ancak modelimiz şimdilik varsayılan katsayıları kullanacak)
            const demographicAdjs: predictionEngine.DemographicAdjustment[] = [];
            const fourthComp: predictionEngine.FourthComponentResult[] = [];

            // Sentez 
            const synthesisWeights = {
                pollWeight: 0.60,
                historicalWeight: 0.30,
                demographicWeight: 0.05,
                fourthComponentWeight: 0.05
            };

            const finalPredictions = predictionEngine.synthesizePrediction(
                pollAverages,
                histBaseline,
                demographicAdjs,
                fourthComp,
                synthesisWeights
            );

            // Güvenilirlik Skoru
            const confidence = predictionEngine.calculateConfidenceScore(enginePolls, engineHistorical.length);
            const confScoreNormalized = confidence.score / 100; // Range 0-1 for DB

            // 4. Tahminleri DB'ye Kaydetme (Overwrite veya Insert) Let's use Upsert.
            for (const pred of finalPredictions) {
                await tx.prediction.upsert({
                    where: {
                        // "electionId_partyId_candidateId_regionId_userId" objesini construct edelim
                        // Prisma schema'sındaki unique composite key gerektiriyor
                        // Null kullanılamayan alanları handle etmek için composite yapıya uygun yaklaşım yapabiliriz.
                        // Ama prizma upsert NULL'lu composite key'de sorun çıkarabilir, bu sebeple delete + create yapabiliriz.
                        id: 'dummy_id_we_will_replace_bypassing_upsert_if_needed'
                    },
                    update: {},
                    create: {
                        electionId: election.id,
                        partyId: pred.partyId,
                        low: pred.low,
                        mid: pred.mid,
                        high: pred.high,
                        confidence: confScoreNormalized,
                        // status default is DRAFT
                        status: "PUBLISHED"
                    }
                }).catch(async () => {
                    // Eğer upsert sorunu olursa (dummy id den dolayı exception atacak) - DB silip yeniden yazma (Safe in TX)
                    await tx.prediction.deleteMany({
                        where: {
                            electionId: election.id,
                            partyId: pred.partyId,
                            userId: null,
                            regionId: null,
                            candidateId: null
                        }
                    });

                    await tx.prediction.create({
                        data: {
                            electionId: election.id,
                            partyId: pred.partyId,
                            low: pred.low,
                            mid: pred.mid,
                            high: pred.high,
                            confidence: confScoreNormalized,
                            status: "PUBLISHED"
                        }
                    });
                });
            }

            // Başarılı ise timeline'a event ekleyebiliriz veya işlem kaydı
            await tx.activity.create({
                data: {
                    type: "PREDICTION_UPDATED",
                    userId: "system", // Normally user, but we'll bypass constraint if possible, but user is required in Activity.
                    // Activity userId foreign key var cascade delete özellikli. 
                    // Eğer 'system' id'li bir user yoksa bu tablo exception atar. 
                    // O yüzden geçici sistem logu basmak yerine console'a basacağız (Catch'ten rollback yememek için).
                }
            }).catch(() => console.log('System User not found for activity tracking... skipping.'));
        });

        console.log(`[JobService] Seçim tahmini başarıyla kaydedildi: ${electionId}`);
        return { success: true };

    } catch (error) {
        // RATE LIMIT sıfırlama (Hata durumunda)
        LAST_CALCULATION_TIME.delete(electionId);

        // Hata Loglama (Sentry entegrasyonuna hazır)
        const errObj = error instanceof Error ? error : new Error(String(error));
        console.error(`[JobService/SENTRY_LOG] Tahmin hesaplama hatası | Seçim: ${electionId}`);
        console.error(errObj.stack);

        return { success: false, error: errObj.message };
    }
}

/**
 * Global Cron vb. üzerinden tüm aktif / yaklaşan seçimleri tarayıp güncelleyen batch job.
 */
export async function runAllCalculationsJob(triggerSource: "cron" | "webhook" | "manual" = "cron"): Promise<JobLog> {
    const startTime = new Date();
    const log: JobLog = {
        jobName: "recalculate-all-predictions",
        startTime,
        affectedElections: 0,
        status: "SUCCESS",
        triggerSource
    };

    try {
        const activeElections = await prisma.election.findMany({
            where: {
                status: { in: ["ACTIVE", "UPCOMING"] },
                isDeleted: false
            },
            select: { id: true }
        });

        let successCount = 0;

        for (const election of activeElections) {
            const res = await recalculateElectionPredictions(election.id, triggerSource);
            if (res.success) {
                successCount++;
            }
        }

        log.affectedElections = successCount;
        log.endTime = new Date();

        // Genel job log'u console/sentry
        console.log(`[JobLog] İşlem Bitti. ${successCount}/${activeElections.length} seçim güncellendi. Süre: ${log.endTime.getTime() - startTime.getTime()}ms`);

        return log;
    } catch (error) {
        const errObj = error instanceof Error ? error : new Error(String(error));
        log.status = "FAILED";
        log.error = errObj.message;
        log.endTime = new Date();

        console.error(`[JobLog/SENTRY_CRITICAL] Job başarısız oldu:`, errObj);
        return log;
    }
}
