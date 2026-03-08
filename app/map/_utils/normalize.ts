/**
 * Normalize a Turkish string for case-insensitive comparison.
 * Handles Turkish-specific characters (I/i, İ/i) properly.
 */
export function normalize(str: string): string {
  return str.toLocaleUpperCase('tr-TR').trim()
}

/**
 * Check if two province names match (case-insensitive, Turkish-aware).
 */
export function matchProvinceName(a: string, b: string): boolean {
  return normalize(a) === normalize(b)
}
