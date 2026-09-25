import { useEffect, useState } from 'react'
import { defaultTheme, isThemeId, themes, type ThemeId } from '../themes/themes'

const STORAGE_KEY = 'portfolio-theme'

function initialTheme(): ThemeId {
  const fromUrl = new URLSearchParams(window.location.search).get('theme')
  if (isThemeId(fromUrl)) return fromUrl
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isThemeId(stored)) return stored
  } catch {
    // Storage can be unavailable (private mode, blocked cookies).
  }
  return defaultTheme
}

/** Current theme, persisted in the URL (?theme=) and localStorage. */
export function useTheme() {
  const [id, setId] = useState(initialTheme)
  const theme = themes.find((t) => t.id === id)!

  useEffect(() => {
    document.documentElement.dataset.theme = theme.id
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.background)

    try {
      localStorage.setItem(STORAGE_KEY, theme.id)
    } catch {
      // Ignore, the URL still carries the choice.
    }

    const url = new URL(window.location.href)
    url.searchParams.set('theme', theme.id)
    window.history.replaceState(window.history.state, '', url)
  }, [theme])

  return [theme, setId] as const
}
