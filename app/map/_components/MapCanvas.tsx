'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { ProvinceResult } from '../_utils/types'
import { buildFillExpression } from '../_utils/mapHelpers'
import { normalize } from '../_utils/normalize'

interface MapCanvasProps {
  provinceResults: ProvinceResult[]
  viewMode: 'winner' | 'party'
  selectedPartyId: string | null
  hoveredProvince: string | null
  selectedProvince: string | null
  onHover: (name: string | null, point: { x: number; y: number } | null) => void
  onClick: (name: string) => void
}

export default function MapCanvas({
  provinceResults,
  viewMode,
  selectedPartyId,
  hoveredProvince,
  selectedProvince,
  onHover,
  onClick,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const readyRef = useRef(false)

  // Stable refs for event handlers
  const onHoverRef = useRef(onHover)
  const onClickRef = useRef(onClick)
  useEffect(() => { onHoverRef.current = onHover }, [onHover])
  useEffect(() => { onClickRef.current = onClick }, [onClick])

  // ─── Initialize map (mount only) ──────────────────────────────
  useEffect(() => {
    if (mapRef.current) return
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {},
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: { 'background-color': '#0d1b2e' },
          },
        ],
      },
      center: [35.0, 39.0],
      zoom: 5.5,
      minZoom: 4.5,
      maxZoom: 9,
      maxBounds: [
        [24.0, 34.0],
        [45.5, 43.0],
      ],
      attributionControl: false,
    })

    map.on('load', () => {
      console.log('[MapCanvas] map load event fired')

      // Add GeoJSON source (local file — no CORS issues)
      map.addSource('provinces', {
        type: 'geojson',
        data: '/geo/turkey.geojson',
      })

      // Fill layer — province colors
      map.addLayer({
        id: 'provinces-fill',
        type: 'fill',
        source: 'provinces',
        paint: {
          'fill-color': '#334155',
          'fill-opacity': 0.85,
        },
      })

      // Border layer
      map.addLayer({
        id: 'provinces-border',
        type: 'line',
        source: 'provinces',
        paint: {
          'line-color': '#1e3a5f',
          'line-width': 0.8,
        },
      })

      // Hover highlight layer
      map.addLayer({
        id: 'provinces-hover',
        type: 'fill',
        source: 'provinces',
        paint: {
          'fill-color': '#ffffff',
          'fill-opacity': 0,
        },
      })

      // Selected border layer
      map.addLayer({
        id: 'provinces-selected',
        type: 'line',
        source: 'provinces',
        paint: {
          'line-color': '#C9A84C',
          'line-width': 2.5,
          'line-opacity': 0,
        },
      })

      console.log('[MapCanvas] provinces-fill layer:', map.getLayer('provinces-fill'))
      mapRef.current = map
      readyRef.current = true

      // Trigger initial paint after source loads
      map.once('sourcedata', () => {
        map.fire('mapready')
      })
    })

    // Hover events
    map.on('mousemove', 'provinces-fill', (e) => {
      if (!e.features?.length) return
      const feat = e.features[0]
      const name = feat?.properties?.name ?? ''
      onHoverRef.current(name, { x: e.point.x, y: e.point.y })
      map.getCanvas().style.cursor = 'pointer'
    })

    map.on('mouseleave', 'provinces-fill', () => {
      onHoverRef.current(null, null)
      map.getCanvas().style.cursor = 'grab'
    })

    // Click event
    map.on('click', 'provinces-fill', (e) => {
      if (!e.features?.length) return
      const clickFeat = e.features[0]
      const name = clickFeat?.properties?.name ?? ''
      onClickRef.current(name)
    })

    return () => {
      map.remove()
      mapRef.current = null
      readyRef.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Update fill colors when data/mode changes ────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    if (!map.getLayer('provinces-fill')) return
    if (provinceResults.length === 0) return

    const expression = buildFillExpression(provinceResults, viewMode, selectedPartyId, 'name')
    console.log('[MapCanvas] fill expression:', JSON.stringify(expression).slice(0, 200))
    map.setPaintProperty('provinces-fill', 'fill-color', expression)
  }, [provinceResults, viewMode, selectedPartyId])

  // ─── Hover highlight ──────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    if (!map.getLayer('provinces-hover')) return

    if (hoveredProvince) {
      const normalizedName = normalize(hoveredProvince)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.setPaintProperty('provinces-hover', 'fill-opacity', [
        'case',
        ['==', ['upcase', ['get', 'name']], normalizedName],
        0.15,
        0,
      ] as any)
    } else {
      map.setPaintProperty('provinces-hover', 'fill-opacity', 0)
    }
  }, [hoveredProvince])

  // ─── Selected highlight ───────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    if (!map.getLayer('provinces-selected')) return

    if (selectedProvince) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.setPaintProperty('provinces-selected', 'line-opacity', [
        'case',
        ['==', ['upcase', ['get', 'name']], normalize(selectedProvince)],
        1,
        0,
      ] as any)
    } else {
      map.setPaintProperty('provinces-selected', 'line-opacity', 0)
    }
  }, [selectedProvince])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
