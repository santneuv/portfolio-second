import type { Project } from '../../../data/content'
import styles from './Projects.module.css'

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className={styles.card}>
      {project.image ? (
        <img
          className={styles.image}
          src={project.image}
          alt=""
          loading="lazy"
          width={640}
          height={360}
        />
      ) : (
        <div className={styles.placeholder} aria-hidden="true" />
      )}
      <div className={styles.body}>
        <h3 className={styles.title}>{project.title}</h3>
        <p className={styles.description}>{project.description}</p>
        <ul className={styles.tags} aria-label="Technologies">
          {project.tags.map((tag) => (
            <li key={tag} className={styles.tag}>
              {tag}
            </li>
          ))}
        </ul>
        <div className={styles.links}>
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noreferrer" className={styles.link}>
              Live demo <span aria-hidden="true">↗</span>
              <span className="visually-hidden">: {project.title} (opens in a new tab)</span>
            </a>
          )}
          {project.sourceUrl && (
            <a href={project.sourceUrl} target="_blank" rel="noreferrer" className={styles.link}>
              Source <span aria-hidden="true">↗</span>
              <span className="visually-hidden">: {project.title} (opens in a new tab)</span>
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
