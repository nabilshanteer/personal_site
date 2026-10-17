/* Top right: the work, and the way into everything else.

   The menu glyph is deliberately not a hamburger — it is four pads and a
   routed link, which says "there is more board over here" in the same
   language as the rest of the panel. */

export default function Controls({ onMenu, menuOpen }) {
  return (
    <nav className="controls" aria-label="Primary">
      <a className="control" href="#projects">
        <svg className="control__icon" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
          <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
          <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
          <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
        </svg>
        <span>PROJECTS</span>
      </a>

      <button
        className="control control--icon"
        type="button"
        onClick={onMenu}
        aria-expanded={menuOpen}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
      >
        <svg className="control__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path className="control__route" d="M 4 6 L 11 6 L 15 10 L 20 10" />
          <path className="control__route" d="M 4 18 L 9 18 L 13 14 L 20 14" />
          <circle cx="4" cy="6" r="1.9" />
          <circle cx="20" cy="10" r="1.9" />
          <circle cx="4" cy="18" r="1.9" />
          <circle cx="20" cy="14" r="1.9" />
        </svg>
      </button>
    </nav>
  )
}
