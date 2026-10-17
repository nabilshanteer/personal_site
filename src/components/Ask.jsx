import { useRef, useState } from 'react'
import { ask } from '../lib/ask'

/* A question box, per bubble.

   It has no memory beyond the open card: the last few turns are held
   here so a follow-up like "what microcontroller did they use" still
   makes sense, and they go when the card closes or the page does.
   Nothing is stored, nothing is sent anywhere but the one request.

   Everything it answers from comes out of the site's own pages, so it
   cannot invent a project — and when the passages do not cover a
   question, it is told to say so rather than fill the gap. */


/* The model is told to write plain prose, and mostly does. When it slips
   and emits markdown anyway, the asterisks used to be shown as
   asterisks. This turns the two it actually reaches for into real
   emphasis, and quietly drops any other stray marks.

   Built as React elements rather than injected HTML: nothing the model
   returns is ever parsed as markup. */
function format(text) {
  const clean = String(text)
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[\s]*[-\u2022]\s+/gm, '')

  return clean.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((piece, i) => {
    if (piece.startsWith('**') && piece.endsWith('**') && piece.length > 4) {
      return <strong key={i}>{piece.slice(2, -2)}</strong>
    }
    if (piece.startsWith('*') && piece.endsWith('*') && piece.length > 2) {
      return <em key={i}>{piece.slice(1, -1)}</em>
    }
    return piece
  })
}

const TURNS = 4 // how much of the exchange rides along with a follow-up

const COARSE =
  typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)')?.matches

export default function Ask({ topic, label }) {
  const coarse = COARSE
  const [thread, setThread] = useState([])
  const [draft, setDraft] = useState('')
  const [waiting, setWaiting] = useState(false)
  const field = useRef(null)

  const send = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    const question = draft.trim()
    if (!question || waiting) return

    setDraft('')
    setWaiting(true)
    const asked = [...thread, { role: 'user', content: question }]
    setThread(asked)

    const reply = await ask(question, topic, asked.slice(-TURNS), label)
    setWaiting(false)
    setThread((current) => [
      ...current,
      reply.error
        ? { role: 'assistant', content: reply.error, failed: true }
        : { role: 'assistant', content: reply.answer },
    ])
    field.current?.focus()
  }

  return (
    <div
      className="ask"
      /* The card toggles open on click; typing in here must not close it. */
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {thread.length > 0 && (
        <ol className="ask__thread">
          {thread.map((turn, i) => (
            <li key={i} data-role={turn.role} data-failed={turn.failed || undefined}>
              {turn.role === 'assistant' ? format(turn.content) : turn.content}
            </li>
          ))}
          {waiting && (
            <li data-role="assistant" data-waiting="true">
              <span /><span /><span />
            </li>
          )}
        </ol>
      )}

      <form className="ask__form" onSubmit={send}>
        <input
          ref={field}
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          /* "Ask about music production…" is wider than a phone's field
             and gets cut mid-word. The card it sits in already says what
             it is about. */
          placeholder={coarse ? 'Ask anything' : `Ask about ${label.toLowerCase()}…`}
          aria-label={`Ask about ${label}`}
          maxLength={300}
        />
        <button type="submit" disabled={waiting || !draft.trim()} aria-label="Ask">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M 4 12 L 20 12 M 14 6 L 20 12 L 14 18" />
          </svg>
        </button>
      </form>

      <p className="ask__note">
        Answers come from this site only, and it forgets everything when you close the card.
      </p>
    </div>
  )
}
