/* Reading and writing the knowledge notes.

   This only works while the site is running on your own machine. A
   deployed Vercel site has a read-only filesystem, so there is nowhere
   for an uploaded note to go — and an admin page that could write to a
   public site would need a login, which is a much bigger thing than this
   needs to be.

   So the shape is: add notes locally, run the build, deploy. The notes
   are plain files in knowledge/, committed with everything else, which
   also means they are versioned and you can see what changed.

   In production this refuses outright. */

import { readdir, readFile, writeFile, unlink, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const DIR = join(process.cwd(), 'knowledge')

// Filenames come from the browser, so they are rebuilt from scratch
// rather than trusted: letters, digits and hyphens only, no traversal.
const safeName = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'note'

async function list() {
  try {
    const files = (await readdir(DIR)).filter(
      (f) => (f.endsWith('.md') || f.endsWith('.txt')) && f !== 'README.md'
    )
    const notes = []
    for (const file of files) {
      const raw = await readFile(join(DIR, file), 'utf8')
      const title = raw.match(/^title:\s*(.+)$/m)?.[1]?.trim()
      const topics = raw.match(/^topics:\s*(.+)$/m)?.[1]?.trim()
      notes.push({
        file,
        title: title || file.replace(/\.(md|txt)$/, ''),
        topics: topics || '',
        words: raw.split(/\s+/).length,
      })
    }
    return notes.sort((a, b) => a.file.localeCompare(b.file))
  } catch {
    return []
  }
}

export default async function handler(request, response) {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    response.status(403).json({
      error: 'Notes are added locally, then built and deployed.',
    })
    return
  }

  const { action, file, title, topics, text } = request.body ?? {}

  try {
    if (action === 'list') {
      response.status(200).json({ notes: await list() })
      return
    }

    if (action === 'save') {
      if (!String(text || '').trim()) {
        response.status(400).json({ error: 'Nothing to save.' })
        return
      }
      await mkdir(DIR, { recursive: true })
      const name = safeName(file || title)
      const head = ['---', `title: ${title || name}`]
      if (topics) head.push(`topics: ${topics}`)
      head.push('---', '')
      await writeFile(join(DIR, `${name}.md`), `${head.join('\n')}\n${text.trim()}\n`, 'utf8')
      response.status(200).json({ saved: `${name}.md`, notes: await list() })
      return
    }

    if (action === 'delete') {
      const name = safeName(String(file).replace(/\.(md|txt)$/, ''))
      await unlink(join(DIR, `${name}.md`)).catch(() => {})
      response.status(200).json({ notes: await list() })
      return
    }

    response.status(400).json({ error: 'Unknown action.' })
  } catch (error) {
    response.status(500).json({ error: String(error?.message || error) })
  }
}
