import { bands } from '../lib/content'

/* The two bands that run past behind the picture once it has pulled back
   — one left to right, one right to left. Each row's text is repeated so
   the track can loop without a seam. */

const REPEATS = 4

export default function Marquee() {
  return (
    <div className="bands" aria-hidden="true">
      {bands.map((text, row) => (
        <div className="band" key={row} data-direction={row % 2 === 0 ? 'ltr' : 'rtl'}>
          <div className="band__track">
            {Array.from({ length: REPEATS }, (_, i) => (
              <span className="band__text" key={i}>
                {text}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
