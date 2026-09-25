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

## Themes

The site ships with three visual styles. Switch between them with the "Style" pill in the corner, or with a URL parameter such as `?theme=glass`. The choice is remembered in `localStorage`.

| Theme | Look | Scene |
| --- | --- | --- |
| `particles` | Dark, neon | ~9k GPU particles morph sphere → torus knot → galaxy → ring |
| `glass` | Light, pastel | Floating glass shapes over a drifting mesh gradient, regrouping per section |
| `tunnel` | Dark, neon | The camera flies through a wormhole, one stop per section |

### Mouse interaction

| Theme | Hover / move | Click on the background |
| --- | --- | --- |
| `particles` | Particles part around the cursor and light up | A shockwave ring ripples through the particles |
| `glass` | The shape under the cursor grows and spins faster; nearby shapes drift away | The clicked shape jumps and spins |
| `tunnel` | A flashlight lights the wall you point at; fast movement speeds up the flow | A bright pulse races down the tunnel |

The canvas sits behind the page with `pointer-events: none`, so `src/hooks/usePointer.ts` tracks the pointer on the window. Clicks on links and buttons are ignored. With `prefers-reduced-motion`, click effects are off and hover effects are toned down.

Once you pick a favourite, you can delete the others:
1. Remove the entry from `src/themes/themes.ts`.
2. Remove its line from the `scenes` map in `src/three/Experience.tsx`.
3. Delete its `[data-theme]` block in `src/styles/global.css` and its files in `src/three/scenes/` and `src/three/shaders/`.

To drop the switcher entirely, remove `<ThemeSwitcher>` from `src/App.tsx` and set `defaultTheme`.

## Making it yours

- **Content:** Everything personal (name, bio, skills, projects, socials) is in `src/data/content.ts`.
- **Project images:** Put images in `public/projects/` and reference them as `/projects/<file>` in `content.ts`.
- **SEO:** Update the `<title>` and meta tags in `index.html`.
- **Colors and fonts:** CSS variables in `src/styles/global.css` (one block per theme). 3D colors live at the top of each scene file.

## How it works

| Path | Purpose |
| --- | --- |
| `src/lib/sections.ts` | Ordered list of sections. A section's index is its "stage" in the 3D scene. |
| `src/hooks/useScrollStage.ts` | Converts the scroll position into a continuous stage value (e.g. `1.4` = 40% of the way from About to Projects). |
| `src/lib/scrollState.ts` | Mutable object shared by the DOM and the scene, so scrolling never re-renders React. |
| `src/three/stage.ts` | Shared helpers: smooths the stage, blends per-section values, lays out objects. |
| `src/three/scenes/` | One scene per theme. Each reads the stage in `useFrame`. |
| `src/three/Experience.tsx` | Canvas shell and adaptive performance. Lazy-loaded so the text paints first; each scene is its own chunk. |

`prefers-reduced-motion` is respected: idle animation stops, and shapes switch without the scatter effect.

## Deploying

`npm run build` outputs a static site to `dist/`. It can be deployed to Vercel, Netlify, GitHub Pages or any static host.
