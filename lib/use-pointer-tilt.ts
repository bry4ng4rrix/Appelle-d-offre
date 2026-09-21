'use client'

import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Inclinaison 3D discrète pilotée par le pointeur, plus un reflet qui suit
 * le curseur. Écrit des variables CSS (`--tilt-x`, `--tilt-y`, `--mx`, `--my`)
 * plutôt que des styles inline : aucun rendu React pendant le déplacement.
 *
 * Désactivé lorsque l'appareil n'a pas de pointeur fin (tactile) ou que
 * l'utilisateur demande moins d'animations — dans ce cas le hook ne pose
 * aucun écouteur et la carte reste parfaitement plate.
 */
export function usePointerTilt<T extends HTMLElement>(maxDeg = 5) {
  const ref = useRef<T>(null)
  const frame = useRef(0)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setEnabled(fine.matches && !calm.matches)
    sync()
    fine.addEventListener('change', sync)
    calm.addEventListener('change', sync)
    return () => {
      fine.removeEventListener('change', sync)
      calm.removeEventListener('change', sync)
    }
  }, [])

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const onPointerMove = useCallback(
    (event: React.PointerEvent<T>) => {
      const node = ref.current
      if (!enabled || !node) return
      const { clientX, clientY } = event
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect()
        const px = (clientX - rect.left) / rect.width
        const py = (clientY - rect.top) / rect.height
        node.style.setProperty('--tilt-y', `${(px - 0.5) * maxDeg * 2}deg`)
        node.style.setProperty('--tilt-x', `${(0.5 - py) * maxDeg * 2}deg`)
        node.style.setProperty('--mx', `${px * 100}%`)
        node.style.setProperty('--my', `${py * 100}%`)
      })
    },
    [enabled, maxDeg],
  )

  const onPointerLeave = useCallback((_event?: React.PointerEvent<T>) => {
    const node = ref.current
    cancelAnimationFrame(frame.current)
    if (!node) return
    node.style.setProperty('--tilt-x', '0deg')
    node.style.setProperty('--tilt-y', '0deg')
  }, [])

  return enabled
    ? { ref, onPointerMove, onPointerLeave, 'data-tilt': true as const }
    : { ref }
}
