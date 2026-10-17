/* Retrieval, in the browser.

   The knowledge file is small — a hundred-odd passages — so finding the
   relevant ones is a scoring pass over an array rather than anything
   that needs a vector database. It costs nothing, needs no key, and runs
   before a single token is sent anywhere.

   Doing it here rather than on the server is deliberate: the serverless
   function stays a thin pipe with a secret in it, which is the only
   thing it should be. */

let cache = null

const STOP = new Set(
  `a an and are as at be but by for from has have he her his how i in is it
   its of on or that the their them they this to was were what when where
   which who why with you your did does do done nabil`.split(/\s+/)
)

/* Crude stemming, applied to the question and to the pages alike.

   Without it "electronic projects" and "electronics project" are four
   different words and match nothing in common, which is exactly the sort
   of near-miss that makes a search feel broken. Trimming a trailing
   plural is most of the benefit for none of the weight of a real
   stemmer. */
const stem = (word) =>
  word.length > 4 && word.endsWith('s') && !word.endsWith('ss')
    ? word.slice(0, -1)
    : word

/* Words people ask with, against words the pages are written in.

   "What microcontroller did they use" finds nothing on its own, because
   the page says "Pi Pico" and never says microcontroller. This is a
   small, honest bridge for the handful of terms where the question and
   the answer use different vocabulary — not a thesaurus, and not a
   substitute for the model reading the passage. */
const ALIASES = {
  microcontroller: ['pico', 'stm32', 'arduino', 'mcu', 'firmware', 'embedded', 'raspberry'],
  mcu: ['pico', 'microcontroller', 'stm32'],
  electronics: ['circuit', 'pcb', 'laser', 'embedded', 'hardware', 'diy', 'soldering'],
  diy: ['electronics', 'circuit', 'build', 'hardware'],
  recent: ['2026', '2025', 'latest'],
  latest: ['2026', '2025', 'recent'],
  chip: ['fpga', 'silicon', 'neuromorphic', 'pico'],
  ai: ['llm', 'model', 'agent', 'neural'],
  model: ['llm', 'neural', 'network', 'claude'],
  language: ['llm', 'nlp', 'rlhf'],
  robot: ['pendulum', 'nxtway', 'balancing', 'control'],
  camera: ['vision', 'opencv', 'surveillance', 'image'],
  degree: ['meng', 'southampton', 'university'],
  job: ['internship', 'bloctopus', 'client', 'role'],
  work: ['internship', 'project', 'role'],
}

const STEMMED = Object.fromEntries(
  Object.entries(ALIASES).map(([key, list]) => [stem(key), list.map(stem)])
)

const expand = (asked) => {
  const out = new Set(asked)
  for (const word of asked) {
    for (const extra of STEMMED[word] ?? []) out.add(extra)
  }
  return [...out]
}

const words = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map(stem)

export async function knowledge() {
  if (cache) return cache
  try {
    const reply = await fetch('/data/knowledge.json')
    if (!reply.ok) return null
    const data = await reply.json()

    // How rare each word is across the corpus. A passage matching
    // "microcontroller" should count for far more than one matching
    // "project", and this is what makes that happen.
    const seen = new Map()
    for (const passage of data.passages) {
      for (const word of new Set(words(passage.text))) {
        seen.set(word, (seen.get(word) ?? 0) + 1)
      }
    }
    const total = data.passages.length
    const weight = new Map()
    for (const [word, n] of seen) weight.set(word, Math.log(1 + total / n))

    cache = { ...data, weight, tokens: data.passages.map((p) => words(p.text)) }
    return cache
  } catch {
    return null
  }
}

/* The passages most likely to answer this question.

   `topic` is the bubble the question was asked from, and it is a fence
   rather than a preference. Each card is about one thing; the assistant
   inside it answers on that thing and nothing else, so what it can see
   is cut down to that card's own passages before anything is scored.

   This used to favour the topic and keep everything else in view, on the
   grounds that refusing a fair question because it came from the wrong
   card would be absurd. It also meant four cards that all answered the
   same way, which made having four of them pointless. */
export async function retrieve(question, topic, take = 8) {
  const base = await knowledge()
  if (!base) return []

  const asked = expand(words(question))
  if (!asked.length) return []

  const inScope = topic
    ? base.passages
        .map((passage, i) => ({ passage, i }))
        .filter(({ passage }) => passage.topics?.includes(topic))
    : base.passages.map((passage, i) => ({ passage, i }))

  if (!inScope.length) return []

  const scored = inScope.map(({ passage, i }) => {
    const text = base.tokens[i]
    let score = 0
    for (const word of asked) {
      if (!text.includes(word)) continue
      score += base.weight.get(word) ?? 1
      // A word in the title is a stronger signal than one in the body.
      if (passage.title.toLowerCase().includes(word)) score += 0.6
    }
    // Longer passages match more words by accident; lean against that.
    return { passage, score: score / Math.sqrt(4 + text.length / 24) }
  })

  const best = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, take)
    .map((s) => s.passage)

  /* Nothing in this card matched the question. Its own text goes anyway,
     so the model can see what the card actually covers and say so,
     rather than being handed nothing and left to guess whether it is
     refusing because the subject is wrong or because the search broke.

     Within a card the limit also goes: a hobby has a paragraph or two,
     and showing all of it costs less than one project passage. */
  if (!best.length) return inScope.slice(0, take).map(({ passage }) => passage)

  return best
}

/* Ask. Retrieval happens here; the key lives on the server. */
export async function ask(question, topic, history = [], scope = '') {
  const passages = await retrieve(question, topic)

  const reply = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    // `scope` is what the card is called, so the refusal can name it.
    body: JSON.stringify({ question, passages, history, scope }),
  })

  const data = await reply.json().catch(() => ({}))
  if (!reply.ok) {
    return { error: data.error || 'The assistant is not answering right now.' }
  }
  return { answer: data.answer, used: passages.map((p) => p.title) }
}
