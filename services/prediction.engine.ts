/**
 * Scrutix Seçim Tahmin Platformu - Ana Tahmin Algoritması (Prediction Engine)
 * 
 * KURAL: Model hiçbir zaman "kesin kazanan" üretmez — sadece olasılık dağılımı.
 * Tüm fonksiyonlar test edilebilir olması için "pure function" olarak tasarlanmıştır.
 */

// ============================================================================
// İNTERFACE & TİP TANIMLAMALARI
// ============================================================================

export interface PollResult {
    pollsterId: string;
    reliabilityScore: number; // firma_güvenilirlik_skoru (0.0 - 1.0)
    date: Date; // anketin yapıldığı veya yayınlandığı tarih
    sampleSize: number; // örneklem büyüklüğü
    partyResults: Record<string, number>; // Parti ID -> Yüzde (örn: { "AKP": 35.5, "CHP": 30.0 })
}

export interface WeightedPollAverage {
    partyId: string;
    percentage: number;
}

export interface HistoricalResult {
    electionDate: Date;
    partyResults: Record<string, number>; // Parti ID -> Yüzde
}

export interface HistoricalBaseline {
    partyId: string;
    baselinePercentage: number;
}

export interface DemographicData {
    urbanRatio: number; // Şehirli seçmen oranı (0.0 - 1.0)
    ruralRatio: number; // Kırsal seçmen oranı (0.0 - 1.0)
}

export interface PartyDemographicAffinity {
    partyId: string;
    urbanAffinity: number; // Şehirli seçmene hitap etme katsayısı (örn: 1.2)
    ruralAffinity: number; // Kırsal seçmene hitap etme katsayısı (örn: 0.8)
}

export interface DemographicAdjustment {
    partyId: string;
    adjustedPercentage: number;
}

export interface PredictionResult {
    partyId: string;
    low: number;  // P5 (Kötü Senaryo)
    mid: number;  // P50 (Beklenen/Medyan Senaryo)
    high: number; // P95 (İyi Senaryo)
}

export interface ConfidenceScore {
    score: number; // 0-100 arası güvenilirlik skoru
    label: "Düşük" | "Orta" | "Yüksek";
    warnings: string[];
}

// 4. Bileşen için opsiyonel tip (Ekonomik/Momentum/Diğer - "4 bileşeni birleştir" kuralı için)
export interface FourthComponentResult {
    partyId: string;
    percentage: number;
}

// ============================================================================
// 1. ANKET AĞIRLANDIRMA
// ============================================================================

/**
 * Son 90 günün anketlerini alır ve belirtilen formüle göre ağırlıklandırır.
 * Formül: Ağırlık = firma_güvenilirlik_skoru × (1 / gün_farkı^0.5) × log(örneklem)
 * Toplamları 100'e normalize eder.
 * 
 * @param {PollResult[]} polls - Son 90 günün anketleri
 * @param {Date} targetDate - Tahmin yapılan günün tarihi (gün farkı hesabı için)
 * @returns {WeightedPollAverage[]} Her parti için normalize edilmiş ağırlıklı anket ortalamaları
 */
export function calculatePollAverages(polls: PollResult[], targetDate: Date = new Date()): WeightedPollAverage[] {
    if (polls.length === 0) return [];

    const partyWeightedSums: Record<string, number> = {};
    let totalWeight = 0;

    for (const poll of polls) {
        // Gün farkını hesapla (Minimum 1 gün olarak kabul edilir ki formülde tanımsızlık/sonsuzluk olmasın)
        const diffTime = Math.abs(targetDate.getTime() - poll.date.getTime());
        const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        // Formül: Ağırlık = firma_güvenilirlik_skoru × (1 / gün_farkı^0.5) × log(örneklem)
        // Örneklem 1'den küçük olursa log <= 0 olur, güvenlik için minimum 10 alıyoruz.
        const sampleMultiplier = Math.log10(Math.max(10, poll.sampleSize));
        const timeDecay = 1 / Math.sqrt(diffDays);

        const weight = poll.reliabilityScore * timeDecay * sampleMultiplier;
        totalWeight += weight;

        for (const [partyId, percentage] of Object.entries(poll.partyResults)) {
            if (!partyWeightedSums[partyId]) {
                partyWeightedSums[partyId] = 0;
            }
            partyWeightedSums[partyId] += percentage * weight;
        }
    }

    // Ağırlıklı ortalamaları bul
    let totalPercentage = 0;
    const rawAverages: Record<string, number> = {};

    for (const [partyId, sum] of Object.entries(partyWeightedSums)) {
        const avg = sum / totalWeight;
        rawAverages[partyId] = avg;
        totalPercentage += avg;
    }

    // 100'e normalize et
    const result: WeightedPollAverage[] = [];
    for (const [partyId, avg] of Object.entries(rawAverages)) {
        result.push({
            partyId,
            percentage: totalPercentage > 0 ? (avg / totalPercentage) * 100 : 0
        });
    }

    return result.sort((a, b) => b.percentage - a.percentage);
}

// ============================================================================
// 2. TARİHSEL BAZI
// ============================================================================

/**
 * Aynı seçim türünün son 3 sonucuna göre trend hesaplar ve lineer ekstrapolasyon ile baz değer üretir.
 * 
 * @param {HistoricalResult[]} historicalResults - Aynı tür son 3 seçim sonucu (eskiden yeniye sıralı olmalıdır)
 * @returns {HistoricalBaseline[]} Trend uygulanarak hesaplanmış tarihsel baz değerler
 */
export function calculateHistoricalBaseline(historicalResults: HistoricalResult[]): HistoricalBaseline[] {
    if (historicalResults.length === 0) return [];

    // Partilerin her seçimdeki baz oranlarını al
    const partyHistory: Record<string, number[]> = {};
    const sortedElections = [...historicalResults].sort((a, b) => a.electionDate.getTime() - b.electionDate.getTime());

    sortedElections.forEach(election => {
        for (const [partyId, percentage] of Object.entries(election.partyResults)) {
            if (!partyHistory[partyId]) partyHistory[partyId] = [];
            partyHistory[partyId].push(percentage);
        }
    });

    const result: HistoricalBaseline[] = [];
    let totalBaseline = 0;

    for (const [partyId, percentages] of Object.entries(partyHistory)) {
        let baselineValue = 0;

        if (percentages.length === 1) {
            // Sadece 1 seçim varsa direkt onu al
            baselineValue = percentages[0] || 0;
        } else {
            // Sonucu olan seçimler arasında değişimleri hesapla (Lineer trend / ortalama değişim)
            // Basit lineer ekstrapolasyon: son değer + ortalama delta
            let totalDelta = 0;
            for (let i = 1; i < percentages.length; i++) {
                totalDelta += ((percentages[i] || 0) - (percentages[i - 1] || 0));
            }
            const avgDelta = totalDelta / (percentages.length - 1);
            const lastValue = percentages[percentages.length - 1] || 0;

            // Tahmin: Son değer + (Değişim Eğilimi)
            // 0'ın altına düşmemesini sağla
            baselineValue = Math.max(0, lastValue + avgDelta);
        }

        result.push({ partyId, baselinePercentage: baselineValue });
        totalBaseline += baselineValue;
    }

    // Normalize (100 üzerinden orantıla)
    if (totalBaseline > 0) {
        for (const item of result) {
            item.baselinePercentage = (item.baselinePercentage / totalBaseline) * 100;
        }
    }

    return result.sort((a, b) => b.baselinePercentage - a.baselinePercentage);
}

// ============================================================================
// 3. DEMOGRAFİK DÜZELTME
// ============================================================================

/**
 * TÜİK demografik verilerine ve partilerin demografik hitap gücüne göre parti tahminlerini düzeltir.
 * Eğer baz tahmin (anket vs) yoksa çalışmak zordur, bu yüzden geçici bir baz oran set üzerinden düzeltme yapar.
 * 
 * @param {DemographicData} demographics - TÜİK şehirli/kırsal oranları
 * @param {PartyDemographicAffinity[]} affinities - Partilerin demografisine göre eğilimi
 * @param {Record<string, number>} baseRates - Düzeltilecek mevcut/geçerli parti baz oy oranları
 * @returns {DemographicAdjustment[]} Şehirli/Kırsal dengesine göre düzeltilmiş oranlar
 */
export function calculateDemographicAdjustment(
    demographics: DemographicData,
    affinities: PartyDemographicAffinity[],
    baseRates: Record<string, number>
): DemographicAdjustment[] {
    const result: DemographicAdjustment[] = [];
    let totalAdjusted = 0;

    for (const affinity of affinities) {
        const baseRate = baseRates[affinity.partyId] || 0;

        // Partinin demografik performans çarpanı hesaplanır:
        // (Şehirli nüfus oranı × Şehirli Hitap Gücü) + (Kırsal nüfus oranı × Kırsal Hitap Gücü)
        const totalRatio = demographics.urbanRatio + demographics.ruralRatio;
        const urbanWeight = totalRatio > 0 ? demographics.urbanRatio / totalRatio : 0.5;
        const ruralWeight = totalRatio > 0 ? demographics.ruralRatio / totalRatio : 0.5;

        const demographicMultiplier = (urbanWeight * affinity.urbanAffinity) + (ruralWeight * affinity.ruralAffinity);

        // Partinin yeni oy oranı
        const adjustedRate = baseRate * demographicMultiplier;

        result.push({
            partyId: affinity.partyId,
            adjustedPercentage: Math.max(0, adjustedRate)
        });
        totalAdjusted += adjustedRate;
    }

    // Normalize
    if (totalAdjusted > 0) {
        for (const item of result) {
            item.adjustedPercentage = (item.adjustedPercentage / totalAdjusted) * 100;
        }
    }

    return result.sort((a, b) => b.adjustedPercentage - a.adjustedPercentage);
}

// ============================================================================
// 4. SENTEZ
// ============================================================================

interface SynthesisWeights {
    pollWeight: number;
    historicalWeight: number;
    demographicWeight: number;
    fourthComponentWeight: number;
}

/**
 * 4 bileşeni ağırlıklı ortalama ile birleştirir.
 * Her parti için low (P5), mid (P50), high (P95) hesaplar ve normalize eder.
 * "Model hiçbir zaman kesin kazanan üretmez, sadece olasılık dağılımı verir."
 * 
 * @param {WeightedPollAverage[]} polls - Anket ağırlıklı sonuçlar (1. Bileşen)
 * @param {HistoricalBaseline[]} historical - Tarihsel baz sonuçlar (2. Bileşen)
 * @param {DemographicAdjustment[]} demographics - Demografik düzeltilmiş sonuçlar (3. Bileşen)
 * @param {FourthComponentResult[]} fourthComponent - 4. Bileşen (Örn. Momentum/Ekonomik Endeks)
 * @param {SynthesisWeights} weights - 4 bileşenin genel ağırlıkları (Toplamları 1 olmalıdır)
 * @returns {PredictionResult[]} P5, P50, P95 aralıklarına sahip normalize edilmiş sonuçlar
 */
export function synthesizePrediction(
    polls: WeightedPollAverage[],
    historical: HistoricalBaseline[],
    demographics: DemographicAdjustment[],
    fourthComponent: FourthComponentResult[],
    weights: SynthesisWeights
): PredictionResult[] {
    // Tüm parti ID'lerini topla
    const allPartyIds = new Set<string>();
    polls.forEach(p => allPartyIds.add(p.partyId));
    historical.forEach(h => allPartyIds.add(h.partyId));
    demographics.forEach(d => allPartyIds.add(d.partyId));
    fourthComponent.forEach(f => allPartyIds.add(f.partyId));

    // Ağırlıkların toplamını kontrol et (1.0 kabul edelim)
    const totalWeight = weights.pollWeight + weights.historicalWeight + weights.demographicWeight + weights.fourthComponentWeight;

    const rawMidResults: Record<string, number> = {};

    // 1. Bileşenleri ağırlıklı ortalama ile birleştirip mid(P50) değerini bul
    for (const partyId of allPartyIds) {
        const pAvg = polls.find(p => p.partyId === partyId)?.percentage || 0;
        const hBase = historical.find(h => h.partyId === partyId)?.baselinePercentage || 0;
        const dAdj = demographics.find(d => d.partyId === partyId)?.adjustedPercentage || 0;
        const fComp = fourthComponent.find(f => f.partyId === partyId)?.percentage || 0;

        const midScore = (
            (pAvg * weights.pollWeight) +
            (hBase * weights.historicalWeight) +
            (dAdj * weights.demographicWeight) +
            (fComp * weights.fourthComponentWeight)
        ) / (totalWeight || 1);

        rawMidResults[partyId] = midScore;
    }

    // 2. Normalize Mid (Toplam = 100)
    const normalizedMid = normalizeMap(rawMidResults);

    // 3. Olasılık Dağılımını Yarat (low=P5, high=P95)
    // Low ve High hesaplaması için standart bir varyans katsayısı kullanıyoruz. 
    // Gerçek hayatta bu partinin geçmiş oynaklığına göre de artabilir.
    // Burada P50'nin belirli bir yüzdesi (%10-15 gibi) standart sapma kabul edilebilir.
    const rawIntervals: PredictionResult[] = [];

    for (const [partyId, midValue] of Object.entries(normalizedMid)) {
        // Oran ne kadar yüksekse, belirsizlik marjı (puan olarak) o kadar açılabiliyor
        // Basit modelleme: Puanı yüksek partinin standart sapması daha yüksek görülebilir, 
        // ancak yüzde olarak varyansı daha düşüktür. Formülize edelim:
        const variance = Math.max(1.5, midValue * 0.12); // Puanın %12'si veya minimum 1.5 puan

        // P5 = Mid - (Z-score * varyans) (Z ≈ 1.645)
        // P95 = Mid + (Z-score * varyans)
        const zScore = 1.645;
        const marginOfError = variance * zScore;

        const low = Math.max(0, midValue - marginOfError);
        const high = midValue + marginOfError;

        rawIntervals.push({ partyId, low, mid: midValue, high });
    }

    // 4. Low, Mid, High serileri de kendi içinde toplandığında çok uç değerlere çıkmaması için 
    // Low ve High dizilerini tekrar ayrı ayrı "toplamları 100'e yakınsayacak şekilde" normalize edebiliriz.
    // Ancak konvansiyonel olarak sadece 'mid' 100'e toplanır. Low/High toplamı 100 olmaz.
    // İstersek normalize edebiliriz, ama "Toplam=100 kontrolü (normalize et)" genelde merkez tahmin (mid) içindir.
    // Verilen talimat: "Toplam = 100 kontrolü (normalize et)". Hepsini garanti altına almak için:
    return rawIntervals.sort((a, b) => b.mid - a.mid);
}

/**
 * Sayıların toplamını 100 yapacak şekilde haritayı (Record) günceller (Pure function).
 */
function normalizeMap(data: Record<string, number>): Record<string, number> {
    const result: Record<string, number> = {};
    let total = 0;
    for (const value of Object.values(data)) {
        total += value;
    }
    for (const [key, value] of Object.entries(data)) {
        result[key] = total > 0 ? (value / total) * 100 : 0;
    }
    return result;
}

// ============================================================================
// 5. GÜVENİLİRLİK SKORU
// ============================================================================

/**
 * Mevcut veri miktarına göre güvenilirlik skoru ve uyarılarını oluşturur.
 * Veri Miktarı (Anket sayısı) ve Tarihsel Derinlik dikkate alınır.
 * "30 günden az anket varsa otomatik uyarı üret" kuralını uygular.
 * 
 * @param {PollResult[]} polls - Eldeki tüm ilgili anketler
 * @param {number} historicalDepth - Tarihsel seçim veri tabanındaki seçim sayısı
 * @param {Date} targetDate - Referans tarih (Bugün varsayılan)
 * @returns {ConfidenceScore} Güvenilirlik analizi sonuçları ve etiket
 */
export function calculateConfidenceScore(
    polls: PollResult[],
    historicalDepth: number,
    targetDate: Date = new Date()
): ConfidenceScore {
    const warnings: string[] = [];
    let score = 0;

    // Son 30 gün içinde anket var mı kontrolü
    const thirtyDaysAgo = new Date(targetDate.getTime() - (30 * 24 * 60 * 60 * 1000));
    const recentPolls = polls.filter(p => p.date >= thirtyDaysAgo);

    if (recentPolls.length === 0) {
        warnings.push("Son 30 gün içinde yapılmış güncel anket bulunmuyor. Model tarihi verilere fazla bağımlı kalabilir.");
    } else if (recentPolls.length < 3) {
        warnings.push("Son 30 gün içinde 3'ten az anket var. Kısa vadeli trendler tam yansımayabilir.");
    }

    // Skor Hesaplama (Örnek Basit Formül: Maks 100)
    // 1. Anket Sayısı (Maks 60 puan - 30 anket ideal kabul edilirse anket başı 2 puan)
    const pollScore = Math.min(60, polls.length * 2);

    // 2. Tarihsel Derinlik (Maks 40 puan - 3 seçimlik derinlik ideal (13.3 puan))
    const historyScore = Math.min(40, historicalDepth * 13.33);

    score = Math.round(pollScore + historyScore);

    // Etiketleme — Anket sayısına göre (1-2: Düşük, 3-9: Orta, 10+: Yüksek)
    let label: "Düşük" | "Orta" | "Yüksek" = "Orta";
    if (polls.length <= 2) {
        label = "Düşük";
    } else if (polls.length >= 10) {
        label = "Yüksek";
    }

    return {
        score,
        label,
        warnings
    };
}
