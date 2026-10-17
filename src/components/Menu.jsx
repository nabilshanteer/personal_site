import { useEffect } from 'react'
import { menu } from '../lib/content'

/* The menu.

   Opens from the button it was summoned by: the panel unfolds from its
   top-right corner, a bus line draws down the left of it, and the
   entries arrive one after another off that line — each sitting on its
   own pad, like parts placed along a track.

   Closes on the button, on Escape, or by clicking the space around it. */

/* Which menu entries are panels, and what each one is called while it is
   open — the panels write that name onto <html>, so the menu can tell
   when you have picked the page you are already on. */
const PANELS = {
  '/about': { id: 'about', event: 'about:open' },
  '/contact': { id: 'contact', event: 'contact:open' },
  '/cv': { id: 'cv', event: 'cv:open' },
}

export default function Menu({ open, onClose }) {
  useEffect(() => {
    if (!open) return
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div className="menu" data-open={open ? 'true' : 'false'} aria-hidden={!open}>
      <button className="menu__scrim" type="button" tabIndex={-1} aria-label="Close menu" onClick={onClose} />

      <nav className="menu__panel" aria-label="Menu">
        <svg className="menu__bus" viewBox="0 0 10 300" preserveAspectRatio="none" aria-hidden="true">
          <path d="M 5 0 L 5 300" pathLength="1" />
        </svg>

        <button className="menu__close" type="button" onClick={onClose} aria-label="Close menu">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M 6 6 L 18 18" />
            <path d="M 18 6 L 6 18" />
          </svg>
        </button>

        <ul className="menu__list">
          {menu.map((item, index) => (
            <li className="menu__item" key={item.label} style={{ '--delay': `${120 + index * 65}ms` }}>
              <a
                className="menu__link"
                href={item.href}
                onClick={(event) => {
                  /* About, Contact and the CV are sequences that start
                     here, not pages to go to. Portfolio is the work
                     section further down this same page. Anything else
                     still navigates. */
                  const panel = PANELS[item.href]
                  const scrolls = item.href === '/work'
                  if (!panel && !scrolls) return

                  event.preventDefault()
                  onClose()

                  /* Already here. Dispatching the sequence again would
                     re-run a panel over itself, which looked like the
                     page reopening half-built. Closing the menu is the
                     whole of the right answer. */
                  if (panel && document.documentElement.dataset.panel === panel.id) return

                  // Whatever is open stands down first.
                  window.dispatchEvent(
                    new CustomEvent('panel:exit', { detail: { next: panel?.event ?? 'work' } })
                  )

                  if (scrolls) {
                    // After the panel has gone, or the scroll happens
                    // behind something still covering the page.
                    window.setTimeout(() => {
                      document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })
                    }, 160)
                    return
                  }

                  window.dispatchEvent(new CustomEvent(panel.event))
                }}
              >
                <span className="menu__pad" aria-hidden="true" />
                <span className="menu__label">{item.label}</span>
                <span className="menu__note">{item.note}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
