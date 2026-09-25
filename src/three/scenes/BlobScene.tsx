import { useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { easing } from 'maath'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Color, type Group, type ShaderMaterial } from 'three'
import { scrollState } from '../../lib/scrollState'
import fragmentShader from '../shaders/blob.frag.glsl?raw'
import vertexShader from '../shaders/blob.vert.glsl?raw'
import { layoutObject, lerpStage, type SceneProps, stepStage } from '../stage'
import { CameraRig } from './CameraRig'

// Per-section look, same order as src/lib/sections.ts.
const frequency = [1.1, 2.4, 0.8, 1.5] // calm → spiky → smooth → soft
const amplitude = [0.24, 0.36, 0.2, 0.3]
const speed = [0.35, 0.7, 0.25, 0.45]
const paletteShift = [0.0, 0.3, 0.6, 0.85]
const intensity = [1, 1, 0.5, 1] // dim behind the project cards
const size = [1, 0.9, 1.25, 0.8]
const offsets = [0.24, 0.24, 0, 0]
// Iridescent gradient stops: violet, pink, teal.
const colors = ['#7c3aed', '#f0abfc', '#2dd4bf'].map((c) => new Color(c))

const detail = () => (window.matchMedia('(max-width: 768px)').matches ? 32 : 64)

/** Theme "blob": an iridescent noise-displaced sphere that changes mood per section. */
export default function BlobScene({ reducedMotion, effects }: SceneProps) {
  const layout = useRef<Group>(null)
  const blob = useRef<Group>(null)
  const material = useRef<ShaderMaterial>(null)
  const stage = useRef({ value: scrollState.stage })
  const [segments] = useState(detail)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uFrequency: { value: frequency[0] },
      uAmplitude: { value: amplitude[0] },
      uPaletteShift: { value: paletteShift[0] },
      uIntensity: { value: 1 },
      uColorA: { value: colors[0] },
      uColorB: { value: colors[1] },
      uColorC: { value: colors[2] },
    }),
    [],
  )

  // Reduced motion: freeze the surface on a fixed (non-zero) time.
  useEffect(() => {
    if (reducedMotion && material.current) material.current.uniforms.uTime.value = 4
  }, [reducedMotion])

  useFrame((state, delta) => {
    if (!layout.current || !blob.current || !material.current) return
    const u = material.current.uniforms
    const dt = Math.min(delta, 0.1)
    const blend = stepStage(stage.current, reducedMotion, dt)

    u.uFrequency.value = lerpStage(frequency, blend)
    u.uAmplitude.value = lerpStage(amplitude, blend)
    u.uPaletteShift.value = lerpStage(paletteShift, blend)
    u.uIntensity.value = lerpStage(intensity, blend)
    layoutObject(layout.current, state, offsets, blend, reducedMotion, dt)

    const base = lerpStage(size, blend)
    if (reducedMotion) {
      blob.current.scale.setScalar(base)
      return
    }

    u.uTime.value += dt * lerpStage(speed, blend)
    // Gentle "breathing" and a slow turn that leans towards the pointer.
    const breath = base * (1 + Math.sin(u.uTime.value * 1.5) * 0.02)
    blob.current.scale.setScalar(breath)
    const { x, y } = scrollState.pointer
    easing.damp(blob.current.rotation, 'x', -y * 0.4, 0.5, dt)
    blob.current.rotation.y += dt * 0.15
    easing.damp(blob.current.rotation, 'z', x * 0.2, 0.5, dt)
  })

  return (
    <>
      <group ref={layout}>
        <group ref={blob}>
          <mesh>
            <icosahedronGeometry args={[1.4, segments]} />
            <shaderMaterial
              ref={material}
              vertexShader={vertexShader}
              fragmentShader={fragmentShader}
              uniforms={uniforms}
            />
          </mesh>
        </group>
      </group>
      {!reducedMotion && <CameraRig />}

      {effects && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.35} luminanceSmoothing={0.4} />
          <Vignette offset={0.3} darkness={0.7} />
        </EffectComposer>
      )}
    </>
  )
}
