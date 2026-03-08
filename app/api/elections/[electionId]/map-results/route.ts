import { NextResponse } from 'next/server';

export async function GET(
    _request: Request,
    { params }: { params: { electionId: string } }
) {
    const { electionId: _electionId } = params;

    // TODO: Gerçek veritabanı bağlantısı buraya eklenecek.
    // Şimdilik MapLibre bileşeni için mock veri döndürüyoruz.

    // Türkiye'nin birkaç ilini kapsayan dummy veriler
    const mockResults = [
        {
            provinceId: "34", // İstanbul
            provinceName: "İstanbul",
            winningParty: { id: "chp", name: "CUMHURİYET HALK PARTİSİ", shortName: "CHP", color: "#ef4444" },
            results: [
                { partyId: "chp", partyName: "CUMHURİYET HALK PARTİSİ", partyColor: "#ef4444", voteShare: 51.14 },
                { partyId: "akp", partyName: "ADALET VE KALKINMA PARTİSİ", partyColor: "#f97316", voteShare: 39.59 },
                { partyId: "yrp", partyName: "YENİDEN REFAH PARTİSİ", partyColor: "#ec4899", voteShare: 2.61 },
            ],
            turnout: 79.28,
            totalVotes: 8964972
        },
        {
            provinceId: "06", // Ankara
            provinceName: "Ankara",
            winningParty: { id: "chp", name: "CUMHURİYET HALK PARTİSİ", shortName: "CHP", color: "#ef4444" },
            results: [
                { partyId: "chp", partyName: "CUMHURİYET HALK PARTİSİ", partyColor: "#ef4444", voteShare: 60.43 },
                { partyId: "akp", partyName: "ADALET VE KALKINMA PARTİSİ", partyColor: "#f97316", voteShare: 31.68 },
                { partyId: "yrp", partyName: "YENİDEN REFAH PARTİSİ", partyColor: "#ec4899", voteShare: 3.13 },
            ],
            turnout: 79.39,
            totalVotes: 3385458
        },
        {
            provinceId: "35", // İzmir
            provinceName: "İzmir",
            winningParty: { id: "chp", name: "CUMHURİYET HALK PARTİSİ", shortName: "CHP", color: "#ef4444" },
            results: [
                { partyId: "chp", partyName: "CUMHURİYET HALK PARTİSİ", partyColor: "#ef4444", voteShare: 48.97 },
                { partyId: "akp", partyName: "ADALET VE KALKINMA PARTİSİ", partyColor: "#f97316", voteShare: 37.06 },
                { partyId: "dem", partyName: "DEM PARTİ", partyColor: "#84cc16", voteShare: 4.16 },
            ],
            turnout: 79.03,
            totalVotes: 2661595
        },
        {
            provinceId: "42", // Konya
            provinceName: "Konya",
            winningParty: { id: "akp", name: "ADALET VE KALKINMA PARTİSİ", shortName: "AK PARTİ", color: "#f97316" },
            results: [
                { partyId: "akp", partyName: "ADALET VE KALKINMA PARTİSİ", partyColor: "#f97316", voteShare: 49.43 },
                { partyId: "yrp", partyName: "YENİDEN REFAH PARTİSİ", partyColor: "#ec4899", voteShare: 23.40 },
            ],
            turnout: 75.83,
            totalVotes: 1251786
        },
        // Rasterleri görmek için bir iki il daha
        {
            provinceId: "61", // Trabzon
            provinceName: "Trabzon",
            winningParty: { id: "akp", name: "ADALET VE KALKINMA PARTİSİ", shortName: "AK PARTİ", color: "#f97316" },
            results: [
                { partyId: "akp", partyName: "ADALET VE KALKINMA PARTİSİ", partyColor: "#f97316", voteShare: 51.48 },
                { partyId: "chp", partyName: "CUMHURİYET HALK PARTİSİ", partyColor: "#ef4444", voteShare: 28.43 },
            ],
            turnout: 78.4,
            totalVotes: 499120
        },
        {
            provinceId: "01", // Adana
            provinceName: "Adana",
            winningParty: { id: "chp", name: "CUMHURİYET HALK PARTİSİ", shortName: "CHP", color: "#ef4444" },
            results: [
                { partyId: "chp", partyName: "CUMHURİYET HALK PARTİSİ", partyColor: "#ef4444", voteShare: 46.54 },
                { partyId: "akp", partyName: "ADALET VE KALKINMA PARTİSİ", partyColor: "#f97316", voteShare: 37.43 },
            ],
            turnout: 75.3,
            totalVotes: 1162383
        }
    ];

    // Diğer tüm iller için gri göstermek istemiyorsak rastgele üretebiliriz
    // Ama şimdilik 81 ilin boş olanları zaten "#CCCCCC" olarak haritada düşecek.

    return NextResponse.json(mockResults);
}
