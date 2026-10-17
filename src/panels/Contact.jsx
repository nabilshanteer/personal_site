import { useCallback, useEffect, useRef, useState } from 'react'
import { LINES, CONNECT_AT, email, PHONE, tel } from '../lib/contact'
import Message from '../components/Message'

/* The contact panel.

   Getting in touch is a circuit being completed, and the whole site is
   drawn in that language already — traces, pads, drill holes. So this is
   a switchboard: each way of reaching him is a jack, and choosing one
   patches a cable across to it.

   Getting there is the cable arriving. The camera sits behind the growing
   tips and is dragged along by them, close enough that the cables rush
   outward past the edge of the frame; as the run ends two of them
   straighten into the sides of the panel, so the thing you travelled
   along becomes the thing you are looking at.

   It is short and it is skippable. Whatever else a contact page is, it
   is the page someone opens when they have already decided to get in
   touch — making them wait is the one thing it must not do. */

const SOCKETS = LINES.map((line, i) => ({
  ...line,
  x: 92,
  y: 20 + i * 20,
}))

const PLUG = { x: 16, y: 50 }

const cable = (to) =>
  `M ${PLUG.x} ${PLUG.y} C ${PLUG.x + 26} ${PLUG.y + 14}, ${to.x - 30} ${to.y + 14}, ${to.x} ${to.y}`

/* --- the run ----------------------------------------------------------- */

/* A tracking shot alongside the growth, not a flight down a tunnel.

   The first attempt pointed the camera straight down the axis of travel.
   Every cable then leaves the centre of the frame as a radial spike, and
   perspective tapers it from a point to a club over its length — which
   is why it read first as flailing arms and then as a starburst of
   matchsticks. Pointing the camera across the growth instead fixes both:
   a cable keeps one thickness along its length, the way a cable does,
   and its shape is a long sinuous curve rather than a spoke.

   Depth is carried by parallax instead. Every cable grows from the same
   place at the same time, but at its own distance from the lens, so the
   near ones race across the frame huge and out of focus while the far
   ones creep. The camera tracks the tips at the middle distance, and the
   near tips outrun it and punch out through the edge of the frame. */

const FOCAL = 520 // how hard the perspective bites
const TRAVEL = 2400 // world units the tips cover over the run
const HERO_Z = 420 // the distance the camera keeps pace with
const LOOK = 0.14 // where the tracked tip sits, as a fraction right of centre
const RUNS = 14
const STEP = 13 // screen pixels between samples along a cable
const SETTLE = 0.72 // where the run stops rushing and becomes a frame

/* The run arrives, and then the bundle keeps flowing behind the panel
   for as long as anyone is on the page. World units a second — a
   twentieth of the speed of the run itself, so it reads as a current in
   the cables rather than as the journey starting again. */
const AMBIENT = 46
const AMBIENT_MS = 1000 / 30 // and at half the frame rate, to be cheap

/* Each cable is a seed, not a stored path: its line is a pair of sines
   read at a world position, so a cable of any length costs nothing to
   remember and never repeats. Depth is fixed per cable, which is what
   keeps its gauge constant down its whole length. */
function makeRuns() {
  const runs = []
  for (let i = 0; i < RUNS; i += 1) {
    const k = i / (RUNS - 1)
    // Weighted towards the back: a few foreground whips, a crowd at the
    // middle distance, a few far enough to sit behind everything.
    const z = 110 + Math.pow(k, 1.7) * 820
    runs.push({
      z,
      scale: FOCAL / z,
      // Spread across the frame, well past its edges — a bundle that
      // stops neatly at the top and bottom looks drawn, not filmed.
      /* Held as fractions of the frame, not as world distances, and
         divided back through by the scale when they are read. A cable
         twice as far away would otherwise sit at half the offset and
         swing half as wide, which crushes the far ones into a band
         across the middle and throws the near ones off-screen. Depth
         should show in a cable's gauge, its brightness and how fast it
         crosses — not in its shape. */
      yFrac: (((i * 7919) % 997) / 997 - 0.5) * 1.22,
      // The long swing, and a small ripple riding on it.
      ampFrac: 0.07 + ((i * 31) % 5) * 0.035,
      waves: 0.7 + ((i * 17) % 7) * 0.17,
      amp2Frac: 0.012 + ((i * 13) % 4) * 0.009,
      waves2: 2.6 + ((i * 11) % 5) * 0.7,
      phase: i * 1.37,
      phase2: i * 2.71,
      width: 2.3 + ((i * 23) % 4) * 0.95,
      // Tips do not all arrive together. The rails keep pace exactly.
      speed: i === 5 || i === 10 ? 1 : 0.86 + ((i * 29) % 5) * 0.07,
      // Two of them become the sides of the panel at the end.
      rail: i === 5 ? -1 : i === 10 ? 1 : 0,
    })
  }
  return runs
}

/* --- the board behind it ------------------------------------------------ */

/* The field the cables run over: a graded dark, two pools of colour, and
   a sparse routing of traces and vias in the site's own language.

   Drawn once into an offscreen canvas per size, then blitted. That
   matters more than it looks: it is also what wipes the previous frame,
   so it is touched every frame of the run, and routing forty traces
   sixty times a second to produce an identical picture would be a waste
   of the whole frame budget. */
function makePlate(w, h) {
  const off = document.createElement('canvas')
  off.width = w
  off.height = h
  const c = off.getContext('2d')

  // A graded base rather than one flat colour.
  const base = c.createLinearGradient(0, 0, w * 0.4, h)
  base.addColorStop(0, '#080a14')
  base.addColorStop(0.55, '#06070d')
  base.addColorStop(1, '#0b0711')
  c.fillStyle = base
  c.fillRect(0, 0, w, h)

  const pool = (x, y, r, colour) => {
    const g = c.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, colour)
    g.addColorStop(1, 'rgba(0, 0, 0, 0)')
    c.fillStyle = g
    c.fillRect(0, 0, w, h)
  }
  const reach = Math.max(w, h)
  pool(w * 0.2, h * 0.84, reach * 0.62, 'rgba(255, 122, 40, 0.085)')
  pool(w * 0.84, h * 0.14, reach * 0.55, 'rgba(78, 96, 200, 0.07)')

  /* Fixed seed, so the board is the same board every time the page is
     opened and on every reload. A field that reshuffled itself would
     read as noise rather than as a thing that is there. */
  let seed = 20260416
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }

  const GRID = 26

  // The drill holes, very faint — the texture of a board rather than
  // anything meant to be looked at.
  c.fillStyle = 'rgba(238, 241, 246, 0.022)'
  for (let y = GRID; y < h; y += GRID) {
    for (let x = GRID; x < w; x += GRID) c.fillRect(x, y, 1, 1)
  }

  /* Traces run at multiples of 45 degrees and nothing else, which is how
     a board is actually routed and is most of why this reads as one. */
  const DIRS = [
    [1, 0], [0, 1], [-1, 0], [0, -1],
    [1, 1], [1, -1], [-1, 1], [-1, -1],
  ]

  c.lineCap = 'square'
  c.lineJoin = 'round'

  for (let i = 0; i < 44; i += 1) {
    let x = Math.round(rnd() * (w / GRID)) * GRID
    let y = Math.round(rnd() * (h / GRID)) * GRID
    const from = [x, y]
    const path = [[x, y]]

    let last = -1
    const legs = 2 + Math.floor(rnd() * 3)
    for (let k = 0; k < legs; k += 1) {
      let d = Math.floor(rnd() * DIRS.length)
      // No doubling back on itself, and no two legs the same way.
      if (d === last) d = (d + 1) % DIRS.length
      last = d
      const [dx, dy] = DIRS[d]
      const len = (2 + Math.floor(rnd() * 6)) * GRID
      x += dx * len
      y += dy * len
      path.push([x, y])
    }

    c.strokeStyle = rnd() < 0.3 ? 'rgba(238, 241, 246, 0.03)' : 'rgba(255, 146, 66, 0.055)'
    c.lineWidth = rnd() < 0.25 ? 2 : 1
    c.beginPath()
    c.moveTo(path[0][0], path[0][1])
    for (let k = 1; k < path.length; k += 1) c.lineTo(path[k][0], path[k][1])
    c.stroke()

    // A pad at each end, the way a trace starts and stops somewhere.
    for (const [px, py] of [from, [x, y]]) {
      c.strokeStyle = 'rgba(255, 150, 70, 0.075)'
      c.lineWidth = 1
      c.beginPath()
      c.arc(px, py, 3.2, 0, Math.PI * 2)
      c.stroke()
    }
  }

  return off
}

export default function Contact() {
  const [phase, setPhase] = useState('off') // off | running | connected
  const [patched, setPatched] = useState(null)
  const [copied, setCopied] = useState(null)
  const canvas = useRef(null)
  const runs = useRef(null)
  const edge = useRef(null) // cached vignette, rebuilt only on resize
  const plate = useRef(null) // cached background, likewise
  const frame = useRef(null)
  const started = useRef(0)
  const live = useRef(false)
  const held = useRef(0) // where the run was when it was skipped
  const settledAt = useRef(0) // when the board arrived, for the drift after it
  const timer = useRef(null)
  const formArea = useRef(null)

  const stop = useCallback(() => {
    if (frame.current) cancelAnimationFrame(frame.current)
    frame.current = null
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = null
  }, [])

  const restore = useCallback(() => {
    live.current = false
    settledAt.current = 0
    stop()
    document.documentElement.removeAttribute('data-overlay')
    document.documentElement.removeAttribute('data-panel')
    document.documentElement.style.setProperty('--house', '1')
    setPatched(null)
    setCopied(null)
    setPhase('off')
  }, [stop])

  /* The board arrives. Called by the clock, or by anyone who skips. */
  const connect = useCallback(() => {
    if (!live.current) return
    if (timer.current) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    held.current = 1
    settledAt.current = performance.now()
    document.documentElement.setAttribute('data-overlay', 'here')
    document.documentElement.style.setProperty('--house', '0.06')
    setPhase('connected')
  }, [])

  /* One frame of the run. */
  /* One frame of the run. */
  const paint = useCallback(() => {
    const node = canvas.current
    if (!node) return
    const box = node.getBoundingClientRect()
    if (box.width < 2 || box.height < 2) return
    const w = Math.round(box.width)
    const h = Math.round(box.height)
    if (node.width !== w || node.height !== h) {
      node.width = w
      node.height = h
      edge.current = null
      plate.current = null
    }

    const ctx = node.getContext('2d')
    const mx = w / 2
    const my = h / 2

    // Where the run has got to. Eased, so it leaves hard and arrives soft.
    const now = performance.now()
    const raw = held.current || Math.min(1, (now - started.current) / (CONNECT_AT * 1000))
    const t = 1 - Math.pow(1 - raw, 2.2)

    // The last stretch is the settle: the two rails straighten and the
    // rest thin out, so the run ends as a frame rather than a stop.
    const settle = Math.max(0, (t - SETTLE) / (1 - SETTLE))
    const ease = settle * settle * (3 - 2 * settle)

    /* Trails, not a clean wipe. A frame left faintly under the next one
       is what reads as speed, and it smooths the fast foreground cables
       into a blur instead of a stutter. The wipe goes opaque through the
       settle, so the frame held at the end is clean.

       The background does the wiping. Laying it down at the wipe's own
       opacity covers the frame beneath exactly as a flat fill did, and
       leaves the board showing through rather than a single dead
       colour. */
    if (!plate.current) plate.current = makePlate(w, h)
    ctx.globalAlpha = 0.32 + 0.68 * ease
    ctx.drawImage(plate.current, 0, 0)
    ctx.globalAlpha = 1

    if (!runs.current) runs.current = makeRuns()

    const heroScale = FOCAL / HERO_Z
    /* Everything keeps moving forward together once the board is here:
       the camera and every tip advance at the same rate, so the stagger
       between them is kept and no cable slowly wanders out of frame and
       leaves the background emptier than it started. */
    const drift = settledAt.current ? ((now - settledAt.current) / 1000) * AMBIENT : 0
    const tipWorld = t * TRAVEL + drift
    // The camera keeps the tracked tip a fixed distance right of centre.
    const camX = tipWorld - (LOOK * w) / heroScale

    /* A little movement on the camera — the shot is handheld, not on
       rails — taken back out as it settles, since the rails have to
       finish genuinely vertical. */
    const loose = 1 - ease
    const roll = Math.sin(t * 6.1) * 0.045 * loose
    const cos = Math.cos(roll)
    const sin = Math.sin(roll)
    const camY = Math.sin(t * 3.4) * 26 * loose

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Past the settle, and so flowing rather than arriving.
    const flowing = ease >= 0.999

    for (const run of runs.current) {
      const scale = run.scale
      const tipX = mx + (t * TRAVEL * run.speed + drift - camX) * scale
      if (!flowing && tipX < -50) continue

      /* During the run a cable is only as long as it has grown: from
         where it was planted to where its tip has got to. Once the board
         is here it spans the frame instead. A growing tip is the point
         of the run, but a cable that stops dead in open space is just a
         line with an end on it, and thirteen of those hanging behind the
         panel is not a background. */
      const rootX = mx + (0 - camX) * scale
      const from = flowing ? -60 : Math.max(-60, rootX)
      const to = flowing ? w + 60 : Math.min(w + 60, tipX)
      if (to - from < 2) continue

      // Read back in world units at this cable's distance, so the shape
      // lands the same size on screen whatever depth it sits at.
      const yOff = (run.yFrac * h) / scale
      const amp = (run.ampFrac * h) / scale
      const amp2 = (run.amp2Frac * h) / scale
      const freq = (Math.PI * 2 * scale) / (w * run.waves)
      const freq2 = (Math.PI * 2 * scale) / (w * run.waves2)

      const pts = []
      for (let sx = from; ; sx += STEP) {
        const at = Math.min(sx, to)
        const wx = camX + (at - mx) / scale
        const wy =
          yOff +
          Math.sin(wx * freq + run.phase) * amp +
          Math.sin(wx * freq2 + run.phase2) * amp2
        // Roll is a rotation of the frame, so it is applied to the
        // projected point rather than to the world.
        const dx = at - mx
        const dy = wy * scale - camY
        pts.push([mx + dx * cos - dy * sin, my + dx * sin + dy * cos])
        if (at >= to) break
      }
      if (pts.length < 2) continue

      /* A cable at the hero distance is the one in focus. Nearer ones
         are dark, soft shapes crossing the frame and further ones sit
         back — which is the whole of the depth cue, since there is no
         affordable way to actually blur any of this. */
      const focus = Math.exp(-Math.pow((scale - heroScale) / 2, 2))
      const far = Math.min(1, 0.45 + scale * 0.45)

      let gauge = Math.min(Math.max(0.9, run.width * scale), 40)
      let alpha = far
      if (run.rail) {
        // Morphed in screen space towards a straight vertical line at the
        // frame's edge, which is where the panel's sides want it.
        const last = pts.length - 1
        const tx = mx + run.rail * w * 0.46
        for (let i = 0; i <= last; i += 1) {
          const frac = last ? i / last : 0
          const ty = -12 + frac * (h + 24)
          pts[i][0] += (tx - pts[i][0]) * ease
          pts[i][1] += (ty - pts[i][1]) * ease
        }
        gauge += (3.2 - gauge) * ease
        alpha += (1 - alpha) * ease
      } else {
        /* Not all the way out. What is left of the bundle at the end is
           part of the background the panel sits on, and a field that
           erased itself completely would leave the two rails standing in
           nothing. */
        alpha *= Math.max(0.14, loose)
      }
      if (alpha <= 0.01) continue

      const run_core = run.rail ? 1 : focus
      const line = () => {
        ctx.beginPath()
        ctx.moveTo(pts[0][0], pts[0][1])
        for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0], pts[i][1])
        ctx.stroke()
      }

      // The sheath, the light it throws, then the lit core. Three
      // layered strokes rather than a shadow blur — a blur at this size
      // costs more than the whole rest of the frame. The gauge is one
      // number for the whole cable, which is what stops it tapering.
      ctx.strokeStyle = `rgba(13, 8, 15, ${(0.94 * alpha).toFixed(3)})`
      ctx.lineWidth = gauge
      line()

      ctx.strokeStyle = `rgba(255, 118, 36, ${(0.17 * alpha * (0.3 + 0.7 * run_core)).toFixed(3)})`
      ctx.lineWidth = gauge * 2.3
      line()

      ctx.strokeStyle = `rgba(255, 208, 156, ${(0.95 * alpha * run_core).toFixed(3)})`
      ctx.lineWidth = Math.max(0.8, gauge * 0.26)
      line()

      /* The growing tip. A soft bloom and a short bright lick, not a
         bead on the end — a round cap sitting proud of the line is what
         made the last version look like a box of matches. */
      if (!run.rail && ease < 1 && tipX < w + 20 && tipX > -20) {
        const [ex, ey] = pts[pts.length - 1]
        const lit = alpha * (0.35 + 0.65 * focus)
        const reach = Math.max(10, gauge * 2.6)
        const glow = ctx.createRadialGradient(ex, ey, 0, ex, ey, reach)
        glow.addColorStop(0, `rgba(255, 190, 120, ${(0.34 * lit).toFixed(3)})`)
        glow.addColorStop(1, 'rgba(255, 140, 50, 0)')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(ex, ey, reach, 0, Math.PI * 2)
        ctx.fill()

        // The last stretch of core runs hot, which reads as the cable
        // being made rather than as a bead stuck on the end.
        const lick = Math.min(5, pts.length - 1)
        if (lick > 0) {
          ctx.strokeStyle = `rgba(255, 240, 220, ${(0.85 * lit).toFixed(3)})`
          ctx.lineWidth = Math.max(0.8, gauge * 0.3)
          ctx.beginPath()
          ctx.moveTo(pts[pts.length - 1 - lick][0], pts[pts.length - 1 - lick][1])
          for (let i = pts.length - lick; i < pts.length; i += 1) ctx.lineTo(pts[i][0], pts[i][1])
          ctx.stroke()
        }
      }
    }

    // Dark corners, so the frame has a middle to look at. Built once per
    // size: a gradient per frame is a real cost at this rate.
    if (!edge.current) {
      const g = ctx.createRadialGradient(mx, my, Math.min(w, h) * 0.3, mx, my, Math.max(w, h) * 0.78)
      g.addColorStop(0, 'rgba(6, 7, 13, 0)')
      g.addColorStop(1, 'rgba(4, 4, 9, 0.6)')
      edge.current = g
    }
    ctx.globalAlpha = 1 - 0.55 * ease
    ctx.fillStyle = edge.current
    ctx.fillRect(0, 0, w, h)
    ctx.globalAlpha = 1
  }, [])

  const begin = useCallback(() => {
    if (phase !== 'off') return
    live.current = true
    held.current = 0
    settledAt.current = 0
    started.current = performance.now()
    runs.current = makeRuns()
    document.documentElement.setAttribute('data-overlay', 'falling')
    document.documentElement.setAttribute('data-panel', 'contact')
    setPhase('running')

    /* The board arrives on a timer, not on a frame. Frames stop in a
       backgrounded tab, and hanging the arrival off them meant the
       sequence could sit on the connecting screen indefinitely. The
       animation is allowed to depend on frames; the sequence is not. */
    timer.current = window.setTimeout(connect, CONNECT_AT * 1000)

    const dimFrom = Date.now()
    const dim = window.setInterval(() => {
      if (!live.current) {
        window.clearInterval(dim)
        return
      }
      const d = Math.min(1, (Date.now() - dimFrom) / 1400)
      document.documentElement.style.setProperty('--house', (1 - 0.94 * (d * d * (3 - 2 * d))).toFixed(3))
      if (d >= 1) window.clearInterval(dim)
    }, 40)
  }, [phase, connect])

  /* The run draws while it is running, and holds its last frame after —
     the rails stay as the sides of the panel. */
  useEffect(() => {
    if (phase === 'off') return
    let stopped = false

    /* The run draws every frame. Afterwards the bundle keeps flowing,
       but at half the rate — it moves slowly enough that thirty frames a
       second is indistinguishable from sixty, and this is a loop that
       now runs for as long as someone is on the page rather than for two
       and a half seconds. Frames stop by themselves in a backgrounded
       tab, which is the rest of the saving. */
    let last = 0
    const tick = (at) => {
      if (stopped || !live.current) return
      frame.current = requestAnimationFrame(tick)
      if (settledAt.current && at - last < AMBIENT_MS) return
      last = at
      paint()
    }
    frame.current = requestAnimationFrame(tick)

    return () => {
      stopped = true
      stop()
    }
  }, [phase, paint, stop])

  /* The held frame is a drawing, not a layout — without this a resize
     leaves the rails stretched away from the panel's edges. */
  useEffect(() => {
    if (phase !== 'connected') return
    const again = () => {
      edge.current = null
      paint()
    }
    window.addEventListener('resize', again)
    return () => window.removeEventListener('resize', again)
  }, [phase, paint])

  /* A way to look at one frame of the run on demand, without waiting for
     it and without frames at all. The browser pane pauses
     requestAnimationFrame, which is exactly how the previous version of
     this animation came to be described without ever being looked at.
     Dev only: import.meta.env.DEV folds the whole block away in a
     build. */
  useEffect(() => {
    if (!import.meta.env.DEV) return
    window.__contactFrame = (at) =>
      new Promise((done) => {
        if (timer.current) {
          window.clearTimeout(timer.current)
          timer.current = null
        }
        live.current = true
        runs.current = makeRuns()
        held.current = Math.max(0.0001, Math.min(1, at))
        setPhase('running')
        // A timer, not a frame — the point is to work where frames do not.
        window.setTimeout(() => {
          paint()
          const node = canvas.current
          done({ at: held.current, w: node?.width ?? 0, h: node?.height ?? 0 })
        }, 70)
      })
    return () => {
      delete window.__contactFrame
    }
  }, [paint])

  /* Another panel was chosen from the menu while this one was open. */
  useEffect(() => {
    const leave = (event) => {
      if (event.detail?.next === 'contact:open') return
      restore()
    }
    window.addEventListener('panel:exit', leave)
    return () => window.removeEventListener('panel:exit', leave)
  }, [restore])

  useEffect(() => {
    const open = () => begin()
    window.addEventListener('contact:open', open)
    return () => window.removeEventListener('contact:open', open)
  }, [begin])

  useEffect(() => {
    if (phase === 'off') return
    const onKey = (event) => {
      if (event.key === 'Escape') {
        restore()
        return
      }
      if (phase !== 'running' || event.key === 'Tab') return
      const target = event.target
      if (target instanceof Element && target.closest('input, textarea')) return
      event.preventDefault()
      connect()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, restore, connect])

  /* Opening the form adds a good half-screen below the fold. Bringing it
     into view beats leaving someone to work out that the panel scrolls. */
  useEffect(() => {
    if (patched !== 'message') return
    const id = window.setTimeout(() => {
      formArea.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }, 120)
    return () => window.clearTimeout(id)
  }, [patched])

  useEffect(
    () => () => {
      if (frame.current) cancelAnimationFrame(frame.current)
      document.documentElement.removeAttribute('data-overlay')
    document.documentElement.removeAttribute('data-panel')
      document.documentElement.style.setProperty('--house', '1')
    },
    []
  )

  const patch = (line) => {
    setPatched(line.id)
    if (line.kind !== 'form' && line.href) {
      window.open(line.href, '_blank', 'noopener')
    }
  }

  const take = async (what, value) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(what)
      window.setTimeout(() => setCopied(null), 1600)
    } catch {
      setCopied(null)
    }
  }

  const liveLine = SOCKETS.find((s) => s.id === patched)

  return (
    <div className="contact" data-phase={phase} aria-hidden={phase === 'off'}>
      <canvas className="contact__run" ref={canvas} aria-hidden="true" />
      <div className="contact__glow" aria-hidden="true" />

      {phase === 'running' && (
        <div className="contact__ring">
          <p className="contact__dialling">CONNECTING</p>
          <button className="contact__skip" type="button" onClick={connect}>
            ANY KEY TO SKIP
          </button>
        </div>
      )}

      {/* Outside the scroller on purpose: the way out must not scroll away
          from someone halfway down the form. */}
      {phase === 'connected' && (
        <button className="contact__close" type="button" onClick={restore} aria-label="Close contact">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M 6 6 L 18 18" />
            <path d="M 18 6 L 6 18" />
          </svg>
        </button>
      )}

      <div className="contact__board">
        <section className="contact__sheet" aria-label="Contact">
          <header className="contact__head">
            <p className="contact__eyebrow">CONTACT</p>
            <h2>Patch a line through</h2>

            {/* Always on the board. Someone who came here to email or ring
                should not have to pick anything first. */}
            <dl className="contact__direct">
              <div>
                <dt>EMAIL</dt>
                <dd>
                  <a href={`mailto:${email()}`}>{email()}</a>
                  <button type="button" onClick={() => take('email', email())}>
                    {copied === 'email' ? 'COPIED' : 'COPY'}
                  </button>
                </dd>
              </div>
              <div>
                <dt>PHONE</dt>
                <dd>
                  <a href={`tel:${tel()}`}>{PHONE}</a>
                  <button type="button" onClick={() => take('phone', PHONE)}>
                    {copied === 'phone' ? 'COPIED' : 'COPY'}
                  </button>
                </dd>
              </div>
            </dl>
          </header>

          <div className="contact__panel">
            <svg className="contact__wire" viewBox="0 0 108 100" aria-hidden="true">
              {SOCKETS.map((socket) => (
                <path
                  key={socket.id}
                  className="contact__trace"
                  d={`M ${socket.x - 26} ${socket.y} L ${socket.x} ${socket.y}`}
                  data-on={patched === socket.id}
                />
              ))}

              {liveLine && (
                <path key={liveLine.id} className="contact__cable" d={cable(liveLine)} pathLength="1" />
              )}

              <circle className="contact__plug" cx={PLUG.x} cy={PLUG.y} r="4.5" />
              <circle className="contact__plug-pin" cx={PLUG.x} cy={PLUG.y} r="1.8" />

              {SOCKETS.map((socket) => (
                <g key={socket.id} data-on={patched === socket.id} className="contact__socket">
                  <circle cx={socket.x} cy={socket.y} r="5.5" />
                  <circle className="contact__hole" cx={socket.x} cy={socket.y} r="2.2" />
                </g>
              ))}
            </svg>

            <ul className="contact__lines">
              {LINES.map((line) => (
                <li key={line.id} data-on={patched === line.id}>
                  <button type="button" onClick={() => patch(line)}>
                    <span className="contact__label">{line.label}</span>
                    <span className="contact__note">{line.note}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {patched === 'message' && (
            <div className="contact__form" ref={formArea}>
              <Message />
            </div>
          )}
          {patched && patched !== 'message' && (
            <p className="contact__opened">Opened in a new tab.</p>
          )}
        </section>
      </div>
    </div>
  )
}
