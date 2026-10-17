import { useEffect, useState } from 'react'
import Menu from './Menu'

/* The way out of a panel and into any other one.

   Panel one has its own controls in the top right, but they belong to
   that page and are covered the moment a panel opens over it. So this is
   the same glyph, mounted above everything, and shown only while a panel
   is up — on the index it would be a second copy of a button already
   there.

   It steps aside for a project panel: those have their own furniture in
   that corner, and the request was for every panel except those.

   It watches the two attributes the panels already set on <html> rather
   than asking each of them to report in. Nothing new has to be
   remembered when the next panel is written. */

export default function PanelNav() {
  const [over, setOver] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    const read = () => {
      const panel = root.hasAttribute('data-overlay')
      const work = root.hasAttribute('data-work')
      setOver(panel && !work)
    }
    read()
    const watch = new MutationObserver(read)
    watch.observe(root, { attributes: true, attributeFilter: ['data-overlay', 'data-work'] })
    return () => watch.disconnect()
  }, [])

  // The menu must not be left hanging open over a panel that has closed.
  useEffect(() => {
    if (!over) setOpen(false)
  }, [over])

  if (!over) return null

  return (
    <div className="panelnav">
      <button
        className="panelnav__button"
        type="button"
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path className="panelnav__route" d="M 4 6 L 11 6 L 15 10 L 20 10" />
          <path className="panelnav__route" d="M 4 18 L 9 18 L 13 14 L 20 14" />
          <circle cx="4" cy="6" r="1.9" />
          <circle cx="20" cy="10" r="1.9" />
          <circle cx="4" cy="18" r="1.9" />
          <circle cx="20" cy="14" r="1.9" />
        </svg>
      </button>

      <Menu open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
