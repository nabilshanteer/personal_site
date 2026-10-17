import { useCallback, useEffect, useRef, useState } from 'react'
import { HOBBIES } from '../lib/about'

/* The notes page.

   Somewhere to put the things the site has no pages about — the music,
   the car, anything else — so the assistant has something to answer
   from. Drop files on it or type straight into it; each note becomes a
   file in knowledge/, which the index reads on the next build.

   It is local only, and says so. A deployed site has a read-only
   filesystem, and an admin page that could write to a live site would
   need an account system this does not want. Add notes here, build,
   deploy. */

const TOPICS = ['', ...HOBBIES.map((h) => h.key)]

async function call(body) {
  const reply = await fetch('/api/knowledge', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  return reply.json().catch(() => ({ error: 'No reply.' }))
}

export default function Admin() {
  const [notes, setNotes] = useState([])
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('')
  const [text, setText] = useState('')
  const [status, setStatus] = useState('')
  const [over, setOver] = useState(false)
  const box = useRef(null)

  const refresh = useCallback(async () => {
    const reply = await call({ action: 'list' })
    if (reply.error) setStatus(reply.error)
    else setNotes(reply.notes ?? [])
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const save = async () => {
    if (!text.trim()) return
    setStatus('saving…')
    const reply = await call({ action: 'save', title, topics: topic, text })
    if (reply.error) {
      setStatus(reply.error)
      return
    }
    setNotes(reply.notes ?? [])
    setTitle('')
    setText('')
    setStatus(`saved ${reply.saved} — run npm run index to pick it up`)
  }

  const remove = async (file) => {
    const reply = await call({ action: 'delete', file })
    setNotes(reply.notes ?? [])
    setStatus(`removed ${file}`)
  }

  /* Dropped files are read here and added as notes, one per file, so a
     folder of text can go in at once. */
  const drop = async (event) => {
    event.preventDefault()
    setOver(false)
    const files = [...(event.dataTransfer?.files ?? [])].filter((f) =>
      /\.(md|txt|markdown)$/i.test(f.name)
    )
    if (!files.length) {
      setStatus('text or markdown files only')
      return
    }
    setStatus(`reading ${files.length} file${files.length > 1 ? 's' : ''}…`)
    let last = null
    for (const file of files) {
      const body = await file.text()
      last = await call({
        action: 'save',
        title: file.name.replace(/\.(md|txt|markdown)$/i, ''),
        topics: topic,
        text: body,
      })
    }
    if (last?.notes) setNotes(last.notes)
    setStatus(`added ${files.length} — run npm run index to pick them up`)
  }

  return (
    <main className="admin">
      <header className="admin__head">
        <p className="admin__eyebrow">KNOWLEDGE</p>
        <h1>What the assistant knows</h1>
        <p className="admin__lede">
          The project pages are read automatically. This is for everything else —
          the music, the car, anything the site has no page about. Notes are saved
          into <code>knowledge/</code> and picked up by <code>npm run index</code>.
        </p>
        <p className="admin__local">
          Local only. Add notes here, then build and deploy — a live site cannot be
          written to.
        </p>
      </header>

      <section
        ref={box}
        className="admin__drop"
        data-over={over}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={drop}
      >
        Drop <code>.md</code> or <code>.txt</code> files here
      </section>

      <section className="admin__write">
        <div className="admin__row">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            {TOPICS.map((t) => (
              <option key={t || 'any'} value={t}>
                {t || 'every section'}
              </option>
            ))}
          </select>
        </div>

        <textarea
          placeholder={
            'Write in paragraphs — each one is indexed separately, so keep each to one thing.\n\n' +
            'I have 36 tracks out. The first went up in…'
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
        />

        <div className="admin__row">
          <button type="button" onClick={save} disabled={!text.trim()}>
            Save note
          </button>
          <span className="admin__status">{status}</span>
        </div>
      </section>

      <section className="admin__list">
        <h2>{notes.length} note{notes.length === 1 ? '' : 's'}</h2>
        {notes.length === 0 && <p className="admin__empty">Nothing yet.</p>}
        <ul>
          {notes.map((note) => (
            <li key={note.file}>
              <span className="admin__name">{note.title}</span>
              <span className="admin__meta">
                {note.topics || 'every section'} · {note.words} words · {note.file}
              </span>
              <button type="button" onClick={() => remove(note.file)} aria-label={`Delete ${note.file}`}>
                remove
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
