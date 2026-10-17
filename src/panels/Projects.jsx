import { useEffect, useRef, useState } from 'react'
import { categories, projectsIn, toBinary } from '../lib/content'
import { detailFor } from '../lib/work'
import ProjectPanel from '../components/ProjectPanel'

/* Panel two: the work, on a dial.

   The selector is a rotary encoder — the disc you find on the side of a
   piece of lab equipment. Scrolling turns it through the categories, and
   whichever reaches the marker at three o'clock has its projects listed
   beside it.

   The rotation is a CSS custom property driven from scroll, so turning
   the wheel costs nothing; React is only told when the selection
   actually changes. */

const STEP = 360 / Math.max(categories.length, 1)
const TEETH = 72

export default function Projects() {
  const section = useRef(null)
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(null)

  useEffect(() => {
    const element = section.current
    if (!element) return

    let frame = null
    let current = -1

    const apply = () => {
      frame = null
      const travel = element.offsetHeight - window.innerHeight
      const top = element.getBoundingClientRect().top
      const p = travel > 0 ? Math.min(1, Math.max(0, -top / travel)) : 0

      // One step per category, so each passes the marker exactly once.
      const turns = p * (categories.length - 1)
      element.style.setProperty('--angle', (-turns * STEP).toFixed(3))

      const index = Math.round(turns)
      if (index !== current) {
        current = index
        setActive(index)
      }
    }

    const onScroll = () => {
      if (frame === null) frame = requestAnimationFrame(apply)
    }

    apply()
    const onPop = () => setOpen(null)

    /* Opening a project from somewhere else on the site — the CV links
       into these panels by slug. Same two steps the dial's own buttons
       take, so a project opened this way behaves identically and the
       back button still closes it. */
    const onAsk = (event) => {
      const detail = detailFor(event.detail?.slug)
      if (!detail) return
      setOpen(detail)
      window.history.pushState({ work: event.detail.slug }, '', `/work/${event.detail.slug}`)
    }

    window.addEventListener('work:open', onAsk)
    window.addEventListener('popstate', onPop)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('work:open', onAsk)
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [])

  /* The rest of the site needs to know a project is up: the persistent
     menu button steps out of the way while one is open, because a
     project panel has its own furniture in that corner. */
  useEffect(() => {
    const root = document.documentElement
    if (open) root.setAttribute('data-work', 'open')
    else root.removeAttribute('data-work')
    return () => root.removeAttribute('data-work')
  }, [open])

  const selected = categories[active] ?? categories[0]
  const listed = projectsIn(selected.id)

  return (
    <section
      className="projects"
      id="projects"
      ref={section}
      style={{ '--count': categories.length }}
    >
      <div className="projects__sticky">
        <p className="projects__label">SELECTED WORK</p>

        <div className="dial">
          {/* the encoder disc */}
          <svg className="dial__disc" viewBox="-100 -100 200 200" aria-hidden="true">
            <circle className="dial__rim" r="92" />
            <circle className="dial__rim dial__rim--inner" r="66" />

            {/* slots around the rim, the part that actually reads rotation */}
            {Array.from({ length: TEETH }, (_, i) => {
              const a = (i / TEETH) * Math.PI * 2
              return (
                <line
                  key={i}
                  className="dial__tooth"
                  x1={Math.cos(a) * 92}
                  y1={Math.sin(a) * 92}
                  x2={Math.cos(a) * (i % 6 === 0 ? 80 : 86)}
                  y2={Math.sin(a) * (i % 6 === 0 ? 80 : 86)}
                />
              )
            })}

            {/* a spoke and a pad per category */}
            {categories.map((category, i) => {
              const a = ((i * STEP) / 180) * Math.PI
              return (
                <g key={category.id} className="dial__spoke" data-active={i === active}>
                  <line x1={Math.cos(a) * 24} y1={Math.sin(a) * 24} x2={Math.cos(a) * 64} y2={Math.sin(a) * 64} />
                  <circle cx={Math.cos(a) * 66} cy={Math.sin(a) * 66} r="4.5" />
                  <circle className="dial__drill" cx={Math.cos(a) * 66} cy={Math.sin(a) * 66} r="1.8" />
                </g>
              )
            })}

            {/* the part in the middle of it all */}
            <rect className="dial__hub" x="-19" y="-19" width="38" height="38" rx="5" />
            {[-10, 0, 10].map((o) => (
              <g key={o} className="dial__pin">
                <line x1={o} y1="-19" x2={o} y2="-25" />
                <line x1={o} y1="19" x2={o} y2="25" />
                <line x1="-19" y1={o} x2="-25" y2={o} />
                <line x1="19" y1={o} x2="25" y2={o} />
              </g>
            ))}
          </svg>

          {/* the category names, riding the same rotation */}
          <ul className="dial__titles">
            {categories.map((category, i) => (
              <li
                className="dial__title"
                key={category.id}
                data-active={i === active}
                data-distance={Math.min(
                  Math.abs(i - active),
                  categories.length - Math.abs(i - active)
                )}
                style={{ '--a': i * STEP }}
              >
                <span className="dial__row">
                  <span className="dial__index">{toBinary(i + 1)}</span>
                  <span className="dial__name">{category.label}</span>
                </span>
              </li>
            ))}
          </ul>

          {/* where the reading is taken */}
          <div className="dial__marker" aria-hidden="true">
            <svg viewBox="0 0 40 20">
              <path d="M 0 10 L 16 10 M 16 4 L 16 16" />
              <circle cx="22" cy="10" r="3.5" />
            </svg>
          </div>
        </div>

        <div className="readout">
          <p className="readout__count">
            {toBinary(active + 1)}
            <span> / {toBinary(categories.length)}</span>
          </p>
          <p className="readout__kicker">{selected.note}</p>

          {/* what is filed here. A project's own category lists it in full;
              the others list it as a cross-reference to where it leads. */}
          <ul className="sheet-list" key={selected.id}>
            {listed.map((project, i) => {
              const bridges = project.tags.filter((t) => t !== selected.id)
              return (
                <li
                  className="sheet-list__item"
                  key={project.slug}
                  data-lead={project.lead === selected.id}
                  style={{ '--delay': `${i * 70}ms` }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      const detail = detailFor(project.slug)
                      if (!detail) return
                      setOpen(detail)
                      // Linkable, and the back button closes it.
                      window.history.pushState({ work: project.slug }, '', `/work/${project.slug}`)
                    }}
                    disabled={!detailFor(project.slug)}
                  >
                    {project.org && (
                      <img
                        className="sheet-list__mark"
                        src={project.org.mark}
                        alt={project.org.name}
                        title={project.org.name}
                        loading="lazy"
                      />
                    )}
                    <span className="sheet-list__title">{project.title}</span>
                    <span className="sheet-list__year">{project.year}</span>
                  </button>
                  {bridges.length > 0 && (
                    <span className="sheet-list__bridge">
                      also{' '}
                      {bridges
                        .map((t) => categories.find((c) => c.id === t)?.label ?? t)
                        .join(' · ')}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <ProjectPanel
        project={open}
        onClose={() => {
          setOpen(null)
          if (window.history.state?.work) window.history.back()
        }}
      />
    </section>
  )
}
