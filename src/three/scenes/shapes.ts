import { Mesh, MeshBasicMaterial, TorusKnotGeometry, Vector3 } from 'three'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'

// Each generator returns `count` xyz triplets, one target position per particle.
// Keeping the same particle order across shapes is what lets the shader blend them.

export interface ShapeSet {
  sphere: Float32Array
  torus: Float32Array
  galaxy: Float32Array
  ring: Float32Array
  random: Float32Array
}

/** Hero: a glowing sphere with a thin, fuzzy shell. */
function sphere(count: number, radius = 1.6) {
  const out = new Float32Array(count * 3)
  const v = new Vector3()
  for (let i = 0; i < count; i++) {
    v.randomDirection().multiplyScalar(radius * (1 + (Math.random() - 0.5) * 0.08))
    v.toArray(out, i * 3)
  }
  return out
}

/** About: points sampled on the surface of a torus knot. */
function torusKnot(count: number) {
  const geometry = new TorusKnotGeometry(1.15, 0.36, 220, 32)
  const sampler = new MeshSurfaceSampler(new Mesh(geometry, new MeshBasicMaterial())).build()
  const out = new Float32Array(count * 3)
  const v = new Vector3()
  for (let i = 0; i < count; i++) {
    sampler.sample(v)
    v.toArray(out, i * 3)
  }
  geometry.dispose()
  return out
}

/** Projects: a flat spiral galaxy in the XZ plane (tilted in the shader). */
function galaxy(count: number, radius = 4.5, arms = 3) {
  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const r = Math.pow(Math.random(), 1.6) * radius
    const armAngle = ((i % arms) / arms) * Math.PI * 2
    const spin = r * 1.1
    // Scatter grows towards the core so the centre looks dense and bright.
    const scatter = () => Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? -1 : 1) * 0.6
    out[i * 3] = Math.cos(armAngle + spin) * r + scatter()
    out[i * 3 + 1] = scatter() * 0.4
    out[i * 3 + 2] = Math.sin(armAngle + spin) * r + scatter()
  }
  return out
}

/** Contact: a portal-like ring in the XY plane, facing the camera. */
function ring(count: number, radius = 2, thickness = 0.18) {
  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const r = radius + (Math.random() - 0.5) * thickness * (Math.random() < 0.15 ? 6 : 1)
    out[i * 3] = Math.cos(angle) * r
    out[i * 3 + 1] = Math.sin(angle) * r
    out[i * 3 + 2] = (Math.random() - 0.5) * thickness
  }
  return out
}

export function createShapes(count: number): ShapeSet {
  const random = new Float32Array(count)
  for (let i = 0; i < count; i++) random[i] = Math.random()

  return {
    sphere: sphere(count),
    torus: torusKnot(count),
    galaxy: galaxy(count),
    ring: ring(count),
    random,
  }
}
