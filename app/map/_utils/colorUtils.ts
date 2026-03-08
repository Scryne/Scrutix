/**
 * Get a color with opacity based on vote share intensity.
 * Returns an 8-character hex color (RRGGBBAA).
 */
export function getColorByIntensity(baseColor: string, voteShare: number): string {
  const hex = baseColor.replace('#', '')
  if (voteShare < 20) return `#${hex}40`
  if (voteShare < 40) return `#${hex}70`
  if (voteShare < 60) return `#${hex}A0`
  if (voteShare < 80) return `#${hex}C8`
  return `#${hex}`
}
