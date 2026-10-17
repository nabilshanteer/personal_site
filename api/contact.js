/* Sending a message from the contact form.

   Like the assistant's route, this exists so a key never reaches the
   browser. It delivers down two independent channels, and a message
   counts as delivered if either one of them worked:

   1. A push to your phone, via a Telegram bot. This is the notification.
        TELEGRAM_BOT_TOKEN   from @BotFather
        TELEGRAM_CHAT_ID     your own chat with the bot

   2. An email, via Resend — free tier, no card. This is the copy you
      keep, and its reply-to is set to the sender, so replying goes
      straight back to them.
        MAIL_API_KEY
        MAIL_TO     where messages land. Defaults to the address on the page.
        MAIL_FROM   the sender the provider is allowed to send as

   Configure one, or both. Until at least one is set this returns 503 and
   says so, and the form falls back to opening a mail draft — so a
   message is never lost just because the plumbing is not finished.

   Nothing is stored here. The message is passed on and forgotten. */

const RESEND = 'https://api.resend.com/emails'

/* --- leaning on the button ---------------------------------------------- */

/* Three an hour from one address. The page enforces this too, but the
   page is a suggestion — anyone can reload past it, or skip the form and
   post here directly — so the number that counts is this one.

   Held in memory, which means it is per server instance and is forgotten
   on a cold start. On Vercel that makes it a speed bump rather than a
   wall: it stops the ordinary case, a hand on the button or a careless
   script, and someone determined could wait out an instance. A real
   limit needs shared storage (Vercel KV, Upstash) and is the upgrade if
   this is ever actually abused — not worth the dependency before then.

   Note it keys on IP, so an office behind one NAT shares an allowance.
   At three an hour that is a trade worth making. */
const WINDOW = 60 * 60 * 1000
const LIMIT = 3
const seen = new Map()

function recent(who) {
  const now = Date.now()
  const times = (seen.get(who) ?? []).filter((t) => now - t < WINDOW)
  if (times.length) seen.set(who, times)
  else seen.delete(who)
  return times
}

/* Minutes until the oldest of the three falls out of the window, or 0 if
   there is room. Checked before sending and recorded only after, so a
   message that failed to go anywhere does not cost an allowance. */
function waitFor(who) {
  const times = recent(who)
  if (times.length < LIMIT) return 0
  return Math.max(1, Math.ceil((WINDOW - (Date.now() - times[0])) / 60000))
}

function record(who) {
  // A long-lived instance should not accumulate callers for ever.
  if (seen.size > 5000) seen.clear()
  const times = recent(who)
  times.push(Date.now())
  seen.set(who, times)
}

/* Behind a proxy the socket address is the proxy's. Vercel puts the real
   one at the front of x-forwarded-for; anything after it was supplied by
   whoever called, so only the first entry is worth reading. */
function caller(request) {
  const fwd = request.headers?.['x-forwarded-for']
  const first = String(Array.isArray(fwd) ? fwd[0] : fwd || '').split(',')[0].trim()
  return first || request.headers?.['x-real-ip'] || request.socket?.remoteAddress || 'unknown'
}

const clip = (value, max) => String(value ?? '').slice(0, max).trim()

/* A header injected through a reply-to would let someone send mail that
   looks like it came from here. The address is checked rather than
   trusted, and newlines are stripped from everything that lands in a
   header. */
const safeHeader = (value) => clip(value, 200).replace(/[\r\n]+/g, ' ')
const looksLikeEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)

/* The push. Sent as plain text with no parse_mode on purpose: with
   Markdown or HTML parsing on, a stray bracket in someone's message is
   enough to make Telegram reject the whole send, and a deliberate one
   could dress up a link. Plain text cannot be made to mean anything. */
async function push(note) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chat = process.env.TELEGRAM_CHAT_ID
  if (!token || !chat) return null

  try {
    const sent = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chat,
        text: note,
        disable_web_page_preview: true,
      }),
    })
    return sent.ok
  } catch {
    return false
  }
}

async function mail({ name, from, phone, body }) {
  const key = process.env.MAIL_API_KEY
  if (!key) return null

  const lines = [body, '', `— ${name}`, from]
  if (phone) lines.push(phone)

  try {
    const sent = await fetch(RESEND, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || 'Website <onboarding@resend.dev>',
        to: [process.env.MAIL_TO || 'nabilshanteer03@gmail.com'],
        reply_to: safeHeader(from),
        subject: `Website message from ${safeHeader(name)}`,
        text: lines.join('\n'),
      }),
    })
    return sent.ok
  } catch {
    return false
  }
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'POST only' })
    return
  }

  const name = clip(request.body?.name, 120)
  const from = clip(request.body?.from, 160)
  const phone = clip(request.body?.phone, 40)
  const body = clip(request.body?.body, 4000)

  if (!name || !from || !body) {
    response.status(400).json({ error: 'Name, address and message are all needed.' })
    return
  }
  if (!looksLikeEmail(from)) {
    response.status(400).json({ error: 'That address does not look right.' })
    return
  }

  const who = caller(request)
  const wait = waitFor(who)
  if (wait) {
    response.status(429).json({
      error: `That is ${LIMIT} within the hour.`,
      retryInMinutes: wait,
    })
    return
  }

  const note = [
    `New message from the site`,
    ``,
    `${name}`,
    `${from}`,
    ...(phone ? [`${phone}`] : []),
    ``,
    body,
  ].join('\n')

  /* Both at once. One failing does not hold up the other, and the
     message counts as delivered if either arrived — a push that got
     through is a message received, whatever the mail provider did. */
  const [pushed, mailed] = await Promise.all([push(note), mail({ name, from, phone, body })])

  if (pushed === null && mailed === null) {
    response.status(503).json({ error: 'sending is not set up yet' })
    return
  }

  if (pushed || mailed) {
    // Only a message that actually went somewhere costs an allowance.
    record(who)
    const left = Math.max(0, LIMIT - recent(who).length)
    response.status(200).json({ sent: true, by: { push: !!pushed, mail: !!mailed }, left })
    return
  }

  response.status(502).json({ error: 'nothing would accept it' })
}
