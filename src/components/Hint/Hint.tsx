import type { ReactNode } from 'react'
import styles from './Hint.module.css'

/** Small floating tip above the style switcher. */
export function Hint({ children }: { children: ReactNode }) {
  return (
    <p className={styles.hint} aria-hidden="true">
      {children}
    </p>
  )
}
