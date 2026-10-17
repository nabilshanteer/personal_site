import { useEffect, useRef } from 'react'
import { pointer, power } from '../lib/pointer'

/* The board, and the geometry over it.

   The circuit photograph is always there, just very faint. Everything
   else is about raising it:

     moving   the cursor scatters triangles behind it, each with its own
              size, spin, drift and lifetime, so the trail breaks up a
              shard at a time rather than fading as one smear
     idle     once the cursor has been still for a moment, slow quiet
              ripples spread from it
     always   triangular line clusters surface at random points, the
              border geometry from the reference artwork

   All of it feeds one mask. That mask starts at a low floor rather than
   at zero, which is what keeps the board faintly present everywhere. */

const COUNT = 26

const BASE_REVEAL = 0.17 // how present the board is with nothing happening
const SHARD_EVERY = 15 // px of cursor travel per triangle dropped
const SHARD_LIFE = [0.55, 2.6] // seconds — the spread is what makes it chaotic
const SHARD_MAX = 150
const STILL_AFTER = 0.4 // seconds without movement before it counts as idle
const STILL_SPEED = 28 // px/s under which the cursor counts as still
const RIPPLE_EVERY = 1.5 // seconds between idle ripples
const RIPPLE_LIFE = 3.4 // seconds for one to spread and fade
const RIPPLE_ALPHA = 0.3 // deliberately faint
const CLUSTER_EVERY = 2.3 // seconds between random triangle clusters
const CLUSTER_LIFE = 3.0

function buildShapes(width, height) {
  const shapes = []
  // Deterministic layout, so it looks composed rather than noisy.
  let seed = 20260101
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }

  for (let i = 0; i < COUNT; i++) {
    const edge = random()
    const cx = edge < 0.5 ? random() * 0.3 * width : (0.7 + random() * 0.3) * width
    const cy = random() * height
    const size = (0.06 + random() * 0.26) * Math.min(width, height)

    shapes.push({
      x: random() < 0.35 ? random() * width : cx,
      y: cy,
      size,
      rotation: random() * Math.PI * 2,
      spin: (random() - 0.5) * 0.08,
      driftX: (random() - 0.5) * 9,
      driftY: (random() - 0.5) * 9,
      phase: random() * Math.PI * 2,
      speed: 0.12 + random() * 0.3,
      sides: random() > 0.45 ? 3 : 2,
      weight: random() > 0.7 ? 1.4 : 0.7,
    })
  }
  return shapes
}

/* A ring whose radius wobbles with angle, so it never reads as a circle. */
function ringPath(context, x, y, radius, seed) {
  const STEPS = 64
  context.beginPath()
  for (let i = 0; i <= STEPS; i++) {
    const a = (i / STEPS) * Math.PI * 2
    const wobble =
      1 +
      0.09 * Math.sin(a * 3 + seed) +
      0.05 * Math.sin(a * 7 - seed * 1.7) +
      0.03 * Math.sin(a * 13 + seed * 0.6)
    const r = radius * wobble
    const px = x + Math.cos(a) * r
    const py = y + Math.sin(a) * r
    if (i === 0) context.moveTo(px, py)
    else context.lineTo(px, py)
  }
  context.closePath()
}

/* The border geometry from the reference: nested triangles on a shared
   centre at different scales and rotations. */
function trianglePath(context, x, y, size, rotation) {
  context.beginPath()
  for (let i = 0; i <= 3; i++) {
    const a = rotation + (i / 3) * Math.PI * 2
    const px = x + Math.cos(a) * size
    const py = y + Math.sin(a) * size
    if (i === 0) context.moveTo(px, py)
    else context.lineTo(px, py)
  }
  context.closePath()
}

export default function Backdrop() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    const layer = document.createElement('canvas') // photo + line work
    const layerContext = layer.getContext('2d')
    const events = document.createElement('canvas') // ripples + clusters
    const eventsContext = events.getContext('2d')
    const mask = document.createElement('canvas') // all of it, unioned
    const maskContext = mask.getContext('2d')

    const photo = new Image()
    // Rescaling a 900px photograph to cover the viewport every frame was
    // the single most expensive thing on the page. It is scaled once into
    // this canvas instead, with a margin for the parallax to move inside,
    // and blitted 1:1 from then on.
    const plate = document.createElement('canvas')
    const plateContext = plate.getContext('2d')
    const PARALLAX = 16
    let photoReady = false

    const paintPlate = () => {
      if (!photoReady || width < 2) return
      plate.width = Math.round(width + PARALLAX * 2)
      plate.height = Math.round(height + PARALLAX * 2)
      const scale = Math.max(plate.width / photo.width, plate.height / photo.height)
      const w = photo.width * scale
      const h = photo.height * scale
      plateContext.clearRect(0, 0, plate.width, plate.height)
      plateContext.drawImage(photo, (plate.width - w) / 2, (plate.height - h) / 2, w, h)
    }

    photo.onload = () => {
      photoReady = true
      paintPlate()
    }
    photo.src = '/img/backdrop.webp'

    let shapes = []
    let width = 0
    let height = 0
    let dpr = 1

    const resize = () => {
      // Deliberately 1, not devicePixelRatio: at 2 this surface is 3.3
      // million pixels and every frame walks it several times over. The
      // backdrop is a blurred photograph behind everything else — nobody
      // can see the difference, and it is four times the work.
      dpr = 1
      width = canvas.clientWidth
      height = canvas.clientHeight
      for (const c of [canvas, layer, events, mask]) {
        c.width = Math.round(width * dpr)
        c.height = Math.round(height * dpr)
      }
      for (const ctx of [context, layerContext, eventsContext, maskContext]) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      shapes = buildShapes(width, height)
      paintPlate()
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    const ripples = []
    const clusters = []
    const shards = []
    let travelled = 0
    let lastCluster = 0
    let lastRipple = 0
    let stillFor = 0
    let previousX = 0
    let previousY = 0
    let seeded = false

    let frame
    let time = 0
    let last = performance.now()

    const draw = (now) => {
      frame = requestAnimationFrame(draw)
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now

      // Nothing underneath the about sequence needs drawing: it covers the
      // screen completely, and leaving two canvases and a WebGL portrait
      // running under it was most of the cost of having it open.
      if (document.documentElement.getAttribute('data-overlay') === 'here') return

      time += dt

      // A collapsed panel gives zero-sized canvases, and drawImage throws.
      if (width < 2 || height < 2) return

      // --- the layer being revealed ------------------------------------
      layerContext.clearRect(0, 0, width, height)

      if (photoReady) {
        // Drifts slightly with the cursor, so the board sits behind glass
        // rather than on it.
        layerContext.drawImage(
          plate,
          -PARALLAX - pointer.nx * PARALLAX * 0.8,
          -PARALLAX - pointer.ny * PARALLAX * 0.6
        )
      }

      layerContext.strokeStyle = 'rgba(232, 238, 246, 0.5)'
      layerContext.lineJoin = 'round'

      for (const s of shapes) {
        const x = s.x + Math.sin(time * s.speed + s.phase) * s.driftX
        const y = s.y + Math.cos(time * s.speed * 0.8 + s.phase) * s.driftY
        const rotation = s.rotation + time * s.spin

        layerContext.lineWidth = s.weight
        if (s.sides === 3) {
          trianglePath(layerContext, x, y, s.size, rotation)
          layerContext.stroke()
        } else {
          layerContext.beginPath()
          layerContext.moveTo(
            x - Math.cos(rotation) * s.size * 2.4,
            y - Math.sin(rotation) * s.size * 2.4
          )
          layerContext.lineTo(
            x + Math.cos(rotation) * s.size * 2.4,
            y + Math.sin(rotation) * s.size * 2.4
          )
          layerContext.stroke()
        }
      }

      // --- cursor state --------------------------------------------------
      const rect = canvas.getBoundingClientRect()
      const px = pointer.x - rect.left
      const py = pointer.y - rect.top
      if (!seeded && pointer.active) {
        previousX = px
        previousY = py
        seeded = true
      }

      const moved = Math.hypot(px - previousX, py - previousY)
      const speed = moved / Math.max(dt, 0.001)
      const still = pointer.active && speed < STILL_SPEED
      stillFor = still ? stillFor + dt : 0

      // --- the trail: a swarm of triangles, not a stroke ------------------
      // One is dropped per fixed distance of travel, each with its own
      // size, spin, drift and lifetime, so the trail comes apart a shard
      // at a time instead of fading as one uniform smear.
      if (pointer.active && !still) {
        travelled += moved
        const base = Math.min(width, height)
        while (travelled > SHARD_EVERY && shards.length < SHARD_MAX) {
          travelled -= SHARD_EVERY
          // Place it somewhere along the segment just travelled, so a fast
          // flick lays a line of them rather than a clump at the end.
          const t = Math.random()
          const scatter = base * 0.035
          shards.push({
            x: previousX + (px - previousX) * t + (Math.random() - 0.5) * scatter,
            y: previousY + (py - previousY) * t + (Math.random() - 0.5) * scatter,
            size: base * (0.012 + Math.random() * 0.055),
            rotation: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 1.6,
            driftX: (Math.random() - 0.5) * 26,
            driftY: (Math.random() - 0.5) * 26,
            life: 0,
            span: SHARD_LIFE[0] + Math.random() * (SHARD_LIFE[1] - SHARD_LIFE[0]),
            filled: Math.random() > 0.4,
          })
        }
      }

      previousX = px
      previousY = py

      // --- what gets spawned ----------------------------------------------
      // Ripples only once the cursor has settled: that is what makes them
      // the resting state rather than cursor decoration.
      if (stillFor > STILL_AFTER && time - lastRipple > RIPPLE_EVERY) {
        lastRipple = time
        ripples.push({
          x: px,
          y: py,
          life: 0,
          seed: Math.random() * Math.PI * 2,
          reach: Math.min(width, height) * (0.26 + Math.random() * 0.22),
        })
        if (ripples.length > 6) ripples.shift()
      }

      if (time - lastCluster > CLUSTER_EVERY) {
        lastCluster = time
        clusters.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.min(width, height) * (0.08 + Math.random() * 0.14),
          rotation: Math.random() * Math.PI * 2,
          count: 2 + Math.floor(Math.random() * 2),
          life: 0,
        })
        if (clusters.length > 8) clusters.shift()
      }

      // --- ripples and clusters --------------------------------------------
      eventsContext.clearRect(0, 0, width, height)
      eventsContext.lineJoin = 'round'

      for (let i = shards.length - 1; i >= 0; i--) {
        const shard = shards[i]
        shard.life += dt / shard.span
        if (shard.life >= 1) {
          shards.splice(i, 1)
          continue
        }
        // Holds, then goes: full strength for the first third, then eased
        // away, so individual shards wink out at their own moments.
        const remaining = 1 - shard.life
        const fade = remaining < 0.66 ? Math.pow(remaining / 0.66, 1.5) : 1

        const x = shard.x + shard.driftX * shard.life
        const y = shard.y + shard.driftY * shard.life
        const rotation = shard.rotation + shard.spin * shard.life

        trianglePath(eventsContext, x, y, shard.size, rotation)
        if (shard.filled) {
          eventsContext.fillStyle = `rgba(0,0,0,${(fade * 0.8).toFixed(3)})`
          eventsContext.fill()
        } else {
          eventsContext.lineWidth = 1.3
          eventsContext.strokeStyle = `rgba(0,0,0,${(fade * 0.95).toFixed(3)})`
          eventsContext.stroke()
        }
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i]
        ripple.life += dt / RIPPLE_LIFE
        if (ripple.life >= 1) {
          ripples.splice(i, 1)
          continue
        }
        const eased = 1 - Math.pow(1 - ripple.life, 2.6)
        const fade = Math.sin(ripple.life * Math.PI) * RIPPLE_ALPHA
        for (let r = 0; r < 2; r++) {
          const radius = ripple.reach * eased * (1 - r * 0.3)
          if (radius < 2) continue
          eventsContext.lineWidth = 2.4 - r * 0.8
          eventsContext.strokeStyle = `rgba(0,0,0,${(fade * (1 - r * 0.35)).toFixed(3)})`
          ringPath(eventsContext, ripple.x, ripple.y, radius, ripple.seed)
          eventsContext.stroke()
        }
      }

      for (let i = clusters.length - 1; i >= 0; i--) {
        const cluster = clusters[i]
        cluster.life += dt / CLUSTER_LIFE
        if (cluster.life >= 1) {
          clusters.splice(i, 1)
          continue
        }
        const fade = Math.sin(cluster.life * Math.PI)
        for (let t = 0; t < cluster.count; t++) {
          const size = cluster.size * (1 - t * 0.28)
          const rotation = cluster.rotation + t * 0.5 + cluster.life * 0.25
          // Softly filled so the board rises inside the triangle, with a
          // firmer edge so the geometry itself stays legible.
          trianglePath(eventsContext, cluster.x, cluster.y, size, rotation)
          eventsContext.fillStyle = `rgba(0,0,0,${(fade * 0.3).toFixed(3)})`
          eventsContext.fill()
          eventsContext.lineWidth = 1.6
          eventsContext.strokeStyle = `rgba(0,0,0,${(fade * 0.75).toFixed(3)})`
          eventsContext.stroke()
        }
      }

      // --- one mask: floor, trail, events ----------------------------------
      maskContext.clearRect(0, 0, width, height)
      // The board comes up as the power-up lands behind him.
      maskContext.fillStyle = `rgba(0,0,0,${BASE_REVEAL + power.amount * 0.22})`
      maskContext.fillRect(0, 0, width, height)
      maskContext.drawImage(events, 0, 0, width, height)

      context.clearRect(0, 0, width, height)
      context.drawImage(layer, 0, 0, width, height)
      context.globalCompositeOperation = 'destination-in'
      context.drawImage(mask, 0, 0, width, height)
      context.globalCompositeOperation = 'source-over'
    }
    frame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  return <canvas className="backdrop" ref={canvasRef} aria-hidden="true" />
}
