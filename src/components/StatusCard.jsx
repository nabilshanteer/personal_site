import { useEffect, useState } from 'react'
import { country } from '../lib/maps'

/* The location card, bottom left.

   Built like the reference: a rounded frame with a step cut out of its
   top-left corner, the label sitting in the gap rather than on top of a
   filled chip — which matters here, because the background behind it is
   a photograph, not a flat colour.

   The frame is one SVG path at a fixed size so the step can be drawn
   exactly; everything inside it is ordinary layout. */

const W = 152
const H = 238
const R = 11
const TAB_W = 76
const TAB_H = 21

const frame = [
  `M ${TAB_W} 1`,
  `L ${W - R - 1} 1`,
  `A ${R} ${R} 0 0 1 ${W - 1} ${R + 1}`,
  `L ${W - 1} ${H - R - 1}`,
  `A ${R} ${R} 0 0 1 ${W - R - 1} ${H - 1}`,
  `L ${R + 1} ${H - 1}`,
  `A ${R} ${R} 0 0 1 1 ${H - R - 1}`,
  `L 1 ${TAB_H + R}`,
  `A ${R} ${R} 0 0 1 ${R + 1} ${TAB_H}`,
  `L ${TAB_W - R} ${TAB_H}`,
  `A ${R} ${R} 0 0 0 ${TAB_W} ${TAB_H - R}`,
  'Z',
].join(' ')

/* Four ways of reaching out, taken in turn. */
const WIRE_SETS = [
  // kinked — a run, a 45° break, a run
  [
    { d: 'M 36 16 L 24 16 L 18 22 L 8 22', pad: [8, 22] },
    { d: 'M 36 40 L 26 40 L 22 44 L 10 44', pad: [10, 44] },
    { d: 'M 84 16 L 96 16 L 102 10 L 112 10', pad: [112, 10] },
    { d: 'M 84 40 L 94 40 L 100 46 L 110 46', pad: [110, 46] },
  ],
  // stepped — right angles only
  [
    { d: 'M 36 12 L 20 12 L 20 4 L 6 4', pad: [6, 4] },
    { d: 'M 36 30 L 14 30 L 14 38 L 4 38', pad: [4, 38] },
    { d: 'M 84 26 L 104 26 L 104 16 L 116 16', pad: [116, 16] },
    { d: 'M 84 44 L 98 44 L 98 52 L 114 52', pad: [114, 52] },
  ],
  // vertical — out of the top and bottom edges
  [
    { d: 'M 44 6 L 44 0 L 30 0', pad: [30, 0] },
    { d: 'M 64 6 L 64 -2 L 80 -2', pad: [80, -2] },
    { d: 'M 52 50 L 52 56 L 36 56', pad: [36, 56] },
    { d: 'M 72 50 L 72 55 L 88 55', pad: [88, 55] },
  ],
  // fan — long diagonals to the corners
  [
    { d: 'M 36 20 L 16 20 L 2 8', pad: [2, 8] },
    { d: 'M 36 36 L 18 36 L 2 48', pad: [2, 48] },
    { d: 'M 84 20 L 104 20 L 118 8', pad: [118, 8] },
    { d: 'M 84 36 L 102 36 L 118 48', pad: [118, 48] },
  ],
]

export default function StatusCard() {
  // A real outline, once one has been dropped into images/ and the asset
  // script has run. Until then the placeholder in lib/maps.js stands in.
  const [outline, setOutline] = useState(null)

  useEffect(() => {
    fetch('/img/country.json')
      .then((r) => (r.ok ? r.json() : null))
      .then(setOutline)
      .catch(() => {})
  }, [])

  const shape = outline ?? { viewBox: country.viewBox, paths: [country.d] }

  return (
    <aside className="card" aria-label={`Based in ${country.name}`}>
      <svg className="card__frame" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <path d={frame} />
      </svg>

      <span className="card__tab">BASED IN</span>

      <div className="card__inner">
        {/* Turning slowly on its vertical axis, like a cut-out held up to
            the light. The outline takes the copper on hover. */}
        <div className="card__map">
          <svg viewBox={shape.viewBox} aria-hidden="true">
            {shape.paths.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </svg>
        </div>

        <p className="card__place">{country.name}</p>

        <hr className="card__rule" />

        {/* His own line art, with wires that grow out of it and retract
            again. Four different routings take it in turn — kinked,
            stepped, vertical, then a long fan — so it never reaches out
            the same way twice in a row. The icon is a mask, so the runs
            are drawn around it rather than inside it. */}
        <div className="card__symbol" aria-hidden="true">
          <svg className="card__wires" viewBox="0 0 120 56">
            {WIRE_SETS.map((set, setIndex) =>
              set.map((wire, i) => (
                <g
                  key={`${setIndex}-${i}`}
                  style={{ '--set': setIndex, '--wire-delay': `${i * 120}ms` }}
                >
                  <path className="wire" d={wire.d} pathLength="1" />
                  <circle className="wire__pad" cx={wire.pad[0]} cy={wire.pad[1]} r="2.3" />
                </g>
              ))
            )}
          </svg>
          <span className="card__chip" />
        </div>

        <p className="card__role">
          Electronic and
          <br />
          AI Engineer
        </p>
      </div>
    </aside>
  )
}
