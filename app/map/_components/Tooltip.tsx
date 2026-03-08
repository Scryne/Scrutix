'use client'

import type { ProvinceResult } from '../_utils/types'

interface TooltipProps {
  provinceName: string | null
  result: ProvinceResult | null
  position: { x: number; y: number } | null
}

export default function Tooltip({ provinceName, result, position }: TooltipProps) {
  const isVisible = !!(provinceName && position)

  // Calculate position offset and clamp to viewport
  let left = (position?.x ?? 0) + 15
  let top = (position?.y ?? 0) + 15

  // Prevent overflow — tooltip is ~220px wide, ~100px tall
  if (typeof window !== 'undefined') {
    if (left + 220 > window.innerWidth) left = left - 240
    if (top + 120 > window.innerHeight) top = top - 130
  }

  return (
    <div
      style={{
        position: 'fixed',
        left,
        top,
        background: 'rgba(11, 31, 58, 0.97)',
        border: '1px solid #C9A84C',
        borderRadius: 8,
        padding: '10px 14px',
        pointerEvents: 'none',
        zIndex: 1000,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 150ms ease',
        minWidth: 160,
      }}
    >
      {isVisible && result && (
        <>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#f1f5f9',
              marginBottom: 6,
            }}
          >
            {provinceName}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: result.winningParty.color,
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>
              {result.winningParty.shortName}
            </span>
            <span style={{ color: '#94a3b8', fontSize: 13, marginLeft: 'auto' }}>
              %{result.results[0]?.voteShare.toFixed(1)}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Katilim: %{result.turnout.toFixed(1)}
          </div>
        </>
      )}
    </div>
  )
}
