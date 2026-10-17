/* The agent's only server-side piece.

   It exists for one reason: the API key must never reach the browser.
   The page sends a question and the passages it retrieved; this adds the
   key, calls the provider, and returns the answer. Nothing is stored and
   nothing is logged — there is no memory on this side at all.

   Provider-agnostic, as long as the endpoint speaks the OpenAI chat
   format. Set these in Vercel (Project → Settings → Environment
   Variables), and nowhere else:

     AI_API_KEY    the key. Never commit it, never prefix it VITE_.
     AI_BASE_URL   optional, defaults to Groq's free endpoint
     AI_MODEL      optional

   Groq's free tier is the default because it is fast and needs no card.
   Together, OpenRouter and a self-hosted Ollama all work by changing
   AI_BASE_URL alone. */

const DEFAULT_BASE = 'https://api.groq.com/openai/v1'
/* What this key can actually reach. Groq's catalogue moves around and
   differs per account, so if this ever stops existing, set AI_MODEL in
   the environment rather than editing here — the list is at
   <base>/models. gpt-oss-20b is the faster, lighter alternative. */
const DEFAULT_MODEL = 'openai/gpt-oss-120b'

/* The prompt is built per request, because the assistant lives inside a
   card and the card decides what it is allowed to be about. Everything
   else is fixed. */
const SYSTEM = (scope) => `You answer questions about Nabil Al-Shanteer, on his own website.

Who "he" is:
Every question is about Nabil. He, him, his, they, them and "this person"
all mean him, and so does a question with no subject at all. Never treat a
question as unanswerable because it used a pronoun instead of his name —
that is the same question either way.

What you may say:
Answer only from the passages below. They are extracts from his project
write-ups and his own words about his hobbies. Do not add anything from
general knowledge, and never invent a project, a number, an employer or a
date — a confident wrong answer about his work is worse than no answer.

${
  scope
    ? `What this card is about:
You are the assistant inside the "${scope}" card, and ${scope} is the only
subject you answer on. The passages below are everything that card holds.

If the question is not about ${scope}, do not answer it, and do not answer
it partly. Say in one short line that this card is only about ${scope}, and
that the other cards on this page cover the rest of what he does outside
work. Do not apologise at length, do not guess, and do not reach for
anything you know that is not in the passages.

If the question is about ${scope} but the passages do not cover the
particular thing asked, say plainly that he has not written about that
here.`
    : `Refuse only when the passages genuinely hold nothing relevant. If they
cover part of it, give that part and say what is missing. Several
passages are short descriptions of every project he has; if someone asks
what kind of work he does, those alone are enough to answer from.`
}

How to write:
Plain prose, two or three sentences unless more is asked for. Write as a
knowledgeable third party: "he built", not "I built". Quote his numbers
exactly as they appear, without rounding or converting.

No formatting of any kind. No asterisks, no bold, no headings, no bullet
points, no markdown — this is rendered as plain text, so symbols meant to
become formatting are shown as symbols.`

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'POST only' })
    return
  }

  const key = process.env.AI_API_KEY
  if (!key) {
    response.status(503).json({
      error: 'The assistant is not configured yet (AI_API_KEY is unset).',
    })
    return
  }

  const { question, passages = [], history = [], scope = '' } = request.body ?? {}
  // The card's own name, trimmed and capped — it goes into the prompt.
  const card = String(scope).replace(/[\r\n]+/g, ' ').trim().slice(0, 60)
  if (typeof question !== 'string' || !question.trim()) {
    response.status(400).json({ error: 'No question.' })
    return
  }

  const grounding = passages
    .slice(0, 20)
    .map((p, i) => `[${i + 1}] ${p.text}`)
    .join('\n\n')

  // The last couple of turns ride along so follow-ups like "what
  // microcontroller did they use" resolve. Nothing is kept server side.
  const recent = history
    .slice(-4)
    .filter((m) => m && typeof m.content === 'string')
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content.slice(0, 1200),
    }))

  try {
    const reply = await fetch(`${process.env.AI_BASE_URL || DEFAULT_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || DEFAULT_MODEL,
        temperature: 0.2,
        max_tokens: 400,
        messages: [
          { role: 'system', content: SYSTEM(card) },
          {
            role: 'system',
            content: grounding
              ? `Passages:\n\n${grounding}`
              : 'No passages were retrieved. Say the page does not cover it.',
          },
          ...recent,
          { role: 'user', content: question.slice(0, 600) },
        ],
      }),
    })

    if (!reply.ok) {
      const detail = await reply.text()
      response.status(502).json({
        error: 'The model did not answer.',
        detail: detail.slice(0, 300),
      })
      return
    }

    const data = await reply.json()
    const answer = data?.choices?.[0]?.message?.content?.trim()
    response.status(200).json({ answer: answer || 'No answer came back.' })
  } catch (error) {
    response.status(502).json({ error: 'Could not reach the model.' })
  }
}
