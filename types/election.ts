import type {
  Election as PrismaElection,
  Candidate as PrismaCandidate,
  Party as PrismaParty,
  PollResult as PrismaPollResult,
  PollFirm as PrismaPollFirm,
  HistoricalResult as PrismaHistoricalResult,
  Region as PrismaRegion,
  Prediction as PrismaPrediction,
  DataSource as PrismaDataSource,
} from "@prisma/client";

// ─────────────────────────────────────────────
// Base Types (re-export Prisma types)
// ─────────────────────────────────────────────

export type Election = PrismaElection;
export type Candidate = PrismaCandidate;
export type Party = PrismaParty;
export type PollResult = PrismaPollResult;
export type PollFirm = PrismaPollFirm;
export type HistoricalResult = PrismaHistoricalResult;
export type Region = PrismaRegion;
export type Prediction = PrismaPrediction;
export type DataSource = PrismaDataSource;

// ─────────────────────────────────────────────
// Extended / Joined Types
// ─────────────────────────────────────────────

export type ElectionWithRelations = PrismaElection & {
  region: PrismaRegion | null;
  candidates: CandidateWithParty[];
  pollResults: PollResultWithRelations[];
  predictions: PrismaPrediction[];
  _count?: {
    candidates: number;
    pollResults: number;
    predictions: number;
    comments: number;
    historicalResults: number;
  };
};

export type CandidateWithParty = PrismaCandidate & {
  party: PrismaParty | null;
};

export type PollResultWithRelations = PrismaPollResult & {
  pollFirm: PrismaPollFirm;
  party: PrismaParty | null;
  candidate: PrismaCandidate | null;
  dataSource: PrismaDataSource | null;
};

export type PollFirmWithStats = PrismaPollFirm & {
  _count: {
    pollResults: number;
  };
};

export type HistoricalResultWithRelations = PrismaHistoricalResult & {
  election: PrismaElection;
  party: PrismaParty | null;
  candidate: PrismaCandidate | null;
  region: PrismaRegion | null;
};

export type RegionWithChildren = PrismaRegion & {
  children: PrismaRegion[];
  parent: PrismaRegion | null;
  historicalResults: PrismaHistoricalResult[];
};

export type PredictionWithRelations = PrismaPrediction & {
  election: PrismaElection;
  party: PrismaParty | null;
  candidate: PrismaCandidate | null;
  region: PrismaRegion | null;
};

export type DataSourceWithRelations = PrismaDataSource & {
  election: PrismaElection | null;
  pollResults: PrismaPollResult[];
};

// ─────────────────────────────────────────────
// Summary / Card Types
// ─────────────────────────────────────────────

export interface ElectionSummary {
  id: string;
  title: string;
  slug: string;
  type: PrismaElection["type"];
  status: PrismaElection["status"];
  country: string;
  date: Date;
  round: number;
  coverImage: string | null;
  candidateCount: number;
  pollResultCount: number;
  predictionCount: number;
  latestPollDate: Date | null;
}

export interface PollTrend {
  date: string;
  firmName: string;
  firmSlug: string;
  items: {
    candidateId: string | null;
    partyId: string | null;
    label: string;
    percentage: number;
    color: string;
    reliabilityScore: number | null;
  }[];
}

export interface ElectionMapData {
  regionCode: string;
  regionName: string;
  regionType: string;
  winnerId: string | null;
  winnerName: string | null;
  winnerColor: string | null;
  percentage: number;
  totalVotes: number;
  turnout: number | null;
}

export interface PredictionSummary {
  partyOrCandidateName: string;
  color: string;
  low: number;
  mid: number;
  high: number;
  confidence: number | null;
  status: string;
  actualResult: number | null;
  deviation: number | null;
}
