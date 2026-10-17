import { useCallback, useEffect, useRef, useState } from 'react'
import { categories } from '../lib/content'
import FigureBand from './FigureBand'
import DiagramViewer from './DiagramViewer'

/* A project, opened over the dial.

   An overlay rather than a page: the wheel keeps its position, the
   backdrop never reloads, and closing puts you back exactly where you
   were. The URL is still pushed, so a project is linkable and the back
   button does what it should.

   Order is deliberate — result before method. The numbers are the second
   thing on the page, because they are the first thing an engineer looks
   for and the thing most portfolios leave out. */

export default function ProjectPanel({ project, onClose }) {
  const [zoomed, setZoomed] = useState(null)
  /* One figure, shown full size. The hero opens this rather than the
     diagram viewer: clicking the picture you are looking at should
     enlarge that picture, not open a set it is not part of. */
  const [lightbox, setLightbox] = useState(null)
  /* Both overlays play their exit before they go, so a dismissal reads as
     the picture receding rather than as the picture vanishing. */
  const [shutting, setShutting] = useState(null)
  const [focus, setFocus] = useState(0)
  const [closing, setClosing] = useState(false)
  const scroller = useRef(null)

  /* Closing plays out before the panel goes: the sheet drops away and
     the dial behind it comes back. The unmount waits for it. */
  const dismiss = useCallback(() => {
    setClosing(true)
    window.setTimeout(() => {
      setClosing(false)
      onClose()
    }, 420)
  }, [onClose])

  /* Close on a delay that matches the animation, so the frame that plays
     it is still mounted while it plays. */
  const retire = useCallback((which) => {
    setShutting(which)
    window.setTimeout(() => {
      if (which === 'lightbox') setLightbox(null)
      else setZoomed(null)
      setShutting(null)
    }, 300)
  }, [])

  useEffect(() => {
    if (!project) return
    setClosing(false)

    const onKey = (event) => {
      if (event.key !== 'Escape') return
      if (lightbox) retire('lightbox')
      else if (zoomed) retire('viewer')
      else dismiss()
    }
    window.addEventListener('keydown', onKey)

    // The page behind must not scroll while this is over it.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (scroller.current) scroller.current.scrollTop = 0

    // Whichever block sits closest to where the eye is reading gets the
    // light; everything else steps back until you reach it.
    const sheet = scroller.current
    let frame = null

    const mark = () => {
      frame = null
      if (!sheet) return
      const line = sheet.clientHeight * 0.38
      const blocks = sheet.querySelectorAll('.work__block')
      let best = 0
      let bestGap = Infinity
      blocks.forEach((block, i) => {
        const box = block.getBoundingClientRect()
        const sheetBox = sheet.getBoundingClientRect()
        const middle = box.top - sheetBox.top + box.height / 2
        const gap = Math.abs(middle - line)
        if (gap < bestGap) {
          bestGap = gap
          best = i
        }
      })
      setFocus(best)
    }

    const onScroll = () => {
      if (frame === null) frame = requestAnimationFrame(mark)
    }
    sheet?.addEventListener('scroll', onScroll, { passive: true })
    mark()

    return () => {
      window.removeEventListener('keydown', onKey)
      sheet?.removeEventListener('scroll', onScroll)
      if (frame !== null) cancelAnimationFrame(frame)
      document.body.style.overflow = previous
    }
  }, [project, zoomed, lightbox, dismiss, retire])

  if (!project) return null

  // Every list is optional: a project written up later may not have all
  // of these, and a missing field should not take the panel down.
  const sets = project.diagramSets ?? []
  // Flattened for the bands, but each figure remembers its set, so
  // clicking one opens the sequence it belongs to rather than itself.
  const figures = sets.flatMap((set) =>
    [...(set.legend ? [set.legend] : []), ...set.figures].map((figure) => ({ ...figure, set: set.id }))
  )
  /* The blocks, in order, with anything empty dropped — a project with
     no iterations should not show an ITERATIONS heading over nothing.

     `pairWithPrevious` ties a block to the one before it so they light
     together: BUILT WITH is a short list that sits under OUTCOME, and on
     its own the reading line never reaches it. */
  const sections = [
    { title: 'THE PROBLEM', body: project.problem },
    { title: 'THE APPROACH', body: project.solution },
    { title: 'ITERATIONS', steps: project.iterations },
    { title: 'MY PART IN IT', list: project.contribution },
    { title: 'OUTCOME', body: project.outcome },
    { title: 'BUILT WITH', chips: project.stack, side: 'left', pairWithPrevious: true },
  ]
    .filter((section) => (section.body ?? section.steps ?? section.list ?? section.chips ?? []).length > 0)
    .map((section, index, all) => ({
      ...section,
      // Paired blocks share the group of the block above them.
      group: all.slice(0, index + 1).filter((s) => !s.pairWithPrevious).length,
    }))

  const half = Math.ceil(figures.length / 2)
  const topRow = figures.slice(0, half)
  const bottomRow = figures.slice(half)

  return (
    <div className="work" role="dialog" aria-label={project.title} data-closing={closing}>
      <div className="work__sheet" ref={scroller}>
        <button className="work__close" type="button" onClick={dismiss} aria-label="Close project">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M 6 6 L 18 18" />
            <path d="M 18 6 L 6 18" />
          </svg>
        </button>

        {/* --- the part number ------------------------------------- */}
        <header className="work__head">
          {/* Where the work actually lives — top right, before anything
              else, so it is never hunted for at the bottom. */}
          <div className="work__links">
            {/* The document the panel was written from, where a project has
                one. It leads, because a reader who wants the detail wants
                the paper rather than a longer page. */}
            {project.report && (
              <a
                className="work__report"
                href={project.report.href}
                target="_blank"
                rel="noreferrer"
              >
                {project.report.label ?? 'Read Report'}
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M 6 3 L 14 3 L 19 8 L 19 21 L 6 21 Z" />
                  <path d="M 14 3 L 14 8 L 19 8" />
                </svg>
              </a>
            )}

            {(project.links ?? []).map((link) => (
              <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                {link.label}
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M 5 19 L 19 5 M 9 5 L 19 5 L 19 15" />
                </svg>
              </a>
            ))}
          </div>

          <p className="work__eyebrow">
            {project.client} · {project.period}
          </p>
          <h2 className="work__title">{project.title}</h2>
          <p className="work__subtitle">{project.subtitle}</p>
          <p className="work__role">{project.role}</p>

          <ul className="work__pads">
            {(project.tags ?? []).map((tag) => (
              <li key={tag}>{categories.find((c) => c.id === tag)?.label ?? tag}</li>
            ))}
          </ul>

          <p className="work__summary">{project.summary}</p>
        </header>

        {/* --- the numbers ----------------------------------------- */}
        {(project.metrics ?? []).length > 0 && (
        <section className="ratings">
          {(project.metrics ?? []).map((metric, i) => (
            <div className="rating" key={metric.label} style={{ '--delay': `${i * 90}ms` }}>
              <p className="rating__value">
                {metric.value}
                {metric.unit && <span>{metric.unit}</span>}
              </p>
              <p className="rating__label">{metric.label}</p>
              {metric.note && <p className="rating__note">{metric.note}</p>}
            </div>
          ))}
        </section>
        )}

        {/* --- the poster ------------------------------------------- */}
        {(project.hero?.src || project.hero?.video) && (
          <figure className="work__hero">
            {project.hero.video ? (
              /* A film plays in place, with its own controls and its own
                 sound. It is not wrapped in the lightbox button: clicking a
                 video should start it, not open a picture of it. */
              <video
                className="work__film"
                src={project.hero.video}
                poster={project.hero.src}
                controls
                preload="metadata"
                playsInline
              />
            ) : (
              <button type="button" onClick={() => setLightbox(project.hero)}>
                <img src={project.hero.src} alt={project.hero.caption} />
              </button>
            )}
            <figcaption>{project.hero.caption}</figcaption>
          </figure>
        )}

        {/* --- the figures, drifting -------------------------------- */}
        {figures.length > 0 && (
          <section className="band" aria-label="Figures">
            <FigureBand figures={topRow} direction={1} onOpen={(f) => setZoomed(f.set)} />
            {bottomRow.length > 0 && (
              <FigureBand figures={bottomRow} direction={-1} onOpen={(f) => setZoomed(f.set)} />
            )}
          </section>
        )}

        {/* --- the writing: alternating sides, lit where you are reading --- */}
        <div className="run">
          {sections.map((section, index) => (
            <div className="run__node" key={section.title}>
              <section
                className="work__block"
                data-side={section.side ?? (index % 2 === 0 ? 'left' : 'right')}
                data-focus={section.group === sections[focus]?.group}
              >
                <h3>{section.title}</h3>

                {(section.body ?? []).map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}

                {section.steps && (
                  <ol className="steps">
                    {section.steps.map((step) => (
                      <li className="step" key={step.tag}>
                        <span className="step__tag">{step.tag}</span>
                        <div className="step__body">
                          <h4>{step.title}</h4>
                          <p>{step.note}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                {section.list && (
                  <ul className="did">
                    {section.list.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                )}

                {section.chips && (
                  <ul className="chips">
                    {section.chips.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>

            </div>
          ))}
        </div>

      </div>

      {/* --- one figure, full size ---------------------------------- */}
      {lightbox && (
        <div
          className="lightbox"
          role="dialog"
          aria-label={lightbox.caption}
          data-closing={shutting === 'lightbox'}
          onClick={() => retire('lightbox')}
        >
          <img src={lightbox.src} alt={lightbox.caption} />
          {lightbox.caption && <p>{lightbox.caption}</p>}
        </div>
      )}

      {/* --- the diagrams, in order, zoomable ----------------------- */}
      {zoomed && sets.length > 0 && (
        <DiagramViewer
          sets={sets}
          openSet={zoomed}
          onChangeSet={setZoomed}
          closing={shutting === 'viewer'}
          onClose={() => retire('viewer')}
        />
      )}

    </div>
  )
}
