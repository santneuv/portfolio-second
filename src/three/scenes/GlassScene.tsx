import { Environment, Float, Lightformer, MeshTransmissionMaterial, RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, type Group, type ShaderMaterial } from 'three'
import { scrollState } from '../../lib/scrollState'
import fragmentShader from '../shaders/gradient.frag.glsl?raw'
import vertexShader from '../shaders/gradient.vert.glsl?raw'
import { lerpStage, type SceneProps, type StageBlend, stepStage } from '../stage'
import { CameraRig } from './CameraRig'

type Vec3 = [number, number, number]

// Where each shape sits in each section (same order as src/lib/sections.ts).
// Home/About: a cluster on the right. Projects: pushed to the edges. Contact: a ring.
const ringPos = (k: number): Vec3 => {
  const a = (k / 6) * Math.PI * 2 + Math.PI / 2
  return [Math.cos(a) * 2.7, Math.sin(a) * 1.9, -1]
}
const formations: Vec3[][] = [
  [[0, 0.2, 0], [1.1, -0.8, 0.4], [-0.9, -0.6, -0.4], [0.7, 1.2, -0.6], [-0.7, 1.0, 0.3], [0.1, -1.4, -0.3]],
  [[-0.4, 1.4, 0], [0.6, 0.6, 0.3], [-0.6, -0.1, -0.2], [0.6, -0.9, 0.1], [-0.3, -1.6, 0.3], [1.1, 1.7, -0.6]],
  [[-3.3, 1.5, -1.2], [3.3, 1.3, -1.2], [-3.5, -1.3, -0.8], [3.4, -1.5, -1], [-2.6, -2.7, -2.2], [2.7, 2.6, -2.2]],
  [0, 1, 2, 3, 4, 5].map(ringPos),
]
// Horizontal offset (fraction of viewport width) per section on wide screens.
const offsets = [0.24, 0.24, 0, 0]
// On narrow screens the cluster moves up into the empty space above the text,
// since opaque glass directly behind copy hurts legibility.
const narrowLift = [1.55, 1.55, 0, 0]

// Pastel tints for the glass and the background blobs, per section.
const tints = ['#c7d2fe', '#fbcfe8', '#bbf7d0', '#fde68a', '#bae6fd', '#e9d5ff']
const backgrounds = [
  ['#a5b4fc', '#f9a8d4', '#fcd34d', '#99f6e4'],
  ['#c4b5fd', '#f0abfc', '#fda4af', '#a5f3fc'],
  ['#fda4af', '#fdba74', '#fde68a', '#c4b5fd'],
  ['#99f6e4', '#a5b4fc', '#f9a8d4', '#bef264'],
].map((set) => set.map((c) => new Color(c)))

function Shape({ index }: { index: number }) {
  switch (index) {
    case 0:
      return <torusGeometry args={[0.55, 0.22, 48, 128]} />
    case 1:
      return <icosahedronGeometry args={[0.55, 0]} />
    case 3:
      return <sphereGeometry args={[0.42, 64, 32]} />
    case 4:
      return <capsuleGeometry args={[0.24, 0.5, 12, 32]} />
    default:
      return <torusKnotGeometry args={[0.35, 0.12, 160, 24]} />
  }
}

function GlassMaterial({ tint, effects }: { tint: string; effects: boolean }) {
  // Full transmission material on capable devices; a cheaper physical glass otherwise.
  return effects ? (
    <MeshTransmissionMaterial
      transmissionSampler
      color={tint}
      thickness={0.8}
      roughness={0.08}
      ior={1.35}
      chromaticAberration={0.08}
      anisotropy={0.2}
      distortion={0.25}
      distortionScale={0.4}
      temporalDistortion={0.08}
      backside={false}
    />
  ) : (
    <meshPhysicalMaterial color={tint} transmission={1} thickness={0.6} roughness={0.12} ior={1.35} />
  )
}

function blendFormation(k: number, blend: StageBlend): Vec3 {
  const a = formations[blend.i][k]
  const b = formations[blend.i + 1][k]
  return [0, 1, 2].map((c) => a[c] + (b[c] - a[c]) * blend.f) as Vec3
}

/** Theme "glass": light, pastel and minimal — floating glass shapes over a soft gradient. */
export default function GlassScene({ reducedMotion, effects }: SceneProps) {
  const layout = useRef<Group>(null)
  const items = useRef<(Group | null)[]>([])
  const background = useRef<ShaderMaterial>(null)
  const stage = useRef({ value: scrollState.stage })

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uColors: { value: backgrounds[0].map((c) => c.clone()) } }),
    [],
  )

  useFrame((state, delta) => {
    if (!layout.current || !background.current) return
    const dt = Math.min(delta, 0.1)
    const blend = stepStage(stage.current, reducedMotion, dt, 0.5)

    const { viewport, size } = state
    const wide = size.width >= 900
    const narrow = size.width < 600
    layout.current.position.x = wide ? lerpStage(offsets, blend) * viewport.width : 0
    layout.current.position.y = narrow ? lerpStage(narrowLift, blend) : 0
    layout.current.scale.setScalar(narrow ? 0.4 : Math.min(Math.max(viewport.width / 5, 0.55), 1))

    items.current.forEach((item, k) => {
      if (!item) return
      item.position.set(...blendFormation(k, blend))
      if (!reducedMotion) {
        item.rotation.x += dt * (0.15 + k * 0.03)
        item.rotation.y += dt * (0.2 + k * 0.02)
      }
    })

    const u = background.current.uniforms
    if (!reducedMotion) u.uTime.value += dt
    u.uColors.value.forEach((c: Color, k: number) =>
      c.lerpColors(backgrounds[blend.i][k], backgrounds[blend.i + 1][k], blend.f),
    )
  })

  return (
    <>
      {/* Background gradient far behind everything; the glass refracts it. */}
      <mesh position={[0, 0, -6]}>
        <planeGeometry args={[40, 20]} />
        <shaderMaterial
          ref={background}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          depthWrite={false}
        />
      </mesh>

      <group ref={layout}>
        {tints.map((tint, k) => (
          <group key={k} ref={(el) => void (items.current[k] = el)}>
            <Float
              speed={reducedMotion ? 0 : 1.2}
              rotationIntensity={reducedMotion ? 0 : 0.4}
              floatIntensity={reducedMotion ? 0 : 0.6}
            >
              {k === 2 ? (
                <RoundedBox args={[0.8, 0.8, 0.8]} radius={0.16} smoothness={6}>
                  <GlassMaterial tint={tint} effects={effects} />
                </RoundedBox>
              ) : (
                <mesh>
                  <Shape index={k} />
                  <GlassMaterial tint={tint} effects={effects} />
                </mesh>
              )}
            </Float>
          </group>
        ))}
      </group>

      {/* Local studio lighting, no HDR file to download. */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 4, 3]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={2} color="#fbcfe8" position={[-5, 0, 2]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} />
        <Lightformer form="rect" intensity={2} color="#bae6fd" position={[5, -1, 2]} rotation-y={-Math.PI / 2} scale={[6, 4, 1]} />
        <Lightformer form="ring" intensity={4} position={[0, 0, 6]} scale={3} />
      </Environment>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} />

      {!reducedMotion && <CameraRig />}
    </>
  )
}
