import { useEffect, useRef } from 'react'

/* A band of figures that never ends.

   The list is laid out four times over and moved with a transform. The
   offset is kept inside one copy's width by adding or subtracting that
   width whenever it strays — and because the next copy is identical and
   already in place, there is nothing to see when it happens. No reset to
   the first slide, no snap, and no scroll container to run out of.

   Four copies rather than two, so the track is wider than the viewport
   even for a set of three figures, which is what left the first band
   stuck at its last frame. */

const COPIES = 4
const DRIFT = 26 // px per second

export default function FigureBand({ figures, direction = 1, onOpen }) {
  const track = useRef(null)

  useEffect(() => {
    const element = track.current
    if (!element || figures.length === 0) return

    let offset = 0
    let unit = 0
    let frame
    let last = performance.now()
    let idleUntil = 0

    const measure = () => {
      unit = element.scrollWidth / COPIES
    }
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(element)

    const wrap = () => {
      if (unit < 2) return
      // Keep the offset within one copy. The copy either side is identical,
      // so stepping by exactly `unit` is invisible.
      while (offset <= -unit) offset += unit
      while (offset > 0) offset -= unit
    }

    const tick = (now) => {
      frame = requestAnimationFrame(tick)
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      if (now > idleUntil) offset -= DRIFT * direction * dt
      wrap()
      element.style.transform = `translate3d(${offset.toFixed(2)}px, 0, 0)`
    }
    frame = requestAnimationFrame(tick)

    const onWheel = (event) => {
      // Only take the gesture when it is actually sideways, so the page
      // still scrolls normally with the cursor over a band.
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
      event.preventDefault()
      offset -= event.deltaX
      idleUntil = performance.now() + 1400
      wrap()
      element.style.transform = `translate3d(${offset.toFixed(2)}px, 0, 0)`
    }

    const rail = element.parentElement
    rail.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      rail.removeEventListener('wheel', onWheel)
    }
  }, [figures, direction])

  const run = Array.from({ length: COPIES }, () => figures).flat()

  return (
    <div className="band-row">
      <div className="band-row__track" ref={track}>
        {run.map((figure, i) => (
          <button
            className="band-row__cell"
            key={`${figure.src}-${i}`}
            type="button"
            onClick={() => onOpen(figure)}
            title={figure.caption}
          >
            <img src={figure.src} alt={figure.caption} loading="lazy" draggable="false" />
          </button>
        ))}
      </div>
    </div>
  )
}
