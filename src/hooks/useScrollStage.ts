import { useEffect, useState } from 'react'
import { scrollState } from '../lib/scrollState'

/**
 * Maps the scroll position to a continuous "stage" value based on where each
 * section's centre sits relative to the viewport centre, and stores it in
 * scrollState for the 3D scene. Returns the index of the active section.
 */
export function useScrollStage(ids: readonly string[]) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const viewportCenter = window.innerHeight / 2
      const centers = ids.map((id) => {
        const rect = document.getElementById(id)?.getBoundingClientRect()
        return rect ? rect.top + rect.height / 2 : Infinity
      })

      let stage = 0
      if (viewportCenter >= centers[centers.length - 1]) {
        stage = centers.length - 1
      } else {
        for (let i = 0; i < centers.length - 1; i++) {
          const a = centers[i]
          const b = centers[i + 1]
          if (viewportCenter < b) {
            stage = i + Math.min(Math.max((viewportCenter - a) / (b - a), 0), 1)
            break
          }
        }
      }

      scrollState.stage = stage
      setActive(Math.round(stage))
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [ids])

  return active
}
