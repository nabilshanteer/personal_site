/* -----------------------------------------------------------------
   One shared pointer, read by every layer.

   The portrait, the lines and the invert lens all follow the cursor at
   up to 60 frames a second. Routing that through React state would
   re-render the tree on every mouse move, so the position lives in a
   plain object that each layer reads inside its own animation frame.
   ----------------------------------------------------------------- */

export const pointer = {
  /* Viewport pixels */
  x: 0,
  y: 0,
  /* Panel-relative, 0 → 1 */
  u: 0.5,
  v: 0.5,
  /* Panel-relative, -1 → 1, which is what the parallax wants */
  nx: 0,
  ny: 0,
  /* Direction of travel, normalised. Used to decide which way the
     visor slides in from. */
  dirX: -1,
  dirY: 0,
  /* False until the cursor has actually been somewhere */
  active: false,
}

let lastX = 0
let lastY = 0

export function trackPointer(element) {
  const onMove = (event) => {
    const rect = element.getBoundingClientRect()
    const x = event.clientX
    const y = event.clientY

    const dx = x - lastX
    const dy = y - lastY
    const distance = Math.hypot(dx, dy)
    // Ignore sub-pixel jitter, or the slide direction flickers.
    if (distance > 1.5) {
      pointer.dirX = dx / distance
      pointer.dirY = dy / distance
    }
    lastX = x
    lastY = y

    pointer.x = x
    pointer.y = y
    pointer.u = (x - rect.left) / rect.width
    pointer.v = (y - rect.top) / rect.height
    pointer.nx = pointer.u * 2 - 1
    pointer.ny = pointer.v * 2 - 1
    pointer.active = true
  }

  window.addEventListener('pointermove', onMove, { passive: true })
  return () => window.removeEventListener('pointermove', onMove)
}

/* How far the power-up has come, 0 → 1. The portrait writes it; the
   backdrop reads it and lifts the board as the current lands. */
export const power = { amount: 0 }

/* Frame-rate independent damping. */
export const damp = (current, target, lambda, dt) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt))
