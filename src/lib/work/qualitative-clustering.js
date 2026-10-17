/* -----------------------------------------------------------------
   Qualitative Clustering — NHS patient feedback, AI City Innovation
   Sandpit.

   Sourced from your own material: the technical specification and the
   project-management document in images/projects/qualitative-clustering/,
   the README you wrote for the repo, the ai-service and react-client
   code, and the commit history for dates and for the iteration order.

   The specification says outright that the system is "built upon the
   richardgomer/nie-prototype", so the attribution below is the project's
   own framing, not a hedge I invented. Your part — the pipelines, the
   three analyst views, the redactor and the suggestion engines — is Apr
   2026 and verifiable in the log.
   ----------------------------------------------------------------- */

const FIG = '/img/projects/qualitative-clustering'

export default {
  slug: 'qualitative-clustering',
  title: 'Qualitative Clustering',
  subtitle: 'human-in-the-loop theme discovery in NHS patient feedback',

  /* Machine learning leads: the substance here is embeddings, dimensional
     reduction and density clustering, not agency. */
  lead: 'ml',
  tags: ['ml', 'ai'],

  client: 'NHS · AI City Innovation Sandpit',
  role: 'Internship, NHS — clustering pipelines and analyst interface',
  period: 'Apr 2026',
  place: 'Southampton, UK',

  summary:
    'Built during an internship with the NHS, through the AI City Innovation Sandpit. A tool that helps analysts find the themes in thousands of free-text patient responses — ' +
    'and, more to the point, show their working afterwards. It runs the same data through four ' +
    'pipelines, from fully automatic density clustering to a drag-and-drop board where the analyst ' +
    'groups responses by hand and the model only suggests, because the useful question was never ' +
    'whether a machine can cluster feedback but how much of the judgement an analyst can hand over ' +
    'and still defend the result.',

  metrics: [
    { label: 'Clustering pipelines', value: '4', note: 'auto · manual · LLM semantic · LLM manual' },
    { label: 'Embedding dimension', value: '384', note: 'all-MiniLM-L6-v2, over redacted text only' },
    { label: 'UMAP target dimensions', value: '10', note: 'before HDBSCAN finds the boundaries' },
    { label: 'Grouping proximity', value: '220', unit: 'px', note: 'manual board, React Flow' },
    { label: 'Infrastructure budget', value: '£200', note: 'Azure VM for hosting, Iridis HPC for batch' },
  ],

  problem: [
    'Patient and public survey data shapes health services, but the free-text half of it is the ' +
    'half nobody can read at volume. Coding it by hand is slow, subjective, and drifts over a long ' +
    'session: the same response sorted at hour one and at hour four can end up in different groups.',
    'The existing AI tools generate themes quickly and are black boxes about it. An analyst who ' +
    'cannot trace a theme back to the patient voices underneath it cannot check it for bias, and ' +
    'will not put it in front of a commissioner. The binding constraint was never accuracy — it was ' +
    'whether the output could be defended.',
    'And before any of that: patients write names, places and clinical detail into free-text boxes, ' +
    'and the data is bound by UK GDPR and NHS rules on where it may be processed.',
  ],

  solution: [
    'The unit of analysis is the fragment, not the response. Each cell of a survey row becomes its ' +
    'own independently clusterable item, so an answer about staff attitude is never averaged into ' +
    'one about the ward environment. Each fragment is stored with its original text, a redacted ' +
    'version, and its vector — and the analyst can click any note to read the exact original ' +
    'response, which is what kills the black-box effect.',
    'Redaction runs first and is what gets embedded: a spaCy NER pass strips personal detail, and ' +
    'the pipeline embeds and sends only the redacted text. The original stays in the database for ' +
    'the analyst to read and never leaves it.',
    'The design treats the model as something that learns from the analyst rather than something ' +
    'that replaces them. The analyst clusters the first quotes by hand; once a group reaches ' +
    'critical mass the model names it; from there the model proposes homes for new responses and ' +
    'the analyst accepts, rejects or moves them.',
    'Four pipelines sit across that spectrum. Auto reduces the 384-dimensional embeddings to ten ' +
    'with UMAP and lets HDBSCAN find natural boundaries — no target number of clusters to guess — ' +
    'with a second UMAP pass giving 2D coordinates for the graph and an LLM naming each cluster. ' +
    'LLM Semantic takes a research question and optional column filters and reads each fragment to ' +
    'assign or create a cluster, streaming progress as it goes. Manual is a React Flow board where ' +
    'the analyst drags fragments into groups by proximity and the model offers a cosine-similarity ' +
    'match against each group centroid. LLM Manual is the same board with the model reading the ' +
    'text to make that suggestion instead.',
    'Running over both board modes is a Sanity Check: after each placement the model reads samples ' +
    'from every group and flags a clearly better home with an arrow the analyst accepts or ' +
    'dismisses. It is deliberately conservative — it waits until the board has enough structure to ' +
    'judge against, and only fires when a placement is wrong rather than merely debatable, because ' +
    'a checker that nags is one the analyst turns off.',
    'The compute was split to fit a £200 budget: the always-on FastAPI backend and React client run ' +
    'on an Azure VM with UK-region storage, while heavy batch work goes to the University of ' +
    'Southampton’s Iridis HPC at no cost.',
  ],

  /* The real order the work happened in, taken from the commit log. */
  iterations: [
    {
      tag: 'V1',
      title: 'The automatic pipeline',
      note: 'Survey ingestion, fragment extraction, embedding, UMAP and HDBSCAN, and the cluster graph — the fully automatic path end to end, with LLM cluster naming.',
    },
    {
      tag: 'V2',
      title: 'The analyst in the loop',
      note: 'The manual placement board and the first suggestion engine: cosine similarity against group centroids, expand-on-click nodes, and dataset management.',
    },
    {
      tag: 'V3',
      title: 'Reading instead of measuring',
      note: 'LLM-driven pipelines — research-question filtering and semantic assignment — plus the Sanity Check. Similarity was not enough on small or domain-specific datasets, so the model reads the text instead.',
    },
  ],

  contribution: [
    'Built all four clustering pipelines in the FastAPI AI service: the UMAP and HDBSCAN automatic path, the LLM semantic clusterer with research-question and column filtering, and both suggestion engines behind the board.',
    'Wrote the spaCy NER redactor and wired the pipeline so that embeddings and LLM calls see only redacted text — the requirement that made the rest of it legal to run.',
    'Built the three analyst views in the React client: survey ingestion, the interactive cluster graph, and the drag-and-drop manual placement board.',
    'Designed the Sanity Check — the conservative placement checker — including the gate that stops it firing on placements that are merely debatable.',
    'Added the fragment ingestion and labelling routers, and the client-side facade over the AI service and the data API.',
    'Chose the model and the reduction strategy: a local sentence-transformer rather than an embedding API, so a survey of thousands of fragments costs nothing per run and no patient text leaves the machine to be embedded.',
    'Wrote the repository documentation, including the rationale for each pipeline and each design decision.',
    'Worked on top of the university’s existing NIE prototype rather than greenfield, which set the data model and the storage layer the clustering had to fit.',
  ],

  outcome: [
    'The idea was selected as one of two prototypes the sandpit built and tested with its partner ' +
    'organisations, and shipped as a working tool an analyst could run on their own CSV, with a ' +
    'public feedback survey attached.',
    'What the four pipelines established is that the interesting axis is control, not accuracy: the ' +
    'automatic path is the fastest route to a first pass, and the board is the only one an analyst ' +
    'trusts enough to defend. The honest gap is that the two success metrics the specification set ' +
    'out — time to process 500 responses against spreadsheet analysis, and the share of ' +
    'auto-assigned quotes an analyst accepts without re-routing — were defined but never measured ' +
    'in the three weeks available. Both are cheap to run and would turn this from a convincing ' +
    'prototype into evidence; that is the first thing I would do next.',
  ],

  /* The document this panel was written from. Served straight out of
     public/doc by the asset pipeline, opened in a new tab. */
  report: { href: '/doc/projects/qualitative-clustering/technical-specs.pdf', label: 'Read Specification' },

  stack: [
    'Python', 'FastAPI', 'sentence-transformers', 'UMAP', 'HDBSCAN', 'scikit-learn',
    'spaCy', 'pandas', 'React', 'React Flow', 'Vite', 'TypeScript',
    'Node.js', 'Express', 'MongoDB', 'Azure', 'Iridis HPC',
  ],

  hero: {
    src: `${FIG}/whiteboard.webp`,
    caption: 'The clustering board — fragments grouped by hand, with the model suggesting from the side',
  },

  diagramSets: [
    {
      id: 'tool',
      title: 'The tool',
      note: 'Ingestion, the board, and the model offering a placement.',
      figures: [
        { src: `${FIG}/survey-ingestion.webp`, caption: 'Survey ingestion — a CSV becomes independently clusterable fragments' },
        { src: `${FIG}/whiteboard.webp`, caption: 'The clustering board' },
        { src: `${FIG}/manual-placement.webp`, caption: 'Manual placement — the analyst drags a fragment into a group' },
        { src: `${FIG}/llm-suggestion.webp`, caption: 'The model proposes a home for a fragment; the analyst accepts or refuses' },
        { src: `${FIG}/human-in-the-loop.webp`, caption: 'Human in the loop — where the analyst and the model divide the work' },
      ],
    },
    {
      id: 'design',
      title: 'Design — the human-in-the-loop playground',
      note: 'The interaction as specified, before it was built.',
      figures: [
        {
          src: `${FIG}/aicis-project-management-p2-1.webp`,
          caption: 'Quotes cluster by proximity; the model suggests a placement, a new cluster, or a name, and every suggestion is an Accept',
        },
      ],
    },
  ],

  links: [
    { label: 'Code', href: 'https://github.com/nabilshanteer/thematic_clusters' },
    { label: 'Project article', href: 'https://www.ai-city.uk/sandpit/' },
  ],

  check: [
    'Employment wording: the panel now says this was an internship with the NHS, as you asked. Worth a second look. The public sandpit page frames it as a University of Southampton programme working with partner organisations, and the build sat on a Southampton codebase with Southampton staff on the commit log. If your contract was with the university rather than with the NHS, change this to name the AI City Innovation Sandpit at the University of Southampton instead. An interviewer who checks will check this.',
    'URGENT: this repo is public and its history still carries a live MongoDB Atlas connection string with credentials that are not yours (user or1g20, around commit b6b0e1c). Tell the owner so they can rotate it, then purge the history.',
    'Client name: the sandpit’s public page says "health and community services"; your own specification says NHS throughout and names NHS compliance. The panel says NHS. Confirm that is fine to publish.',
    'Role title: "Prototype developer" is my wording. Replace it with whatever you were actually called.',
    'Attribution is handled the way your own specification handles it — "built upon the richardgomer/nie-prototype". The panel claims the pipelines, the three views, the redactor and the suggestion engines, which the Apr 2026 commits support, and claims nothing else.',
  ],
}
