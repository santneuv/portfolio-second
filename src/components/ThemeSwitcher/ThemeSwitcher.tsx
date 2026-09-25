import { themes, type ThemeId } from '../../themes/themes'
import styles from './ThemeSwitcher.module.css'

interface ThemeSwitcherProps {
  value: ThemeId
  onChange: (id: ThemeId) => void
}

export function ThemeSwitcher({ value, onChange }: ThemeSwitcherProps) {
  return (
    <div className={styles.switcher} role="group" aria-label="Visual style">
      <span className={styles.label} aria-hidden="true">
        Style
      </span>
      {themes.map((theme) => (
        <button
          key={theme.id}
          type="button"
          className={styles.option}
          aria-pressed={theme.id === value}
          onClick={() => onChange(theme.id)}
        >
          {theme.label}
        </button>
      ))}
    </div>
  )
}
