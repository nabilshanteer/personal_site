import { useEffect, useRef, useState } from 'react'

/* The mark, top centre.

   A package seen from above with an N routed across it in copper. At
   rest it is the mark and nothing else; the two places this person can
   be found drop down underneath it.

   Downwards rather than sideways on purpose. Opening across the top put
   the links on the same line as the controls in the corner, and the two
   ran into each other on a narrow screen — dropping below the row they
   share means they can never meet.

   With a mouse it opens on hover, and on focus for a keyboard. On a
   touch screen there is no hover: the mark becomes a button that opens
   the pair on the first tap, rather than an anchor that silently takes
   you somewhere on it. A tap anywhere else closes it again. */

const LINKS = [
  { label: 'LINKEDIN', href: 'https://www.linkedin.com/in/nabil-al-shanteer/' },
  { label: 'GITHUB', href: 'https://github.com/nabilshanteer' },
]

const MARK = (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <rect className="monogram__body" x="7" y="7" width="34" height="34" rx="7" />

    {/* the N, as a routed trace */}
    <path className="monogram__trace" d="M 18 33 L 18 15 L 30 33 L 30 15" />

    {/* pads where it breaks out of the package */}
    <circle className="monogram__pad" cx="18" cy="33" r="2.4" />
    <circle className="monogram__pad" cx="30" cy="15" r="2.4" />

    <line className="monogram__pin" x1="7" y1="19" x2="2" y2="19" />
    <line className="monogram__pin" x1="7" y1="29" x2="2" y2="29" />
    <line className="monogram__pin" x1="41" y1="19" x2="46" y2="19" />
    <line className="monogram__pin" x1="41" y1="29" x2="46" y2="29" />
  </svg>
)

export default function Monogram() {
  const dock = useRef(null)
  const [open, setOpen] = useState(false)
  const [coarse] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)')?.matches
  )

  /* Anywhere else closes it. Pointerdown rather than click, so it shuts
     as the next thing is being reached for rather than after. */
  useEffect(() => {
    if (!open) return
    const away = (event) => {
      if (!dock.current?.contains(event.target)) setOpen(false)
    }
    const esc = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', away)
    window.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', away)
      window.removeEventListener('keydown', esc)
    }
  }, [open])

  return (
    <div className="monogram-dock" ref={dock} data-open={open ? 'true' : 'false'}>
      {coarse ? (
        <button
          className="monogram"
          type="button"
          onClick={() => setOpen((was) => !was)}
          aria-expanded={open}
          aria-label={open ? 'Hide links' : 'Show links'}
        >
          {MARK}
        </button>
      ) : (
        <a className="monogram" href="/" aria-label="Nabil Al-Shanteer — home">
          {MARK}
        </a>
      )}

      <nav className="monogram__links" aria-label="Elsewhere">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            tabIndex={coarse && !open ? -1 : undefined}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  )
}
