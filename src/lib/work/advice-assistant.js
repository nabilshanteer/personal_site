/* -----------------------------------------------------------------
   AI Legal Advice Assistant — Citizens Advice, AI City Innovation Sandpit.

   Sourced from your own material: the project-management document and
   the interface screenshot in images/projects/advice-assistant/, the
   proposal and technical specification in the repo's documents/ folder,
   the scraper and backend code itself, the commit history for dates, and
   the sandpit's public write-up. Nothing is invented.

   The latency figures in the specification are TARGETS, not
   measurements, and the panel says so. See `check` at the bottom.
   ----------------------------------------------------------------- */

const FIG = '/img/projects/advice-assistant'

export default {
  slug: 'advice-assistant',
  title: 'AI Legal Advice Assistant',
  subtitle: 'source-grounded retrieval for frontline advisors',

  lead: 'ai',
  tags: ['ai'],

  client: 'Citizens Advice · AI City Innovation Sandpit',
  role: 'Internship, Citizens Advice — retrieval pipeline, backend and ingestion',
  period: 'Mar — Apr 2026',
  place: 'Southampton, UK',

  summary:
    'Built during an internship with Citizens Advice, through the AI City Innovation Sandpit. A staff-facing assistant that answers an advisor’s question from a curated library of ' +
    'trusted guidance, shows the source behind every line, and says how confident it is. Built for ' +
    'the problem that makes general-purpose chatbots unusable in an advice setting: a confident ' +
    'wrong answer about someone’s housing or benefits entitlement is worse than no answer at all.',

  metrics: [
    { label: 'Research depth levels', value: '3', note: 'quick · balanced · deep dive' },
    { label: 'Embedding dimension', value: '384', note: 'all-MiniLM-L6-v2, HNSW index on pgvector' },
    { label: 'Chunk length', value: '600', note: 'characters, 120 overlap, heading-aware' },
    { label: 'Top-5 retrieval', value: '<200', unit: 'ms', note: 'design target, not a measurement' },
    { label: 'Access roles', value: '3', note: 'advisor · admin · read-only' },
  ],

  problem: [
    'Citizens Advice services are taking on more demand than they can answer quickly. The ' +
    'information an advisor needs is real and public, but it is scattered across housing policy, ' +
    'local council regulations and national guidance — so the slow part of a case is not the advice, ' +
    'it is the search.',
    'At peak times that fragmentation compounds into rushed, inconsistent answers and worse ' +
    'decisions. But the obvious fix is the dangerous one: a general assistant that sounds right and ' +
    'cites nothing is unusable here, because an advisor cannot sign off on an answer they cannot ' +
    'trace, and an advisor who is given a wrong answer confidently has been actively harmed by the ' +
    'tool. Anything built had to be checkable by the person using it.',
  ],

  solution: [
    'Retrieval-augmented generation restricted to a pre-approved corpus. A question is embedded, ' +
    'matched against a vector store of chunked guidance, and the model is given only those passages ' +
    'to answer from — with the source rendered next to the answer, in-text and as a summary, so the ' +
    'advisor can verify it before repeating it to a client.',
    'The corpus builds itself rather than being hand-curated. A collector walks the GOV.UK Content ' +
    'API’s taxonomy to assemble a whitelist of relevant pages, a scraper pulls them in parallel, a ' +
    'heading-aware chunker splits them on their own structure instead of at arbitrary character ' +
    'counts, and an embedder upserts the result into Supabase pgvector — keyed on chunk ID, so ' +
    're-running it refreshes the library instead of duplicating it.',
    'Work is organised by case rather than by chat. Each case carries its own documents, its own web ' +
    'sources, free-text notes that can be dictated, and a jurisdiction, so an advisor returning to a ' +
    'case a week later gets the context back rather than re-explaining it.',
    'The Research Depth Slider is the honest part of the interface: quick, balanced or deep dive, ' +
    'set per case or per question, trading latency for thoroughness rather than pretending the ' +
    'trade-off does not exist. The answer comes back with a confidence rate, the number of sources ' +
    'it drew on and the depth level it ran at, so the advisor can see how much weight it deserves.',
    'The output is shaped for the job rather than for conversation. Alongside the answer it flags ' +
    'the critical information missing from the question — how long, since when — and recommends the ' +
    'follow-up questions to put to the client, then lists the relevant organisations, contact ' +
    'numbers and websites. That turns it from an answering machine into something closer to a ' +
    'second advisor reading over the first one’s shoulder.',
  ],

  contribution: [
    'Built the ingestion pipeline end to end: taxonomy-driven URL collection from the GOV.UK Content API, a resumable parallel scraper, the heading-aware chunker, and the embedder that upserts into Supabase pgvector.',
    'Made the scrape restartable and parallel — checkpointed by category, shardable across SLURM array workers, with a separate merge step — so a run that dies partway through does not start from nothing.',
    'Wrote the FastAPI backend: chat, documents and auth routing, JWT issuance with role enforcement, and the Anthropic call with streaming.',
    'Built the Next.js advisor interface, including the case workspace and the source-citation display that makes an answer checkable.',
    'Containerised the stack with Docker Compose so the partner organisation could run it without a Python or Node setup.',
    'Wrote the technical specification and the retrieval test harness used to verify the embedder had run correctly.',
  ],

  outcome: [
    'The idea was selected as one of two prototypes the sandpit chose to build and test with its ' +
    'partner organisations, and went in front of them as a working system with a public feedback ' +
    'survey attached.',
    'What I would change is the evaluation. The specification set latency and retrieval targets but ' +
    'the prototype shipped without a measured retrieval-quality benchmark — no held-out set of ' +
    'advisor questions with known-correct sources — so "it retrieves well" rests on spot checks ' +
    'rather than a number. For a system whose entire claim is groundedness, and which displays a ' +
    'confidence rate to a person who will act on it, that is the first thing I would build next.',
  ],

  stack: [
    'Python', 'FastAPI', 'Next.js 14', 'TypeScript', 'PostgreSQL', 'Supabase pgvector',
    'sentence-transformers', 'Anthropic API', 'SQLAlchemy', 'Alembic', 'NextAuth',
    'Docker Compose', 'SLURM',
  ],

  hero: {
    src: `${FIG}/index-page.webp`,
    caption: 'The advisor workspace — cases, per-case documents and web sources, dictated notes, and the jurisdiction the advice is given under',
  },

  diagramSets: [
    {
      id: 'built',
      title: 'The built interface',
      note: 'What the advisor actually sees.',
      figures: [
        { src: `${FIG}/index-page.webp`, caption: 'The workspace — cases, documents, web sources and notes' },
        { src: `${FIG}/login.webp`, caption: 'Advisor sign-in' },
        { src: `${FIG}/slider.webp`, caption: 'The Research Depth Slider — quick, balanced, deep dive' },
        { src: `${FIG}/dictation.webp`, caption: 'Dictated notes — speech to text, for hands-free use during a session' },
        { src: `${FIG}/web-sources.webp`, caption: 'Web sources attached to a case' },
        { src: `${FIG}/top-sources.webp`, caption: 'The sources behind an answer, ranked — what makes it checkable' },
      ],
    },
    {
      id: 'design',
      title: 'Design — the three screens',
      note: 'The interface as specified, before it was built.',
      figures: [
        {
          src: `${FIG}/aicis-project-management-p2-2.webp`,
          caption: 'Home — the case list, the question, and the Research Depth Slider running quick to deep dive',
        },
        {
          src: `${FIG}/aicis-project-management-p2-1.webp`,
          caption: 'Case context — the documents and web pages this case is answered from, its depth preference, and its notes',
        },
        {
          src: `${FIG}/aicis-project-management-p2-3.webp`,
          caption: 'Output — confidence rate, sources used and depth level, with the missing information and the follow-up questions to ask',
        },
      ],
    },
  ],

  links: [
    { label: 'Code', href: 'https://github.com/nabilshanteer/aicity_chatbot' },
    { label: 'Project article', href: 'https://www.ai-city.uk/sandpit/' },
  ],

  check: [
    'Employment wording: the panel now says this was an internship with Citizens Advice, as you asked. Worth a second look. The public sandpit page frames it as a University of Southampton programme working with partner organisations, and the build sat on a Southampton codebase with Southampton staff on the commit log. If your contract was with the university rather than with Citizens Advice, change this to name the AI City Innovation Sandpit at the University of Southampton instead. An interviewer who checks will check this.',
    'URGENT: this repo is public and frontend/.env.local is still readable in its history at commit f8b55cfe — a live Google OAuth client secret and NEXTAUTH_SECRET. Rotate both now, then purge with git filter-repo. The panel links to the repo as you asked; the exposure is there with or without the link.',
    'Depth naming: your technical specification calls the three modes quick / standard / deep, but the wireframes and the built interface call them quick / balanced / deep dive. The panel uses the built naming. Worth making the spec agree.',
    'Client name: the sandpit’s public page says only "Citizens Advice". Your CV says Citizens Advice Eastleigh. The panel uses the generic name — change it if naming the branch is fine with them.',
    'Role title: "Prototype developer" is my wording. Replace it with whatever the sandpit actually called you.',
    'The <200ms retrieval figure is a design target from your own spec, not a measurement, and the panel says so. Either measure it or drop that tile.',
    'The screenshot shows an empty workspace. A shot with a real case open — question, cited answer, confidence rate — would be a far stronger hero, if you have one that is safe to publish.',
  ],
}
