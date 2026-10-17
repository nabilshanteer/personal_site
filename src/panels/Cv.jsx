import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PDF, PREVIEW, WHO, EXPERIENCE, THESES, EDUCATION, PLACES, STACKS, NOTES, SOCIETY } from '../lib/cv'

/* The CV panel.

   A CV is a record of what was running when. So it is shown on a scope:
   time along the bottom, three channels stacked up the screen, and each
   role a pulse that goes high while it ran and falls when it ended.
   Overlapping work is the thing a list of dates hides and a scope shows
   for free — two traces high at once is two jobs at once.

   The instrument is the index, not the document. Underneath it the whole
   CV is laid out as text, in order, selectable and printable; picking a
   pulse scrolls to the entry it belongs to. A CV that could only be read
   by poking at a graph would be a worse CV, however good the graph.

   It powers on the way a scope does: the graticule comes up, the beam
   sweeps once from the left laying down the trace, the screen shrinks
   from the whole viewport onto the bench, and the document rises under
   it. Skippable on any key, like the rest. */

const MONTHS = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
}

/* "Mar 2026" and "2022" both mean a point on the axis. Months land
   mid-month rather than on the first, which stops a one-month role
   collapsing to zero width. */
function when(text, end = false) {
  const bits = String(text).trim().split(/\s+/)
  if (bits.length === 1) return Number(bits[0]) + (end ? 1 : 0)
  const month = MONTHS[bits[0]] ?? 0
  return Number(bits[1]) + (month + (end ? 1 : 0)) / 12
}

/* Named, not numbered. "CH1" is what the instrument would call it and
   means nothing to anyone who has not stood in front of one. */
const CHANNELS = [
  { id: 'exp', name: 'EXPERIENCE', rgb: [255, 146, 58] },
  { id: 'thesis', name: 'EDUCATION', rgb: [92, 214, 224] },
  { id: 'place', name: 'LOCATION', rgb: [178, 142, 255] },
]

const SWEEP = 1.9 // seconds the beam takes to cross
const SETTLE_AT = 2.3 // when the screen sits down and the document rises
const RISE = 0.055 // years a pulse takes to get up to level — the slew

const DIVS_X = 10
const DIVS_Y = 8

/* [text](slug) inside a line of the CV becomes a way into that project's
   panel. Built as React elements, never injected as markup — the CV is
   our own text, but parsing prose into HTML is a habit worth not having.

   A button rather than an anchor: there is no page at the other end to
   navigate to, it opens a panel on the same document. */
const LINK = /\[([^\]]+)\]\(([a-z0-9-]+)\)/g

function Prose({ text, onJump }) {
  const bits = []
  let last = 0
  let n = 0
  for (const m of String(text).matchAll(LINK)) {
    if (m.index > last) bits.push(<span key={n++}>{text.slice(last, m.index)}</span>)
    const slug = m[2]
    bits.push(
      <button key={n++} type="button" className="cv__jump" onClick={() => onJump(slug)}>
        {m[1]}
      </button>
    )
    last = m.index + m[0].length
  }
  if (last < text.length) bits.push(<span key={n++}>{text.slice(last)}</span>)
  return <>{bits}</>
}

export default function Cv() {
  const [phase, setPhase] = useState('off') // off | running | here
  const [picked, setPicked] = useState(null)
  const canvas = useRef(null)
  const frame = useRef(null)
  const timer = useRef(null)
  const started = useRef(0)
  const live = useRef(false)
  const held = useRef(0)
  const hits = useRef([])
  const entries = useRef({})
  const board = useRef(null)

  /* Every dated thing on the CV, flattened onto its channel. */
  const tracks = useMemo(() => {
    const rows = [
      ...EXPERIENCE.map((e) => ({
        key: e.id,
        channel: 'exp',
        label: e.short ?? e.org,
        from: when(e.from),
        // null means it has not finished: resolved to the right edge below.
        to: e.to == null ? null : when(e.to, true),
      })),
      ...THESES.map((t) => ({
        key: t.id,
        channel: 'thesis',
        label: t.degree.replace(' Thesis', ''),
        // The stage of the degree where one is given, otherwise the dates
        // the thesis itself carries.
        from: when(t.span?.from ?? t.from),
        to: when(t.span?.to ?? t.to, !t.span),
      })),
      ...PLACES.map((m) => ({
        key: m.id,
        channel: 'place',
        label: m.label,
        from: when(m.from),
        to: m.to == null ? null : when(m.to, true),
        // Where picking this pulse should take you.
        goes: m.goes,
      })),
    ]

    const first = Math.floor(Math.min(...rows.map((r) => r.from)))
    const closed = rows.map((r) => r.to).filter((v) => v != null)
    let last = Math.ceil(Math.max(...closed))

    /* The axis ends where the dated work ends. Something still running
       is not given a year of empty graph to run through — it simply
       stays high to the right edge and leaves. */

    /* An open span is carried past the right edge rather than up to it.
       Ending it exactly at `last` puts its falling edge in view, which
       draws the one thing it must not say: that the job has an end date
       of 2028. */
    return {
      rows: rows.map((r) => ({ ...r, to: r.to ?? last + 0.6, open: r.to == null })),
      first,
      last,
    }
  }, [])

  /* A pulse is not always the entry it stands for: a place on the map is
     opened by the job or the degree that put him there. */
  const goesTo = useMemo(
    () => Object.fromEntries(tracks.rows.map((r) => [r.key, r.goes ?? r.key])),
    [tracks]
  )

  const stop = useCallback(() => {
    if (frame.current) cancelAnimationFrame(frame.current)
    frame.current = null
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = null
  }, [])

  const restore = useCallback(() => {
    live.current = false
    stop()
    document.documentElement.removeAttribute('data-overlay')
    document.documentElement.removeAttribute('data-panel')
    document.documentElement.style.setProperty('--house', '1')
    setPicked(null)
    setPhase('off')
  }, [stop])

  const arrive = useCallback(() => {
    if (!live.current) return
    if (timer.current) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    held.current = 1
    document.documentElement.setAttribute('data-overlay', 'here')
    document.documentElement.style.setProperty('--house', '0.06')
    setPhase('here')
  }, [])

  /* One frame of the screen. */
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
    }

    const ctx = node.getContext('2d')
    const now = performance.now()
    const run = held.current ? 1 : Math.min(1, (now - started.current) / (SWEEP * 1000))
    // The beam eases off at the end of its travel, like a real sweep.
    const beam = 1 - Math.pow(1 - run, 2)

    ctx.fillStyle = '#05070a'
    ctx.fillRect(0, 0, w, h)

    /* Wide enough for whichever channel has the longest name, measured
       rather than guessed, so this does not quietly clip at some width
       nobody tested. */
    ctx.font = '9px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    const widest = Math.max(...CHANNELS.map((c) => ctx.measureText(c.name).width))
    const padL = Math.round(widest) + 18
    const padR = 18
    const padT = 16
    const padB = 30
    const gw = w - padL - padR
    const gh = h - padT - padB
    if (gw < 40 || gh < 40) return

    const { rows, first, last } = tracks
    const span = last - first
    const atX = (year) => padL + ((year - first) / span) * gw

    /* --- the graticule ------------------------------------------------- */
    ctx.save()
    ctx.beginPath()
    ctx.rect(padL, padT, gw, gh)
    ctx.clip()

    ctx.lineWidth = 1
    ctx.strokeStyle = 'rgba(126, 160, 190, 0.1)'
    ctx.beginPath()
    for (let i = 1; i < DIVS_X; i += 1) {
      const x = Math.round(padL + (gw * i) / DIVS_X) + 0.5
      ctx.moveTo(x, padT)
      ctx.lineTo(x, padT + gh)
    }
    for (let i = 1; i < DIVS_Y; i += 1) {
      const y = Math.round(padT + (gh * i) / DIVS_Y) + 0.5
      ctx.moveTo(padL, y)
      ctx.lineTo(padL + gw, y)
    }
    ctx.stroke()

    // The centre lines carry the fine ticks, as on a real graticule.
    ctx.strokeStyle = 'rgba(126, 160, 190, 0.2)'
    ctx.beginPath()
    const midY = Math.round(padT + gh / 2) + 0.5
    const midX = Math.round(padL + gw / 2) + 0.5
    ctx.moveTo(padL, midY)
    ctx.lineTo(padL + gw, midY)
    ctx.moveTo(midX, padT)
    ctx.lineTo(midX, padT + gh)
    for (let i = 0; i <= DIVS_X * 5; i += 1) {
      const x = Math.round(padL + (gw * i) / (DIVS_X * 5)) + 0.5
      ctx.moveTo(x, midY - 3)
      ctx.lineTo(x, midY + 3)
    }
    for (let i = 0; i <= DIVS_Y * 5; i += 1) {
      const y = Math.round(padT + (gh * i) / (DIVS_Y * 5)) + 0.5
      ctx.moveTo(midX - 3, y)
      ctx.lineTo(midX + 3, y)
    }
    ctx.stroke()
    ctx.restore()

    /* --- the traces ---------------------------------------------------- */
    const lane = gh / (CHANNELS.length + 0.5)
    const found = []

    CHANNELS.forEach((channel, index) => {
      const mine = rows.filter((r) => r.channel === channel.id)
      const base = padT + lane * (index + 0.95)
      const amp = lane * 0.58

      /* The level at a moment: how many of this channel's spans are
         running, slewed rather than switched, so an edge has a rise time
         the way a real one does. Overlap stacks, which is the point —
         two things at once reads as a taller step. */
      const level = (year) => {
        let total = 0
        for (const r of mine) {
          /* The slew is centred on each edge rather than starting at it.
             Two spans that meet — school ending the year university
             begins — then hand over at half each and sum to one, instead
             of both reaching zero at the shared instant and cutting a
             notch down to the baseline between them. A real gap still
             shows as a real gap. */
          const up = Math.min(1, Math.max(0, (year - (r.from - RISE / 2)) / RISE))
          const down = Math.min(1, Math.max(0, (r.to + RISE / 2 - year) / RISE))
          total += Math.min(up, down)
        }
        return total
      }

      const tallest = Math.max(1, ...mine.map((r) => level((r.from + r.to) / 2)))
      const seenTo = padL + gw * beam

      const pts = []
      for (let x = padL; x <= seenTo; x += 1.5) {
        const year = first + ((x - padL) / gw) * span
        const lit = level(year) / tallest
        // A whisper of noise, so a flat line is not a dead one.
        const hum = Math.sin(x * 0.9 + index * 2.1) * 0.5 + Math.sin(x * 0.21) * 0.6
        pts.push([x, base - lit * amp + hum])
      }
      if (pts.length < 2) return

      const [r, g, b] = channel.rgb
      const draw = (colour, width) => {
        ctx.strokeStyle = colour
        ctx.lineWidth = width
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(pts[0][0], pts[0][1])
        for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0], pts[i][1])
        ctx.stroke()
      }
      // Phosphor: a wide dim bloom under a bright thin beam. Layered
      // strokes rather than a shadow blur, which at this size would cost
      // more than everything else on the screen put together.
      draw(`rgba(${r}, ${g}, ${b}, 0.1)`, 7)
      draw(`rgba(${r}, ${g}, ${b}, 0.22)`, 3.2)
      draw(`rgba(${r}, ${g}, ${b}, 0.95)`, 1.4)

      // Where each pulse sits, for the label and for picking it.
      for (const span_ of mine) {
        const x0 = atX(span_.from)
        const x1 = atX(span_.to)
        if (x0 > seenTo) continue
        const top = base - amp * (level((span_.from + span_.to) / 2) / tallest)
        found.push({ ...span_, x0, x1: Math.min(x1, seenTo), y: top, rgb: channel.rgb })
      }
    })

    hits.current = found

    /* --- what each pulse is -------------------------------------------- */
    ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    ctx.textBaseline = 'bottom'

    /* Labels are placed left to right, and one that would run into the
       last one is lifted a line above it instead. Two short roles close
       together — three months apart, with names longer than either
       pulse — otherwise print straight over each other. */
    const placed = []
    for (const hit of [...found].sort((a, b) => a.x0 - b.x0)) {
      const [r, g, b] = hit.rgb
      const on = picked === hit.key
      const room = hit.x1 - hit.x0
      const width = ctx.measureText(hit.label).width
      if (room < 10) continue

      if (on) {
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.16)`
        ctx.fillRect(hit.x0, hit.y - 3, room, Math.max(3, padT + gh - hit.y - 3))
      }

      let x = room > width + 10 ? hit.x0 + (room - width) / 2 : hit.x0
      x = Math.max(padL + 2, Math.min(x, padL + gw - width - 2))
      let y = hit.y - 6
      // Lift until this label clears everything already written near it.
      for (let guard = 0; guard < 4; guard += 1) {
        const clash = placed.some(
          (p) => Math.abs(p.y - y) < 11 && x < p.x + p.width + 6 && p.x < x + width + 6
        )
        if (!clash) break
        y -= 12
      }
      placed.push({ x, y, width })

      ctx.fillStyle = on ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, 0.72)`
      ctx.fillText(hit.label, x, y)
    }

    /* --- the time base -------------------------------------------------- */
    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    ctx.fillStyle = 'rgba(206, 220, 236, 0.5)'
    ctx.textBaseline = 'top'
    ctx.textAlign = 'center'
    for (let year = first; year <= last; year += 1) {
      const x = atX(year)
      ctx.fillText(String(year), x, padT + gh + 8)
      ctx.strokeStyle = 'rgba(126, 160, 190, 0.3)'
      ctx.beginPath()
      ctx.moveTo(Math.round(x) + 0.5, padT + gh)
      ctx.lineTo(Math.round(x) + 0.5, padT + gh + 4)
      ctx.stroke()
    }

    // The channel markers down the left edge, as a scope puts them.
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.font = '9px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    CHANNELS.forEach((channel, index) => {
      const [r, g, b] = channel.rgb
      const base = padT + lane * (index + 0.95)
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.9)`
      /* No marker stub beside it. With "CH1" it read as a pointer at
         the trace; beside a word it reads as a dash someone left in. */
      ctx.fillText(channel.name, padL - 10, base)
    })
    ctx.textAlign = 'left'

    /* --- the beam ------------------------------------------------------- */
    if (run < 1) {
      const x = padL + gw * beam
      const glow = ctx.createLinearGradient(x - 26, 0, x, 0)
      glow.addColorStop(0, 'rgba(255, 214, 160, 0)')
      glow.addColorStop(1, 'rgba(255, 214, 160, 0.3)')
      ctx.fillStyle = glow
      ctx.fillRect(x - 26, padT, 26, gh)
      ctx.strokeStyle = 'rgba(255, 236, 206, 0.85)'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(x, padT)
      ctx.lineTo(x, padT + gh)
      ctx.stroke()
    }
  }, [tracks, picked])

  const begin = useCallback(() => {
    if (phase !== 'off') return
    live.current = true
    held.current = 0
    started.current = performance.now()
    document.documentElement.setAttribute('data-overlay', 'falling')
    document.documentElement.setAttribute('data-panel', 'cv')
    setPhase('running')

    // On a clock, not on a frame: frames stop in a backgrounded tab, and
    // the sequence must not be able to stall there.
    timer.current = window.setTimeout(arrive, SETTLE_AT * 1000)

    const from = Date.now()
    const dim = window.setInterval(() => {
      if (!live.current) {
        window.clearInterval(dim)
        return
      }
      const d = Math.min(1, (Date.now() - from) / 1100)
      document.documentElement.style.setProperty('--house', (1 - 0.94 * (d * d * (3 - 2 * d))).toFixed(3))
      if (d >= 1) window.clearInterval(dim)
    }, 40)
  }, [phase, arrive])

  /* The screen stays live the whole time it is on — a scope that froze
     the moment you looked at it would be a picture of a scope. */
  useEffect(() => {
    if (phase === 'off') return
    let stopped = false
    let last = 0
    const tick = (at) => {
      if (stopped || !live.current) return
      frame.current = requestAnimationFrame(tick)
      // Full rate while the beam is crossing, half once it has landed.
      if (held.current && at - last < 1000 / 30) return
      last = at
      paint()
    }
    frame.current = requestAnimationFrame(tick)
    return () => {
      stopped = true
      stop()
    }
  }, [phase, paint, stop])

  /* Another panel was chosen from the menu while this one was open. */
  useEffect(() => {
    const leave = (event) => {
      if (event.detail?.next === 'cv:open') return
      restore()
    }
    window.addEventListener('panel:exit', leave)
    return () => window.removeEventListener('panel:exit', leave)
  }, [restore])

  useEffect(() => {
    const open = () => begin()
    window.addEventListener('cv:open', open)
    return () => window.removeEventListener('cv:open', open)
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
      if (target instanceof Element && target.closest('input, textarea, select')) return
      event.preventDefault()
      arrive()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, restore, arrive])

  useEffect(
    () => () => {
      if (frame.current) cancelAnimationFrame(frame.current)
      document.documentElement.removeAttribute('data-overlay')
    document.documentElement.removeAttribute('data-panel')
      document.documentElement.style.setProperty('--house', '1')
    },
    []
  )

  /* Picking a pulse goes to the entry it stands for. The scope is the
     index; the text below it is the CV. */
  const choose = useCallback(
    (key) => {
      setPicked(key)
      const node = entries.current[goesTo[key] ?? key]
      if (node) node.scrollIntoView({ block: 'center', behavior: 'smooth' })
    },
    [goesTo]
  )

  /* A link out of the CV and into the project it names. The panel closes
     first: the work opens on the page underneath this one, and leaving
     the CV over the top of it would hide the thing just asked for. */
  const jump = useCallback(
    (slug) => {
      restore()
      window.setTimeout(
        () => window.dispatchEvent(new CustomEvent('work:open', { detail: { slug } })),
        90
      )
    },
    [restore]
  )

  const onScreen = (event) => {
    if (phase !== 'here') return
    const box = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - box.left
    const y = event.clientY - box.top
    // Nearest pulse the pointer is actually over, horizontally, then by
    // how close it is vertically to that trace.
    const over = hits.current
      .filter((hit) => x >= hit.x0 - 4 && x <= hit.x1 + 4)
      .sort((a, b) => Math.abs(a.y - y) - Math.abs(b.y - y))[0]
    if (over) choose(over.key)
  }

  const keep = (key) => (node) => {
    entries.current[key] = node
  }

  const dated = (from, to) => (to ? `${from} — ${to}` : `From ${from}`)

  return (
    <div className="cv" data-phase={phase} aria-hidden={phase === 'off'}>
      <div className="cv__field" aria-hidden="true" />
      <div className="cv__lines" aria-hidden="true" />
      <div className="cv__sweep" aria-hidden="true" />

      {/* The panel is pointer-events:none, so the tap needs something
          real to land on. */}
      {phase === 'running' && (
        <button className="skip-sheet" type="button" aria-label="Skip" onClick={arrive} />
      )}

      {phase === 'running' && (
        <div className="cv__ring">
          <p className="cv__arming">ACQUIRING</p>
          <button className="cv__skip" type="button" onClick={arrive}>
            ANY KEY TO SKIP
          </button>
        </div>
      )}

      {phase === 'here' && (
        <button className="cv__close" type="button" onClick={restore} aria-label="Close CV">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M 6 6 L 18 18" />
            <path d="M 18 6 L 6 18" />
          </svg>
        </button>
      )}

      <div className="cv__board" ref={board}>
        <section className="cv__sheet" aria-label="CV">
          <header className="cv__head">
            <p className="cv__eyebrow">CURRICULUM VITAE</p>
            <h2>{WHO.name}</h2>
            <p className="cv__who">{WHO.citizenship}</p>
            <div className="cv__links">
              <a href={WHO.linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
              <a href={WHO.github} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </div>
          </header>

          {/* The plain document, offered first and plainly. Everything
              below this is an interpretation of the CV; some people only
              want the CV, and they should not have to scroll past a
              graph and a thousand words to find out it exists. */}
          <aside className="cv__pdf">
            <div className="cv__pdftext">
              <p className="cv__pdfhead">Just want the document?</p>
              <p className="cv__pdfnote">One page, the version you would be sent by email.</p>
              <div className="cv__pdfdo">
                <a className="cv__get" href={PDF} download>
                  DOWNLOAD PDF
                </a>
                <a className="cv__open" href={PDF} target="_blank" rel="noopener noreferrer">
                  Open in a tab
                </a>
              </div>
            </div>

            <svg className="cv__arrow" viewBox="0 0 64 24" aria-hidden="true">
              <path d="M 2 12 L 54 12" />
              <path d="M 45 5 L 54 12 L 45 19" />
            </svg>

            <a
              className="cv__thumb"
              href={PDF}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open the CV as a PDF"
            >
              <img src={PREVIEW} alt="The first page of the CV" loading="lazy" />
            </a>
          </aside>

          {/* The instrument. Full height while it powers on, then it sits
              down onto the bench and the document comes up under it. */}
          <figure className="cv__screen">
            <canvas
              ref={canvas}
              onClick={onScreen}
              aria-label="Timeline of experience, theses and education"
            />
            <figcaption className="cv__legend">
              {CHANNELS.map((channel) => (
                <span key={channel.id} style={{ '--ink': `rgb(${channel.rgb.join(',')})` }}>
                  <i aria-hidden="true" />
                  {channel.name}
                </span>
              ))}
              <span className="cv__hint">pick a pulse</span>
            </figcaption>
          </figure>

          <div className="cv__doc">
            <h3 className="cv__rule">Experience</h3>
            {EXPERIENCE.map((job) => (
              <article
                className="cv__entry"
                key={job.id}
                ref={keep(job.id)}
                data-on={goesTo[picked] === job.id}
              >
                <header>
                  <h4>
                    {job.projects.length === 1 ? (
                      <button type="button" className="cv__jump" onClick={() => jump(job.projects[0])}>
                        {job.org}
                      </button>
                    ) : (
                      job.org
                    )}
                    {job.upcoming && <span className="cv__soon">UPCOMING</span>}
                  </h4>
                  {job.role && <p className="cv__role">{job.role}</p>}
                  <p className="cv__meta">
                    {[job.place, dated(job.from, job.to)].filter(Boolean).join(' · ')}
                  </p>
                </header>
                {job.points.length > 0 && (
                  <ul>
                    {job.points.map((point, i) => (
                      <li key={i}>
                        <Prose text={point} onJump={jump} />
                      </li>
                    ))}
                  </ul>
                )}
                <p className="cv__refs">
                  {job.links.map((link) => (
                    <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
                      {link.label}
                    </a>
                  ))}
                  {job.aside && (
                    <a href={job.aside.href} target="_blank" rel="noopener noreferrer">
                      {job.aside.label}
                    </a>
                  )}
                </p>
              </article>
            ))}

            <h3 className="cv__rule">Academic theses</h3>
            {THESES.map((thesis) => (
              <article
                className="cv__entry"
                key={thesis.id}
                ref={keep(thesis.id)}
                data-on={goesTo[picked] === thesis.id}
              >
                <header>
                  <h4>
                    {thesis.projects.length === 1 ? (
                      <button
                        type="button"
                        className="cv__jump"
                        onClick={() => jump(thesis.projects[0])}
                      >
                        {thesis.title}
                      </button>
                    ) : (
                      thesis.title
                    )}
                  </h4>
                  <p className="cv__role">{thesis.degree}</p>
                  <p className="cv__meta">
                    {thesis.place} · {dated(thesis.from, thesis.to)}
                  </p>
                </header>
                <ul>
                  {thesis.points.map((point, i) => (
                    <li key={i}>
                      <Prose text={point} onJump={jump} />
                    </li>
                  ))}
                </ul>
                <p className="cv__refs">
                  {thesis.links.map((link) => (
                    <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
                      {link.label}
                    </a>
                  ))}
                </p>
              </article>
            ))}

            <h3 className="cv__rule">Education</h3>
            {EDUCATION.map((school) => (
              <article
                className="cv__entry"
                key={school.id}
                ref={keep(school.id)}
                data-on={goesTo[picked] === school.id}
              >
                <header>
                  <h4>{school.school}</h4>
                  <p className="cv__role">{school.award}</p>
                  <p className="cv__meta">
                    {school.place} · {dated(school.from, school.to)} · {school.result}
                  </p>
                </header>
                <p className="cv__refs">
                  {school.links.map((link) => (
                    <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
                      {link.label}
                    </a>
                  ))}
                </p>
              </article>
            ))}

            <h3 className="cv__rule">Skills</h3>
            <div className="cv__stacks">
              {STACKS.map((stack) => (
                <div key={stack.id}>
                  <p className="cv__stacklabel">{stack.label}</p>
                  <ul className="cv__tags">
                    {stack.items.map((item) => {
                      const label = typeof item === 'string' ? item : item.label
                      const goes = typeof item === 'string' ? null : item.goes
                      return (
                        <li key={label} data-goes={goes ? 'true' : undefined}>
                          {goes ? (
                            <button type="button" className="cv__jump" onClick={() => jump(goes)}>
                              {label}
                            </button>
                          ) : (
                            label
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>

            <ul className="cv__notes">
              {NOTES.map((note, i) => (
                <li key={i}>
                  {note.includes('Quantitative Trading Society') ? (
                    <>
                      {note.split('Quantitative Trading Society')[0]}
                      <a href={SOCIETY} target="_blank" rel="noopener noreferrer">
                        Quantitative Trading Society
                      </a>
                      {note.split('Quantitative Trading Society')[1]}
                    </>
                  ) : (
                    note
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
