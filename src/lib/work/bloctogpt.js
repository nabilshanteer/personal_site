/* -----------------------------------------------------------------
   BloctoGPT — one project, one file.

   Everything here comes from your own sources: the academic poster, the
   portfolio document and your CV. Nothing is invented. Two numbers
   disagree between those sources and are flagged in `check` at the
   bottom — worth settling before this goes in front of anyone.
   ----------------------------------------------------------------- */

const FIG = '/img/projects/bloctogpt'

export default {
  slug: 'bloctogpt',
  title: 'BloctoGPT',
  subtitle: 'AI-driven Web3 infrastructure assistant',

  /* Must match the dial's entry in content.js. */
  lead: 'ai',
  tags: ['ai'],

  client: 'Bloctopus',
  role: 'Internship, Bloctopus — Technical Lead, orchestration and routing logic',
  period: 'Oct 2025 — Jan 2026',
  place: 'London, UK',

  /* One sentence, for the top of the panel and the dial. */
  summary:
    'Built during an internship at Bloctopus. A conversational agent that lets non-expert users design, deploy and manage Web3 ' +
    'infrastructure — built around the problem of choosing the right tool from a catalogue ' +
    'far larger than any model’s context window.',

  /* The numbers first: this is what an engineer reads before anything else. */
  metrics: [
    { label: 'Tool-selection accuracy', value: '75', unit: '%', note: 'from a 25% baseline — MCPBench' },
    { label: 'Best F1', value: '0.523', note: 'few-shot prompting' },
    { label: 'Tokens per query', value: '650', note: 'against 3,010 for Sonnet 4 and Opus 4.5' },
    { label: 'Efficiency score', value: '0.696', note: 'V3, accuracy against token cost' },
    { label: 'Evaluation prompts', value: '441', note: 'expanded from a 63-prompt series' },
  ],

  problem: [
    'Agents built on the Model Context Protocol can reach thousands of tools across many servers. ' +
    'The trouble is that every tool schema the agent might need has to sit in its context window, ' +
    'and a catalogue of that size fills the window before the agent has read the question. ' +
    'This is MCP context bloating.',
    'The symptoms compound: tool confusion, truncated prompts, reduced reasoning capacity, ' +
    'then incorrect tool selection, partial task completion and hallucination — and every one of ' +
    'them costs tokens.',
  ],

  solution: [
    'Rather than exposing the agent to the full catalogue, the system puts a just-in-time ' +
    'abstraction layer in front of it. A query is decomposed into structured sub-tasks, each ' +
    'sub-task retrieves only the tool schemas that serve it, and those are aggregated into ' +
    'MetaTools — compact, high-level sets the agent can actually reason about.',
    'Tool discovery is then guided by the shape of the workflow rather than by keyword overlap, ' +
    'and the agent spends its context on the task instead of on the menu.',
  ],

  /* Three iterations, which is the honest shape of the work. */
  iterations: [
    {
      tag: 'V1',
      title: 'Two-stage retrieval',
      note: 'A baseline on Best-Match-25 keyword ranking with an LLM intent parser filtering the candidates.',
      figure: `${FIG}/v1-two-stage-retrieval.webp`,
      caption: 'V1 — three-layer architecture: Claude Desktop, a local MCP proxy, and a Go API on a GCP VM',
    },
    {
      tag: 'V2',
      title: 'Agent-to-agent orchestration',
      note: 'Agent-to-agent deliberation for tool selection, with an LLM-as-a-judge extracting parameters and constructing MetaTools. The most accurate variant, at a substantially higher token cost.',
      figure: `${FIG}/v2-agent-to-agent.webp`,
      caption: 'V2 — seven domain-specific agents queried in parallel, with a judge LLM building MetaTools',
    },
    {
      tag: 'V3',
      title: 'Decomposer RAG',
      note: 'A decomposition agent breaks the request into sub-tasks, retrieval returns the top-K relevant schemas, and those are aggregated into MetaTool sets. The balance between accuracy and cost.',
      figure: null,
      caption: null,
    },
  ],

  /* What you actually did, from the CV. */
  contribution: [
    'Planned, designed, evaluated and deployed the system end to end.',
    'Applied statistical tools — the Jaccard index and co-occurrence matrices — to rank and select high-utility tools from the catalogue.',
    'Handled the routing logic between core components, and wrote the system workflow tools (status check, tool sorting) in Go as a RESTful API.',
    'Engineered the cloud-deployed, multi-component processing framework: Google’s retrieval tool, Anthropic’s models and the surrounding APIs.',
    'Ran the team agile — sprints organised around the three design iterations — and reported results to stakeholders weekly.',
    'Designed the academic poster and presented to the ECS faculty and external partners.',
  ],

  stack: [
    'Go', 'Docker', 'Google Cloud Platform', 'Kubernetes',
    'Claude Haiku 3.5', 'Claude Sonnet 4', 'Google File Search (RAG)',
    'MCP', 'REST', 'GitLab',
  ],

  /* The poster leads; everything else rides the band. */
  hero: {
    src: `${FIG}/poster.webp`,
    caption: 'Academic conference poster — University of Southampton, ECS',
  },

  /* The diagrams, grouped by the system version they describe. Opening
     any figure opens its whole set in order, because one sequence
     diagram out of four explains nothing on its own. */
  diagramSets: [
    {
      id: 'v1',
      title: 'Version 1 — Two-stage retrieval',
      note: 'BM25 keyword ranking with an LLM intent parser.',
      figures: [
        { src: `${FIG}/v1-two-stage-retrieval.webp`, caption: 'Three layers: Claude Desktop, a local MCP proxy, and a Go API on a GCP VM' },
      ],
    },
    {
      id: 'v2',
      title: 'Version 2 — Agent-to-agent orchestration',
      note: 'Seven domain agents in parallel, with a judge LLM building MetaTools.',
      figures: [
        { src: `${FIG}/v2-agent-to-agent.webp`, caption: 'Agent-to-agent deliberation using Claude Haiku 3.5' },
      ],
    },
    {
      id: 'v3',
      title: 'Version 3 — Decomposer RAG',
      note: 'The final system: decomposition, retrieval, MetaTool aggregation.',
      legend: { src: `${FIG}/actors.webp`, caption: 'The actors: user, local agent, proxy, BloctoGPT, RAG, decomposer' },
      figures: [
        { src: `${FIG}/a-startup-sequence.webp`, caption: '[A] Startup sequence — catalogue in, tool status out' },
        { src: `${FIG}/b-status-check.webp`, caption: '[B] Status check — does the system already hold the tools?' },
        { src: `${FIG}/c-metatool-integration.webp`, caption: '[C] MetaTool integration — call, execute, return formatted' },
        { src: `${FIG}/d-sorting-logic.webp`, caption: '[D] Sorting logic — decompose, retrieve, aggregate, return' },
      ],
    },
  ],

  outcome: [
    'Explicitly managing what the agent is allowed to see produced measurable gains in tool-selection ' +
    'quality: three times the accuracy of the baseline on MCPBench, at roughly a fifth of the tokens ' +
    'of the frontier models it was measured against.',
    'The open question is the trade-off itself — V2 selects better, V3 selects nearly as well for far ' +
    'less. Where that balance should sit, along with dynamic context loading and adaptive re-planning, ' +
    'is what the work points at next.',
  ],

  links: [
    { label: 'Project article', href: 'https://medium.com/@0xbloctopus/teaching-ai-to-build-on-chain-b0544a02c050' },
    { label: 'Announcement', href: 'https://www.linkedin.com/posts/0xbloctopus_teaching-ai-to-build-on-chain-activity-7391376189053054976-um7c' },
  ],

  /* Flagged for you, not rendered. */
  check: [
    'Catalogue size: your CV says 1,000+ MCP tools, the portfolio says 500+. Which is right?',
    'Baseline accuracy: the poster says 25% (MCPBench), the portfolio says 33%. The panel uses 25%.',
  ],
}
