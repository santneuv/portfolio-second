import { PointMaterial } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, BackSide, CatmullRomCurve3, type ShaderMaterial, Vector3 } from 'three'
import { scrollState } from '../../lib/scrollState'
import { neonA, neonB } from '../palettes'
import fragmentShader from '../shaders/tunnel.frag.glsl?raw'
import vertexShader from '../shaders/tunnel.vert.glsl?raw'
import { LAST_STAGE, lerpStage, type SceneProps, stepStage } from '../stage'

const RADIUS = 2.2
const SEGMENTS = 480
// How far along the tunnel (0..1) the camera is at each section.
const stops = [0.02, 0.27, 0.52, 0.78]
// Dim the walls behind the project cards so text stays readable.
const intensity = [0.6, 0.5, 0.32, 0.8]

// Scratch vectors reused every frame.
const position = new Vector3()
const lookTarget = new Vector3()

function createPath() {
  const points = Array.from({ length: 16 }, (_, k) => new Vector3(Math.sin(k * 0.7) * 3, Math.cos(k * 0.5) * 2, -k * 7))
  return new CatmullRomCurve3(points)
}

/** Dust particles scattered inside the tube, for parallax while flying through. */
function createDust(path: CatmullRomCurve3, count: number) {
  const frames = path.computeFrenetFrames(SEGMENTS, false)
  const positions = new Float32Array(count * 3)
  const p = new Vector3()
  for (let n = 0; n < count; n++) {
    const j = Math.floor(Math.random() * SEGMENTS)
    const angle = Math.random() * Math.PI * 2
    const r = RADIUS * (0.35 + Math.random() * 0.55)
    path.getPointAt(j / SEGMENTS, p)
    p.addScaledVector(frames.normals[j], Math.cos(angle) * r)
    p.addScaledVector(frames.binormals[j], Math.sin(angle) * r)
    p.toArray(positions, n * 3)
  }
  return positions
}

/** Theme "tunnel": scrolling flies the camera through a neon wormhole, one stop per section. */
export default function TunnelScene({ reducedMotion, effects }: SceneProps) {
  const material = useRef<ShaderMaterial>(null)
  const stage = useRef({ value: scrollState.stage })
  const path = useMemo(() => createPath(), [])
  const dust = useMemo(() => createDust(path, 1500), [path])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 1 },
      uColorA: { value: neonA[0].clone() },
      uColorB: { value: neonB[0].clone() },
    }),
    [],
  )

  useFrame((state, delta) => {
    if (!material.current) return
    const u = material.current.uniforms
    const dt = Math.min(delta, 0.1)
    // Slower smoothing than other scenes: flying should feel weighty.
    const blend = stepStage(stage.current, reducedMotion, dt, 0.6)
    const { i, f } = blend

    u.uColorA.value.lerpColors(neonA[i], neonA[i + 1], f)
    u.uColorB.value.lerpColors(neonB[i], neonB[i + 1], f)
    u.uIntensity.value = lerpStage(intensity, blend)
    if (!reducedMotion) u.uTime.value += dt

    // Position along the tunnel follows the (continuous) stage, not the blend,
    // so movement is linear between stops.
    const s = Math.min(Math.max(stage.current.value, 0), LAST_STAGE)
    const k = Math.min(Math.floor(s), LAST_STAGE - 1)
    const t = stops[k] + (stops[k + 1] - stops[k]) * (s - k)

    path.getPointAt(t, position)
    path.getPointAt(Math.min(t + 0.015, 1), lookTarget)
    if (!reducedMotion) {
      // Small pointer-driven look-around.
      const { x, y } = scrollState.pointer
      lookTarget.x += x * 0.6
      lookTarget.y += y * 0.4
    }
    state.camera.position.copy(position)
    state.camera.lookAt(lookTarget)
  })

  return (
    <>
      <mesh>
        <tubeGeometry args={[path, SEGMENTS, RADIUS, 48, false]} />
        <shaderMaterial
          ref={material}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          side={BackSide}
        />
      </mesh>

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dust, 3]} />
        </bufferGeometry>
        <PointMaterial
          size={0.03}
          color="#e0f2fe"
          transparent
          opacity={0.7}
          sizeAttenuation
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>

      {effects && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={1.3} luminanceThreshold={0.15} luminanceSmoothing={0.35} />
          <Vignette offset={0.15} darkness={0.9} />
        </EffectComposer>
      )}
    </>
  )
}
