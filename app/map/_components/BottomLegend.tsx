'use client'

import type { PartySummary } from '../_utils/types'

interface BottomLegendProps {
  viewMode: 'winner' | 'party'
  partySummary: PartySummary[]
  selectedPartyId: string | null
}

export default function BottomLegend({ viewMode, partySummary, selectedPartyId }: BottomLegendProps) {
  return (
    <div
      style={{
        height: 44,
        minHeight: 44,
        background: '#0B1F3A',
        borderTop: '1px solid #1e3a5f',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 16,
        overflowX: 'auto',
      }}
    >
      {viewMode === 'winner' ? (
        // Winner mode: party color squares
        partySummary.map((ps) => (
          <div
            key={ps.party.id}
            style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: ps.party.color,
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500 }}>
              {ps.party.shortName}
            </span>
          </div>
        ))
      ) : (
        // Party mode: intensity gradient
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
          <span style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>Acik</span>
          <div
            style={{
              flex: 1,
              maxWidth: 200,
              height: 10,
              borderRadius: 5,
              background: selectedPartyId
                ? `linear-gradient(to right, ${getPartyColor(partySummary, selectedPartyId)}40, ${getPartyColor(partySummary, selectedPartyId)})`
                : 'linear-gradient(to right, #33415540, #334155)',
            }}
          />
          <span style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>Koyu</span>
          <div style={{ width: 1, height: 20, background: '#1e3a5f', margin: '0 4px' }} />
          <span style={{ fontSize: 11, color: '#64748b' }}>%0</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>%50</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>%100+</span>
        </div>
      )}
    </div>
  )
}

function getPartyColor(partySummary: PartySummary[], partyId: string): string {
  const party = partySummary.find((ps) => ps.party.id === partyId)
  return party?.party.color ?? '#334155'
}
