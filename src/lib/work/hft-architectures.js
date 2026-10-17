/* -----------------------------------------------------------------
   Event-Driven and Many-Threaded Architectures for High-Frequency
   Trading — MEng individual research report.

   Sourced from the report, the poster and the presentation deck in
   images/projects/hft-architectures/.

   Important framing: this is a SURVEY, not an implementation. It reviews
   nineteen papers and grades their evidence. The panel says so in the
   first line, because an interviewer who assumes you built an FPGA
   trading system and then finds out otherwise is a bad conversation.
   ----------------------------------------------------------------- */

const FIG = '/img/projects/hft-architectures'
const FILM = '/media/projects/hft-architectures'

export default {
  slug: 'hft-architectures',
  title: 'Event-Driven Architectures for HFT',
  subtitle: 'a survey of FPGA, neuromorphic and spiking approaches to low-latency trading',

  lead: 'hardware',
  tags: ['hardware', 'ml'],

  client: 'University of Southampton · ECS',
  role: 'Author — individual research report (MEng)',
  period: '2026',
  place: 'Southampton, UK',

  summary:
    'A cross-domain literature survey of nineteen papers published between 2008 and 2025, spanning ' +
    'FPGA hardware acceleration, event-driven computing, neuromorphic chip architecture and spiking ' +
    'neural networks for trading. It sits at an intersection almost nobody occupies: an FPGA can ' +
    'arbitrate NASDAQ market data in six nanoseconds, and an unsupervised spiking network returned ' +
    '76.8% in simulated trading over nineteen days — two results from communities that share a goal ' +
    'and never cite each other.',

  metrics: [
    { label: 'Papers surveyed', value: '19', note: 'published 2008 — 2025' },
    { label: 'Fastest measured arbitration', value: '6', unit: 'ns', note: 'FPGA, on real NASDAQ feeds' },
    { label: 'Best reported SNN return', value: '76.8', unit: '%', note: 'simulated, 19 days, one stock' },
    { label: 'Evidence classes', value: '5', note: 'from fabricated silicon to unimplemented theory' },
    { label: 'Open questions identified', value: '5', note: 'answered by no paper in the corpus' },
  ],

  problem: [
    'Two communities are solving the same problem and not reading each other. FPGA engineers build ' +
    'sub-microsecond data paths for market data; neuromorphic designers build ultra-low-power ' +
    'spiking architectures for pattern recognition. Both argue that event-driven computation is the ' +
    'right answer to the von Neumann bottleneck, both measure success in orders of magnitude, and ' +
    'neither has built a system that crosses the gap.',
    'Surveying across that gap is harder than surveying within it, because the two literatures do ' +
    'not share benchmarks, units, or standards of evidence. A measured nanosecond on fabricated ' +
    'silicon and a simulated energy figure from a device-physics model are not the same kind of ' +
    'claim, and a survey that averages them produces a confident answer that is worth nothing.',
  ],

  solution: [
    'Every paper was classified by methodology and by evidence strength rather than by topic, which ' +
    'turns the incomparability into the finding. Five classes emerged: real hardware on real-world ' +
    'data, hardware on synthetic benchmarks, software models validated by backtesting, ' +
    'device-physics simulation with no silicon, and theoretical frameworks with no implementation.',
    'Three concept lineages were traced through the corpus — event-driven computing, FPGA ' +
    'acceleration, and spiking networks as a computational primitive — to separate what the field ' +
    'has established from what it repeats. What it has established is that purpose-built hardware ' +
    'beats conventional processors on financial workloads by orders of magnitude; that is measured, ' +
    'repeatedly, on real systems.',
    'What it assumes without testing turned out to be the more interesting half. No paper reports ' +
    'power consumption for an HFT pipeline, which makes the comparison against neuromorphic ' +
    'alternatives impossible. No paper tests a complete end-to-end trading system; each measures ' +
    'one stage and assumes the rest. And the latency-to-profit relationship that motivates the ' +
    'entire programme — the industry claim that a millisecond is worth $100M a year — is assumed ' +
    'linear and never validated, while separate work on market stability suggests it may be wrong ' +
    'at the systemic level.',
  ],

  contribution: [
    'Selected, read and classified the nineteen-paper corpus, and built the evidence-strength taxonomy that the survey is organised around.',
    'Traced three concept lineages across seventeen years to separate established results from inherited assumptions.',
    'Identified five research questions that no paper in the corpus answers, including the absence of any cross-substrate power benchmark on a common financial workload.',
    'Read the headline claims against their own evidence class — including a neuromorphic system paper whose "traditional architecture" baseline is never defined, and a simulated spintronic advantage benchmarked against measured 14nm silicon.',
    'Set out the reflexivity argument: physics simulations are non-stationary in their compute pattern but not in their governing equations, whereas markets change their own rules in response to being traded, which is a harder problem than the hardware literature treats it as.',
    'Wrote the report, designed the conference poster, and presented the work to the ECS faculty.',
  ],

  outcome: [
    'The field has established beyond reasonable doubt that purpose-built hardware processes ' +
    'financial data hundreds of times faster and more cheaply than conventional processors. The ' +
    'neuromorphic-for-trading thesis, by contrast, rests on exactly two verifiable data points — ' +
    'neither tested on neuromorphic hardware, neither at production scale.',
    'The gap worth working on is what happens when architecturally different trading systems meet ' +
    'in the same order book. Existing work shows that even homogeneous algorithmic traders can ' +
    'destabilise a market in minutes, and a calibrated simulator already exists for studying it — ' +
    'but every model treats algorithmic traders as equivalent. Extending one of those agent-based ' +
    'models so that CPU-speed, FPGA-speed and neuromorphic-speed agents compete against each other ' +
    'is an experiment the infrastructure supports and nobody has run.',
  ],

  /* The document this panel was written from. Served straight out of
     public/doc by the asset pipeline, opened in a new tab. */
  report: { href: '/doc/projects/hft-architectures/individual-research-report.pdf', label: 'Read Report' },

  stack: [
    'Systematic literature review', 'Evidence grading', 'FPGA architecture',
    'Neuromorphic computing', 'Spiking neural networks', 'Market microstructure', 'LaTeX',
  ],

  hero: {
    /* The talk itself, with sound. No poster frame: the conference poster
       has moved into the figures where it can be read at size. */
    video: `${FILM}/presentation-vid.mp4`,
    caption: 'The presentation — delivered to the ECS faculty',
  },

  diagramSets: [
    {
      id: 'poster',
      title: 'Conference poster',
      note: 'The whole argument on one sheet.',
      figures: [
        { src: `${FIG}/poster-page1.webp`, caption: 'Conference poster — University of Southampton, ECS' },
      ],
    },
    {
      id: 'figures',
      title: 'Figures from the report',
      note: 'How the corpus fits together, and what it costs to run.',
      figures: [
        { src: `${FIG}/individual-research-report-p2-1.webp`, caption: 'Intellectual lineage across the corpus: three parallel tracks and where they touch' },
        { src: `${FIG}/individual-research-report-p3-2.webp`, caption: 'Latency across substrates on a log scale, annotated with power draw' },
        { src: `${FIG}/individual-research-report-p7-3.webp`, caption: 'Evidence strength by paper' },
      ],
    },
    {
      id: 'slides',
      title: 'Presentation slides',
      note: 'Every page of the deck.',
      figures: [
        { src: `${FIG}/presentation-slides-page1.webp`, caption: 'Slide 1' },
        { src: `${FIG}/presentation-slides-page2.webp`, caption: 'Slide 2' },
        { src: `${FIG}/presentation-slides-page3.webp`, caption: 'Slide 3' },
        { src: `${FIG}/presentation-slides-page4.webp`, caption: 'Slide 4' },
        { src: `${FIG}/presentation-slides-page5.webp`, caption: 'Slide 5' },
        { src: `${FIG}/presentation-slides-page6.webp`, caption: 'Slide 6' },
      ],
    },
    {
      id: 'notes',
      title: 'Speaking notes',
      note: 'Every page, as delivered.',
      figures: [
        { src: `${FIG}/presentation-notes-page1.webp`, caption: 'Speaking notes, page 1' },
        { src: `${FIG}/presentation-notes-page2.webp`, caption: 'Speaking notes, page 2' },
        { src: `${FIG}/presentation-notes-page3.webp`, caption: 'Speaking notes, page 3' },
        { src: `${FIG}/presentation-notes-page4.webp`, caption: 'Speaking notes, page 4' },
      ],
    },
  ],

  check: [
    'The panel states plainly that this is a survey rather than an implementation. Keep it that way — it is the honest reading of the report and it still shows the thing employers want to see, which is that you can judge evidence.',
    'The presentation video (Presentation Vid.mp4) is not used; the site has no video support. Say if you want it embedded and I will add it.',
    'The slide deck and the speaker notes are vector PDFs, so the pipeline renders them as pages rather than lifting figures out. Those page renders are on disk under images/projects/hft-architectures/ if you want any of them on the panel.',
    'Check the third report figure’s caption — I inferred it from position in the document rather than from the caption text.',
  ],
}
