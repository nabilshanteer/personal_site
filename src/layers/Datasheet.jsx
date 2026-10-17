import { useMemo } from 'react'
import { callouts } from '../lib/content'

/* The two effects as one.

   Current runs around his silhouette — the outline draws itself rather
   than fading in — and then copper breaks out from points on him and
   routes away into the board, each run terminating on a pad with a
   label beside it. He is the component; this is its datasheet.

   Nothing touches the photograph. Everything happens on his edge and in
   the space around him. */

const EDGE = 0.11 // how far beyond the frame the labels park
const STUB = 0.045 // the short horizontal run leaving the anchor

export default function Datasheet({ meta, active }) {
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

  const routes = useMemo(() => {
    if (!meta?.anchors) return []

    return callouts
      .map((callout, index) => {
        const anchor = meta.anchors[callout.anchor]
        if (!anchor) return null

        const direction = callout.side === 'left' ? -1 : 1
        const ax = X(anchor[0])
        const ay = Y(anchor[1])
        const edgeX = X(callout.side === 'left' ? -EDGE : 1 + EDGE)
        const ty = Y(callout.y)
        const kneeX = edgeX - direction * X(0.1)

        return {
          ...callout,
          direction,
          ax,
          ay,
          edgeX,
          ty,
          // Stub out, 45° run, then flat into the pad the label sits on.
          d: `M ${ax} ${ay} L ${ax + direction * X(STUB)} ${ay} L ${kneeX} ${ty} L ${edgeX} ${ty}`,
          // The edge has to travel most of the way round before the
          // breakouts start leaving it.
          delay: 520 + index * 75,
        }
      })
      .filter(Boolean)
  }, [meta, ratio])

  if (!meta?.outline) return null

  return (
    <svg
      className="sheet"
      viewBox={`0 0 1000 ${1000 * ratio}`}
      data-on={active ? 'true' : 'false'}
      aria-hidden="true"
    >
      <defs>
        <filter id="sheetGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* the current, running his edge */}
      <path className="sheet__glow" d={outlinePath} pathLength="1" filter="url(#sheetGlow)" />
      <path className="sheet__edge" d={outlinePath} pathLength="1" />

      {routes.map((route) => (
        <g className="sheet__route" key={route.anchor} style={{ '--delay': `${route.delay}ms` }}>
          {/* where it leaves him */}
          <circle className="sheet__tap" cx={route.ax} cy={route.ay} r={4.5} />

          <path className="sheet__trace" d={route.d} pathLength="1" />

          {/* where it lands */}
          <circle className="sheet__pad" cx={route.edgeX} cy={route.ty} r={6} />
          <circle className="sheet__drill" cx={route.edgeX} cy={route.ty} r={2.2} />

          <text
            className="sheet__label"
            x={route.edgeX - route.direction * 14}
            y={route.ty - 8}
            textAnchor={route.side === 'left' ? 'end' : 'start'}
          >
            {route.label}
          </text>
          <text
            className="sheet__detail"
            x={route.edgeX - route.direction * 14}
            y={route.ty + 15}
            textAnchor={route.side === 'left' ? 'end' : 'start'}
          >
            {route.detail}
          </text>
        </g>
      ))}
    </svg>
  )
}
