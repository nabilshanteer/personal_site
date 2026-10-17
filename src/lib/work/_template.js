/* -----------------------------------------------------------------
   PROJECT TEMPLATE — copy this file, rename it <slug>.js, fill it in.

   Adding a project is four steps:

     1. Put its images in         images/projects/<slug>/
        (poster.png gets extra resolution; everything else is a figure)

        You can drop PDFs in that folder too — a spec, a report, a
        project-management document — and `npm run assets` mines the
        images out of them. Extracted figures are named after the PDF
        they came from, <pdf-name>-p<page>-<n>, and anything small
        enough to be a logo is ignored. A loose PNG of the same name
        always wins, so a figure can be replaced by hand.

        The folder name is the slug, slugified: "Thematic Clustering"
        and "thematic_clustering" both land on thematic-clustering.
     2. Run                       npm run assets
     3. Copy this file to         src/lib/work/<slug>.js
     4. Register it in            src/lib/work/index.js
        and add a row to `projects` in src/lib/content.js so it appears
        on the dial.

   Nothing below is required. Any field you leave out simply does not
   render — a project with no iterations shows no ITERATIONS heading, a
   project with no figures shows no bands. Fill in what is true and
   delete the rest.
   ----------------------------------------------------------------- */

const FIG = '/img/projects/SLUG'

export default {
  slug: 'SLUG',
  title: 'PROJECT NAME',
  subtitle: 'one line on what it is',

  /* Must match the row in content.js. `lead` is the category it is most
     itself; `tags` is every category it honestly belongs to. */
  lead: 'ai',
  tags: ['ai'],

  client: 'who it was for',
  role: 'what you were',
  period: 'Mon YYYY — Mon YYYY',
  place: 'City, Country',

  /* Two or three sentences. This is the only prose some readers see. */
  summary: '',

  /* The numbers go second, because they are the first thing an engineer
     looks for. Three to five. `unit` and `note` are optional. */
  metrics: [
    // { label: 'Accuracy', value: '92', unit: '%', note: 'against a 70% baseline' },
  ],

  /* What was actually hard. Not what it does — why it was difficult. */
  problem: [],

  /* How you got round it. */
  solution: [],

  /* Optional. Only if the work genuinely went through versions. */
  iterations: [
    // { tag: 'V1', title: '', note: '' },
  ],

  /* Yours specifically, especially on team projects. Be concrete. */
  contribution: [],

  /* What it produced, and what you would do differently. The second part
     is worth more than the first. */
  outcome: [],

  stack: [],

  /* The one image you most want seen. Shown full width, click to open. */
  hero: {
    // src: `${FIG}/poster.webp`,
    // caption: '',
  },

  /* Diagrams grouped by what they describe. Clicking any figure opens
     its whole set on one board, so a set should be things that are read
     together. `legend` is pinned under them if present. */
  diagramSets: [
    // {
    //   id: 'v1',
    //   title: 'Version 1 — name',
    //   note: 'one line',
    //   legend: { src: `${FIG}/actors.webp`, caption: 'symbol definitions' },
    //   figures: [{ src: `${FIG}/diagram.webp`, caption: '' }],
    // },
  ],

  links: [
    // { label: 'Project article', href: '' },
    // { label: 'Code', href: '' },
  ],

  /* Anything you need to settle before this goes public — conflicting
     numbers, unverified claims. Never rendered. */
  check: [],
}
