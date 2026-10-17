import { DESTINATIONS, go } from '../lib/go'

/* The way into everything, in the open.

   This used to be a glyph that opened a menu holding these four. The
   menu is gone: four words take less room than the panel that hid them,
   and nobody has to guess what the glyph means or press it twice.

   On a desktop they sit along the top right. On a phone they move to a
   bar across the bottom, where a thumb already is and where they cannot
   crowd the mark in the middle of the top edge. */

export default function Controls() {
  return (
    <nav className="sitenav" aria-label="Primary">
      {DESTINATIONS.map((destination) => (
        <button
          key={destination.id}
          className="sitenav__link"
          type="button"
          onClick={() => go(destination)}
        >
          <span className="sitenav__pad" aria-hidden="true" />
          {destination.label}
        </button>
      ))}
    </nav>
  )
}
