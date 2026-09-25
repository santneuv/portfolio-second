import { about } from '../../../data/content'
import { Reveal } from '../../Reveal'
import styles from './About.module.css'

export function About() {
  return (
    <section id="about" className="section" aria-labelledby="about-title">
      <div className="container">
        <div className={styles.content}>
          <Reveal>
            <span className="eyebrow">About me</span>
            <h2 id="about-title" className="section-title">
              Design-minded engineer, obsessed with motion.
            </h2>
          </Reveal>
          {about.paragraphs.map((text, i) => (
            <Reveal key={i} delay={100 + i * 100}>
              <p className={styles.paragraph}>{text}</p>
            </Reveal>
          ))}
          <Reveal delay={300}>
            <h3 className={styles.skillsTitle}>Toolbox</h3>
            <ul className={styles.skills}>
              {about.skills.map((skill) => (
                <li key={skill} className={styles.skill}>
                  {skill}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
