/* The mark, top centre.

   A package seen from above with an N routed across it in copper. At
   rest it is the mark and nothing else. Bring the cursor near it and the
   package steps aside for the two places this person can be found;
   take the cursor away and it comes back.

   The swap happens inside a fixed dock, so nothing on the page moves
   when it fires — the mark fades out and the links fade in over the same
   spot. The dock is wider than the mark itself so the cursor never
   leaves it on the way to a link, which would otherwise close the thing
   you were reaching for. `focus-within` does the same job for a keyboard,
   which hover alone would shut out. */

const LINKS = [
  { label: 'LINKEDIN', href: 'https://www.linkedin.com/in/nabil-al-shanteer/' },
  { label: 'GITHUB', href: 'https://github.com/nabilshanteer' },
]

export default function Monogram() {
  return (
    <div className="monogram-dock">
      <a className="monogram" href="/" aria-label="Nabil Al-Shanteer — home">
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
      </a>

      <nav className="monogram__links" aria-label="Elsewhere">
        {LINKS.map((link) => (
          <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  )
}
