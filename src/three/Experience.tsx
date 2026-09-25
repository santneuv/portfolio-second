import { PerformanceMonitor, Stars } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { useState } from 'react'
import { CameraRig } from './CameraRig'
import { Particles } from './Particles'

interface ExperienceProps {
  reducedMotion: boolean
  onReady?: () => void
}

const maxDpr = () => Math.min(window.devicePixelRatio, 2)
const particleCount = () => (window.matchMedia('(max-width: 768px)').matches ? 3500 : 9000)

export default function Experience({ reducedMotion, onReady }: ExperienceProps) {
  const [dpr, setDpr] = useState(maxDpr)
  const [effects, setEffects] = useState(true)
  const [count] = useState(particleCount)

  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 0, 6], fov: 45, near: 0.1, far: 200 }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      onCreated={() => onReady?.()}
    >
      <color attach="background" args={['#05060a']} />

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

      <Stars radius={60} depth={40} count={count / 4} factor={3} saturation={0} fade speed={reducedMotion ? 0 : 0.5} />
      <Particles count={count} reducedMotion={reducedMotion} />
      {!reducedMotion && <CameraRig />}

      {effects && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={1.4} luminanceThreshold={0.12} luminanceSmoothing={0.4} />
          <Vignette offset={0.25} darkness={0.75} />
        </EffectComposer>
      )}
    </Canvas>
  )
}
