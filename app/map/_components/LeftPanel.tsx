'use client'

import type { ElectionData, PartySummary } from '../_utils/types'
import { matchProvinceName } from '../_utils/normalize'

interface LeftPanelProps {
  electionData: ElectionData | null
  viewMode: 'winner' | 'party'
  selectedPartyId: string | null
  selectedProvince: string | null
  onBackToList: () => void
}

export default function LeftPanel({
  electionData,
  viewMode,
  selectedPartyId,
  selectedProvince,
  onBackToList,
}: LeftPanelProps) {
  if (!electionData) {
    return (
      <div style={panelStyle}>
        <div style={{ padding: 16, color: '#94a3b8', fontSize: 14 }}>
          Veri yukleniyor...
        </div>
      </div>
    )
  }

  // If a province is selected, show province detail
  if (selectedProvince) {
    const provinceResult = electionData.provinceResults.find((pr) =>
      matchProvinceName(pr.provinceName, selectedProvince)
    )

    if (!provinceResult) {
      return (
        <div style={panelStyle}>
          <div style={{ padding: 16, color: '#94a3b8' }}>Il bulunamadi</div>
        </div>
      )
    }

    return (
      <div style={panelStyle}>
        {/* Back button */}
        <button
          onClick={onBackToList}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '12px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid #1e3a5f',
            color: '#C9A84C',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            width: '100%',
            textAlign: 'left',
          }}
        >
          &larr; Tum Partiler
        </button>

        {/* Province name */}
        <div style={{ padding: '16px 16px 8px', fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>
          {provinceResult.provinceName}
        </div>

        {/* Winner card */}
        <div
          style={{
            margin: '0 16px 12px',
            padding: '12px 14px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.05)',
            borderLeft: `4px solid ${provinceResult.winningParty.color}`,
          }}
        >
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>KAZANAN</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: provinceResult.winningParty.color }}>
            {provinceResult.winningParty.shortName}
          </div>
          <div style={{ fontSize: 13, color: '#cbd5e1' }}>
            {provinceResult.winningParty.name}
          </div>
        </div>

        {/* All party results */}
        <div style={{ padding: '0 16px' }}>
          {provinceResult.results
            .slice()
            .sort((a, b) => b.voteShare - a.voteShare)
            .map((r) => (
              <div key={r.party.id} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{r.party.shortName}</span>
                  <span style={{ color: '#94a3b8' }}>%{r.voteShare.toFixed(1)}</span>
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 3,
                    background: 'rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${r.voteShare}%`,
                      background: r.party.color,
                      borderRadius: 3,
                      transition: 'width 300ms ease',
                    }}
                  />
                </div>
              </div>
            ))}
        </div>

        {/* Turnout */}
        <div
          style={{
            margin: '16px 16px 0',
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid #1e3a5f',
          }}
        >
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>KATILIM ORANI</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#C9A84C' }}>
            %{provinceResult.turnout.toFixed(1)}
          </div>
        </div>
      </div>
    )
  }

  // Party mode — show selected party stats
  if (viewMode === 'party' && selectedPartyId) {
    const partyInfo = electionData.partySummary.find((ps) => ps.party.id === selectedPartyId)
    if (!partyInfo) return <div style={panelStyle} />

    return (
      <div style={panelStyle}>
        <div style={{ padding: 16 }}>
          {/* Party big card */}
          <div
            style={{
              padding: '20px 16px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.05)',
              borderLeft: `5px solid ${partyInfo.party.color}`,
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: partyInfo.party.color }}>
              {partyInfo.party.shortName}
            </div>
            <div style={{ fontSize: 13, color: '#cbd5e1', marginTop: 2 }}>
              {partyInfo.party.name}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <StatBox label="Oy Orani" value={`%${partyInfo.totalVoteShare.toFixed(1)}`} color={partyInfo.party.color} />
            <StatBox label="Kazanilan Il" value={String(partyInfo.wonProvinces)} color={partyInfo.party.color} />
          </div>

          {/* Won provinces list */}
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>
            KAZANILAN ILLER
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {electionData.provinceResults
              .filter((pr) => pr.winningParty.id === selectedPartyId)
              .map((pr) => (
                <span
                  key={pr.provinceName}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: 'rgba(255,255,255,0.06)',
                    color: '#cbd5e1',
                    fontSize: 11,
                  }}
                >
                  {pr.provinceName}
                </span>
              ))}
          </div>
        </div>
      </div>
    )
  }

  // Default: Party ranking list (winner mode)
  return (
    <div style={panelStyle}>
      <div style={{ padding: '16px 16px 8px', fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
        PARTİ SIRALAMASI
      </div>
      {electionData.partySummary.map((ps) => (
        <PartyCard key={ps.party.id} summary={ps} />
      ))}
    </div>
  )
}

// ─── Sub components ──────────────────────────────────────────

function PartyCard({ summary }: { summary: PartySummary }) {
  const barWidth = (summary.wonProvinces / 81) * 100

  return (
    <div
      style={{
        margin: '0 12px 8px',
        padding: '10px 14px',
        borderRadius: 8,
        background: 'rgba(255,255,255,0.04)',
        borderLeft: `4px solid ${summary.party.color}`,
        cursor: 'default',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 14 }}>
          {summary.party.shortName}
        </span>
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#94a3b8' }}>
          <span>%{summary.totalVoteShare.toFixed(1)}</span>
          <span>{summary.wonProvinces} il</span>
        </div>
      </div>
      <div
        style={{
          height: 5,
          borderRadius: 3,
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${barWidth}%`,
            background: summary.party.color,
            borderRadius: 3,
            transition: 'width 300ms ease',
          }}
        />
      </div>
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        flex: 1,
        padding: '14px 12px',
        borderRadius: 8,
        background: 'rgba(255,255,255,0.04)',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────

const panelStyle: React.CSSProperties = {
  width: 300,
  minWidth: 300,
  height: '100%',
  background: '#0F2744',
  borderRight: '1px solid #1e3a5f',
  overflowY: 'auto',
  overflowX: 'hidden',
}
