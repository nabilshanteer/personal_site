/* The CV, as data.

   The PDF is the artefact someone downloads; this is the same document
   as something a page can lay out, a phone can read without pinching,
   and the site's own assistant can answer from. Keeping one copy in the
   PDF and retyping it into markup would guarantee the two drift apart,
   so the page is built from here and the PDF is published beside it.

   Every link below was taken out of the PDF's own annotations rather
   than retyped, so the two point at exactly the same places.

   `projects` names panels elsewhere on this site that cover the same
   work, so a line on the CV can lead to the full write-up instead of
   being the end of the road.

   `short` is the name used on the scope, where a pulse three months
   wide has no room for "AI City Innovation Sandpit". */

export const PDF = '/doc/nabil-al-shanteer-cv.pdf'

/* A picture of the first page, so the plain document can be offered as
   a thing you can see rather than a link you have to trust. */
export const PREVIEW = '/doc/cv-preview.jpg'

export const WHO = {
  name: 'Nabil Al-Shanteer',
  citizenship: 'French & British Citizen',
  linkedin: 'https://www.linkedin.com/in/nabil-al-shanteer/',
  github: 'https://github.com/nabilshanteer',
}

export const EXPERIENCE = [
  {
    id: 'pwc',
    org: 'PwC',
    short: 'PwC',
    role: 'Technology Consultant Intern',
    from: 'Nov 2026',
    /* Open ended. The scope reads null as "still running" and holds the
       pulse high to the right edge of the graph rather than inventing an
       end date for it. */
    to: null,
    upcoming: true,
    links: [],
    projects: [],
    place: 'Dubai, UAE',
    /* Subject-less, like every other bullet on the CV, so a role that has
       not started yet still reads in the same voice as the ones that
       have. Forward-looking on purpose: nothing has happened yet, and a
       bullet claiming otherwise would be the one untrue line here. */
    points: [
      'Moving from building systems to advising on them, taking an electronics and AI background into technology consulting.',
      'Looking forward to meeting the team and getting into client work.',
    ],
  },
  {
    id: 'sandpit',
    org: 'AI City Innovation Sandpit',
    short: 'AI City Sandpit',
    role: 'AI Solutions Intern',
    place: 'Eastleigh, UK',
    from: 'Mar 2026',
    to: 'Jun 2026',
    links: [{ label: 'Project Article', href: 'https://www.ai-city.uk/sandpit/#index-1' }],
    projects: ['advice-assistant', 'qualitative-clustering'],
    points: [
      'Responsibilities include the discovery phase for both [Citizens Advice Eastleigh](advice-assistant) and the British [National Health Service (NHS)](qualitative-clustering) to learn their pain points and agree on user requirements.',
      'For Citizens Advice: Developed an [AI Chatbot with self-updating RAG system](advice-assistant) to contain only the most up-to-date legal information regarding housing, benefits, and other sectors of law using the United Kingdom government’s official GOV.UK API. Tailored responses in a legal format with source documentation, and connected front-end chatbot interface with back-end database management.',
      'For the NHS: Developed a [survey feedback analysis tool](qualitative-clustering) that synthesises thousands of medical survey feedback. The pipeline anonymises responses, clusters them based on themes, and features a “human-in-the-loop” mode and “automatic” mode. Lastly, clusters are formatted in an interactive whiteboard for analysts to view, edit, and extract useful reports from.',
    ],
  },
  {
    id: 'bloctopus',
    org: 'Bloctopus',
    short: 'Bloctopus',
    role: 'Technical Lead, Orchestration & Routing Logic',
    place: 'London, UK',
    from: 'Oct 2025',
    to: 'Jan 2026',
    links: [
      {
        label: 'Project Article',
        href: 'https://www.linkedin.com/posts/0xbloctopus_teaching-ai-to-build-on-chain-activity-7391376189053054976-um7c',
      },
      {
        label: 'Project Poster',
        href: 'https://www.linkedin.com/feed/update/urn:li:activity:7514658812318994433/',
      },
    ],
    projects: ['bloctogpt'],
    points: [
      'Planned, designed, evaluated, & deployed [BloctoGPT](bloctogpt), an AI-powered conversational agent that allows non-expert users to design, deploy, & manage Web3 infrastructure on the Bloctopus platform, optimising AI agents’ context windows.',
      'Applied statistical tools like the Jaccard Index & Co-Occurrence Matrices to rank and select high-utility, relevant Model Context Protocol (MCP) tools from a catalogue of 1,000+ tools.',
      'Engineered a scalable, cloud-deployed, multi-component processing framework integrating data pipelines including Google’s Retrieval-Augmented Generation (RAG) tool, Anthropic’s Large Language Models (LLM), & various APIs.',
      'Collaborated in a team via agile development using GitLab & GitHub for version control & sprint planning. Organised sprints around three design iterations (BM25 version, Agent-to-Agent version, Decomposer-RAG version).',
      'Communicated progress & experimental results with stakeholders on a weekly basis, translating technical findings into documentation.',
    ],
    aside: {
      label: 'Context Bloating Demo',
      href: 'https://www.linkedin.com/posts/nabil-al-shanteer_unveiling-bloctogpts-first-milestone-a-activity-7396165233544687616-Unnd',
    },
  },
  {
    id: 'asher',
    org: 'Asher',
    short: 'Asher',
    role: 'Machine Learning Researcher (Intern)',
    place: 'Amman, Jordan',
    from: 'Jul 2024',
    to: 'Sep 2024',
    links: [],
    projects: [],
    points: [
      'Collected & curated hundreds of gesture images to train a convolutional neural network converting real-time Arabic Sign Language into written Arabic text. Model evaluation followed.',
    ],
  },
]

export const THESES = [
  {
    id: 'masters',
    degree: 'Masters Thesis',
    span: { from: '2025', to: '2026' },
    title: 'Event-Driven and Many-Threaded Architectures for High-Frequency Trading',
    place: 'University of Southampton, UK',
    from: 'Jan 2026',
    to: 'May 2026',
    links: [{ label: 'Evaluation Report', href: 'https://zenodo.org/records/23286521' }],
    projects: ['hft-architectures'],
    points: [
      'Surveyed 19 papers (2008–2025) on FPGA acceleration, event-driven computing, neuromorphic chips, & [spiking neural networks (SNNs)](spiking-networks) for HFT, classifying each by methodology and evidence strength.',
      'Critiqued SNN trading backtests (Sharpe ratios above 20 from 23 trading days, no transaction costs) and set out five open research problems, including cross-substrate power benchmarking and agent-based market simulation with hardware-heterogeneous traders.',
    ],
  },
  {
    id: 'bachelors',
    degree: 'Bachelors Thesis',
    /* What the scope draws, where it differs from the dates below.
       `from`/`to` are when the thesis itself was worked on, which is what
       the CV states and what the entry shows; `span` is the stage of the
       degree it belongs to, which is what makes a readable trace. */
    span: { from: 'Sep 2022', to: '2025' },
    title: 'Deep Learning for Activity Recognition in Surveillance',
    place: 'University of Southampton, UK',
    from: 'Sep 2024',
    to: 'May 2025',
    links: [
      {
        label: 'Evaluation Report',
        href: 'https://www.linkedin.com/posts/nabil-al-shanteer_97-accurate-cpu-based-smart-surveillance-activity-7383886535646932992-Zf54',
      },
    ],
    projects: ['activity-recognition'],
    points: [
      'Reproduced & optimised [vision-language model ActionCLIP](activity-recognition) for few-shot learning under limited data and compute. Fine-tuned transformer-based architectures on a custom dataset, reaching 97.56% accuracy & ROC-AUC of 0.9913.',
      'Cut false positives using unsupervised learning, statistical regularisation & Mahalanobis distance for outlier detection, with applications in fraud detection, risk monitoring, & market anomaly identification.',
    ],
  },
]

export const EDUCATION = [
  {
    id: 'soton',
    school: 'University of Southampton',
    short: 'University of Southampton',
    place: 'Southampton, UK',
    from: '2022',
    to: '2026',
    award: 'Master of Electronic Engineering with Artificial Intelligence',
    result: 'First Class Honours',
    links: [
      {
        label: 'Academic Transcript',
        href: 'https://www.linkedin.com/in/nabil-al-shanteer/overlay/Education/762810469/treasury/?profileId=ACoAADU8vJwBu7sLL7078EaizMd99uodGVmqPag',
      },
    ],
  },
  {
    id: 'mashrek',
    school: 'Mashrek International School',
    short: 'Mashrek',
    place: 'Amman, Jordan',
    from: '2019',
    to: '2021',
    award: 'IB Higher Level Mathematics, Physics, Computer Science — 6/7, 6/7, 7/7',
    result: 'Final Grade: 41/45',
    links: [],
  },
]

/* Items are a plain string, or { label, goes } where the thing named is
   a project with a panel of its own.

   The named stacks are worth showing as what they are — a list of tools
   reads badly as prose and well as a set of tags. The paragraphs below
   them are kept as sentences because that is what they are. */
export const STACKS = [
  {
    id: 'cloud',
    label: 'CLOUD DEVELOPMENT',
    items: ['Golang', 'Docker', 'Google Kubernetes Engine', 'Google Compute Engine', 'APIs'],
  },
  {
    id: 'ml',
    label: 'MACHINE LEARNING',
    items: [
      'Python',
      'PyTorch',
      'OpenCV',
      'Pandas',
      'NumPy',
      'Matplotlib',
      'scikit-learn',
      'HuggingFace',
      'AI Agency & Automation',
    ],
  },
  {
    id: 'lab',
    label: 'LABORATORIES',
    /* These three are not loose skills, they are things he built. An
       item may carry a slug, and then it is a way into that panel. */
    items: [
      { label: 'PCB Design and Test', goes: 'laser-revolver' },
      { label: 'Mathematical Modelling of Non-Linear Systems', goes: 'optimal-control' },
      { label: 'Analytical Computation of State Estimates (RLS, LS)', goes: 'kalman-filter' },
    ],
  },
]

export const NOTES = [
  'Cross-functional finance and engineering skills, paired with strong presentation skills and resilience towards unfamiliar problems. Solution-driven & optimiser, efficient worker, maintainer of effective communication.',
  'Able to perform under high pressure. Adaptive to company changes, ability to multitask and prioritise, multiple displays of effective project management.',
  'Interested in the intersection of quantitative modelling, machine learning, and financial markets — particularly in algorithmic trading, risk analytics, and data-driven strategy design. Three-year member of the Quantitative Trading Society at the University of Southampton.',
  'Coming from a Middle Eastern background with strong ties to the region, native speaker of Arabic & French, experience studying under British systems and adapting to said work ethic.',
]

/* Where he has been, as its own channel.

   This used to be the education trace, which made Dubai a qualification
   and read wrong. As places it is honest, and it is the one line that
   has somewhere left to go.

   The dates are the moves, not the terms — a place is left some weeks
   before the next one starts, and those gaps are what put a dip between
   one location and the next instead of one unbroken high line from 2019.

   `goes` names the entry each place belongs to, so picking a location
   opens the thing that took him there rather than the nearest pulse. */
export const PLACES = [
  { id: 'amman', label: 'Amman', from: '2019', to: 'Jul 2021', goes: 'mashrek' },
  { id: 'southampton', label: 'Southampton', from: 'Sep 2022', to: 'Jun 2026', goes: 'soton' },
  { id: 'dubai', label: 'Dubai', from: 'Nov 2026', to: null, goes: 'pwc' },
]

export const SOCIETY = 'https://www.linkedin.com/company/sotonquantsoc/'
