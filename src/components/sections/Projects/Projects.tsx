import { projects } from '../../../data/content'
import { Reveal } from '../../Reveal'
import { ProjectCard } from './ProjectCard'
import styles from './Projects.module.css'

export function Projects() {
  return (
    <section id="projects" className="section" aria-labelledby="projects-title">
      <div className="container">
        <Reveal className={styles.header}>
          <span className="eyebrow">Selected work</span>
          <h2 id="projects-title" className="section-title">
            Things I&apos;ve built
          </h2>
        </Reveal>
        <ul className={styles.grid}>
          {projects.map((project, i) => (
            <Reveal as="li" key={project.title} delay={(i % 3) * 120}>
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
