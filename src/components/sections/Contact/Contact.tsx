import { profile, socials } from '../../../data/content'
import { Reveal } from '../../Reveal'
import styles from './Contact.module.css'

export function Contact() {
  return (
    <section id="contact" className={`section ${styles.contact}`} aria-labelledby="contact-title">
      <div className="container">
        <Reveal className={styles.content}>
          <span className="eyebrow">Contact</span>
          <h2 id="contact-title" className="section-title">
            Let&apos;s build something together.
          </h2>
          <p className={styles.text}>
            Open to freelance projects and full-time roles. The fastest way to reach me is email.
          </p>
          <a href={`mailto:${profile.email}`} className={`button button--primary ${styles.email}`}>
            {profile.email}
          </a>
          <ul className={styles.socials}>
            {socials.map((social) => (
              <li key={social.label}>
                <a href={social.url} target="_blank" rel="noreferrer" className={styles.social}>
                  {social.label}
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
      <footer className={styles.footer}>
        © {new Date().getFullYear()} {profile.name}. Built with React Three Fiber.
      </footer>
    </section>
  )
}
