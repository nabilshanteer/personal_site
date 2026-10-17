import { useEffect, useState } from 'react'
import { DESTINATIONS, go } from '../lib/go'

/* The way into everything, in the open.

   This used to be a glyph that opened a menu holding these four. Four
   words take less room than the panel that hid them, and nobody has to
   guess what the glyph means or press it twice.

   It follows you into About, the CV and Contact, and the way out of
   those rides along with it rather than floating alone in the corner —
   one group of controls instead of two things in the same place.

   It stands down over a project, which opens from the dial and belongs
   to the index rather than sitting beside it. That panel keeps its own
   close button. */

export default function Controls() {
  // Which panel is open, and whether a project is up. Both are written
  // onto <html> by the panels themselves, so nothing has to be wired
  // through here when another one is added.
  const [panel, setPanel] = useState(null)
  const [onProject, setOnProject] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    const read = () => {
      setPanel(root.getAttribute('data-panel'))
      setOnProject(root.hasAttribute('data-work'))
    }
    read()
    const watch = new MutationObserver(read)
    watch.observe(root, { attributes: true, attributeFilter: ['data-panel', 'data-work'] })
    return () => watch.disconnect()
  }, [])

  if (onProject) return null

  /* Any `next` that is not a panel's own sequence closes every one of
     them, which is exactly what leaving means here. */
  const leave = () =>
    window.dispatchEvent(new CustomEvent('panel:exit', { detail: { next: 'none' } }))

  return (
    <nav className="sitenav" aria-label="Primary">
      {DESTINATIONS.map((destination) => (
        <button
          key={destination.id}
          className="sitenav__link"
          type="button"
          aria-current={panel === destination.id ? 'true' : undefined}
          onClick={() => go(destination)}
        >
          <span className="sitenav__pad" aria-hidden="true" />
          {destination.label}
        </button>
      ))}

      {panel && (
        <button className="sitenav__close" type="button" onClick={leave} aria-label="Close">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M 6 6 L 18 18" />
            <path d="M 18 6 L 6 18" />
          </svg>
        </button>
      )}
    </nav>
  )
}
