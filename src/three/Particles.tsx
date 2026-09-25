import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { useEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, Color, type Group, type ShaderMaterial, Vector4 } from 'three'
import { scrollState } from '../lib/scrollState'
import { createShapes } from './shapes'
import fragmentShader from './shaders/particles.frag.glsl?raw'
import vertexShader from './shaders/particles.vert.glsl?raw'

// One entry per section, in the same order as src/lib/sections.ts.
const palettes: [string, string][] = [
  ['#22d3ee', '#3b82f6'], // Home: cyan / blue
  ['#a855f7', '#d946ef'], // About: purple / magenta
  ['#f472b6', '#fb923c'], // Projects: pink / orange
  ['#22d3ee', '#a5f3fc'], // Contact: back to cyan
]
// Dim the galaxy behind the project cards so text stays readable.
const intensities = [1, 1, 0.55, 1]
// Horizontal offset (fraction of viewport width) on wide screens, so the
// shape sits beside left-aligned text instead of behind it.
const offsets = [0.24, 0.24, 0, 0]
const LAST = palettes.length - 1

const colorsA = palettes.map(([a]) => new Color(a))
const colorsB = palettes.map(([, b]) => new Color(b))

interface ParticlesProps {
  count: number
  reducedMotion: boolean
}

export function Particles({ count, reducedMotion }: ParticlesProps) {
  const group = useRef<Group>(null)
  const material = useRef<ShaderMaterial>(null)
  const stage = useRef({ value: scrollState.stage })
  const weights = useRef([1, 0, 0, 0])

  const shapes = useMemo(() => createShapes(count), [count])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 42 },
      uPixelRatio: { value: 1 },
      uMotion: { value: 1 },
      uWeights: { value: new Vector4(1, 0, 0, 0) },
      uColorA: { value: colorsA[0].clone() },
      uColorB: { value: colorsB[0].clone() },
      uIntensity: { value: 1 },
    }),
    [],
  )

  useEffect(() => {
    if (material.current) material.current.uniforms.uMotion.value = reducedMotion ? 0 : 1
  }, [reducedMotion])

  useFrame((state, delta) => {
    if (!group.current || !material.current) return
    const u = material.current.uniforms
    const dt = Math.min(delta, 0.1)

    // Reduced motion: jump straight to the nearest shape, no morphing.
    if (reducedMotion) stage.current.value = Math.round(scrollState.stage)
    else easing.damp(stage.current, 'value', scrollState.stage, 0.35, dt)

    const s = Math.min(Math.max(stage.current.value, 0), LAST)
    const i = Math.min(Math.floor(s), LAST - 1)
    const raw = s - i
    const f = raw * raw * (3 - 2 * raw) // smoothstep

    const w = weights.current
    w.fill(0)
    w[i] = 1 - f
    w[i + 1] = f
    u.uWeights.value.set(w[0], w[1], w[2], w[3])

    u.uColorA.value.lerpColors(colorsA[i], colorsA[i + 1], f)
    u.uColorB.value.lerpColors(colorsB[i], colorsB[i + 1], f)
    u.uIntensity.value = intensities[i] + (intensities[i + 1] - intensities[i]) * f
    u.uPixelRatio.value = state.gl.getPixelRatio()
    if (!reducedMotion) u.uTime.value += dt

    // Layout: offset to the right on wide screens, scale down on narrow ones.
    const { viewport, size } = state
    const wide = size.width >= 900
    const offset = wide ? (offsets[i] + (offsets[i + 1] - offsets[i]) * f) * viewport.width : 0
    const scale = Math.min(Math.max(viewport.width / 4.4, 0.55), 1)
    if (reducedMotion) {
      group.current.position.x = offset
      group.current.scale.setScalar(scale)
    } else {
      easing.damp(group.current.position, 'x', offset, 0.25, dt)
      easing.damp3(group.current.scale, [scale, scale, scale], 0.25, dt)
    }
  })

  return (
    <group ref={group}>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[shapes.sphere, 3]} />
          <bufferAttribute attach="attributes-aTorus" args={[shapes.torus, 3]} />
          <bufferAttribute attach="attributes-aGalaxy" args={[shapes.galaxy, 3]} />
          <bufferAttribute attach="attributes-aRing" args={[shapes.ring, 3]} />
          <bufferAttribute attach="attributes-aRandom" args={[shapes.random, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={material}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
    </group>
  )
}
