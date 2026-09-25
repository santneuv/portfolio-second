// Every piece of personal content on the site lives in this file.
// Replace the placeholders below with your own details.

export interface Project {
  title: string
  description: string
  tags: string[]
  /** Path under /public, e.g. "/projects/my-app.jpg". Optional. */
  image?: string
  liveUrl?: string
  sourceUrl?: string
}

export interface SocialLink {
  label: string
  url: string
}

export const profile = {
  name: 'Your Name',
  role: 'Creative Frontend Developer',
  tagline:
    'I build fast, accessible web interfaces and interactive 3D experiences with React and Three.js.',
  location: 'Istanbul, Türkiye',
  email: 'hello@example.com',
  resumeUrl: '',
}

export const about = {
  paragraphs: [
    'I am a frontend developer who cares about the details: smooth interactions, clean component architecture and interfaces that feel good to use.',
    'Lately I have been exploring WebGL, shaders and real-time 3D on the web — bringing depth and motion to products without sacrificing performance or accessibility.',
  ],
  skills: [
    'TypeScript',
    'React',
    'Next.js',
    'Three.js',
    'React Three Fiber',
    'GLSL',
    'CSS / Animations',
    'Vite',
    'Node.js',
    'Figma',
  ],
}

export const projects: Project[] = [
  {
    title: 'Project One',
    description:
      'A short description of what this project does, the problem it solves and your role in building it.',
    tags: ['React', 'Three.js', 'GLSL'],
    liveUrl: 'https://example.com',
    sourceUrl: 'https://github.com/your-username/project-one',
  },
  {
    title: 'Project Two',
    description:
      'Highlight an interesting technical challenge here — performance work, a tricky animation or a design system.',
    tags: ['TypeScript', 'Next.js', 'Tailwind'],
    liveUrl: 'https://example.com',
    sourceUrl: 'https://github.com/your-username/project-two',
  },
  {
    title: 'Project Three',
    description:
      'Keep each description to two or three sentences. Link to a live demo whenever possible.',
    tags: ['React Three Fiber', 'Zustand'],
    sourceUrl: 'https://github.com/your-username/project-three',
  },
]

export const socials: SocialLink[] = [
  { label: 'GitHub', url: 'https://github.com/your-username' },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/your-username' },
  { label: 'X / Twitter', url: 'https://x.com/your-username' },
]
