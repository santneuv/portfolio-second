import { profile } from '../../../data/content'
import styles from './Hero.module.css'

export function Hero() {
  return (
    <section id="home" className={`section ${styles.hero}`} aria-labelledby="hero-title">
      <div className="container">
        <div className={styles.content}>
          <p className={`eyebrow ${styles.intro}`}>Hi, I&apos;m</p>
          <h1 id="hero-title" className={styles.title}>
            {profile.name}
          </h1>
          <p className={styles.role}>{profile.role}</p>
          <p className={styles.tagline}>{profile.tagline}</p>
          <div className={styles.actions}>
            <a href="#projects" className="button button--primary">
              View my work
            </a>
            <a href="#contact" className="button">
              Get in touch
            </a>
          </div>
        </div>
      </div>
      <a href="#about" className={styles.scrollHint}>
        <span className="visually-hidden">Scroll to about section</span>
        <span className={styles.mouse} aria-hidden="true" />
      </a>
    </section>
  )
}
