// A tiny, hand-tuned "water ring toss" simulation.
// Rings move in the tank's XY plane (2.5D) and only rotate in 3D for looks.
// All units are tank-local; the scene positions and scales the tank.

export const TANK = {
  halfWidth: 1.08, // inner half width
  floor: -1.3, // inner floor
  surface: 1.55, // water surface
}

export const RING = { radius: 0.17, tube: 0.05 }
export const PEGS = [-0.55, 0.55]
export const PEG_HEIGHT = 1.0
export const PEG_RADIUS = 0.035
export const PEG_TOP = TANK.floor + PEG_HEIGHT

const GRAVITY = 1.2 // gravity minus buoyancy
const DRAG = 2 // linear drag, per second
const ANGULAR_DRAG = 1.5
const JET_FORCE = 18 // upward acceleration right above the jet
const JET_WIDTH = 0.32 // horizontal falloff of the jet
const CURRENT_FORCE = 2.5 // how much pointer movement drags the water
const SETTLE_TORQUE = 1.6 // pulls rings towards lying flat while they sink
const BOUNCE = 0.3
const CAPTURE_X = 0.12 // how close to the peg axis a ring must be to slide on
const STEP = 1 / 120

export interface Ring {
  x: number
  y: number
  vx: number
  vy: number
  /** Rotation in the screen plane (world Z). */
  tilt: number
  tiltV: number
  /** Tumble around X. π/2 = lying flat with the hole facing up. */
  flip: number
  flipV: number
  /** Yaw around the vertical axis, purely cosmetic. */
  spin: number
  spinV: number
  /** Index of the peg the ring is threaded on, or -1. */
  peg: number
}

export interface WaterInput {
  /** Jet position (tank-local x) and strength 0..1. */
  jet: { x: number; strength: number }
  /** Pointer position and velocity inside the tank, used as a water current. */
  current: { x: number; y: number; vx: number; vy: number; strength: number }
  /** Tank tilt in radians; rotates gravity sideways. */
  sway: number
}

const rand = (min: number, max: number) => min + Math.random() * (max - min)

/** Rings start scattered in the upper half and sink, or lie on the floor when `settled`. */
export function createRings(count: number, settled = false): Ring[] {
  return Array.from({ length: count }, (_, k) => {
    const x = -TANK.halfWidth + RING.radius + ((k + 0.5) / count) * (TANK.halfWidth - RING.radius) * 2
    return {
      x: x + rand(-0.05, 0.05),
      y: settled ? TANK.floor + RING.tube : rand(0.2, TANK.surface - 0.3),
      vx: 0,
      vy: 0,
      tilt: rand(-0.4, 0.4),
      tiltV: 0,
      flip: settled ? Math.PI / 2 : rand(0, Math.PI),
      flipV: settled ? 0 : rand(-1, 1),
      spin: rand(0, Math.PI * 2),
      spinV: rand(-0.5, 0.5),
      peg: -1,
    }
  })
}

/** How much the ring's hole faces up: 1 = flat, 0 = standing on its edge. */
function flatness(r: Ring) {
  return Math.abs(Math.sin(r.flip)) * Math.cos(r.tilt)
}

/** Half of the ring's vertical extent for its current orientation. */
function halfHeight(r: Ring) {
  const n = Math.min(Math.abs(flatness(r)), 1)
  return RING.radius * Math.sqrt(1 - n * n) + RING.tube * n
}

function stepOnce(rings: Ring[], input: WaterInput, dt: number) {
  const { jet, current, sway } = input
  const gx = -Math.sin(sway) * GRAVITY
  const gy = -Math.cos(sway) * GRAVITY

  for (const r of rings) {
    // Gravity (rotated by the tank's sway).
    r.vx += gx * dt
    r.vy += gy * dt

    // Jet: strongest right above the nozzle and near the floor.
    if (jet.strength > 0) {
      const dx = r.x - jet.x
      const reach = Math.exp(-((dx / JET_WIDTH) ** 2)) * Math.exp(-(r.y - TANK.floor) * 0.45) * jet.strength
      r.vy += JET_FORCE * reach * dt
      r.vx += Math.sign(dx || rand(-1, 1)) * reach * 2.5 * dt
      r.flipV += rand(-1, 1) * reach * 40 * dt
      r.tiltV += rand(-1, 1) * reach * 12 * dt
      r.spinV += rand(-1, 1) * reach * 20 * dt
    }

    // Pointer current: drag rings along with the movement nearby.
    if (current.strength > 0 && r.peg === -1) {
      const d2 = (r.x - current.x) ** 2 + (r.y - current.y) ** 2
      const reach = Math.exp(-d2 / 0.3) * current.strength
      r.vx += current.vx * reach * CURRENT_FORCE * dt
      r.vy += current.vy * reach * CURRENT_FORCE * dt
    }

    // Water drag.
    const drag = Math.exp(-DRAG * dt)
    r.vx *= drag
    r.vy *= drag
    const angularDrag = Math.exp(-ANGULAR_DRAG * dt)
    r.flipV *= angularDrag
    r.tiltV *= angularDrag
    r.spinV *= angularDrag

    if (r.peg === -1) {
      // Rings slowly turn flat as they sink, which is what makes the game winnable.
      r.flipV += -Math.sin(2 * (r.flip - Math.PI / 2)) * SETTLE_TORQUE * dt
      r.tiltV += -Math.sin(r.tilt) * SETTLE_TORQUE * dt
    }

    r.x += r.vx * dt
    r.y += r.vy * dt
    r.flip += r.flipV * dt
    r.tilt += r.tiltV * dt
    r.spin += r.spinV * dt

    if (r.peg === -1) collideFree(r)
    else collideThreaded(r, rings)
  }

  // Ring-ring separation (free rings only; threaded ones are stacked above).
  for (let a = 0; a < rings.length; a++) {
    for (let b = a + 1; b < rings.length; b++) {
      const ra = rings[a]
      const rb = rings[b]
      if (ra.peg !== -1 || rb.peg !== -1) continue
      const dx = rb.x - ra.x
      const dy = rb.y - ra.y
      const dist = Math.hypot(dx, dy)
      const min = RING.radius * 1.7
      if (dist === 0 || dist >= min) continue
      const nx = dx / dist
      const ny = dy / dist
      const push = (min - dist) / 2
      ra.x -= nx * push
      ra.y -= ny * push
      rb.x += nx * push
      rb.y += ny * push
      const rel = (rb.vx - ra.vx) * nx + (rb.vy - ra.vy) * ny
      if (rel < 0) {
        const impulse = rel * 0.6
        ra.vx += nx * impulse
        ra.vy += ny * impulse
        rb.vx -= nx * impulse
        rb.vy -= ny * impulse
      }
    }
  }
}

function collideFree(r: Ring) {
  const hh = halfHeight(r)

  // Thread onto a peg: falling, centred over it, just above the tip, and flat enough.
  for (let k = 0; k < PEGS.length; k++) {
    const dx = r.x - PEGS[k]
    if (
      r.vy < 0 &&
      Math.abs(dx) < CAPTURE_X &&
      r.y > PEG_TOP - 0.02 &&
      r.y < PEG_TOP + 0.3 &&
      flatness(r) > 0.5
    ) {
      r.peg = k
      return
    }
  }

  // Otherwise pegs are obstacles below their tip.
  for (const px of PEGS) {
    const dx = r.x - px
    const reach = RING.radius + PEG_RADIUS
    if (r.y - hh < PEG_TOP && Math.abs(dx) < reach) {
      const side = Math.sign(dx) || 1
      r.x = px + side * reach
      r.vx = side * Math.abs(r.vx) * BOUNCE
      r.spinV += r.vy * 2
    }
  }

  const minX = -TANK.halfWidth + RING.radius
  const maxX = TANK.halfWidth - RING.radius
  if (r.x < minX) {
    r.x = minX
    r.vx = Math.abs(r.vx) * BOUNCE
  } else if (r.x > maxX) {
    r.x = maxX
    r.vx = -Math.abs(r.vx) * BOUNCE
  }

  const minY = TANK.floor + hh
  const maxY = TANK.surface - hh
  if (r.y < minY) {
    r.y = minY
    r.vy = Math.abs(r.vy) * BOUNCE
    r.vx *= 0.9 // floor friction
    r.flipV += -Math.sin(2 * (r.flip - Math.PI / 2)) * 4 * (1 / 120) // tip over onto the floor
  } else if (r.y > maxY) {
    r.y = maxY
    r.vy = -Math.abs(r.vy) * BOUNCE
  }
}

function collideThreaded(r: Ring, rings: Ring[]) {
  const px = PEGS[r.peg]

  // Slide on the peg: centred, lying flat, stacked on the rings below.
  r.x += (px - r.x) * 0.2
  r.vx = 0
  r.flip += (Math.PI / 2 - r.flip) * 0.1
  r.tilt += (0 - r.tilt) * 0.1
  r.flipV = 0
  r.tiltV = 0

  let below = 0
  for (const other of rings) if (other !== r && other.peg === r.peg && other.y < r.y) below++
  const rest = TANK.floor + RING.tube + below * (RING.tube * 2 + 0.01)
  if (r.y < rest) {
    r.y = rest
    r.vy = Math.max(r.vy, 0)
  }

  // Pushed off the top of the peg by a strong jet: free again.
  if (r.y - RING.tube > PEG_TOP + 0.02) r.peg = -1
}

/** Advances the simulation by `dt` seconds using fixed sub-steps. */
export function stepRings(rings: Ring[], input: WaterInput, dt: number, carry: { value: number }) {
  carry.value = Math.min(carry.value + dt, 0.1)
  while (carry.value >= STEP) {
    stepOnce(rings, input, STEP)
    carry.value -= STEP
  }
}
