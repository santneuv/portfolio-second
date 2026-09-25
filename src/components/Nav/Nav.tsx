import { profile } from '../../data/content'
import { sections } from '../../lib/sections'
import styles from './Nav.module.css'

interface NavProps {
  active: number
}

export function Nav({ active }: NavProps) {
  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Main">
        <a href="#home" className={styles.brand}>
          {profile.name}
        </a>
        <ul className={styles.links}>
          {sections.slice(1).map((section, i) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={styles.link}
                aria-current={active === i + 1 ? 'true' : undefined}
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
