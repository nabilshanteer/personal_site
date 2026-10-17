import { useRef, useState } from 'react'
import { email } from '../lib/contact'
import { DIAL, DEFAULT_ISO, assemble, exampleFor, phoneLooksOff } from '../lib/dial'

/* The message form.

   It posts to /api/contact, which pushes the message to my phone and
   emails a copy if a mail provider is configured. If neither is, it
   falls back to opening a prefilled mail draft rather than swallowing
   what someone just took the trouble to write. Either way the words
   survive the button.

   Name, address and message are required; the address because there is
   no way to answer without one. A phone number is offered and not
   demanded: asking for one is reasonable, needing one is not.

   The browser's own validation is turned off and done here instead. The
   native bubble is a grey tooltip in the system font that appears over
   the page and vanishes on the next click — it looks like it belongs to
   a different website, and it is gone by the time you have read it.

   Sending does not take the form away. Someone who has just sent a
   message is the single most likely person to send another — they
   remembered something, or they left a line out — so the form stays
   where it is with the message cleared and who they are kept, and the
   confirmation sits by the button. Three an hour, after which it says
   when they can write again.

   Nothing is stored anywhere, beyond the times of their own last few
   sends, which stay in their browser. */

const EMPTY = { name: '', from: '', iso: DEFAULT_ISO, phone: '', body: '' }

const LIMIT = 3
const WINDOW = 60 * 60 * 1000
const LEDGER = 'contact:sent'

/* When they last sent, from their own browser.

   This is the civil half of the limit: it is what lets the form say
   "you can write again at ten past" instead of refusing with no
   explanation. It is not the enforcement — anyone can clear it, so the
   route keeps its own count and is the one that actually says no. */
function ledger() {
  try {
    const raw = JSON.parse(window.localStorage.getItem(LEDGER) || '[]')
    const now = Date.now()
    return (Array.isArray(raw) ? raw : []).filter((t) => typeof t === 'number' && now - t < WINDOW)
  } catch {
    // Private windows and blocked storage both throw. Not a reason to
    // stop anyone writing.
    return []
  }
}

function remember(times) {
  try {
    window.localStorage.setItem(LEDGER, JSON.stringify(times))
  } catch {
    /* nothing to do about it */
  }
}

const clock = (at) =>
  new Date(at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

const looksLikeEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)

/* Said the way the rest of the page is written, rather than the way a
   browser says it. */
function faults(form) {
  const out = {}
  if (!form.name.trim()) out.name = 'A name, so I know who wrote.'

  const from = form.from.trim()
  if (!from) out.from = 'I cannot write back without an address.'
  else if (!from.includes('@')) out.from = 'An email address needs an @ in it.'
  else if (!looksLikeEmail(from)) out.from = 'That address does not look right — check it for a typo.'

  const phone = phoneLooksOff(form.phone)
  if (phone) out.phone = phone

  if (!form.body.trim()) out.body = 'The message is empty.'
  return out
}

export default function Message() {
  const [form, setForm] = useState(EMPTY)
  const [state, setState] = useState('idle') // idle | sending | sent | draft
  const [problem, setProblem] = useState('')
  const [tried, setTried] = useState(false)
  const [touched, setTouched] = useState({})
  const [sends, setSends] = useState(ledger)
  const fields = useRef({})

  const set = (field) => (event) => {
    // Typing again puts the last send behind them.
    if (state === 'sent' || state === 'draft') setState('idle')
    setForm({ ...form, [field]: event.target.value })
  }
  const leave = (field) => () => setTouched((was) => ({ ...was, [field]: true }))

  const bad = faults(form)
  // Nothing is marked wrong until it has been left, or until the button
  // has been pressed. Complaining at someone mid-word is its own fault.
  const showing = (field) => ((tried || touched[field]) && bad[field]) || null

  const left = Math.max(0, LIMIT - sends.length)
  const freeAt = sends.length >= LIMIT ? sends[0] + WINDOW : null

  // What the number will look like when it arrives: country code in
  // front, trunk zero dropped.
  const dialled = assemble(form.iso, form.phone)

  const draft = () => {
    const subject = `Website message from ${form.name.trim()}`
    const sign = [`— ${form.name.trim()}`, form.from.trim(), dialled].filter(Boolean).join('\n')
    const body = `${form.body.trim()}\n\n${sign}`
    window.location.href = `mailto:${email()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setState('draft')
  }

  const send = async (event) => {
    event.preventDefault()
    setTried(true)
    if (state === 'sending') return

    if (freeAt) {
      setProblem(`That is ${LIMIT} within the hour. You can write again at ${clock(freeAt)}.`)
      return
    }

    const wrong = Object.keys(bad)
    if (wrong.length) {
      // Put the cursor on the first thing that needs fixing.
      fields.current[wrong[0]]?.focus()
      return
    }

    setState('sending')
    setProblem('')

    try {
      const reply = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // The route wants one number, already assembled.
        body: JSON.stringify({
          name: form.name,
          from: form.from,
          phone: dialled,
          body: form.body,
        }),
      })
      const data = await reply.json().catch(() => ({}))

      if (reply.ok) {
        const now = [...sends, Date.now()]
        setSends(now)
        remember(now)
        // Who they are stays; the message goes. They can write the next
        // one without filling the top of the form in again.
        setForm({ ...form, body: '' })
        setTried(false)
        setTouched({})
        setState('sent')
        window.setTimeout(() => fields.current.body?.focus(), 60)
        return
      }

      /* Turned away for sending too much. Opening a mail draft here
         would be handing them the way around the limit, so this one
         stops at saying so. */
      if (reply.status === 429) {
        const mins = Number(data.retryInMinutes) || 60
        const until = Date.now() + mins * 60 * 1000
        const full = Array.from({ length: LIMIT }, (_, i) => until - WINDOW + i)
        setSends(full)
        remember(full)
        setState('idle')
        setProblem(`${data.error || 'Too many messages.'} You can write again at ${clock(until)}.`)
        return
      }

      // Nothing would take it. Hand the words to their own mail client
      // rather than losing them.
      setProblem(data.error || 'Could not send from here.')
      draft()
    } catch {
      setProblem('Could not send from here.')
      draft()
    }
  }

  const note = (field) =>
    showing(field) ? (
      <em className="message__bad" id={`bad-${field}`} role="alert">
        {bad[field]}
      </em>
    ) : null

  const wire = (field) => ({
    ref: (node) => {
      fields.current[field] = node
    },
    value: form[field],
    onChange: set(field),
    onBlur: leave(field),
    /* The on-screen keyboard covers the lower half of the screen, and
       the field it just opened for is often under it. Bringing the field
       to the middle of what is left is the difference between being able
       to reach the message box and not. The wait is the keyboard's own
       animation — scrolling before it has arrived scrolls to where the
       field used to be. */
    onFocus: (event) => {
      const node = event.currentTarget
      window.setTimeout(() => {
        node.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }, 320)
    },
    'aria-invalid': showing(field) ? true : undefined,
    'aria-describedby': showing(field) ? `bad-${field}` : undefined,
  })

  return (
    /* noValidate: the checking happens above, in the page's own voice. */
    <form className="message" onSubmit={send} noValidate>
      <div className="message__row">
        <label data-bad={!!showing('name')}>
          <span>FULL NAME</span>
          <input type="text" maxLength={120} {...wire('name')} />
          {note('name')}
        </label>
        <label data-bad={!!showing('from')}>
          <span>E-MAIL</span>
          <input type="email" maxLength={160} {...wire('from')} />
          {note('from')}
        </label>
      </div>

      {/* Its own sub-section: a country and a number are one answer
          given in two parts, and splitting them is what stops a number
          arriving without enough of it to dial. */}
      <fieldset className="message__block">
        <legend>PHONE NUMBER — OPTIONAL</legend>

        <div className="message__dial">
          <label>
            <span>COUNTRY</span>
            <select value={form.iso} onChange={set('iso')} autoComplete="tel-country-code">
              {DIAL.map((country) => (
                <option key={country.iso} value={country.iso}>
                  {country.name} ({country.code})
                </option>
              ))}
            </select>
          </label>

          <label data-bad={!!showing('phone')}>
            <span>NUMBER</span>
            <input
              type="tel"
              inputMode="tel"
              maxLength={24}
              autoComplete="tel-national"
              /* The shape a number takes where they are, which changes
                 with the country beside it. */
              placeholder={exampleFor(form.iso)}
              {...wire('phone')}
            />
            {note('phone')}
          </label>
        </div>

        {dialled && !showing('phone') && <p className="message__dialled">Sends as {dialled}</p>}
      </fieldset>

      <label data-bad={!!showing('body')}>
        <span>MESSAGE</span>
        <textarea rows={5} maxLength={4000} {...wire('body')} />
        {note('body')}
      </label>

      <div className="message__send">
        <button type="submit" disabled={state === 'sending' || !!freeAt}>
          {state === 'sending' ? 'SENDING…' : 'SEND'}
        </button>

        {state === 'sent' && (
          <span className="message__done" role="status">
            Sent — it is on my phone.
            {left > 0
              ? ` Write another if you need to.`
              : ` That is ${LIMIT} within the hour; you can write again at ${clock(sends[0] + WINDOW)}.`}
          </span>
        )}

        {state === 'draft' && (
          <span className="message__note">Opened in your mail app instead — {problem}</span>
        )}
        {state !== 'draft' && state !== 'sent' && problem && (
          <span className="message__note">{problem}</span>
        )}
      </div>
    </form>
  )
}
