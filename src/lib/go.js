/* Where this site goes, and how to get there.

   Three of the four are sequences that start where you are rather than
   pages to navigate to, so they are dispatched as events and the panel
   listening for one opens itself. The portfolio is the work section
   further down the same page.

   Whatever panel is open stands down first — unless it is the one being
   asked for, which would otherwise shut the page someone just chose. */

export const DESTINATIONS = [
  { id: 'work', label: 'PORTFOLIO' },
  { id: 'about', label: 'ABOUT', event: 'about:open' },
  { id: 'cv', label: 'CV', event: 'cv:open' },
  { id: 'contact', label: 'CONTACT', event: 'contact:open' },
]

export function go(destination) {
  // Already here. Re-running a panel over itself looks like the page
  // reopening half-built.
  if (destination.event && document.documentElement.dataset.panel === destination.id) return

  window.dispatchEvent(
    new CustomEvent('panel:exit', { detail: { next: destination.event ?? 'work' } })
  )

  if (!destination.event) {
    // After the panel has gone, or the scroll happens behind something
    // still covering the page.
    window.setTimeout(() => {
      document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })
    }, 160)
    return
  }

  window.dispatchEvent(new CustomEvent(destination.event))
}
