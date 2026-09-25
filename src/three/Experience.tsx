import { PerformanceMonitor } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { type ComponentType, lazy, Suspense, useState } from 'react'
import type { Theme, ThemeId } from '../themes/themes'
import type { SceneProps } from './stage'

// Each theme's scene is its own chunk, so only the active one is downloaded.
const scenes: Record<ThemeId, ComponentType<SceneProps>> = {
  particles: lazy(() => import('./scenes/ParticlesScene')),
  glass: lazy(() => import('./scenes/GlassScene')),
  tunnel: lazy(() => import('./scenes/TunnelScene')),
}

interface ExperienceProps {
  theme: Theme
  reducedMotion: boolean
  onReady?: () => void
}

const maxDpr = () => Math.min(window.devicePixelRatio, 2)

export default function Experience({ theme, reducedMotion, onReady }: ExperienceProps) {
  const [dpr, setDpr] = useState(maxDpr)
  const [effects, setEffects] = useState(true)
  const Scene = scenes[theme.id]

  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 0, 6], fov: 45, near: 0.1, far: 200 }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      onCreated={() => onReady?.()}
    >
      <color attach="background" args={[theme.background]} />

      {/* Drop resolution and post-processing on slow devices, restore when FPS recovers. */}
      <PerformanceMonitor
        flipflops={3}
        onDecline={() => {
          setDpr(1)
          setEffects(false)
        }}
        onIncline={() => {
          setDpr(maxDpr())
          setEffects(true)
        }}
        onFallback={() => {
          setDpr(1)
          setEffects(false)
        }}
      />

      <Suspense fallback={null}>
        <Scene reducedMotion={reducedMotion} effects={effects} />
      </Suspense>
    </Canvas>
  )
}
