import { useEffect } from 'react'
import { scrollState } from '../lib/scrollState'

// Clicks on these never reach the 3D scene.
const INTERACTIVE = 'a, button, input, textarea, select, label, [role="button"]'

function toNdc(e: PointerEvent) {
  return {
    x: (e.clientX / window.innerWidth) * 2 - 1,
    y: -((e.clientY / window.innerHeight) * 2 - 1),
  }
}

/**
 * Tracks the pointer on the whole window and writes it to scrollState.
 * The canvas sits behind the page with pointer-events: none, so scenes read
 * this instead of relying on R3F's own events.
 */
export function usePointer() {
  useEffect(() => {
    const { pointer, click } = scrollState

    const onMove = (e: PointerEvent) => {
      Object.assign(pointer, toNdc(e))
      pointer.active = true
    }
    const onLeave = () => {
      pointer.active = false
    }
    const onUp = (e: PointerEvent) => {
      // A finger lifting off the screen is like a mouse leaving.
      if (e.pointerType === 'touch') pointer.active = false
    }
    const onDown = (e: PointerEvent) => {
      Object.assign(pointer, toNdc(e))
      pointer.active = true
      if (e.button !== 0) return
      if (e.target instanceof Element && e.target.closest(INTERACTIVE)) return
      Object.assign(click, toNdc(e))
      click.time = performance.now()
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('blur', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onLeave)
    }
  }, [])
}
