/* Build the knowledge base the about-page agent answers from.

   Everything here already exists somewhere in the site — the eleven
   project files, the categories they sit under, and the hobby text. This
   reads those and writes a flat list of passages to
   public/data/knowledge.json, so there is exactly one copy of the truth
   and it cannot drift from what the pages show.

   Retrieval is lexical rather than embedded: the corpus is a couple of
   hundred short passages, which keyword scoring handles well, and it
   costs nothing and runs in the browser. If this ever grows enough to
   need embeddings, this is the file that changes.

   Run:  node scripts/build_index.mjs      (or: npm run index)
*/

import { readdir, mkdir, writeFile, readFile, stat } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const workDir = join(root, 'src', 'lib', 'work')

/* Which bubble a passage belongs to. The technical work all sits under
   the making section — that is where someone would think to ask about a
   microcontroller — and each hobby owns its own words. */
const MAKING = 'making'

const sentence = (value) => (Array.isArray(value) ? value.join(' ') : value || '')

function passagesForProject(detail) {
  const title = detail.title
  const out = []
  const add = (part, text) => {
    const body = sentence(text).trim()
    if (body.length < 12) return
    out.push({
      id: `${detail.slug}:${part}`,
      kind: 'project',
      slug: detail.slug,
      title,
      part,
      topics: [MAKING, ...(detail.tags ?? [])],
      // The title rides along in the text so a retrieved passage still
      // says what it is about when it reaches the model on its own.
      text: `${title} — ${part}. ${body}`,
    })
  }

  add('what it is', `${detail.subtitle ?? ''}. ${detail.summary ?? ''}`)
  add('who it was for', `${detail.client ?? ''}, ${detail.role ?? ''}, ${detail.period ?? ''}, ${detail.place ?? ''}`)
  add('the problem', detail.problem)
  add('the approach', detail.solution)
  add('my part in it', detail.contribution)
  add('outcome', detail.outcome)

  if (detail.stack?.length) {
    add('built with', `Built with ${detail.stack.join(', ')}.`)
  }
  if (detail.metrics?.length) {
    add(
      'numbers',
      detail.metrics
        .map((m) => `${m.label}: ${m.value}${m.unit ?? ''}${m.note ? ` (${m.note})` : ''}`)
        .join('. ')
    )
  }
  if (detail.iterations?.length) {
    add(
      'iterations',
      detail.iterations.map((i) => `${i.tag} ${i.title}: ${i.note}`).join(' ')
    )
  }
  return out
}

async function main() {
  const files = (await readdir(workDir)).filter(
    (f) => f.endsWith('.js') && f !== 'index.js' && f !== '_template.js'
  )

  const passages = []

  for (const file of files) {
    const mod = await import(pathToFileURL(join(workDir, file)).href)
    const detail = mod.default
    if (!detail?.slug) continue
    passages.push(...passagesForProject(detail))
  }

  // The dial's own one-line descriptions, which are often the clearest
  // answer to "what has he done".
  const { projects, categories } = await import(
    pathToFileURL(join(root, 'src', 'lib', 'content.js')).href
  )
  for (const project of projects) {
    const where = categories.find((c) => c.id === project.lead)
    passages.push({
      id: `dial:${project.slug}`,
      kind: 'project',
      slug: project.slug,
      title: project.title.replace(/\n/g, ' '),
      part: 'in brief',
      topics: [MAKING, ...project.tags],
      text: `${project.title.replace(/\n/g, ' ')} (${project.year}, ${where?.label ?? project.lead}). ${project.blurb}`,
    })
  }

  // And the hobbies, in his own words.
  const { HOBBIES } = await import(
    pathToFileURL(join(root, 'src', 'lib', 'about.js')).href
  )
  for (const hobby of HOBBIES) {
    const body = Array.isArray(hobby.more) ? hobby.more.join('\n') : hobby.more || ''
    passages.push({
      id: `hobby:${hobby.key}`,
      kind: 'hobby',
      slug: hobby.key,
      title: hobby.label,
      part: 'in his words',
      topics: [hobby.key],
      text: `${hobby.label}. ${hobby.gloss} ${body}`,
    })
  }

  /* Hand-written notes, for everything the site has no pages about.
     Each paragraph is indexed on its own so a question lands on the part
     that answers it rather than on a whole essay. */
  const notesDir = join(root, 'knowledge')
  let noteFiles = []
  try {
    noteFiles = (await readdir(notesDir)).filter(
      (f) => (f.endsWith('.md') || f.endsWith('.txt')) && f !== 'README.md'
    )
  } catch {
    noteFiles = []
  }

  for (const file of noteFiles) {
    const raw = await readFile(join(notesDir, file), 'utf8')
    let body = raw
    const head = {}
    const front = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
    if (front) {
      for (const line of front[1].split(/\r?\n/)) {
        const at = line.indexOf(':')
        if (at > 0) head[line.slice(0, at).trim()] = line.slice(at + 1).trim()
      }
      body = raw.slice(front[0].length)
    }

    const title = head.title || file.replace(/\.(md|txt)$/, '').replace(/[-_]/g, ' ')
    const topics = head.topics
      ? head.topics.split(',').map((t) => t.trim()).filter(Boolean)
      : []

    body
      .split(/\n\s*\n/)
      .map((para) => para.replace(/\s+/g, ' ').trim())
      .filter((para) => para.length > 20)
      .forEach((para, i) => {
        passages.push({
          id: `note:${file}:${i}`,
          kind: 'note',
          slug: file,
          title,
          part: 'note',
          topics,
          text: `${title}. ${para}`,
        })
      })
  }

  const out = join(root, 'public', 'data')
  await mkdir(out, { recursive: true })
  await writeFile(
    join(out, 'knowledge.json'),
    JSON.stringify({ built: new Date().toISOString().slice(0, 10), passages })
  )

  const words = passages.reduce((n, p) => n + p.text.split(/\s+/).length, 0)
  console.log(`${passages.length} passages, ${words} words`)
  const byTopic = {}
  for (const p of passages) for (const t of p.topics) byTopic[t] = (byTopic[t] ?? 0) + 1
  console.log(
    Object.entries(byTopic)
      .sort((a, b) => b[1] - a[1])
      .map(([t, n]) => `  ${t}: ${n}`)
      .join('\n')
  )
  console.log(`written: public/data/knowledge.json`)
}

main()
