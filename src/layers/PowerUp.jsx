import { useMemo } from 'react'

/* Power-up.

   Hovering him closes a circuit. Current runs around his silhouette —
   the outline draws itself rather than fading in — and copper breaks out
   from points on his shoulders and hair, routing away into the board
   behind in 90° and 45° legs and terminating in pads.

   Nothing touches the photograph: the whole effect happens on his edge
   and in the space around him. */

const BREAKOUTS = 9

/* Deterministic, so the routing is the same every time it fires — it
   should feel like the board he is soldered to, not a different one on
   every hover. */
const mulberry32 = (seed) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export default function PowerUp({ meta, active }) {
  const outline = meta?.outline ?? []
  const ratio = meta ? meta.size[1] / meta.size[0] : 1

  const X = (n) => n * 1000
  const Y = (n) => n * 1000 * ratio

  const outlinePath = useMemo(() => {
    if (outline.length < 2) return ''
    return outline
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${X(x).toFixed(1)} ${Y(y).toFixed(1)}`)
      .join(' ')
  }, [outline, ratio])

  const breakouts = useMemo(() => {
    if (outline.length < 20) return []
    const random = mulberry32(8675309)
    const routes = []

    for (let i = 0; i < BREAKOUTS; i++) {
      // Spread the departure points around the silhouette, skipping the
      // very bottom where the figure leaves the frame.
      const index = Math.floor(((i + 0.5) / BREAKOUTS) * outline.length)
      const [nx, ny] = outline[index]
      if (ny > 0.9) continue

      const x = X(nx)
      const y = Y(ny)
      const direction = nx < 0.5 ? -1 : 1

      // Out, then a 45° break, then out again to a pad.
      const first = X(0.04 + random() * 0.07)
      const diagonal = X(0.05 + random() * 0.08)
      const last = X(0.05 + random() * 0.14)
      const rise = (random() > 0.5 ? 1 : -1) * diagonal

      const x1 = x + direction * first
      const x2 = x1 + direction * diagonal
      const y2 = y + rise
      const x3 = x2 + direction * last

      routes.push({
        d: `M ${x.toFixed(1)} ${y.toFixed(1)} L ${x1.toFixed(1)} ${y.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)} L ${x3.toFixed(1)} ${y2.toFixed(1)}`,
        pad: [x3, y2],
        delay: 420 + i * 70,
        weight: random() > 0.65 ? 3 : 1.8,
      })
    }
    return routes
  }, [outline, ratio])

  if (!meta?.outline) return null

  return (
    <svg
      className="powerup"
      viewBox={`0 0 1000 ${1000 * ratio}`}
      data-on={active ? 'true' : 'false'}
      aria-hidden="true"
    >
      <defs>
        <filter id="powerGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* The current, running the edge of him */}
      <path className="powerup__glow" d={outlinePath} pathLength="1" filter="url(#powerGlow)" />
      <path className="powerup__edge" d={outlinePath} pathLength="1" />

      {breakouts.map((route, i) => (
        <g className="powerup__route" key={i} style={{ '--delay': `${route.delay}ms` }}>
          <path
            className="powerup__trace"
            d={route.d}
            pathLength="1"
            style={{ strokeWidth: route.weight }}
          />
          <circle className="powerup__pad" cx={route.pad[0]} cy={route.pad[1]} r={6} />
          <circle className="powerup__drill" cx={route.pad[0]} cy={route.pad[1]} r={2.2} />
        </g>
      ))}
    </svg>
  )
}
