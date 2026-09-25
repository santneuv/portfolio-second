import { Environment, Lightformer, MeshTransmissionMaterial, RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Color, type Group, type Mesh, type ShaderMaterial, Vector3 } from 'three'
import { scrollState } from '../../lib/scrollState'
import { pointerOnPlane } from '../pointer'
import fragmentShader from '../shaders/gradient.frag.glsl?raw'
import vertexShader from '../shaders/gradient.vert.glsl?raw'
import { lerpStage, type SceneProps, stepStage } from '../stage'
import { CameraRig } from './CameraRig'
import { Bubbles, type BubblesHandle } from './water/Bubbles'
import { createRings, PEG_HEIGHT, PEG_TOP, PEGS, RING, stepRings, TANK, type WaterInput } from './water/physics'

// Where the toy sits in each section (same order as src/lib/sections.ts).
// Home/About: right of the text. Projects: pushed back to the side. Contact: centred.
const offsets = [0.24, 0.24, 0.36, 0] // fraction of viewport width, wide screens only
const depth = [0, 0, -2.5, -1.2]
const sizes = [1, 1, 0.8, 0.9]
// On narrow screens the toy moves up into the empty space above the text.
const narrowLift = [1.45, 1.45, 0, 0]

// Tank geometry (tank-local units, see water/physics.ts for the inner volume).
const TANK_TOP = TANK.surface + 0.15
const TANK_BOTTOM = TANK.floor - 0.1
const TANK_HEIGHT = TANK_TOP - TANK_BOTTOM
const TANK_WIDTH = TANK.halfWidth * 2 + 0.2
const TANK_DEPTH = 0.6

const ringColors = ['#f472b6', '#facc15', '#34d399', '#60a5fa', '#a78bfa', '#fb923c']
const backgrounds = [
  ['#a5b4fc', '#f9a8d4', '#fcd34d', '#99f6e4'],
  ['#c4b5fd', '#f0abfc', '#fda4af', '#a5f3fc'],
  ['#fda4af', '#fdba74', '#fde68a', '#c4b5fd'],
  ['#99f6e4', '#a5b4fc', '#f9a8d4', '#bef264'],
].map((set) => set.map((c) => new Color(c)))

// Scratch objects reused every frame.
const pointerLocal = new Vector3()

function TankMaterial({ effects }: { effects: boolean }) {
  // Water-tinted glass. Rings, pegs and bubbles are opaque, so they show up
  // in the transmission buffer and get refracted through the "water".
  return effects ? (
    <MeshTransmissionMaterial
      transmissionSampler
      color="#e0fbff"
      attenuationColor="#a5f3fc"
      attenuationDistance={2.5}
      thickness={0.35}
      roughness={0.03}
      ior={1.33}
      chromaticAberration={0.04}
      distortion={0.12}
      distortionScale={0.5}
      temporalDistortion={0.06}
      backside={false}
    />
  ) : (
    <meshPhysicalMaterial color="#e0fbff" transmission={1} thickness={0.3} roughness={0.05} ior={1.33} />
  )
}

/** Theme "glass": a pastel water ring toss toy. Click and hold the tank to pump water. */
export default function GlassScene({ reducedMotion, effects }: SceneProps) {
  const layout = useRef<Group>(null)
  const tank = useRef<Group>(null)
  const ringMeshes = useRef<(Mesh | null)[]>([])
  const surface = useRef<Mesh>(null)
  const buttons = useRef<(Mesh | null)[]>([])
  const bubbles = useRef<BubblesHandle>(null)
  const background = useRef<ShaderMaterial>(null)

  const stage = useRef({ value: scrollState.stage })
  const [rings] = useState(() => createRings(ringColors.length, reducedMotion))
  const carry = useRef({ value: 0 })
  const input = useRef<WaterInput>({
    jet: { x: 0, strength: 0 },
    current: { x: 0, y: 0, vx: 0, vy: 0, strength: 0 },
    sway: 0,
  })
  const tracking = useRef({ lastX: 0, lastY: 0, hasLast: false, hover: false, lastStage: scrollState.stage, bubbleTimer: 0 })

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uColors: { value: backgrounds[0].map((c) => c.clone()) } }),
    [],
  )

  // Never leave the pointer cursor behind when the theme changes.
  useEffect(() => () => document.documentElement.removeAttribute('data-scene-hover'), [])

  useFrame((state, delta) => {
    if (!layout.current || !tank.current || !background.current) return
    const dt = Math.min(delta, 0.1)
    const blend = stepStage(stage.current, reducedMotion, dt, 0.5)
    const track = tracking.current
    const water = input.current

    // Layout per section.
    const { viewport, size } = state
    const wide = size.width >= 900
    const narrow = size.width < 600
    const fit = narrow ? 0.4 : Math.min(Math.max(viewport.width / 5, 0.55), 1)
    const target: [number, number, number] = [
      wide ? lerpStage(offsets, blend) * viewport.width : 0,
      narrow ? lerpStage(narrowLift, blend) : 0,
      lerpStage(depth, blend),
    ]
    if (reducedMotion) layout.current.position.set(...target)
    else easing.damp3(layout.current.position, target, 0.3, dt)
    layout.current.scale.setScalar(fit * lerpStage(sizes, blend))

    // Scrolling tilts the tank a little; the water (gravity) follows the tilt.
    const stageVelocity = (stage.current.value - track.lastStage) / Math.max(dt, 1e-3)
    track.lastStage = stage.current.value
    const sway = reducedMotion ? 0 : Math.max(-0.14, Math.min(0.14, -stageVelocity * 0.12))
    easing.damp(tank.current.rotation, 'z', sway, 0.35, dt)
    water.sway = tank.current.rotation.z

    // Pointer in tank-local space (the tank's z plane).
    const { pointer } = scrollState
    const worldZ = layout.current.position.z
    const hit = pointer.active ? pointerOnPlane(state, pointerLocal, worldZ) : null
    if (hit) tank.current.worldToLocal(hit)
    const inside =
      hit !== null &&
      Math.abs(hit.x) < TANK.halfWidth + 0.15 &&
      hit.y > TANK_BOTTOM - 0.5 &&
      hit.y < TANK_TOP + 0.3

    if (inside !== track.hover) {
      track.hover = inside
      document.documentElement.toggleAttribute('data-scene-hover', inside)
    }

    // Jet: pressing on the tank pumps water up from the floor under the pointer.
    const pumping = inside && pointer.pressed
    if (pumping && hit) water.jet.x = Math.max(-TANK.halfWidth, Math.min(TANK.halfWidth, hit.x))
    const jetTarget = pumping ? (reducedMotion ? 0.7 : 1) : 0
    easing.damp(water.jet, 'strength', jetTarget, pumping ? 0.04 : 0.15, dt)

    // Current: moving the pointer through the water drags the rings along.
    if (inside && hit) {
      if (track.hasLast && dt > 0) {
        water.current.vx = Math.max(-3, Math.min(3, (hit.x - track.lastX) / dt))
        water.current.vy = Math.max(-3, Math.min(3, (hit.y - track.lastY) / dt))
      }
      water.current.x = hit.x
      water.current.y = hit.y
      water.current.strength = 1
      track.lastX = hit.x
      track.lastY = hit.y
      track.hasLast = true
    } else {
      water.current.strength = 0
      track.hasLast = false
    }

    stepRings(rings, water, dt, carry.current)

    // Bubbles while pumping.
    track.bubbleTimer += dt
    if (water.jet.strength > 0.2 && track.bubbleTimer > 0.03) {
      track.bubbleTimer = 0
      bubbles.current?.spawn(water.jet.x, 2)
    }

    // Sync meshes with the simulation.
    rings.forEach((r, k) => {
      const mesh = ringMeshes.current[k]
      if (!mesh) return
      mesh.position.set(r.x, r.y, ((k % 3) - 1) * 0.1)
      mesh.rotation.set(r.flip, r.spin, r.tilt)
    })

    // The pump button on the jet's side is pressed in.
    buttons.current.forEach((button, k) => {
      if (!button) return
      const side = k === 0 ? water.jet.x < 0 : water.jet.x >= 0
      const pressed = side ? water.jet.strength : 0
      button.position.z = TANK_DEPTH / 2 + 0.16 - pressed * 0.06
    })

    if (surface.current && !reducedMotion) {
      const t = state.clock.elapsedTime
      surface.current.rotation.z = Math.sin(t * 1.3) * 0.015 - tank.current.rotation.z * 0.6
      surface.current.position.y = TANK.surface + Math.sin(t * 2) * 0.01 + water.jet.strength * 0.03
    }

    // Background gradient drifts and changes palette per section.
    const u = background.current.uniforms
    if (!reducedMotion) u.uTime.value += dt
    u.uColors.value.forEach((c: Color, k: number) =>
      c.lerpColors(backgrounds[blend.i][k], backgrounds[blend.i + 1][k], blend.f),
    )
  })

  return (
    <>
      {/* Background gradient far behind everything; the tank refracts it. */}
      <mesh position={[0, 0, -8]}>
        <planeGeometry args={[50, 25]} />
        <shaderMaterial
          ref={background}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          depthWrite={false}
        />
      </mesh>

      <group ref={layout}>
        <group ref={tank}>
          {/* Glass tank filled with water */}
          <RoundedBox
            args={[TANK_WIDTH, TANK_HEIGHT, TANK_DEPTH]}
            radius={0.12}
            smoothness={4}
            position={[0, (TANK_TOP + TANK_BOTTOM) / 2, 0]}
          >
            <TankMaterial effects={effects} />
          </RoundedBox>

          {/* Water surface */}
          <mesh ref={surface} position={[0, TANK.surface, 0]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[TANK.halfWidth * 2, TANK_DEPTH - 0.08]} />
            <meshStandardMaterial color="#cffafe" roughness={0.1} side={2} />
          </mesh>

          {/* Plastic lid and base */}
          <RoundedBox args={[TANK_WIDTH + 0.1, 0.18, TANK_DEPTH + 0.1]} radius={0.07} position={[0, TANK_TOP + 0.06, 0]}>
            <meshPhysicalMaterial color="#c4b5fd" roughness={0.35} clearcoat={0.6} />
          </RoundedBox>
          <RoundedBox args={[TANK_WIDTH + 0.3, 0.55, TANK_DEPTH + 0.3]} radius={0.16} position={[0, TANK_BOTTOM - 0.22, 0]}>
            <meshPhysicalMaterial color="#c4b5fd" roughness={0.35} clearcoat={0.6} />
          </RoundedBox>
          {[-0.75, 0.75].map((x, k) => (
            <mesh
              key={x}
              ref={(el) => void (buttons.current[k] = el)}
              position={[x, TANK_BOTTOM - 0.22, TANK_DEPTH / 2 + 0.16]}
              rotation-x={Math.PI / 2}
            >
              <cylinderGeometry args={[0.15, 0.15, 0.12, 32]} />
              <meshPhysicalMaterial color="#f472b6" roughness={0.25} clearcoat={1} />
            </mesh>
          ))}

          {/* Pegs */}
          {PEGS.map((x) => (
            <group key={x} position={[x, TANK.floor, 0]}>
              <mesh position={[0, PEG_HEIGHT / 2, 0]}>
                <cylinderGeometry args={[0.035, 0.045, PEG_HEIGHT, 16]} />
                <meshPhysicalMaterial color="#ffffff" roughness={0.3} clearcoat={0.5} />
              </mesh>
              <mesh position={[0, PEG_TOP - TANK.floor, 0]}>
                <sphereGeometry args={[0.06, 20, 12]} />
                <meshPhysicalMaterial color="#f472b6" roughness={0.25} clearcoat={1} />
              </mesh>
            </group>
          ))}

          {/* Rings */}
          {ringColors.map((color, k) => (
            <mesh key={color} ref={(el) => void (ringMeshes.current[k] = el)} rotation-order="ZYX">
              <torusGeometry args={[RING.radius, RING.tube, 20, 48]} />
              <meshPhysicalMaterial color={color} roughness={0.2} clearcoat={1} clearcoatRoughness={0.1} />
            </mesh>
          ))}

          <Bubbles ref={bubbles} reducedMotion={reducedMotion} />
        </group>
      </group>

      {/* Local studio lighting, no HDR file to download. */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 4, 3]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={2} color="#fbcfe8" position={[-5, 0, 2]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} />
        <Lightformer form="rect" intensity={2} color="#bae6fd" position={[5, -1, 2]} rotation-y={-Math.PI / 2} scale={[6, 4, 1]} />
        <Lightformer form="ring" intensity={4} position={[0, 0, 6]} scale={3} />
      </Environment>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} />

      {!reducedMotion && <CameraRig />}
    </>
  )
}
