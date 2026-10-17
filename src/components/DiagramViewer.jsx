import { useCallback, useEffect, useRef, useState } from 'react'

/* The diagram viewer: one board, not a stack.

   Every diagram in a set is laid out on a single dotted whiteboard — the
   same surface they were drawn on — and you roam it freely rather than
   scrolling through them one at a time. On opening, the board is scaled
   to fit the window and centred, so the whole system is visible at once;
   from there you zoom into whatever you want to read.

   Panning is bounded: the board can be moved until its far edge reaches
   the middle of the stage, and no further, so it cannot be lost offscreen.

   The transform is written straight to the node rather than held in
   state, so dragging never re-renders. */

const MIN = 0.12
const MAX = 8

export default function DiagramViewer({ sets, openSet, onChangeSet, onClose, closing }) {
  const stage = useRef(null)
  const board = useRef(null)
  const view = useRef({ scale: 1, x: 0, y: 0 })
  const drag = useRef(null)
  const [scaleLabel, setScaleLabel] = useState(100)

  const set = sets.find((s) => s.id === openSet) ?? sets[0]

  const write = useCallback(() => {
    const { scale, x, y } = view.current
    if (board.current) {
      board.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`
    }
  }, [])

  /* Keep the board overlapping the stage: you can push it about, but its
     far edge cannot pass the centre. */
  const clamp = useCallback(() => {
    const stageBox = stage.current?.getBoundingClientRect()
    if (!stageBox || !board.current) return
    const v = view.current
    const w = board.current.offsetWidth * v.scale
    const h = board.current.offsetHeight * v.scale
    const slackX = stageBox.width * 0.5
    const slackY = stageBox.height * 0.5
    v.x = Math.min(slackX, Math.max(stageBox.width - w - slackX, v.x))
    v.y = Math.min(slackY, Math.max(stageBox.height - h - slackY, v.y))
  }, [])

  /* Fit the whole board in the window, centred — the view you want when
     you have just opened a system you have never seen. */
  const fit = useCallback(() => {
    const stageBox = stage.current?.getBoundingClientRect()
    const node = board.current
    if (!stageBox || !node) return

    const scale = Math.min(
      stageBox.width / node.offsetWidth,
      stageBox.height / node.offsetHeight
    ) * 0.92

    view.current = {
      scale,
      x: (stageBox.width - node.offsetWidth * scale) / 2,
      y: (stageBox.height - node.offsetHeight * scale) / 2,
    }
    write()
    setScaleLabel(Math.round(scale * 100))
  }, [write])

  /* Refit whenever the set changes — and again as each diagram finishes
     loading, because a board measured before its images have arrived is
     measured as empty, and the fit lands nowhere near the right place. */
  useEffect(() => {
    const node = board.current
    if (!node) return

    const id = requestAnimationFrame(() => requestAnimationFrame(fit))
    const images = [...node.querySelectorAll('img')]
    const pending = images.filter((image) => !image.complete)
    pending.forEach((image) => image.addEventListener('load', fit, { once: true }))

    return () => {
      cancelAnimationFrame(id)
      pending.forEach((image) => image.removeEventListener('load', fit))
    }
  }, [openSet, fit])

  useEffect(() => {
    const onResize = () => fit()
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', onKey)
    }
  }, [fit, onClose])

  useEffect(() => {
    const element = stage.current
    if (!element) return

    const onWheel = (event) => {
      event.preventDefault()
      const box = element.getBoundingClientRect()
      const px = event.clientX - box.left
      const py = event.clientY - box.top
      const v = view.current

      const next = Math.min(MAX, Math.max(MIN, v.scale * Math.exp(-event.deltaY * 0.0018)))
      // Whatever sits under the cursor stays under the cursor.
      const k = next / v.scale
      v.x = px - (px - v.x) * k
      v.y = py - (py - v.y) * k
      v.scale = next
      clamp()
      write()
      setScaleLabel(Math.round(next * 100))
    }

    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [clamp, write])

  const onPointerDown = (event) => {
    drag.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: view.current.x,
      y: view.current.y,
      // Whether the gesture started on the board or on the dark around it,
      // and how far it travelled: a press on the void that does not move is
      // someone asking to leave, a press that moves is someone panning.
      onBoard: Boolean(event.target.closest('.board')),
      moved: 0,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event) => {
    const start = drag.current
    if (!start) return
    const dx = event.clientX - start.pointerX
    const dy = event.clientY - start.pointerY
    start.moved = Math.max(start.moved, Math.abs(dx) + Math.abs(dy))
    view.current.x = start.x + dx
    view.current.y = start.y + dy
    clamp()
    write()
  }

  const onPointerUp = () => {
    const start = drag.current
    drag.current = null
    // Click the void, leave. Panning from the void does not count, and
    // neither does a click that landed on a drawing.
    if (start && !start.onBoard && start.moved < 6) onClose()
  }

  return (
    <div className="viewer" role="dialog" aria-label={set.title} data-closing={closing}>
      <header className="viewer__bar">
        <div>
          <p className="viewer__title">{set.title}</p>
          {set.note && <p className="viewer__note">{set.note}</p>}
        </div>

        <nav className="viewer__versions">
          {sets.map((other) => (
            <button
              key={other.id}
              type="button"
              data-active={other.id === set.id}
              onClick={() => onChangeSet(other.id)}
            >
              View {other.id.toUpperCase()}
            </button>
          ))}
        </nav>

        <div className="viewer__tools">
          <span>{scaleLabel}%</span>
          <button type="button" onClick={fit}>FIT</button>
          <button type="button" onClick={onClose} aria-label="Close viewer">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M 6 6 L 18 18" />
              <path d="M 18 6 L 6 18" />
            </svg>
          </button>
        </div>
      </header>

      <div
        className="viewer__stage"
        ref={stage}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* one board, the whole system on it */}
        <div className="board" ref={board} data-count={set.figures.length}>
          {set.figures.map((figure) => (
            <figure
              className="board__item"
              key={figure.src}
              style={figure.scale ? { '--fig-scale': figure.scale } : undefined}
            >
              <img src={figure.src} alt={figure.caption} draggable="false" />
              <figcaption>{figure.caption}</figcaption>
            </figure>
          ))}

          {set.legend && (
            <figure className="board__item board__item--legend">
              <img src={set.legend.src} alt={set.legend.caption} draggable="false" />
              <figcaption>{set.legend.caption}</figcaption>
            </figure>
          )}
        </div>
      </div>

      <p className="viewer__hint">scroll to zoom · drag to roam</p>
    </div>
  )
}
