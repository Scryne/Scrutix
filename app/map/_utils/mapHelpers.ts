import type { ExpressionSpecification } from 'maplibre-gl'
import type { ProvinceResult } from './types'
import { normalize } from './normalize'
import { getColorByIntensity } from './colorUtils'

const DEFAULT_COLOR = '#334155'

/**
 * Build a MapLibre GL match expression for fill-color.
 * Maps province names from GeoJSON to colors based on election results.
 */
export function buildFillExpression(
  provinceResults: ProvinceResult[],
  viewMode: 'winner' | 'party',
  selectedPartyId: string | null,
  geoJsonPropertyKey: string
): ExpressionSpecification {
  const matchPairs: (string | string[])[] = []

  provinceResults.forEach((pr) => {
    let color = DEFAULT_COLOR

    if (viewMode === 'winner') {
      color = pr.winningParty.color
    } else if (selectedPartyId) {
      const partyResult = pr.results.find((r) => r.party.id === selectedPartyId)
      if (partyResult) {
        color = getColorByIntensity(partyResult.party.color, partyResult.voteShare)
      }
    }

    // Add both original and uppercased names for matching
    matchPairs.push(pr.provinceName, color)
    matchPairs.push(normalize(pr.provinceName), color)
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return [
    'match',
    ['upcase', ['get', geoJsonPropertyKey]],
    ...matchPairs,
    DEFAULT_COLOR,
  ] as any as ExpressionSpecification
}
