import { Color } from 'three'

// Neon colour pairs, one per section (same order as src/lib/sections.ts).
export const neonPalettes: [string, string][] = [
  ['#22d3ee', '#3b82f6'], // Home: cyan / blue
  ['#a855f7', '#d946ef'], // About: purple / magenta
  ['#f472b6', '#fb923c'], // Projects: pink / orange
  ['#22d3ee', '#a5f3fc'], // Contact: back to cyan
]

export const neonA = neonPalettes.map(([a]) => new Color(a))
export const neonB = neonPalettes.map(([, b]) => new Color(b))
