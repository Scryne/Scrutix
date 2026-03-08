export interface Party {
  id: string
  name: string
  shortName: string
  color: string
}

export interface PartyResult {
  party: Party
  voteShare: number
}

export interface ProvinceResult {
  provinceName: string
  winningParty: Party
  results: PartyResult[]
  turnout: number
}

export interface PartySummary {
  party: Party
  totalVoteShare: number
  wonProvinces: number
}

export interface ElectionData {
  id: string
  name: string
  date: string
  provinceResults: ProvinceResult[]
  partySummary: PartySummary[]
}

export interface ElectionListItem {
  id: string
  name: string
  date: string
}

export interface MapState {
  selectedElectionId: string
  viewMode: 'winner' | 'party'
  selectedPartyId: string | null
  hoveredProvince: string | null
  selectedProvince: string | null
}

export interface TooltipData {
  provinceName: string | null
  result: ProvinceResult | null
  position: { x: number; y: number } | null
}
