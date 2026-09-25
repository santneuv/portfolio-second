// Visual themes. Each one pairs a CSS palette ([data-theme] in global.css)
// with a 3D scene (src/three/scenes). Delete the ones you don't want.
export type ThemeId = 'particles' | 'blob' | 'glass' | 'tunnel'

export interface Theme {
  id: ThemeId
  label: string
  /** Page and canvas background, also used for <meta name="theme-color">. */
  background: string
}

export const themes: Theme[] = [
  { id: 'particles', label: 'Particles', background: '#05060a' },
  { id: 'blob', label: 'Blob', background: '#07060d' },
  { id: 'glass', label: 'Glass', background: '#f3efe9' },
  { id: 'tunnel', label: 'Tunnel', background: '#020308' },
]

export const defaultTheme: ThemeId = 'particles'

export function isThemeId(value: unknown): value is ThemeId {
  return themes.some((t) => t.id === value)
}
