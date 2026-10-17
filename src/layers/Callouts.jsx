import { callouts } from '../lib/content'

/* Datasheet callouts.

   Leader lines run from a point on him out to a label parked beyond the
   edge of the frame, the way a component drawing annotates a package:
   a short stub off the anchor, a 45°-ish run outward, then a flat rule
   under the text.

   Drawn in SVG rather than on the canvas so the type stays crisp and
   selectable, and so the whole thing can be animated by CSS. The lines
   draw themselves with stroke-dashoffset, staggered by index, which is
   what makes it read as something being measured rather than a menu
   appearing. */

const EDGE = 0.11 // how far beyond the frame the labels park
const STUB = 0.045 // the little horizontal run that leaves the anchor

export default function Callouts({ meta, active }) {
  if (!meta?.anchors) return null

  const [imageWidth, imageHeight] = meta.size
  const ratio = imageHeight / imageWidth
  // Work in a 1000-wide viewBox so the geometry is readable as numbers.
  const X = (n) => n * 1000
  const Y = (n) => n * 1000 * ratio

  return (
    <svg
      className="callouts"
      viewBox={`0 0 1000 ${1000 * ratio}`}
      data-on={active ? 'true' : 'false'}
      aria-hidden="true"
    >
      {callouts.map((callout, index) => {
        const anchor = meta.anchors[callout.anchor]
        if (!anchor) return null

        const direction = callout.side === 'left' ? -1 : 1
        const ax = X(anchor[0])
        const ay = Y(anchor[1])
        const edgeX = X(callout.side === 'left' ? -EDGE : 1 + EDGE)
        const ty = Y(callout.y)
        const kneeX = edgeX - direction * X(0.1)

        const path = `M ${ax} ${ay} L ${ax + direction * X(STUB)} ${ay} L ${kneeX} ${ty} L ${edgeX} ${ty}`

        return (
          <g
            className="callout"
            key={callout.anchor}
            style={{ '--delay': `${index * 80}ms` }}
          >
            {/* the pad sitting on him */}
            <circle className="callout__pad" cx={ax} cy={ay} r={7} />
            <circle className="callout__drill" cx={ax} cy={ay} r={2.6} />

            <path className="callout__line" d={path} pathLength="1" />

            <text
              className="callout__label"
              x={edgeX - direction * 10}
              y={ty - 9}
              textAnchor={callout.side === 'left' ? 'end' : 'start'}
            >
              {callout.label}
            </text>
            <text
              className="callout__detail"
              x={edgeX - direction * 10}
              y={ty + 15}
              textAnchor={callout.side === 'left' ? 'end' : 'start'}
            >
              {callout.detail}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
