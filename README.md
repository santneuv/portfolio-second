# Portfolio

Personal portfolio site built with **React**, **TypeScript**, **Vite** and **React Three Fiber**.
The page scrolls natively through regular HTML sections, and a fixed WebGL particle scene sits behind them. As you scroll, the particles morph from one shape to the next, one shape per section.

## Getting started

```bash
npm install
npm run dev       # start dev server
npm run build     # type-check + production build into dist/
npm run preview   # serve the production build locally
npm run lint      # oxlint
```

## Making it yours

- **Content:** Everything personal (name, bio, skills, projects, socials) is in `src/data/content.ts`.
- **Project images:** Put images in `public/projects/` and reference them as `/projects/<file>` in `content.ts`.
- **SEO:** Update the `<title>` and meta tags in `index.html`.
- **Colors and fonts:** CSS variables in `src/styles/global.css`. Particle palettes in `src/three/Particles.tsx`.

## How it works

| Path | Purpose |
| --- | --- |
| `src/lib/sections.ts` | Ordered list of sections. A section's index is its "stage" in the 3D scene. |
| `src/hooks/useScrollStage.ts` | Converts the scroll position into a continuous stage value (e.g. `1.4` = 40% of the way from About to Projects). |
| `src/lib/scrollState.ts` | Mutable object shared by the DOM and the scene, so scrolling never re-renders React. |
| `src/three/shapes.ts` | Generates one target position per particle for each shape. |
| `src/three/Particles.tsx` + `shaders/` | Blends between the shapes on the GPU, weighted by the current stage. |
| `src/three/Experience.tsx` | Canvas, bloom, adaptive performance. Lazy-loaded so the text paints first. |

`prefers-reduced-motion` is respected: idle animation stops, and shapes switch without the scatter effect.

## Deploying

`npm run build` outputs a static site to `dist/`. It can be deployed to Vercel, Netlify, GitHub Pages or any static host.
