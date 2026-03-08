'use client'

import type { ElectionListItem, Party, MapState } from '../_utils/types'

interface TopBarProps {
  elections: ElectionListItem[]
  parties: Party[]
  mapState: MapState
  onElectionChange: (id: string) => void
  onViewModeChange: (mode: 'winner' | 'party') => void
  onPartyChange: (partyId: string) => void
}

export default function TopBar({
  elections,
  parties,
  mapState,
  onElectionChange,
  onViewModeChange,
  onPartyChange,
}: TopBarProps) {
  return (
    <div
      style={{
        height: 56,
        minHeight: 56,
        background: '#0B1F3A',
        borderBottom: '1px solid #1e3a5f',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* Election selector */}
      <select
        value={mapState.selectedElectionId}
        onChange={(e) => onElectionChange(e.target.value)}
        style={{
          background: '#162d4a',
          color: '#e2e8f0',
          border: '1px solid #1e3a5f',
          borderRadius: 6,
          padding: '6px 12px',
          fontSize: 14,
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {elections.map((el) => (
          <option key={el.id} value={el.id}>
            {el.name}
          </option>
        ))}
      </select>

      {/* Separator */}
      <div style={{ width: 1, height: 28, background: '#1e3a5f' }} />

      {/* View mode toggle */}
      <div
        style={{
          display: 'flex',
          borderRadius: 6,
          overflow: 'hidden',
          border: '1px solid #C9A84C',
        }}
      >
        <button
          onClick={() => onViewModeChange('winner')}
          style={{
            padding: '6px 14px',
            fontSize: 13,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            background: mapState.viewMode === 'winner' ? '#C9A84C' : 'transparent',
            color: mapState.viewMode === 'winner' ? '#0B1F3A' : '#C9A84C',
            transition: 'all 150ms ease',
          }}
        >
          Kazananlar
        </button>
        <button
          onClick={() => onViewModeChange('party')}
          style={{
            padding: '6px 14px',
            fontSize: 13,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            background: mapState.viewMode === 'party' ? '#C9A84C' : 'transparent',
            color: mapState.viewMode === 'party' ? '#0B1F3A' : '#C9A84C',
            transition: 'all 150ms ease',
          }}
        >
          Parti Bazli
        </button>
      </div>

      {/* Party selector (visible only in party mode) */}
      {mapState.viewMode === 'party' && (
        <>
          <div style={{ width: 1, height: 28, background: '#1e3a5f' }} />
          <select
            value={mapState.selectedPartyId ?? ''}
            onChange={(e) => onPartyChange(e.target.value)}
            style={{
              background: '#162d4a',
              color: '#e2e8f0',
              border: '1px solid #1e3a5f',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: 14,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {parties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.shortName}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  )
}
