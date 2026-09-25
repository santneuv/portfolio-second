import { Environment, Float, Lightformer, MeshTransmissionMaterial, RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { useEffect, useMemo, useRef } from 'react'
import { Color, type Group, type Mesh, type ShaderMaterial, Vector3 } from 'three'
import { scrollState } from '../../lib/scrollState'
import fragmentShader from '../shaders/gradient.frag.glsl?raw'
import vertexShader from '../shaders/gradient.vert.glsl?raw'
import { pointerOnPlane, pointerRay } from '../pointer'
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

// Per-shape interaction state, mutated every frame.
interface Motion {
  hover: number // 0..1, eased
  offset: Vector3 // pushed away from the pointer
  bounce: number // vertical spring displacement after a click
  bounceVelocity: number
  spin: number // extra spin speed after a click, decays
}

const REPEL_RADIUS = 1.6
const REPEL_DISTANCE = 0.45
const pointerLocal = new Vector3()
const repelTarget = new Vector3()

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
  const meshes = useRef<(Mesh | null)[]>([])
  const background = useRef<ShaderMaterial>(null)
  const stage = useRef({ value: scrollState.stage })
  const hovered = useRef(-1)
  const lastClick = useRef(scrollState.click.time)
  const motion = useRef<Motion[]>(
    tints.map(() => ({ hover: 0, offset: new Vector3(), bounce: 0, bounceVelocity: 0, spin: 0 })),
  )

  // Never leave the pointer cursor behind when the theme changes.
  useEffect(() => () => document.documentElement.removeAttribute('data-scene-hover'), [])

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

    // Which shape is under the pointer (manual raycast: the canvas gets no events).
    const { pointer, click } = scrollState
    const targets = meshes.current.filter((m): m is Mesh => m !== null)
    const hit = pointer.active ? pointerRay(state).intersectObjects(targets, false)[0] : undefined
    const hoverIndex = hit ? meshes.current.indexOf(hit.object as Mesh) : -1
    if (hoverIndex !== hovered.current) {
      hovered.current = hoverIndex
      document.documentElement.toggleAttribute('data-scene-hover', hoverIndex !== -1)
    }

    // A click on a shape makes it jump and spin.
    if (click.time !== lastClick.current) {
      lastClick.current = click.time
      const clicked = pointerRay(state, click).intersectObjects(targets, false)[0]
      const k = clicked ? meshes.current.indexOf(clicked.object as Mesh) : -1
      if (k !== -1 && !reducedMotion) {
        motion.current[k].bounceVelocity = 4.5
        motion.current[k].spin = 9
      }
    }

    const onPlane = pointer.active ? pointerOnPlane(state, pointerLocal) : null
    if (onPlane) layout.current.worldToLocal(onPlane)

    items.current.forEach((item, k) => {
      if (!item) return
      const m = motion.current[k]
      const [x, y, z] = blendFormation(k, blend)

      // Shapes drift away from the pointer when it comes close.
      repelTarget.set(0, 0, 0)
      if (onPlane && !reducedMotion) {
        repelTarget.set(x - onPlane.x, y - onPlane.y, 0)
        const dist = repelTarget.length()
        const push = Math.max(0, 1 - dist / REPEL_RADIUS) * REPEL_DISTANCE
        repelTarget.normalize().multiplyScalar(push)
      }
      easing.damp3(m.offset, repelTarget, 0.3, dt)

      // Damped spring for the click bounce.
      m.bounceVelocity += (-m.bounce * 40 - m.bounceVelocity * 5) * dt
      m.bounce += m.bounceVelocity * dt
      m.spin *= Math.exp(-dt * 2)

      easing.damp(m, 'hover', k === hoverIndex ? 1 : 0, 0.12, dt)
      item.position.set(x + m.offset.x, y + m.offset.y + m.bounce, z)
      item.scale.setScalar(1 + m.hover * 0.15)

      if (!reducedMotion) {
        const speed = 1 + m.hover * 3 + m.spin
        item.rotation.x += dt * (0.15 + k * 0.03) * speed
        item.rotation.y += dt * (0.2 + k * 0.02) * speed
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
                <RoundedBox
                  ref={(el: Mesh | null) => void (meshes.current[k] = el)}
                  args={[0.8, 0.8, 0.8]}
                  radius={0.16}
                  smoothness={6}
                >
                  <GlassMaterial tint={tint} effects={effects} />
                </RoundedBox>
              ) : (
                <mesh ref={(el) => void (meshes.current[k] = el)}>
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
