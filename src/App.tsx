import { lazy, Suspense, useState } from 'react'
import { Nav } from './components/Nav/Nav'
import { ThemeSwitcher } from './components/ThemeSwitcher/ThemeSwitcher'
import { About } from './components/sections/About/About'
import { Contact } from './components/sections/Contact/Contact'
import { Hero } from './components/sections/Hero/Hero'
import { Projects } from './components/sections/Projects/Projects'
import { useReducedMotion } from './hooks/useReducedMotion'
import { useScrollStage } from './hooks/useScrollStage'
import { useTheme } from './hooks/useTheme'
import { sections } from './lib/sections'
import type { ThemeId } from './themes/themes'

// Loaded in a separate chunk so the text content paints before three.js arrives.
const Experience = lazy(() => import('./three/Experience'))

const sectionIds = sections.map((s) => s.id)

function supportsWebGL() {
  try {
    return !!document.createElement('canvas').getContext('webgl2')
  } catch {
    return false
  }
}

export function App() {
  const active = useScrollStage(sectionIds)
  const reducedMotion = useReducedMotion()
  const [webgl] = useState(supportsWebGL)
  const [theme, setTheme] = useTheme()
  const [sceneReady, setSceneReady] = useState(false)

  const changeTheme = (id: ThemeId) => {
    if (id === theme.id) return
    setSceneReady(false) // fade the old canvas out, the new one fades in once created
    setTheme(id)
  }

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {webgl && (
        <div className="scene" data-ready={sceneReady} aria-hidden="true">
          <Suspense fallback={null}>
            {/* key: a fresh canvas per theme so no GPU state leaks between scenes */}
            <Experience
              key={theme.id}
              theme={theme}
              reducedMotion={reducedMotion}
              onReady={() => setSceneReady(true)}
            />
          </Suspense>
        </div>
      )}
      <Nav active={active} />
      <main id="main">
        <Hero />
        <About />
        <Projects />
        <Contact />
      </main>
      <ThemeSwitcher value={theme.id} onChange={changeTheme} />
    </>
  )
}
