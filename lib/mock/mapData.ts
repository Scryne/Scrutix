import type { Party, ElectionData, ProvinceResult, PartySummary } from '@/app/map/_utils/types'

// ─── Parti tanımları ───────────────────────────────────────────

const AKP: Party = { id: 'akp', name: 'Adalet ve Kalkınma Partisi', shortName: 'AKP', color: '#FFA500' }
const CHP: Party = { id: 'chp', name: 'Cumhuriyet Halk Partisi', shortName: 'CHP', color: '#E30A17' }
const MHP: Party = { id: 'mhp', name: 'Milliyetçi Hareket Partisi', shortName: 'MHP', color: '#B22222' }
const DEM: Party = { id: 'dem', name: 'Halkların Eşitlik ve Demokrasi Partisi', shortName: 'DEM', color: '#8B5CF6' }
const IYI: Party = { id: 'iyi', name: 'İYİ Parti', shortName: 'İYİ', color: '#00B4D8' }
const YRP: Party = { id: 'yrp', name: 'Yeniden Refah Partisi', shortName: 'YRP', color: '#065F46' }

// ─── Yardımcı fonksiyon ────────────────────────────────────────

function makeResult(
  provinceName: string,
  winner: Party,
  results: { party: Party; voteShare: number }[],
  turnout: number
): ProvinceResult {
  return {
    provinceName,
    winningParty: winner,
    results: results.map((r) => ({ party: r.party, voteShare: r.voteShare })),
    turnout,
  }
}

// ─── 81 İl Sonuçları (2024 Yerel) ─────────────────────────────
// Province names EXACTLY match GeoJSON properties.name values

const provinceResults2024: ProvinceResult[] = [
  makeResult('Adana', CHP, [{ party: CHP, voteShare: 46.5 }, { party: AKP, voteShare: 35.2 }, { party: MHP, voteShare: 8.3 }, { party: YRP, voteShare: 5.1 }], 82.4),
  makeResult('Adıyaman', AKP, [{ party: AKP, voteShare: 46.8 }, { party: CHP, voteShare: 26.1 }, { party: YRP, voteShare: 14.2 }, { party: MHP, voteShare: 7.5 }], 79.8),
  makeResult('Afyon', AKP, [{ party: AKP, voteShare: 44.2 }, { party: CHP, voteShare: 33.5 }, { party: MHP, voteShare: 11.8 }, { party: YRP, voteShare: 6.2 }], 81.1),
  makeResult('Ağrı', DEM, [{ party: DEM, voteShare: 50.3 }, { party: AKP, voteShare: 35.7 }, { party: CHP, voteShare: 8.2 }, { party: MHP, voteShare: 3.1 }], 68.5),
  makeResult('Aksaray', AKP, [{ party: AKP, voteShare: 52.1 }, { party: CHP, voteShare: 25.3 }, { party: MHP, voteShare: 12.4 }, { party: YRP, voteShare: 6.8 }], 80.2),
  makeResult('Amasya', CHP, [{ party: CHP, voteShare: 42.8 }, { party: AKP, voteShare: 38.5 }, { party: MHP, voteShare: 10.2 }, { party: IYI, voteShare: 4.8 }], 83.1),
  makeResult('Ankara', CHP, [{ party: CHP, voteShare: 60.4 }, { party: AKP, voteShare: 26.7 }, { party: YRP, voteShare: 5.8 }, { party: MHP, voteShare: 3.5 }], 87.5),
  makeResult('Antalya', CHP, [{ party: CHP, voteShare: 55.6 }, { party: AKP, voteShare: 28.3 }, { party: MHP, voteShare: 7.2 }, { party: IYI, voteShare: 4.5 }], 84.9),
  makeResult('Ardahan', CHP, [{ party: CHP, voteShare: 41.2 }, { party: AKP, voteShare: 34.8 }, { party: DEM, voteShare: 14.5 }, { party: MHP, voteShare: 5.2 }], 72.3),
  makeResult('Artvin', CHP, [{ party: CHP, voteShare: 55.8 }, { party: AKP, voteShare: 30.2 }, { party: MHP, voteShare: 7.1 }, { party: IYI, voteShare: 3.8 }], 81.5),
  makeResult('Aydın', CHP, [{ party: CHP, voteShare: 54.3 }, { party: AKP, voteShare: 28.9 }, { party: MHP, voteShare: 8.5 }, { party: IYI, voteShare: 4.2 }], 84.2),
  makeResult('Balıkesir', CHP, [{ party: CHP, voteShare: 49.8 }, { party: AKP, voteShare: 35.1 }, { party: MHP, voteShare: 7.8 }, { party: IYI, voteShare: 3.9 }], 83.6),
  makeResult('Bartın', AKP, [{ party: AKP, voteShare: 43.5 }, { party: CHP, voteShare: 38.2 }, { party: MHP, voteShare: 9.8 }, { party: YRP, voteShare: 4.5 }], 80.8),
  makeResult('Batman', DEM, [{ party: DEM, voteShare: 55.2 }, { party: AKP, voteShare: 30.5 }, { party: CHP, voteShare: 8.1 }, { party: MHP, voteShare: 3.2 }], 71.4),
  makeResult('Bayburt', AKP, [{ party: AKP, voteShare: 55.8 }, { party: CHP, voteShare: 19.5 }, { party: MHP, voteShare: 15.2 }, { party: YRP, voteShare: 5.8 }], 78.5),
  makeResult('Bilecik', CHP, [{ party: CHP, voteShare: 47.2 }, { party: AKP, voteShare: 36.5 }, { party: MHP, voteShare: 8.9 }, { party: IYI, voteShare: 4.1 }], 82.9),
  makeResult('Bingöl', AKP, [{ party: AKP, voteShare: 48.5 }, { party: DEM, voteShare: 35.2 }, { party: CHP, voteShare: 9.1 }, { party: MHP, voteShare: 4.2 }], 70.2),
  makeResult('Bitlis', DEM, [{ party: DEM, voteShare: 47.8 }, { party: AKP, voteShare: 38.5 }, { party: CHP, voteShare: 7.5 }, { party: MHP, voteShare: 3.8 }], 69.1),
  makeResult('Bolu', AKP, [{ party: AKP, voteShare: 45.2 }, { party: CHP, voteShare: 40.1 }, { party: MHP, voteShare: 7.5 }, { party: IYI, voteShare: 4.2 }], 83.5),
  makeResult('Burdur', AKP, [{ party: AKP, voteShare: 44.5 }, { party: CHP, voteShare: 35.8 }, { party: MHP, voteShare: 11.2 }, { party: YRP, voteShare: 4.8 }], 81.8),
  makeResult('Bursa', CHP, [{ party: CHP, voteShare: 49.5 }, { party: AKP, voteShare: 34.8 }, { party: MHP, voteShare: 6.5 }, { party: YRP, voteShare: 5.2 }], 85.1),
  makeResult('Çanakkale', CHP, [{ party: CHP, voteShare: 57.2 }, { party: AKP, voteShare: 27.5 }, { party: MHP, voteShare: 7.8 }, { party: IYI, voteShare: 4.1 }], 84.5),
  makeResult('Çankırı', AKP, [{ party: AKP, voteShare: 47.8 }, { party: CHP, voteShare: 28.5 }, { party: MHP, voteShare: 14.2 }, { party: YRP, voteShare: 5.5 }], 79.8),
  makeResult('Çorum', AKP, [{ party: AKP, voteShare: 43.5 }, { party: CHP, voteShare: 38.8 }, { party: MHP, voteShare: 9.2 }, { party: YRP, voteShare: 4.8 }], 81.2),
  makeResult('Denizli', CHP, [{ party: CHP, voteShare: 48.5 }, { party: AKP, voteShare: 34.2 }, { party: MHP, voteShare: 9.1 }, { party: IYI, voteShare: 4.5 }], 83.8),
  makeResult('Diyarbakır', DEM, [{ party: DEM, voteShare: 62.5 }, { party: AKP, voteShare: 24.8 }, { party: CHP, voteShare: 7.2 }, { party: MHP, voteShare: 2.5 }], 72.8),
  makeResult('Düzce', AKP, [{ party: AKP, voteShare: 46.5 }, { party: CHP, voteShare: 35.8 }, { party: MHP, voteShare: 8.5 }, { party: YRP, voteShare: 5.2 }], 82.5),
  makeResult('Edirne', CHP, [{ party: CHP, voteShare: 62.5 }, { party: AKP, voteShare: 22.8 }, { party: MHP, voteShare: 7.5 }, { party: IYI, voteShare: 4.1 }], 85.2),
  makeResult('Elazığ', AKP, [{ party: AKP, voteShare: 50.2 }, { party: CHP, voteShare: 24.5 }, { party: MHP, voteShare: 12.8 }, { party: YRP, voteShare: 7.1 }], 79.5),
  makeResult('Erzincan', CHP, [{ party: CHP, voteShare: 44.8 }, { party: AKP, voteShare: 39.5 }, { party: MHP, voteShare: 8.2 }, { party: IYI, voteShare: 4.5 }], 80.8),
  makeResult('Erzurum', AKP, [{ party: AKP, voteShare: 52.8 }, { party: CHP, voteShare: 20.5 }, { party: MHP, voteShare: 13.2 }, { party: YRP, voteShare: 8.5 }], 78.2),
  makeResult('Eskişehir', CHP, [{ party: CHP, voteShare: 58.2 }, { party: AKP, voteShare: 27.5 }, { party: MHP, voteShare: 6.8 }, { party: IYI, voteShare: 4.2 }], 86.5),
  makeResult('Gaziantep', AKP, [{ party: AKP, voteShare: 44.8 }, { party: CHP, voteShare: 34.5 }, { party: YRP, voteShare: 9.2 }, { party: MHP, voteShare: 6.5 }], 81.5),
  makeResult('Giresun', AKP, [{ party: AKP, voteShare: 45.2 }, { party: CHP, voteShare: 37.8 }, { party: MHP, voteShare: 9.5 }, { party: IYI, voteShare: 4.2 }], 80.5),
  makeResult('Gümüşhane', AKP, [{ party: AKP, voteShare: 51.2 }, { party: CHP, voteShare: 25.8 }, { party: MHP, voteShare: 13.5 }, { party: YRP, voteShare: 5.5 }], 78.8),
  makeResult('Hakkari', DEM, [{ party: DEM, voteShare: 72.5 }, { party: AKP, voteShare: 18.2 }, { party: CHP, voteShare: 5.1 }, { party: MHP, voteShare: 1.8 }], 65.5),
  makeResult('Hatay', CHP, [{ party: CHP, voteShare: 47.5 }, { party: AKP, voteShare: 33.8 }, { party: MHP, voteShare: 9.2 }, { party: YRP, voteShare: 5.5 }], 78.2),
  makeResult('Iğdır', DEM, [{ party: DEM, voteShare: 45.8 }, { party: AKP, voteShare: 35.2 }, { party: MHP, voteShare: 11.5 }, { party: CHP, voteShare: 4.5 }], 70.5),
  makeResult('Isparta', AKP, [{ party: AKP, voteShare: 42.8 }, { party: CHP, voteShare: 36.5 }, { party: MHP, voteShare: 12.2 }, { party: IYI, voteShare: 4.8 }], 82.5),
  makeResult('İstanbul', CHP, [{ party: CHP, voteShare: 51.2 }, { party: AKP, voteShare: 31.5 }, { party: YRP, voteShare: 7.8 }, { party: MHP, voteShare: 4.5 }], 83.9),
  makeResult('İzmir', CHP, [{ party: CHP, voteShare: 62.8 }, { party: AKP, voteShare: 22.5 }, { party: MHP, voteShare: 6.2 }, { party: IYI, voteShare: 4.8 }], 86.2),
  makeResult('Kahramanmaraş', AKP, [{ party: AKP, voteShare: 47.5 }, { party: CHP, voteShare: 27.2 }, { party: MHP, voteShare: 13.5 }, { party: YRP, voteShare: 7.8 }], 79.5),
  makeResult('Karabük', AKP, [{ party: AKP, voteShare: 44.8 }, { party: CHP, voteShare: 37.2 }, { party: MHP, voteShare: 9.8 }, { party: YRP, voteShare: 4.5 }], 81.5),
  makeResult('Karaman', AKP, [{ party: AKP, voteShare: 45.5 }, { party: CHP, voteShare: 32.8 }, { party: MHP, voteShare: 12.5 }, { party: YRP, voteShare: 5.2 }], 80.8),
  makeResult('Kars', CHP, [{ party: CHP, voteShare: 38.5 }, { party: AKP, voteShare: 32.2 }, { party: DEM, voteShare: 20.8 }, { party: MHP, voteShare: 5.2 }], 73.5),
  makeResult('Kastamonu', AKP, [{ party: AKP, voteShare: 44.2 }, { party: CHP, voteShare: 38.5 }, { party: MHP, voteShare: 9.8 }, { party: IYI, voteShare: 4.2 }], 81.2),
  makeResult('Kayseri', AKP, [{ party: AKP, voteShare: 42.5 }, { party: CHP, voteShare: 30.8 }, { party: YRP, voteShare: 14.2 }, { party: MHP, voteShare: 7.5 }], 82.8),
  makeResult('Kilis', AKP, [{ party: AKP, voteShare: 48.2 }, { party: CHP, voteShare: 28.5 }, { party: MHP, voteShare: 12.8 }, { party: YRP, voteShare: 6.5 }], 78.2),
  makeResult('Kırıkkale', AKP, [{ party: AKP, voteShare: 43.8 }, { party: CHP, voteShare: 38.2 }, { party: MHP, voteShare: 10.5 }, { party: YRP, voteShare: 4.2 }], 81.5),
  makeResult('Kırklareli', CHP, [{ party: CHP, voteShare: 61.5 }, { party: AKP, voteShare: 23.2 }, { party: MHP, voteShare: 7.8 }, { party: IYI, voteShare: 4.5 }], 85.5),
  makeResult('Kırşehir', CHP, [{ party: CHP, voteShare: 50.2 }, { party: AKP, voteShare: 32.5 }, { party: MHP, voteShare: 9.8 }, { party: IYI, voteShare: 4.2 }], 82.8),
  makeResult('Kocaeli', CHP, [{ party: CHP, voteShare: 48.5 }, { party: AKP, voteShare: 35.2 }, { party: MHP, voteShare: 7.2 }, { party: YRP, voteShare: 5.1 }], 84.5),
  makeResult('Konya', AKP, [{ party: AKP, voteShare: 47.8 }, { party: CHP, voteShare: 24.5 }, { party: YRP, voteShare: 15.2 }, { party: MHP, voteShare: 7.5 }], 82.2),
  makeResult('Kütahya', AKP, [{ party: AKP, voteShare: 46.2 }, { party: CHP, voteShare: 30.5 }, { party: MHP, voteShare: 13.8 }, { party: YRP, voteShare: 5.5 }], 80.5),
  makeResult('Malatya', AKP, [{ party: AKP, voteShare: 44.8 }, { party: CHP, voteShare: 30.2 }, { party: YRP, voteShare: 12.5 }, { party: MHP, voteShare: 7.5 }], 79.2),
  makeResult('Manisa', CHP, [{ party: CHP, voteShare: 48.8 }, { party: AKP, voteShare: 34.5 }, { party: MHP, voteShare: 8.5 }, { party: IYI, voteShare: 4.2 }], 83.5),
  makeResult('Mardin', DEM, [{ party: DEM, voteShare: 55.8 }, { party: AKP, voteShare: 30.2 }, { party: CHP, voteShare: 8.5 }, { party: MHP, voteShare: 2.8 }], 69.5),
  makeResult('Mersin', CHP, [{ party: CHP, voteShare: 52.5 }, { party: AKP, voteShare: 30.8 }, { party: MHP, voteShare: 7.2 }, { party: YRP, voteShare: 5.5 }], 83.8),
  makeResult('Muğla', CHP, [{ party: CHP, voteShare: 60.2 }, { party: AKP, voteShare: 24.5 }, { party: MHP, voteShare: 7.8 }, { party: IYI, voteShare: 4.5 }], 85.8),
  makeResult('Muş', DEM, [{ party: DEM, voteShare: 48.5 }, { party: AKP, voteShare: 38.2 }, { party: CHP, voteShare: 7.2 }, { party: MHP, voteShare: 3.5 }], 68.5),
  makeResult('Nevşehir', AKP, [{ party: AKP, voteShare: 45.8 }, { party: CHP, voteShare: 33.5 }, { party: MHP, voteShare: 11.2 }, { party: YRP, voteShare: 5.5 }], 81.5),
  makeResult('Niğde', AKP, [{ party: AKP, voteShare: 44.2 }, { party: CHP, voteShare: 35.8 }, { party: MHP, voteShare: 11.5 }, { party: YRP, voteShare: 4.8 }], 80.8),
  makeResult('Ordu', AKP, [{ party: AKP, voteShare: 44.5 }, { party: CHP, voteShare: 38.2 }, { party: MHP, voteShare: 9.5 }, { party: IYI, voteShare: 4.5 }], 81.2),
  makeResult('Osmaniye', MHP, [{ party: MHP, voteShare: 42.5 }, { party: AKP, voteShare: 30.8 }, { party: CHP, voteShare: 18.2 }, { party: YRP, voteShare: 4.8 }], 80.5),
  makeResult('Rize', AKP, [{ party: AKP, voteShare: 55.5 }, { party: CHP, voteShare: 22.8 }, { party: MHP, voteShare: 10.2 }, { party: YRP, voteShare: 7.5 }], 82.5),
  makeResult('Sakarya', AKP, [{ party: AKP, voteShare: 44.8 }, { party: CHP, voteShare: 37.2 }, { party: MHP, voteShare: 8.5 }, { party: YRP, voteShare: 5.5 }], 83.2),
  makeResult('Samsun', AKP, [{ party: AKP, voteShare: 43.5 }, { party: CHP, voteShare: 39.2 }, { party: MHP, voteShare: 9.2 }, { party: IYI, voteShare: 4.8 }], 82.5),
  makeResult('Şanlıurfa', AKP, [{ party: AKP, voteShare: 48.5 }, { party: DEM, voteShare: 25.8 }, { party: CHP, voteShare: 14.2 }, { party: YRP, voteShare: 7.5 }], 74.2),
  makeResult('Siirt', AKP, [{ party: AKP, voteShare: 45.2 }, { party: DEM, voteShare: 38.5 }, { party: CHP, voteShare: 9.2 }, { party: MHP, voteShare: 4.1 }], 70.8),
  makeResult('Sinop', CHP, [{ party: CHP, voteShare: 52.5 }, { party: AKP, voteShare: 32.8 }, { party: MHP, voteShare: 7.5 }, { party: IYI, voteShare: 4.2 }], 82.5),
  makeResult('Şırnak', DEM, [{ party: DEM, voteShare: 65.5 }, { party: AKP, voteShare: 25.2 }, { party: CHP, voteShare: 5.5 }, { party: MHP, voteShare: 1.8 }], 66.5),
  makeResult('Sivas', AKP, [{ party: AKP, voteShare: 46.5 }, { party: CHP, voteShare: 30.8 }, { party: MHP, voteShare: 12.5 }, { party: YRP, voteShare: 6.2 }], 80.2),
  makeResult('Tekirdağ', CHP, [{ party: CHP, voteShare: 55.8 }, { party: AKP, voteShare: 28.5 }, { party: MHP, voteShare: 7.2 }, { party: IYI, voteShare: 4.8 }], 85.2),
  makeResult('Tokat', AKP, [{ party: AKP, voteShare: 44.8 }, { party: CHP, voteShare: 37.5 }, { party: MHP, voteShare: 9.8 }, { party: YRP, voteShare: 4.5 }], 80.5),
  makeResult('Trabzon', AKP, [{ party: AKP, voteShare: 48.2 }, { party: CHP, voteShare: 30.5 }, { party: MHP, voteShare: 10.8 }, { party: IYI, voteShare: 5.5 }], 82.2),
  makeResult('Tunceli', CHP, [{ party: CHP, voteShare: 55.5 }, { party: DEM, voteShare: 25.2 }, { party: AKP, voteShare: 12.5 }, { party: MHP, voteShare: 3.8 }], 75.2),
  makeResult('Uşak', CHP, [{ party: CHP, voteShare: 47.5 }, { party: AKP, voteShare: 35.2 }, { party: MHP, voteShare: 9.5 }, { party: IYI, voteShare: 4.8 }], 82.8),
  makeResult('Van', DEM, [{ party: DEM, voteShare: 58.2 }, { party: AKP, voteShare: 30.5 }, { party: CHP, voteShare: 6.2 }, { party: MHP, voteShare: 2.5 }], 70.2),
  makeResult('Yalova', CHP, [{ party: CHP, voteShare: 50.8 }, { party: AKP, voteShare: 32.5 }, { party: MHP, voteShare: 7.8 }, { party: IYI, voteShare: 5.2 }], 84.5),
  makeResult('Yozgat', AKP, [{ party: AKP, voteShare: 48.5 }, { party: CHP, voteShare: 28.2 }, { party: MHP, voteShare: 13.5 }, { party: YRP, voteShare: 5.8 }], 79.8),
  makeResult('Zonguldak', CHP, [{ party: CHP, voteShare: 51.2 }, { party: AKP, voteShare: 33.5 }, { party: MHP, voteShare: 8.2 }, { party: IYI, voteShare: 4.1 }], 83.2),
]

// ─── Parti Özeti Hesaplama ─────────────────────────────────────

function computePartySummary(results: ProvinceResult[]): PartySummary[] {
  const partyMap = new Map<string, { party: Party; totalShare: number; count: number; won: number }>()

  results.forEach((pr) => {
    pr.results.forEach((r) => {
      const existing = partyMap.get(r.party.id)
      if (existing) {
        existing.totalShare += r.voteShare
        existing.count += 1
        if (pr.winningParty.id === r.party.id) existing.won += 1
      } else {
        partyMap.set(r.party.id, {
          party: r.party,
          totalShare: r.voteShare,
          count: 1,
          won: pr.winningParty.id === r.party.id ? 1 : 0,
        })
      }
    })
  })

  return Array.from(partyMap.values())
    .map((v) => ({
      party: v.party,
      totalVoteShare: Math.round((v.totalShare / v.count) * 10) / 10,
      wonProvinces: v.won,
    }))
    .sort((a, b) => b.wonProvinces - a.wonProvinces)
}

// ─── Export ────────────────────────────────────────────────────

export const mockElections: ElectionData[] = [
  {
    id: '2024-yerel',
    name: '2024 Yerel Secimleri',
    date: '2024-03-31',
    provinceResults: provinceResults2024,
    partySummary: computePartySummary(provinceResults2024),
  },
]

/**
 * Get mock election data by ID. Falls back to first election if not found.
 */
export function getMockElectionData(electionId: string): ElectionData {
  const found = mockElections.find((e) => e.id === electionId)
  if (found) return found
  return mockElections[0]!
}

/**
 * Get list of available mock elections (for dropdown).
 */
export function getMockElectionList() {
  return mockElections.map((e) => ({ id: e.id, name: e.name, date: e.date }))
}
