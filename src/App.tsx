import { Nav } from './components/Nav/Nav'
import { About } from './components/sections/About/About'
import { Contact } from './components/sections/Contact/Contact'
import { Hero } from './components/sections/Hero/Hero'
import { Projects } from './components/sections/Projects/Projects'
import { useScrollStage } from './hooks/useScrollStage'
import { sections } from './lib/sections'

const sectionIds = sections.map((s) => s.id)

export function App() {
  const active = useScrollStage(sectionIds)

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Nav active={active} />
      <main id="main">
        <Hero />
        <About />
        <Projects />
        <Contact />
      </main>
    </>
  )
}
