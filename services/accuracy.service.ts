/**
 * Scrutix - Seçim Sonrası Tahmin Doğruluk Hesaplama Modülü
 *
 * HESAPLAMA YÖNTEMLERİ:
 * 1. MAE (Mean Absolute Error): her parti için |tahmin - gerçek| ortalaması. (Daha düşük puan = Daha iyi tahmin)
 * 2. BRIER SCORE: Olasılık tahminlerinin kalibrasyonu (0 en iyi, 1 en kötü).
 * 3. RANK ACCURACY: Sıralamayı (özellikle kazananı) doğru tahmin etme oranı.
 */

// ============================================================================
// İNTERFACE & TİP TANIMLAMALARI
// ============================================================================

export interface AccuracyDataPoint {
    partyId: string;
    predictedPercentage: number; // Örn: 45.5 (mid)
    actualPercentage: number;    // Örn: 47.0
    predictedWinProb?: number;   // Örn: 0.85 (Kazanma olasılığı - Brier score için opsiyonel)
}

export interface AccuracyResult {
    mae: number;          // Ortalama Mutlak Hata (Puan sapması)
    brierScore: number | null;   // Brier Skoru
    rankAccuracy: number; // Sıralama Doğruluğu (%)
    isWinnerCorrect: boolean; // Kazanan doğru bilindi mi?
    details: {
        partyId: string;
        predicted: number;
        actual: number;
        error: number;
    }[];
}

// ============================================================================
// HESAPLAMA FONKSİYONLARI (PURE FUNCTIONS)
// ============================================================================

/**
 * MAE (Mean Absolute Error) Hesaplar
 * Bir seçimin genel hata payını bulmak için en yaygın yöntemdir.
 * 
 * Öz Türkçesi: "Partilerin oy oranlarını ortalama kaç puan sapmayla bildik?"
 */
export function calculateMAE(points: AccuracyDataPoint[]): number {
    if (points.length === 0) return 0;

    const sumAbsError = points.reduce((sum, p) => {
        return sum + Math.abs(p.predictedPercentage - p.actualPercentage);
    }, 0);

    return Number((sumAbsError / points.length).toFixed(4));
}

/**
 * Brier Score Hesaplar
 * Tahmin edilen "kazanma/oy alma olasılığı" ile "gerçek sonuç" arasındaki karesel fark.
 * Olasılıklar 0.0 ile 1.0 arasındadır. Formül: (1/N) * Σ(tahmin_olasiligi - gercek_durum)²
 * Genellikle "Kazanan vs Kaybeden" (1 veya 0) üzerinden hesaplanır.
 * 
 * Öz Türkçesi: "Model "%80 kazanır" dediğinde gerçekten kazanıyor mu? (Kalibrasyon)"
 */
export function calculateBrierScore(points: AccuracyDataPoint[]): number | null {
    if (points.length === 0) return null;

    // Gerçekte en çok oyu alan partiyi (Kazananı) bul
    let maxActual = -1;
    let winnerPartyId = "";
    for (const p of points) {
        if (p.actualPercentage > maxActual) {
            maxActual = p.actualPercentage;
            winnerPartyId = p.partyId;
        }
    }

    // Brier score kazanma olasılığı p ve gerçekleşme durumu o üzerinden:
    // Σ (p - o)^2 / N
    let brierSum = 0;
    let validPoints = 0;

    for (const p of points) {
        // Eğer predictedWinProb yoksa (sadece oransal tahmin varsa) mid/100 oranını proxy jako kullanıyoruz
        // Ancak gerçek Brier score genelde pWin için yapılır. Proxy brier (Multiclass Brier Score formülü): 
        const isWinner = p.partyId === winnerPartyId ? 1 : 0;
        const predictedProb = p.predictedWinProb !== undefined
            ? p.predictedWinProb
            // Basit bir Sigmoid proxy ile oranı kazanma şansına dönüştürme simülasyonu 
            // (Büyük orana büyük prob. Sadece mock prob if missing)
            : Math.max(0, Math.min(1, p.predictedPercentage / 100));

        brierSum += Math.pow(predictedProb - isWinner, 2);
        validPoints++;
    }

    return validPoints > 0 ? Number((brierSum / validPoints).toFixed(4)) : null;
}

/**
 * Rank Accuracy Hesaplar
 * Katılan partilerin doğru sıralamasını ne kadar bildiğimizi hesaplar.
 * Kazananı bilmek rankAccuracy'ye özel bir flag olarak da döner.
 */
export function calculateRankAccuracy(
    points: AccuracyDataPoint[]
): { accuracyPercentage: number; isWinnerCorrect: boolean } {
    if (points.length === 0) return { accuracyPercentage: 0, isWinnerCorrect: false };

    // Tahmin edilen ve gerçekleşen oranlara göre azalan sıralama yapalım
    const predictedRank = [...points].sort((a, b) => b.predictedPercentage - a.predictedPercentage).map(p => p.partyId);
    const actualRank = [...points].sort((a, b) => b.actualPercentage - a.actualPercentage).map(p => p.partyId);

    let correctPositions = 0;
    for (let i = 0; i < points.length; i++) {
        if (predictedRank[i] === actualRank[i]) {
            correctPositions++;
        }
    }

    const accuracyPercentage = (correctPositions / points.length) * 100;
    const isWinnerCorrect = predictedRank[0] === actualRank[0];

    return {
        accuracyPercentage: Number(accuracyPercentage.toFixed(2)),
        isWinnerCorrect
    };
}

/**
 * Tüm metrikleri tek seferde hesaplayan Ana Sentez fonksiyonu
 * 
 * @param {AccuracyDataPoint[]} points Karşılaştırılacak tahmin-gerçek veri setleri
 * @returns {AccuracyResult} MAE, Brier ve Rank sonuçlarının birleşimi
 */
export function evaluateAccuracy(points: AccuracyDataPoint[]): AccuracyResult {
    const mae = calculateMAE(points);
    const brierScore = calculateBrierScore(points);
    const { accuracyPercentage, isWinnerCorrect } = calculateRankAccuracy(points);

    const details = points.map(p => ({
        partyId: p.partyId,
        predicted: Number(p.predictedPercentage.toFixed(2)),
        actual: Number(p.actualPercentage.toFixed(2)),
        error: Number(Math.abs(p.predictedPercentage - p.actualPercentage).toFixed(2))
    })).sort((a, b) => b.actual - a.actual); // Gerçek seçime göre sıralı detay

    return {
        mae,
        brierScore,
        rankAccuracy: accuracyPercentage,
        isWinnerCorrect,
        details
    };
}
