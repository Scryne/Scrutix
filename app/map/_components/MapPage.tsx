'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { MapState, ElectionListItem, ElectionData, ProvinceResult } from '../_utils/types'
import { matchProvinceName } from '../_utils/normalize'
import TopBar from './TopBar'
import LeftPanel from './LeftPanel'
import Tooltip from './Tooltip'
import BottomLegend from './BottomLegend'

// Dynamic import for MapCanvas — SSR disabled (MapLibre needs DOM)
const MapCanvas = dynamic(() => import('./MapCanvas'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#0d1b2e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ color: '#C9A84C', fontSize: 14 }}>Harita yukleniyor...</div>
    </div>
  ),
})

export default function MapPage() {
  // ─── State ──────────────────────────────────────────────────
  const [mapState, setMapState] = useState<MapState>({
    selectedElectionId: '',
    viewMode: 'winner',
    selectedPartyId: null,
    hoveredProvince: null,
    selectedProvince: null,
  })
  const [elections, setElections] = useState<ElectionListItem[]>([])
  const [electionData, setElectionData] = useState<ElectionData | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // ─── Fetch election list ──────────────────────────────────
  useEffect(() => {
    fetch('/api/map/elections')
      .then((r) => r.json())
      .then((data: ElectionListItem[]) => {
        setElections(data)
        if (data.length > 0 && data[0]) {
          setMapState((s) => ({ ...s, selectedElectionId: data[0]!.id }))
        }
      })
      .catch(() => {
        // Silently fail — mock data will be used via API
      })
  }, [])

  // ─── Fetch election results ───────────────────────────────
  useEffect(() => {
    if (!mapState.selectedElectionId) return
    setIsLoading(true)
    fetch(`/api/map/results?electionId=${mapState.selectedElectionId}`)
      .then((r) => r.json())
      .then((data: ElectionData) => {
        setElectionData(data)
        // Auto-select first party for party mode
        if (data.partySummary.length > 0 && data.partySummary[0] && !mapState.selectedPartyId) {
          setMapState((s) => ({ ...s, selectedPartyId: data.partySummary[0]!.party.id }))
        }
        setIsLoading(false)
      })
      .catch(() => {
        setIsLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapState.selectedElectionId])

  // ─── Derived data ─────────────────────────────────────────
  const uniqueParties = useMemo(() => {
    if (!electionData) return []
    return electionData.partySummary.map((ps) => ps.party)
  }, [electionData])

  const hoveredResult = useMemo((): ProvinceResult | null => {
    if (!electionData || !mapState.hoveredProvince) return null
    return (
      electionData.provinceResults.find((pr) =>
        matchProvinceName(pr.provinceName, mapState.hoveredProvince!)
      ) ?? null
    )
  }, [electionData, mapState.hoveredProvince])

  // ─── Handlers ─────────────────────────────────────────────
  const handleElectionChange = useCallback((id: string) => {
    setMapState((s) => ({
      ...s,
      selectedElectionId: id,
      selectedProvince: null,
      hoveredProvince: null,
    }))
  }, [])

  const handleViewModeChange = useCallback((mode: 'winner' | 'party') => {
    setMapState((s) => ({ ...s, viewMode: mode, selectedProvince: null }))
  }, [])

  const handlePartyChange = useCallback((partyId: string) => {
    setMapState((s) => ({ ...s, selectedPartyId: partyId }))
  }, [])

  const handleHover = useCallback(
    (name: string | null, point: { x: number; y: number } | null) => {
      setMapState((s) => ({ ...s, hoveredProvince: name }))
      setTooltipPos(point)
    },
    []
  )

  const handleClick = useCallback((name: string) => {
    setMapState((s) => ({
      ...s,
      selectedProvince: s.selectedProvince === name ? null : name,
    }))
  }, [])

  const handleBackToList = useCallback(() => {
    setMapState((s) => ({ ...s, selectedProvince: null }))
  }, [])

  // ─── Render ───────────────────────────────────────────────
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 64px)',
        overflow: 'hidden',
      }}
    >
      {/* Top bar — 56px */}
      <TopBar
        elections={elections}
        parties={uniqueParties}
        mapState={mapState}
        onElectionChange={handleElectionChange}
        onViewModeChange={handleViewModeChange}
        onPartyChange={handlePartyChange}
      />

      {/* Main content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left panel — 300px */}
        <LeftPanel
          electionData={electionData}
          viewMode={mapState.viewMode}
          selectedPartyId={mapState.selectedPartyId}
          selectedProvince={mapState.selectedProvince}
          onBackToList={handleBackToList}
        />

        {/* Map area — rest of the space */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Loading overlay */}
          {isLoading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(13,27,46,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
            >
              <div
                className="animate-spin"
                style={{
                  width: 32,
                  height: 32,
                  border: '2px solid #C9A84C',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                }}
              />
            </div>
          )}

          {/* Map */}
          <MapCanvas
            provinceResults={electionData?.provinceResults ?? []}
            viewMode={mapState.viewMode}
            selectedPartyId={mapState.selectedPartyId}
            hoveredProvince={mapState.hoveredProvince}
            selectedProvince={mapState.selectedProvince}
            onHover={handleHover}
            onClick={handleClick}
          />

          {/* Tooltip */}
          <Tooltip
            provinceName={mapState.hoveredProvince}
            result={hoveredResult}
            position={tooltipPos}
          />
        </div>
      </div>

      {/* Bottom legend — 44px */}
      <BottomLegend
        viewMode={mapState.viewMode}
        partySummary={electionData?.partySummary ?? []}
        selectedPartyId={mapState.selectedPartyId}
      />
    </div>
  )
}
