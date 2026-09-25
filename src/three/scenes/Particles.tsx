import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { useEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, type Group, type ShaderMaterial, Vector3, Vector4 } from 'three'
import { scrollState } from '../../lib/scrollState'
import { neonA as colorsA, neonB as colorsB } from '../palettes'
import { createShapes } from './shapes'
import fragmentShader from '../shaders/particles.frag.glsl?raw'
import vertexShader from '../shaders/particles.vert.glsl?raw'
import { clickAge, pointerOnPlane } from '../pointer'
import { layoutObject, lerpStage, stepStage } from '../stage'

// Dim the galaxy behind the project cards so text stays readable.
const intensities = [1, 1, 0.55, 1]
// Horizontal offset (fraction of viewport width) on wide screens, so the
// shape sits beside left-aligned text instead of behind it.
const offsets = [0.24, 0.24, 0, 0]
// How long a click shockwave stays alive, in seconds.
const WAVE_LIFETIME = 3

const hit = new Vector3()

interface ParticlesProps {
  count: number
  reducedMotion: boolean
}

export function Particles({ count, reducedMotion }: ParticlesProps) {
  const group = useRef<Group>(null)
  const material = useRef<ShaderMaterial>(null)
  const stage = useRef({ value: scrollState.stage })
  const weights = useRef([1, 0, 0, 0])
  const lastClick = useRef(scrollState.click.time)

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
      uMouse: { value: new Vector3(99, 99, 0) },
      uMouseStrength: { value: 0 },
      uClickPos: { value: new Vector3() },
      uClickAge: { value: 0 },
      uClickStrength: { value: 0 },
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

    const blend = stepStage(stage.current, reducedMotion, dt)
    const { i, f } = blend

    const w = weights.current
    w.fill(0)
    w[i] = 1 - f
    w[i + 1] = f
    u.uWeights.value.set(w[0], w[1], w[2], w[3])

    u.uColorA.value.lerpColors(colorsA[i], colorsA[i + 1], f)
    u.uColorB.value.lerpColors(colorsB[i], colorsB[i + 1], f)
    u.uIntensity.value = lerpStage(intensities, blend)
    u.uPixelRatio.value = state.gl.getPixelRatio()
    if (!reducedMotion) u.uTime.value += dt
    layoutObject(group.current, state, offsets, blend, reducedMotion, dt)

    // Pointer repulsion, in the group's local space (it is offset and scaled).
    const onPlane = pointerOnPlane(state, hit)
    if (onPlane) u.uMouse.value.copy(group.current.worldToLocal(onPlane))
    const targetStrength = scrollState.pointer.active && onPlane ? (reducedMotion ? 0.5 : 1) : 0
    easing.damp(u.uMouseStrength, 'value', targetStrength, 0.2, dt)

    // Click shockwave (skipped with reduced motion).
    const { click } = scrollState
    if (click.time !== lastClick.current) {
      lastClick.current = click.time
      const at = pointerOnPlane(state, hit, 0, click)
      if (at) u.uClickPos.value.copy(group.current.worldToLocal(at))
    }
    const age = clickAge()
    u.uClickAge.value = age
    u.uClickStrength.value = !reducedMotion && age < WAVE_LIFETIME ? 1 : 0
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
