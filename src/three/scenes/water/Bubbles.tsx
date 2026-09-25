import { useFrame } from '@react-three/fiber'
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { type InstancedMesh, Object3D } from 'three'
import { TANK } from './physics'

const MAX = 90

export interface BubblesHandle {
  /** Emits `count` bubbles from the floor at tank-local x. */
  spawn: (x: number, count: number) => void
}

interface Bubble {
  alive: boolean
  x: number
  y: number
  z: number
  speed: number
  size: number
  phase: number
}

const dummy = new Object3D()

/** Pooled instanced spheres that rise from the jet and pop at the surface. */
export const Bubbles = forwardRef<BubblesHandle, { reducedMotion: boolean }>(function Bubbles(
  { reducedMotion },
  ref,
) {
  const mesh = useRef<InstancedMesh>(null)
  const pool = useMemo<Bubble[]>(
    () => Array.from({ length: MAX }, () => ({ alive: false, x: 0, y: 0, z: 0, speed: 0, size: 0, phase: 0 })),
    [],
  )
  const next = useRef(0)

  useImperativeHandle(ref, () => ({
    spawn(x, count) {
      for (let n = 0; n < count; n++) {
        const b = pool[next.current]
        next.current = (next.current + 1) % MAX
        b.alive = true
        b.x = x + (Math.random() - 0.5) * 0.12
        b.y = TANK.floor + 0.05
        b.z = (Math.random() - 0.5) * 0.3
        b.speed = 0.9 + Math.random() * 0.8
        b.size = 0.015 + Math.random() * 0.03
        b.phase = Math.random() * Math.PI * 2
      }
    },
  }))

  useFrame((state, delta) => {
    if (!mesh.current) return
    const dt = Math.min(delta, 0.1)
    const t = state.clock.elapsedTime
    pool.forEach((b, k) => {
      if (b.alive) {
        b.y += b.speed * dt
        if (!reducedMotion) b.x += Math.sin(t * 7 + b.phase) * 0.15 * dt
        if (b.y > TANK.surface - b.size) b.alive = false
      }
      dummy.position.set(b.x, b.y, b.z)
      dummy.scale.setScalar(b.alive ? b.size : 0)
      dummy.updateMatrix()
      mesh.current!.setMatrixAt(k, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, MAX]} frustumCulled={false}>
      <sphereGeometry args={[1, 12, 8]} />
      <meshStandardMaterial color="#ffffff" emissive="#e0f7ff" emissiveIntensity={0.4} roughness={0.1} />
    </instancedMesh>
  )
})
