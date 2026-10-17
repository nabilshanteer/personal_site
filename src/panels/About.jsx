import { useCallback, useEffect, useRef, useState } from 'react'
import { HOBBIES } from '../lib/about'
import Ask from '../components/Ask'

/* The about sequence.

   Asking who someone is should not be a page change. It is a room
   change: the house lights go down over the panel you were looking at,
   the music comes up, geometry flickers through the dark while it
   drains, a waveform draws itself across the middle in the same orange
   everything else uses, and when the track reaches its climax the page
   crystallises out of it.

   Three things are worth knowing about how it is built.

   The clock is the audio, not the wall. Every phase is driven by
   `audio.currentTime`, so a slow decode or a stalled buffer moves the
   whole sequence with it rather than letting the lights and the music
   drift apart. Frames land the climax to within one of them, and
   `timeupdate` is the backstop for a tab that is not being drawn.

   Nothing here re-renders per frame. The dimming is written to a custom
   property on the document element and the canvas is drawn straight to.

   And it can always be left or quietened: escape closes it, space and
   enter toggle the sound, both ways. */

/* Two files, not one. The first is the piece the sequence is timed to;
   the moment it finishes the loop takes over and runs under the page for
   as long as anyone stays. */
/* The playlist. Each entry is an opening piece and the loop that takes
   over when it finishes. Adding another is one object here — nothing else
   needs to change. The sequence is timed to the first track. */
const TRACKS = [
  {
    title: 'Asylum',
    artist: 'Santé',
    // The only one the opening sequence is timed to: an intro piece that
    // hands over to a part that loops under the page afterwards.
    intro: '/media/about/song1.mp3',
    loop: '/media/about/song_loop.mp3',
    spotify: 'https://open.spotify.com/track/2eKTFR9Z9kctLnOCl7RveF',
  },
  {
    title: 'In Love With a Chore',
    artist: 'Santé',
    intro: '/media/about/in-love-with-a-chore.mp3',
    spotify: 'https://open.spotify.com/track/6qnjSeCExy69m5vnv0DNjI',
  },
  {
    title: 'Problem',
    artist: 'Santé',
    intro: '/media/about/problem.mp3',
    spotify: 'https://open.spotify.com/track/6X4Z85yvARBWROZtvRxNIV',
  },
  {
    title: 'How It Turned Out',
    artist: 'Santé',
    intro: '/media/about/how-it-turned-out.mp3',
    spotify: 'https://open.spotify.com/track/65LJGtascyvpRkHuKBvEGk',
  },
  {
    title: 'Want',
    artist: 'Santé',
    intro: '/media/about/want.mp3',
    spotify: 'https://open.spotify.com/track/6DyA98C9mo4pot8J2loSDd',
  },
]

const CLIMAX = 5 // seconds — where the page crystallises
/* Both of these have to finish before CLIMAX, or the page arrives over a
   room still dimming and a sun still climbing. They are set a little
   short of it so each one lands and settles rather than being cut off. */
const BLACKOUT = 3.4 // seconds — the lights are all the way down by here
const FLOOR = 0.06 // how much of the room is left at the bottom
const BASS = '/media/about/song1.bass.json'
const FADE = 1.6 // seconds a track takes to hand over to the next one
const SUNSET_IN = 3.2 // seconds for the sun to climb to the middle of the frame
const PICS = '/img/about/pics.json'
const DRIFT_AT = 0.4 // the photographs arrive with the light, not later

/* Two semicircles at one edge of the section, the smaller inside the
   larger, with the pictures riding their arcs in opposite directions.
   Each picture counter-rotates against its own spoke so it stays the
   right way up all the way round, and fades at both ends of the sweep so
   the loop has no visible seam. */
function Orbit({ pictures, side }) {
  if (!pictures.length) return null
  const inner = pictures.filter((_, i) => i % 2 === 0)
  const outer = pictures.filter((_, i) => i % 2 === 1)
  const rings = [
    { name: 'inner', list: inner, seconds: 26 },
    { name: 'outer', list: outer.length ? outer : inner, seconds: 34 },
  ]

  return (
    <div className="orbit" data-side={side} aria-hidden="true">
      {rings.map((ring) => (
        <div className={'orbit__ring orbit__ring--' + ring.name} key={ring.name}>
          {ring.list.map((src, i) => (
            <span
              className="orbit__spoke"
              key={src + i}
              style={{
                '--dur': ring.seconds + 's',
                // Spread evenly round the arc by starting each one
                // further through the same animation.
                '--delay': (-(i / ring.list.length) * ring.seconds).toFixed(2) + 's',
              }}
            >
              <span className="orbit__arm">
                <img src={src} alt="" loading="lazy" draggable="false" />
              </span>
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}
const SUNSET_REACT = 0.045 // how much the bass moves it. Barely.
const RIPPLE_EVERY = 900 // ms between ripples, before the random spread
const RIPPLE_LIFE = 3.4 // seconds for one to open and fade, as on panel one
const RIPPLE_ALPHA = 0.26 // faint, the way they are on panel one

export default function About() {
  const [phase, setPhase] = useState('off') // off | falling | crystallised
  const [muted, setMuted] = useState(false)
  /* A phone has no keyboard, so the keyboard wording is not just noise —
     it describes controls that are not there. */
  /* Land the arrival now: move the music to the point the page settles
     at, bring the lights with it, and crystallise. */
  const skipArrival = useCallback(() => {
    const player = audio.current
    if (player && Number.isFinite(player.duration)) {
      player.currentTime = Math.max(player.currentTime, CLIMAX)
    }
    lights(CLIMAX)
    crystallise()
  }, [])

  const [coarse] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)')?.matches
  )
  const [drifting, setDrifting] = useState(false)
  const [track, setTrack] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [lanes, setLanes] = useState([])
  const audio = useRef(null)
  const loop = useRef(null)
  const canvas = useRef(null)
  const engine = useRef(null)
  const frame = useRef(null)
  const follower = useRef(null)
  // Bass energy, and what is left of the last hit.
  const thump = useRef({ previous: 0, energy: 0, settled: true })
  /* The track analysed ahead of time: a low-band envelope per frame, plus
     the stretches where the bass actually moves. Reading the level from
     this rather than from the live analyser means the background is in
     sync with the music even while the file is still buffering, and that
     it knows a glide is coming instead of discovering it late. */
  const bassmap = useRef(null)
  const ripples = useRef([])
  const lastRipple = useRef(0)
  const lastFrame = useRef(0)
  const sky = useRef({ canvas: null, w: 0, h: 0, top: null })
  const clock = useRef(null)
  const shown = useRef(-1)
  const meter = useRef(null)
  const beam = useRef(null)
  /* The gain between the analyser and the speakers. A tapped element's
     `muted` does not gate the graph, so this is what actually silences
     the music. */
  const gate = useRef(null)
  const [landed, setLanded] = useState(false)
  // Which bubble is being read, if one has been clicked open.
  const [pinned, setPinned] = useState(null)
  /* A bubble closed by a click has to stay closed while the cursor is
     still sitting on it; without this :hover reopens it the moment the
     click lands, so on a desktop it never appears to close at all. It
     clears when the pointer leaves, so hovering still peeks. */
  const [shut, setShut] = useState(null)
  // The draw loop runs outside React, so it reads the ref, not the state.
  const landedRef = useRef(false)
  // Listeners live for the life of the panel, so they read the current
  // track from a ref rather than closing over a stale index.
  const trackRef = useRef(0)
  const arriving = useRef(false)
  // When the back key was last pressed, for telling one press from two.
  const lastBack = useRef(0)
  /* Whether the sequence is still wanted. Leaving during the transition
     has to cancel what the transition was going to do next — otherwise a
     timer fired after the escape and crystallised the page onto a screen
     the person had already walked away from. */
  const live = useRef(false)
  const pending = useRef(null)

  const toggleMute = useCallback(() => {
    const player = audio.current
    if (!player) return
    const next = !player.muted
    player.muted = next
    if (loop.current) loop.current.muted = next

    /* Both elements are tapped by createMediaElementSource, and a tapped
       element's `muted` no longer gates what comes out of the graph —
       the source node sits ahead of it. So muting did nothing audible,
       and the sound only stopped later when a handover or a ramp moved
       the volume, which is what read as a six second delay. The gain
       before the destination is what actually silences it. Twenty
       milliseconds rather than a hard zero, which would click. */
    const out = gate.current
    if (out) {
      const now = out.context.currentTime
      out.gain.cancelScheduledValues(now)
      out.gain.setValueAtTime(out.gain.value, now)
      out.gain.linearRampToValueAtTime(next ? 0 : 1, now + 0.02)
    }

    setMuted(next)
  }, [])

  /* Put the room back the way it was. */
  const restore = useCallback(() => {
    live.current = false
    if (pending.current) {
      window.clearTimeout(pending.current)
      pending.current = null
    }
    const player = audio.current
    // Detach the follower FIRST: it writes the lights on every timeupdate
    // and would push the room straight back down behind us.
    if (player && follower.current) {
      player.removeEventListener('timeupdate', follower.current)
      follower.current = null
    }
    document.documentElement.style.setProperty('--house', '1')
    document.documentElement.style.setProperty('--shake-x', '0px')
    document.documentElement.style.setProperty('--shake-y', '0px')
    document.documentElement.removeAttribute('data-overlay')
    document.documentElement.removeAttribute('data-panel')
    if (frame.current) cancelAnimationFrame(frame.current)
    frame.current = null
    ripples.current = []
    lastRipple.current = 0
    lastFrame.current = 0
    landedRef.current = false
    setLanded(false)
    if (beam.current) {
      beam.current.removeAttribute('data-flying')
      beam.current.style.cssText = ''
    }
    thump.current = { previous: 0, energy: 0, settled: true }

    const after = loop.current
    if (after) {
      after.pause()
      after.currentTime = 0
    }

    if (player) {
      // Fade out rather than cut: a hard stop on a loud track is a shock.
      // On a timer, not on frames — a tab that is not being drawn still has
      // to be able to stop its own music.
      const from = player.volume
      const started = Date.now()
      const step = window.setInterval(() => {
        const t = (Date.now() - started) / 420
        if (t >= 1 || player.paused) {
          window.clearInterval(step)
          player.pause()
          player.currentTime = 0
          player.volume = from
          player.muted = false
          return
        }
        player.volume = Math.max(0, from * (1 - t))
      }, 25)
    }
    setPinned(null)
    setMuted(false)
    setDrifting(false)
    setPlaying(false)
    // The opening is timed to the first track, so that is what it opens
    // on however the last visit ended.
    arriving.current = false
    trackRef.current = 0
    setTrack(0)
    setPhase('off')
  }, [])

  /* Build the analyser once, on the gesture that starts the music —
     browsers will not let an audio context run before one. */
  const listen = useCallback(() => {
    if (engine.current) return engine.current
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null

    let context
    try {
      context = new Ctx()
    } catch {
      return null
    }

    const analyser = context.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.72
    // Reach the speakers FIRST. Routing an element into an analyser that
    // is not yet connected to anywhere is how you get a track that is
    // playing, with a running clock, and no sound at all — and if the
    // second source then throws, the first is left in that state forever.
    const volume = context.createGain()
    volume.gain.value = 1
    analyser.connect(volume)
    volume.connect(context.destination)
    gate.current = volume

    let tapped = 0
    for (const element of [audio.current, loop.current]) {
      if (!element) continue
      try {
        context.createMediaElementSource(element).connect(analyser)
        tapped += 1
      } catch {
        // Already tapped, or refused. Leave this element on native
        // playback rather than half-routing it into the graph.
      }
    }

    if (!tapped) {
      // Nothing is going through the graph, so the graph is just overhead.
      // The music still plays natively; the waveform sits this one out.
      context.close().catch(() => {})
      return null
    }

    engine.current = {
      context,
      analyser,
      wave: new Uint8Array(analyser.frequencyBinCount),
      bins: new Uint8Array(analyser.frequencyBinCount),
    }
    if (import.meta.env.DEV) window.__about = engine.current
    return engine.current
  }, [])

  /* The lights. */
  function lights(t) {
    // The room is already down once the page has arrived; nothing after
    // that should raise it again.
    if (document.documentElement.getAttribute('data-overlay') === 'here') return
    const fall = Math.min(1, t / BLACKOUT)
    const eased = fall * fall * (3 - 2 * fall)
    document.documentElement.style.setProperty(
      '--house',
      (1 - (1 - FLOOR) * eased).toFixed(3)
    )
  }

  /* Two different numbers, for two different jobs.

     `reactionAt` is the analysed signal: near zero for most of the track
     and rising only where the bass sweeps or lands. The equaliser and the
     screen shake run off this, which is what makes the background move to
     the bass and to nothing else.

     `liveBass` is the analyser in the moment, and only the waveform uses
     it — a waveform that went flat between bass events would look broken
     rather than restrained. */
  function reactionAt(t) {
    const map = bassmap.current
    if (!map || !map.reaction || !map.reaction.length) return 0
    const i = Math.round(t * map.fps)
    if (i < 0 || i >= map.reaction.length) return 0
    return map.reaction[i]
  }

  function liveBass(rig) {
    if (!rig) return 0
    let sum = 0
    for (let i = 0; i < 24; i += 1) sum += rig.bins[i]
    return sum / (24 * 255)
  }

  /* The sunset.

     Opaque from the first frame — the sky is a solid thing, not a veil
     laid over the panel behind it. What changes is not how much of it
     there is but how high the sun has climbed: the frame starts as the
     dark it was already, and the warmth rises out of the bottom edge
     until it reaches the middle of the screen eight seconds later.

     It answers the bass, but only just. The waveform throws; this
     breathes. A background that moved as much as the foreground would
     stop being a background. */
  function drawSunset(ctx, w, h, t, react) {
    const climb = Math.min(1, Math.max(0, t) / SUNSET_IN)
    const eased = climb * climb * (3 - 2 * climb)
    const lift = react * SUNSET_REACT
    const top = Math.round(h * (1.04 - (0.54 + lift * 0.4) * eased))

    /* The sky is redrawn only when it has actually changed. It is a
       full-screen gradient fill and a full-screen radial on top, which is
       the most expensive thing on this canvas; during the four-second
       rise that is maybe sixty redraws, and after it almost none. The
       rest of the time it is one blit of an image the right size. */
    const cache = sky.current
    if (!cache.canvas || cache.w !== w || cache.h !== h) {
      cache.canvas = document.createElement('canvas')
      cache.canvas.width = w
      cache.canvas.height = h
      cache.w = w
      cache.h = h
      cache.top = null
    }

    if (cache.top !== top) {
      cache.top = top
      const c = cache.canvas.getContext('2d')
      c.clearRect(0, 0, w, h)

      // The night the panel was already sitting in. Always opaque.
      c.fillStyle = '#06070d'
      c.fillRect(0, 0, w, h)

      const band = h - top
      if (band > 1) {
        // Deeper and less lit than before: this sits behind text all the
        // way down the page, and a bright sky makes that unreadable.
        const grad = c.createLinearGradient(0, top, 0, h)
        grad.addColorStop(0, 'rgba(18, 14, 30, 0)')
        grad.addColorStop(0.22, 'rgba(50, 22, 44, 0.86)')
        grad.addColorStop(0.5, 'rgba(104, 38, 42, 0.95)')
        grad.addColorStop(0.76, 'rgba(150, 70, 36, 0.98)')
        grad.addColorStop(1, 'rgba(176, 108, 48, 1)')
        c.fillStyle = grad
        c.fillRect(0, top, w, band)

        const glow = c.createRadialGradient(
          w / 2, top + band * 0.55, 0,
          w / 2, top + band * 0.55, Math.max(w, h) * 0.3
        )
        glow.addColorStop(0, 'rgba(196, 126, 74, 0.1)')
        glow.addColorStop(1, 'rgba(196, 126, 74, 0)')
        c.fillStyle = glow
        c.fillRect(0, 0, w, h)
      }
    }

    ctx.drawImage(cache.canvas, 0, 0)
  }

  /* The ripples from the first panel, brought through.

     Same wobbling rings, same faintness, spreading from points at random
     rather than from where a cursor came to rest. They keep arriving for
     as long as the panel is open, so the page is read on a surface that
     is still quietly moving rather than on a still one. */
  function ring(ctx, x, y, radius, seed) {
    const STEPS = 40
    ctx.beginPath()
    for (let i = 0; i <= STEPS; i += 1) {
      const a = (i / STEPS) * Math.PI * 2
      const wobble =
        1 +
        0.09 * Math.sin(a * 3 + seed) +
        0.05 * Math.sin(a * 7 - seed * 1.7) +
        0.03 * Math.sin(a * 13 + seed * 0.6)
      const r = radius * wobble
      const px = x + Math.cos(a) * r
      const py = y + Math.sin(a) * r
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
  }

  function stirRipples(now, spreading, w, h) {
    if (spreading && now - lastRipple.current > RIPPLE_EVERY * (0.6 + Math.random() * 0.9)) {
      lastRipple.current = now
      ripples.current.push({
        x: Math.random() * w,
        y: Math.random() * h,
        life: 0,
        seed: Math.random() * Math.PI * 2,
        reach: Math.min(w, h) * (0.26 + Math.random() * 0.22),
      })
      if (ripples.current.length > 8) ripples.current.shift()
    }
  }

  function drawRipples(ctx, dt, dpr) {
    for (let i = ripples.current.length - 1; i >= 0; i -= 1) {
      const r = ripples.current[i]
      r.life += dt / RIPPLE_LIFE
      if (r.life >= 1) {
        ripples.current.splice(i, 1)
        continue
      }
      const eased = 1 - Math.pow(1 - r.life, 2.6)
      const fade = Math.sin(r.life * Math.PI) * RIPPLE_ALPHA
      for (let k = 0; k < 2; k += 1) {
        const radius = r.reach * eased * (1 - k * 0.3)
        if (radius < 2) continue
        ctx.lineWidth = (2.4 - k * 0.8) * dpr
        ctx.strokeStyle = 'rgba(255, 229, 198, ' + (fade * (1 - k * 0.35)).toFixed(3) + ')'
        ring(ctx, r.x, r.y, radius, r.seed)
        ctx.stroke()
      }
    }
  }

  function paint(t, rig, settled) {
    const node = canvas.current
    if (!node) return
    const box = node.getBoundingClientRect()
    /* Deliberately 1, as the first panel's backdrop also does. At device
       pixel ratio 2 this canvas is four times the area for a gradient and
       some soft rings that gain nothing from the extra resolution. */
    const dpr = 1
    if (node.width !== Math.round(box.width * dpr)) {
      node.width = Math.round(box.width * dpr)
      node.height = Math.round(box.height * dpr)
    }
    const ctx = node.getContext('2d')
    const w = node.width
    const h = node.height
    /* A collapsed pane gives a zero-sized canvas, and both the cache and
       drawImage throw on one. Nothing is visible at that size anyway. */
    if (w < 2 || h < 2) return
    ctx.clearRect(0, 0, w, h)

    const now = performance.now()
    if (rig) {
      rig.analyser.getByteTimeDomainData(rig.wave)
      rig.analyser.getByteFrequencyData(rig.bins)
    }

    // What the bass is doing right now, as analysed ahead of time.
    const react = reactionAt(t)
    // And what it sounds like right now, for the wave alone.
    const bass = liveBass(rig)

    /* Once the page is here the sky is simply up. Driving it from the
       audio clock after that meant replaying or skipping a track wound
       the whole arrival back — sun sinking, lights rising — when all the
       person did was press a button on the player. */
    const skyTime = settled ? SUNSET_IN : t

    /* The countdown. Written to the node rather than to state: this runs
       sixty times a second and React has no business hearing about it. */
    if (!settled && clock.current) {
      const left = Math.max(0, CLIMAX - t)
      clock.current.style.setProperty('--run', (1 - left / CLIMAX).toFixed(4))
      const whole = Math.ceil(left)
      if (whole !== shown.current) {
        shown.current = whole
        const face = clock.current.querySelector('.countdown__num')
        if (face) face.textContent = String(whole)
      }
    }

    // Seconds since the last frame, for anything that spreads over time.
    const dt = lastFrame.current ? Math.min(0.1, (now - lastFrame.current) / 1000) : 0
    lastFrame.current = now

    // The sky first: it is the background everything else sits on.
    drawSunset(ctx, w, h, skyTime, react)

    // Then the ripples, which keep arriving while the panel is open.
    stirRipples(now, true, w, h)
    drawRipples(ctx, dt, dpr)

    /* A hit is a rise in low-end energy, not merely loud low end — a
       sustained bass note should not shake the room for its whole
       length. Each hit adds to a pot that drains every frame, so the
       screen kicks and settles rather than vibrating continuously. */
    /* The knock on a bass hit.

       Kept deliberately small and rare. The earlier version fired on
       almost every rise and threw the screen eleven pixels, which meant
       the compositor was re-rastering full-screen layers most frames —
       that is where the lag was coming from. It now needs a real jump to
       trigger, moves a third as far, and writes nothing at all once it
       has decayed, so most frames touch no styles whatsoever. */
    const rise = react - thump.current.previous
    thump.current.previous = react
    if (rise > 0.13 && react > 0.55) {
      thump.current.energy = Math.min(1, thump.current.energy + rise * 1.6)
    }
    thump.current.energy *= 0.8
    const kick = thump.current.energy
    const root = document.documentElement.style
    if (kick > 0.01) {
      const amp = kick * 3.8
      root.setProperty('--shake-x', ((Math.random() * 2 - 1) * amp).toFixed(2) + 'px')
      root.setProperty('--shake-y', ((Math.random() * 2 - 1) * amp * 0.6).toFixed(2) + 'px')
      thump.current.settled = false
    } else if (!thump.current.settled) {
      // Write the resting value once, then leave the style alone.
      root.setProperty('--shake-x', '0px')
      root.setProperty('--shake-y', '0px')
      thump.current.settled = true
    }

    /* Once the page is here the waveform leaves the sky and goes to live
       in the player, at a couple of hundred pixels instead of a million.
       Drawing it full-screen for the whole visit was never worth it. */
    if (!rig) return
    if (settled) {
      // Once it has landed in the player it is drawn there, crisply, at
      // the size it is actually shown. Until then it is still flying.
      if (landedRef.current) drawMeter(rig)
      else drawBeam(rig)
      return
    }

    drawBeam(rig)
  }

  /* The big waveform, on its own layer so it can be moved as one thing. */
  function drawBeam(rig) {
    const node = beam.current
    if (!node) return
    const box = node.getBoundingClientRect()
    if (node.width !== Math.round(box.width) && box.width > 1) {
      node.width = Math.round(box.width)
      node.height = Math.round(box.height)
    }
    const w = node.width
    const h = node.height
    if (w < 2 || h < 2) return
    const ctx = node.getContext('2d')
    ctx.clearRect(0, 0, w, h)

    let bass = 0
    for (let i = 0; i < 24; i += 1) bass += rig.bins[i]
    bass /= 24 * 255

    const mid = h / 2
    const reach = h * 0.34 * (0.35 + bass * 1.1)
    const len = rig.wave.length
    const dpr = 1
    // The sample index is mapped across the full width. Stepping one pixel
    // per sample drew the whole wave into the left of the canvas whenever
    // there were fewer samples than pixels, which is most screens.
    const points = Math.max(2, Math.min(len, Math.floor(w / dpr)))

    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#ff8f3a'
    ctx.shadowColor = 'rgba(255, 143, 58, 0.95)'
    ctx.shadowBlur = dpr * (10 + bass * 26)

    // Drawn twice: once wide and faint, once thin and bright over it,
    // which is what gives a neon tube its halo.
    for (const pass of [0, 1]) {
      ctx.lineWidth = pass === 0 ? dpr * 7 : dpr * 2
      ctx.globalAlpha = pass === 0 ? 0.16 : 1
      ctx.beginPath()
      for (let i = 0; i < points; i += 1) {
        const f = i / (points - 1)
        const v = (rig.wave[Math.round(f * (len - 1))] - 128) / 128
        const x = f * w
        const y = mid + v * reach
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  /* Transport. `playing` tracks whichever of the two elements is live. */
  function nowPlaying() {
    const after = loop.current
    if (after && !after.paused) return after
    return audio.current
  }

  const togglePlay = useCallback(() => {
    const player = nowPlaying()
    if (!player) return
    if (player.paused) {
      player.play().then(() => setPlaying(true)).catch(() => {})
    } else {
      player.pause()
      setPlaying(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Back.

     Once is "start this again", which is what the key means on every
     other player. Twice in quick succession is "I meant the one before" —
     the same convention, and it keeps a single key doing both without a
     second button for a thing nobody presses often. */
  const BACK_AGAIN = 700 // ms

  /* Stop both elements dead. Every track change goes through this: the
     loop half of Asylum was still running when the track was switched out
     from under it, so the old loop and the new song played together. */
  function silence() {
    for (const player of [audio.current, loop.current]) {
      if (!player) continue
      player.pause()
      player.currentTime = 0
    }
  }

  const back = useCallback(() => {
    const now = Date.now()
    const twice = now - lastBack.current < BACK_AGAIN
    lastBack.current = now

    if (twice) {
      silence()
      arriving.current = true
      setTrack((i) => (i - 1 + TRACKS.length) % TRACKS.length)
      return
    }

    const after = loop.current
    const player = audio.current
    if (after && !after.paused) {
      after.currentTime = 0
      return
    }
    if (!player) return
    player.currentTime = 0
    player.play().then(() => setPlaying(true)).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* On to the next piece, wrapping round. With one track in the list that
     is the same as starting it again, which is the honest behaviour until
     there are more. */
  const nextTrack = useCallback(() => {
    silence()
    arriving.current = true
    setTrack((i) => (i + 1) % TRACKS.length)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* The waveform, small, in the player. */
  function drawMeter(rig) {
    const node = meter.current
    if (!node) return
    const w = node.width
    const h = node.height
    const ctx = node.getContext('2d')
    ctx.clearRect(0, 0, w, h)

    const len = rig.wave.length
    const points = Math.min(len, w)
    ctx.lineWidth = 1.4
    ctx.lineJoin = 'round'
    ctx.strokeStyle = 'rgba(255, 170, 94, 0.95)'
    ctx.beginPath()
    for (let i = 0; i < points; i += 1) {
      const f = i / (points - 1)
      const v = (rig.wave[Math.round(f * (len - 1))] - 128) / 128
      const y = h / 2 + v * h * 0.42
      if (i === 0) ctx.moveTo(0, y)
      else ctx.lineTo(f * w, y)
    }
    ctx.stroke()
  }

  const crystallise = useCallback(() => {
    // Nothing arrives after the person has left.
    if (!live.current) return
    if (document.documentElement.getAttribute('data-overlay') === 'here') return
    document.documentElement.setAttribute('data-overlay', 'here')
    setPhase('crystallised')

    /* The waveform flies into the player rather than cutting to it. The
       target is measured from the slot it is going to live in, so the
       landing is exact at any window size. Once it is down the big layer
       stops drawing and the small canvas in the player takes over —
       squashing a full-screen canvas into a strip leaves the line thin
       and uneven, so this is a hand-off, not a permanent scale. */
    window.setTimeout(() => {
      const flier = beam.current
      const slot = meter.current
      if (!flier || !slot) {
        landedRef.current = true
        setLanded(true)
        return
      }
      const from = flier.getBoundingClientRect()
      const to = slot.getBoundingClientRect()
      if (from.width > 1 && to.width > 1) {
        flier.style.setProperty('--fly-sx', (to.width / from.width).toFixed(4))
        flier.style.setProperty('--fly-sy', (to.height / from.height).toFixed(4))
        flier.style.setProperty(
          '--fly-x',
          (to.left + to.width / 2 - (from.left + from.width / 2)).toFixed(1) + 'px'
        )
        flier.style.setProperty(
          '--fly-y',
          (to.top + to.height / 2 - (from.top + from.height / 2)).toFixed(1) + 'px'
        )
      }
      flier.setAttribute('data-flying', 'true')
      window.setTimeout(() => {
        landedRef.current = true
        setLanded(true)
      }, 900)
    }, 420)
    const player = audio.current
    const rig = engine.current
    const on = () => {
      paint(player ? player.currentTime : CLIMAX, rig, true)
      frame.current = requestAnimationFrame(on)
    }
    frame.current = requestAnimationFrame(on)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const begin = useCallback(async () => {
    if (phase !== 'off') return
    const player = audio.current
    if (!player) return

    live.current = true
    document.documentElement.setAttribute('data-overlay', 'falling')
    document.documentElement.setAttribute('data-panel', 'about')
    setPhase('falling')
    ripples.current = []
    lastRipple.current = 0
    lastFrame.current = 0

    const rig = listen()
    if (rig && rig.context.state === 'suspended') await rig.context.resume()

    try {
      player.currentTime = 0
      player.volume = 1
      player.muted = false
      setMuted(false)
      await player.play()
      setPlaying(true)
    } catch {
      // Blocked despite the gesture: run the sequence on the wall clock so
      // the page still arrives, just without the music.
      const started = performance.now()
      const silent = () => {
        if (!live.current) return
        const t = (performance.now() - started) / 1000
        lights(t)
        paint(t, null)
        if (t < CLIMAX) frame.current = requestAnimationFrame(silent)
        else crystallise()
      }
      frame.current = requestAnimationFrame(silent)
      pending.current = window.setTimeout(() => crystallise(), CLIMAX * 1000)
      return
    }

    const tick = () => {
      if (!live.current) return
      const t = player.currentTime
      paint(t, rig)
      if (t >= DRIFT_AT) setDrifting(true)
      if (t >= CLIMAX) {
        crystallise()
        return
      }
      frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)

    const follow = () => {
      if (!live.current) return
      if (player.currentTime >= DRIFT_AT) setDrifting(true)
      lights(player.currentTime)
      if (player.currentTime >= CLIMAX) {
        player.removeEventListener('timeupdate', follow)
        follower.current = null
        crystallise()
      }
    }
    follower.current = follow
    player.addEventListener('timeupdate', follow)
    lights(0)


    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, listen, crystallise])

  /* The photographs, kept in their groups so each hobby can take its own.
     A shuffled pool of everything is kept too, for any hobby that has no
     folder of its own yet. */
  useEffect(() => {
    let dead = false
    fetch(PICS)
      .then((r) => (r.ok ? r.json() : null))
      .then((groups) => {
        if (dead || !groups) return
        const pool = []
        for (const [group, names] of Object.entries(groups)) {
          for (const name of names) pool.push(`/img/about/${group}/${name}`)
        }
        for (let i = pool.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[pool[i], pool[j]] = [pool[j], pool[i]]
        }
        setLanes(
          HOBBIES.map((hobby) => {
            const own = hobby.groups.flatMap((g) =>
              (groups[g] ?? []).map((name) => `/img/about/${g}/${name}`)
            )
            return own.length ? own : pool.slice(0, 6)
          })
        )
      })
      .catch(() => {})
    return () => {
      dead = true
    }
  }, [])

  useEffect(() => {
    let dead = false
    fetch(BASS)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!dead) bassmap.current = data
      })
      .catch(() => {})
    return () => {
      dead = true
    }
  }, [])

  /* A way to step the canvas by hand. Frames stop in a backgrounded tab,
     which makes the sequence impossible to inspect while it is not in
     front of you; this drives one frame at whatever time you name. Dev
     only, and it never reaches a build. */
  useEffect(() => {
    if (!import.meta.env.DEV) return
    window.__aboutFrame = (t, settled) => paint(t, engine.current, settled)
    window.__aboutRipples = ripples
    return () => {
      delete window.__aboutFrame
      delete window.__aboutRipples
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Mark whichever sections are on screen, so the rest can stop turning.
     Rebuilt whenever the sections appear, which is once. */
  useEffect(() => {
    if (phase !== 'crystallised') return
    const sections = document.querySelectorAll('.hobby')
    if (!sections.length) return
    const watcher = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.setAttribute('data-live', entry.isIntersecting ? 'true' : 'false')
        }
      },
      { root: document.querySelector('.about__sheet'), rootMargin: '18%' }
    )
    sections.forEach((section) => watcher.observe(section))
    return () => watcher.disconnect()
  }, [phase, lanes])

  /* Ramp a player's volume over FADE seconds. On a timer rather than
     frames, so it still finishes in a tab that is not being drawn. */
  function ramp(player, to, done) {
    if (!player) return
    const from = player.volume
    const started = Date.now()
    const step = window.setInterval(() => {
      const t = Math.min(1, (Date.now() - started) / (FADE * 1000))
      player.volume = Math.max(0, Math.min(1, from + (to - from) * t))
      if (t >= 1) {
        window.clearInterval(step)
        if (done) done()
      }
    }, 40)
  }

  /* What happens at the end of a track.

     Asylum hands over to its own loop, which is what the opening sequence
     is built around. Everything else moves on to the next piece, and both
     ends of that are faded so it dissolves rather than cutting. */
  useEffect(() => {
    const player = audio.current
    if (!player) return

    const chain = () => {
      const after = loop.current
      if (!after || !after.getAttribute('src') || !live.current) return
      // Only the track that owns this loop may start it.
      if (!TRACKS[trackRef.current].loop) return
      after.muted = player.muted
      after.volume = player.volume
      after.currentTime = 0
      after.play().catch(() => {})
    }

    // Start pulling the level down as the end comes into view.
    const watch = () => {
      if (!live.current || arriving.current) return
      if (TRACKS[trackRef.current].loop) return
      const left = player.duration - player.currentTime
      if (Number.isFinite(left) && left <= FADE) {
        player.volume = Math.max(0, left / FADE)
      }
    }

    const ended = () => {
      if (!live.current) return
      if (TRACKS[trackRef.current].loop) {
        chain()
        return
      }
      // On to the next, which comes up from silence.
      silence()
      arriving.current = true
      setTrack((i) => (i + 1) % TRACKS.length)
    }

    player.addEventListener('timeupdate', watch)
    player.addEventListener('ended', ended)
    return () => {
      player.removeEventListener('timeupdate', watch)
      player.removeEventListener('ended', ended)
    }
  }, [])

  /* When the source has actually changed under us, bring it in. */
  useEffect(() => {
    trackRef.current = track
    if (!arriving.current) return
    arriving.current = false
    const player = audio.current
    if (!player) return
    player.currentTime = 0
    player.volume = 0
    player
      .play()
      .then(() => {
        setPlaying(true)
        ramp(player, 1)
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track])

  /* Another panel was chosen from the menu while this one was open. */
  useEffect(() => {
    const leave = (event) => {
      if (event.detail?.next === 'about:open') return
      restore()
    }
    window.addEventListener('panel:exit', leave)
    return () => window.removeEventListener('panel:exit', leave)
  }, [restore])

  useEffect(() => {
    const onOpen = () => begin()
    window.addEventListener('about:open', onOpen)
    return () => window.removeEventListener('about:open', onOpen)
  }, [begin])

  useEffect(() => {
    if (phase === 'off') return
    const onKey = (event) => {
      if (event.key === 'Escape') {
        restore()
        return
      }

      /* Any other key during the transition lands the page immediately.
         Five seconds is tolerable once; on a second visit it is five
         seconds of waiting for something already seen. */
      if (phase === 'falling' && event.key !== 'Tab') {
        event.preventDefault()
        const player = audio.current
        // Move the clock rather than skipping the arrival, so the lights,
        // the sky and the page all land together as they would have.
        if (player && Number.isFinite(player.duration)) {
          player.currentTime = Math.max(player.currentTime, CLIMAX)
        }
        lights(CLIMAX)
        crystallise()
        return
      }

      if (event.key !== ' ' && event.key !== 'Enter') return

      // Typing somewhere is the one case where these keys are not ours.
      const target = event.target
      if (target instanceof Element && target.closest('input, textarea, [contenteditable]')) return

      /* Otherwise they mute, always — including when a player button
         still holds focus from being clicked. Without this, space
         re-pressed whichever button was last used instead of doing the
         thing the note at the bottom of the screen says it does. */
      event.preventDefault()
      if (target instanceof HTMLElement && typeof target.blur === 'function') target.blur()
      toggleMute()
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, restore, toggleMute, crystallise])

  useEffect(
    () => () => {
      if (frame.current) cancelAnimationFrame(frame.current)
      document.documentElement.style.setProperty('--house', '1')
      document.documentElement.removeAttribute('data-overlay')
    document.documentElement.removeAttribute('data-panel')
    },
    []
  )

  return (
    <div className="about" data-phase={phase} aria-hidden={phase === 'off'}>
      {/* Anywhere on the screen skips while it is arriving. This has to
          be a real element: the panel itself is pointer-events:none, so
          a handler on it never sees the tap — it falls through to the
          page behind. */}
      {phase === 'falling' && (
        <button className="skip-sheet" type="button" aria-label="Skip the intro" onClick={skipArrival} />
      )}
      {/* A track with no separate loop file simply repeats itself. */}
      <audio
        ref={audio}
        src={TRACKS[track].intro}
        preload="auto"
        crossOrigin="anonymous"
      />
      {/* `loop` on the element itself, so the hand-off happens once and the
          browser repeats the second piece seamlessly from then on. */}
      <audio ref={loop} src={TRACKS[track].loop} preload="auto" loop crossOrigin="anonymous" />

      <canvas className="about__wave" ref={canvas} aria-hidden="true" />
      {/* The waveform lives on its own layer so it can be moved into the
          player as one piece when the page arrives. */}
      <canvas className="about__beam" ref={beam} data-landed={landed} aria-hidden="true" />

      {/* A clock on the wait, so it reads as a thing with an end rather
          than a loading screen that might go on forever. */}
      {phase === 'falling' && (
        <div className="countdown" ref={clock} aria-hidden="true">
          <svg viewBox="0 0 100 100">
            <circle className="countdown__track" cx="50" cy="50" r="44" />
            <circle className="countdown__run" cx="50" cy="50" r="44" pathLength="1" />
          </svg>
          <span className="countdown__num">{Math.ceil(CLIMAX)}</span>
          <span className="countdown__word">ARRIVING</span>
        </div>
      )}

      {/* The player. It takes the waveform over from the sky once the page
          has arrived, and stays put while the page is read. */}
      {/* The transport is locked until the page has arrived. The opening
          is timed to one particular track, and letting it be swapped
          mid-flight meant the sunset restarted — and that someone could
          keep skipping and never actually get here. Mute and the link out
          stay live throughout. */}
      <div className="player" data-here={phase === 'crystallised'} data-locked={phase !== 'crystallised'}>
          {/* Where to hear the track properly. Sits ahead of everything
            else in the box, since it is about the music rather than a
            control for it. */}
        {/* Only shown for a track that has somewhere to be heard. */}
        {TRACKS[track].spotify && (
          <a
            className="player__out"
            href={TRACKS[track].spotify}
            target="_blank"
            rel="noreferrer"
            title={'Listen to ' + TRACKS[track].title + ' on Spotify'}
            aria-label={'Listen to ' + TRACKS[track].title + ' on Spotify'}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M 7.5 9.4 A 10 10 0 0 1 16.6 10.5" />
              <path d="M 8.2 12.3 A 8 8 0 0 1 15.6 13.2" />
              <path d="M 8.9 15 A 6 6 0 0 1 14.7 15.8" />
            </svg>
          </a>
        )}

        <canvas className="player__meter" ref={meter} width="104" height="26" aria-hidden="true" />

        <div className="player__words">
          <p className="player__now">NOW PLAYING</p>
          <p className="player__track">
            {TRACKS[track].title} <span>by {TRACKS[track].artist}</span>
          </p>
        </div>

        <div className="player__keys">
          <button
            type="button"
            onClick={back}
            disabled={phase !== 'crystallised'}
            aria-label="Play from the start, or press twice for the previous track"
            title="Start again · twice for the previous track"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M 15 5 L 7 12 L 15 19 Z" />
              <path d="M 6 5 L 6 19" />
            </svg>
          </button>

          <button
            type="button"
            className="player__play"
            onClick={togglePlay}
            disabled={phase !== 'crystallised'}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {playing ? (
                <>
                  <path d="M 9 5 L 9 19" />
                  <path d="M 15 5 L 15 19" />
                </>
              ) : (
                <path d="M 8 5 L 19 12 L 8 19 Z" />
              )}
            </svg>
          </button>

          <button type="button" onClick={nextTrack}
            disabled={phase !== 'crystallised'} aria-label="Next track">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M 9 5 L 17 12 L 9 19 Z" />
              <path d="M 18 5 L 18 19" />
            </svg>
          </button>

          <button
            type="button"
            className="player__mute"
            onClick={toggleMute}
            aria-pressed={muted}
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M 4 9 L 8 9 L 13 5 L 13 19 L 8 15 L 4 15 Z" />
              {muted ? (
                <>
                  <path d="M 17 9 L 21 15" />
                  <path d="M 21 9 L 17 15" />
                </>
              ) : (
                <path d="M 16.5 9.5 A 3.5 3.5 0 0 1 16.5 14.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {phase === 'falling' && !coarse && (
        <button
          className="about__skip"
          type="button"
          onClick={skipArrival}
        >
          SKIP
        </button>
      )}

      {/* On a touch screen the hint becomes the control it describes, so
          the words are true and there is one thing at the bottom of the
          screen rather than two fighting for the same corner. */}
      {coarse ? (
        <button
          className="about__hint about__hint--tap"
          type="button"
          onClick={() => {
            if (phase === 'falling') {
              skipArrival()
              return
            }
            toggleMute()
          }}
        >
          {phase === 'falling' ? 'TAP TO SKIP' : muted ? 'TAP TO UNMUTE' : 'TAP TO MUTE'}
        </button>
      ) : (
        <p className="about__hint">
          {phase === 'falling'
            ? 'ANY KEY to skip · ESC to leave'
            : 'SPACE or ENTER mutes · ESC to leave'}
        </p>
      )}

      <button className="about__close" type="button" onClick={restore} aria-label="Close about">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M 6 6 L 18 18" />
          <path d="M 18 6 L 6 18" />
        </svg>
      </button>

      <section className="about__sheet" aria-label="About">
        <header className="about__intro">
          <p className="about__eyebrow">ABOUT</p>
          <h2 className="about__title">Nabil Al-Shanteer</h2>
          <p className="about__lede">
            Create then ideate, abstraction beats perfection. I love to bring my ideas
            to life, whether it&rsquo;s this page, an AIoT that optimises a common workflow
            of mine, or anything DIY really. Catch a glimpse of my hobbies.
          </p>
        </header>

        {HOBBIES.map((hobby, i) => (
          <section
            className="hobby"
            key={hobby.key}
            /* The card and its arcs trade places down the page, so no two
               sections sit the same way round. */
            data-side={i % 2 === 0 ? 'right' : 'left'}
            /* Live by default: if the observer below never gets to run,
               the orbits turn rather than sitting frozen. */
            data-live="true"
          >
            <Orbit pictures={lanes[i] ?? []} side={i % 2 === 0 ? 'right' : 'left'} />
            <article
              className="hobby__bubble"
              tabIndex={0}
              /* Hovering opens it; clicking keeps it open, which is what
                 you want once there is enough text to scroll through. */
              data-open={pinned === hobby.key}
              data-shut={shut === hobby.key ? 'true' : undefined}
              onPointerLeave={() => setShut((k) => (k === hobby.key ? null : k))}
              onClick={(event) => {
                /* Ask the card whether it is open rather than working it
                   out from state. It can be open because it is pinned,
                   because it is hovered, or because something inside it
                   has focus — and on a touch screen that last one is
                   easy to land in by tapping the assistant, after which
                   `pinned` says closed while the card is plainly open.
                   Its own height is the one answer that is always true,
                   and it makes a tap anywhere in the card — the title,
                   the subtitle, the paragraphs — close it. */
                const card = event.currentTarget
                const body = card.querySelector('.hobby__more')
                const isOpen = !!body && body.getBoundingClientRect().height > 4

                if (isOpen) {
                  // Focus inside would hold it open through :focus-within.
                  if (card.contains(document.activeElement)) document.activeElement.blur()
                  setPinned(null)
                  setShut(hobby.key)
                  return
                }
                setShut(null)
                setPinned(hobby.key)
              }}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return
                e.stopPropagation()
                e.preventDefault()
                setPinned((k) => (k === hobby.key ? null : hobby.key))
              }}
            >
              <h3>{hobby.label}</h3>
              {/* The title stays put; everything under it reads and
                  scrolls together, so the subtitle goes off the top with
                  the rest instead of sitting pinned above moving text. */}
              <div className="hobby__read">
                <p className="hobby__gloss">{hobby.gloss}</p>
                {/* Opens on hover, and on focus for anyone using a keyboard. */}
                <div className="hobby__more">
                {/* The inner box is what gets clipped, so the paragraphs'
                    own spacing collapses with it instead of holding the
                    card open by a margin's worth. */}
                <div className="hobby__more-inner">
                  {/* Either shape works, and a newline anywhere starts a
                      new paragraph — so the text can be written as one
                      string with line breaks in it and still come out
                      properly spaced. */}
                  {(Array.isArray(hobby.more) ? hobby.more : [hobby.more ?? ''])
                    .flatMap((block) => String(block).split(/\n+/))
                    .map((para) => para.trim())
                    .filter(Boolean)
                    .map((para, k) => (
                      <p key={k}>{para}</p>
                    ))}

                  {/* Scoped to this section, so a question asked here is
                      answered from this section first. */}
                  <Ask topic={hobby.key} label={hobby.label} />
                  </div>
                </div>
              </div>
            </article>
          </section>
        ))}
      </section>
    </div>
  )
}
