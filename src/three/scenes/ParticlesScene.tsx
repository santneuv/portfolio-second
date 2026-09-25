import { Stars } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { useState } from 'react'
import type { SceneProps } from '../stage'
import { CameraRig } from './CameraRig'
import { Particles } from './Particles'

const particleCount = () => (window.matchMedia('(max-width: 768px)').matches ? 3500 : 9000)

/** Theme "particles": neon points morphing sphere → torus knot → galaxy → ring. */
export default function ParticlesScene({ reducedMotion, effects }: SceneProps) {
  const [count] = useState(particleCount)

  return (
    <>
      <Stars radius={60} depth={40} count={count / 4} factor={3} saturation={0} fade speed={reducedMotion ? 0 : 0.5} />
      <Particles count={count} reducedMotion={reducedMotion} />
      {!reducedMotion && <CameraRig />}

      {effects && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={1.4} luminanceThreshold={0.12} luminanceSmoothing={0.4} />
          <Vignette offset={0.25} darkness={0.75} />
        </EffectComposer>
      )}
    </>
  )
}
