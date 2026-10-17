/* -----------------------------------------------------------------
   The datasheet callouts.

   Each one hangs off a part of him that has something to do with the
   discipline it names: the eyes see, the ears hear and keep balance,
   the nose senses, the mouth transmits, the chest is where the board
   lives, the shoulders carry the hardware.

   `anchor` keys come from public/img/face.json, which the asset script
   derives from the detected face — change the photograph and every
   label re-places itself. `y` is where the label parks, as a fraction
   of the image height, and is the only thing to adjust if two ever
   collide. Keep each side's list in vertical order or the leader lines
   will cross each other.
   ----------------------------------------------------------------- */

export const callouts = [
  // --- right side, top to bottom ---
  {
    anchor: 'crown',
    side: 'right',
    y: 0.04,
    label: 'MACHINE LEARNING',
    detail: 'PyTorch · neural networks',
  },
  {
    anchor: 'eyeRight',
    side: 'right',
    y: 0.2,
    label: 'IMAGE PROCESSING',
    detail: 'filtering · segmentation',
  },
  {
    anchor: 'earRight',
    side: 'right',
    y: 0.36,
    label: 'SIGNAL PROCESSING',
    detail: 'DSP · FFT · filtering',
  },
  {
    anchor: 'mouth',
    side: 'right',
    y: 0.52,
    label: 'SERIAL COMMS',
    detail: 'UART · SPI · CAN',
  },
  {
    anchor: 'shoulderRight',
    side: 'right',
    y: 0.7,
    label: 'PCB DESIGN',
    detail: 'KiCad · schematic capture',
  },
  {
    anchor: 'chest',
    side: 'right',
    y: 0.88,
    label: 'EMBEDDED SYSTEMS',
    detail: 'STM32 · firmware · RTOS',
  },

  // --- left side, top to bottom. Nothing below 0.62: the location card
  //     sits in the bottom-left corner and would shadow it.
  {
    anchor: 'eyeLeft',
    side: 'left',
    y: 0.12,
    label: 'COMPUTER VISION',
    detail: 'OpenCV · detection · depth',
  },
  {
    anchor: 'earLeft',
    side: 'left',
    y: 0.29,
    label: 'CONTROL SYSTEMS',
    detail: 'feedback · stability',
  },
  {
    anchor: 'nose',
    side: 'left',
    y: 0.46,
    label: 'SENSORS',
    detail: 'instrumentation · calibration',
  },
  {
    anchor: 'shoulderLeft',
    side: 'left',
    y: 0.62,
    label: 'DIGITAL LOGIC',
    detail: 'Verilog · FPGA',
  },
]

/* -----------------------------------------------------------------
   The menu.

   Portfolio and Contact were asked for. The other three are the ones a
   recruiter looks for and cannot currently find: who you are, the CV
   itself, and somewhere that shows you are still building things.
   ----------------------------------------------------------------- */

export const menu = [
  { label: 'Portfolio', note: 'selected work', href: '/work' },
  { label: 'About', note: 'who I am', href: '/about' },
  { label: 'CV', note: 'the document', href: '/cv' },
  { label: 'Contact', note: 'get in touch', href: '/contact' },
]

/* The two bands that run behind the picture during the hand-off to panel
   two. Top row travels left to right, the one below it right to left. */

export const bands = [
  'ELECTRONIC ENGINEERING · ARTIFICIAL INTELLIGENCE · ',
  'EMBEDDED SYSTEMS · SIGNAL PROCESSING · COMPUTER VISION · ',
]

/* -----------------------------------------------------------------
   The work.

   The wheel turns through CATEGORIES, not projects. Pick one and its
   projects are listed beside it.

   A project belongs to as many categories as it honestly belongs to —
   `tags` is a list, not a single value. An agent running on a board is
   filed under both AI and Embedded, and appears on both spokes. That is
   the right answer rather than a compromise: someone browsing Embedded
   Systems should find it there, and someone browsing AI should too.

   What stops that feeling like padding is `lead`: the category a project
   is most itself. The lead category shows it full strength; the others
   show it as a cross-reference, marked with the categories it bridges.
   So nothing is hidden, nothing is double-counted, and a project that
   spans two fields reads as a strength rather than as a filing error.
   ----------------------------------------------------------------- */

export const categories = [
  { id: 'ai', label: 'AI & AGENCY', note: 'agents · LLM systems' },
  { id: 'ml', label: 'MACHINE LEARNING', note: 'embeddings · clustering' },
  { id: 'vision', label: 'COMPUTER VISION', note: 'detection · depth' },
  { id: 'embedded', label: 'EMBEDDED SYSTEMS', note: 'firmware · RTOS' },
  { id: 'signal', label: 'SIGNAL PROCESSING', note: 'DSP · FFT' },
  { id: 'control', label: 'CONTROL SYSTEMS', note: 'feedback · stability' },
  { id: 'hardware', label: 'HARDWARE', note: 'PCB · FPGA' },
]

/* `lead` must be one of the tags. `org` is whoever the work was for: its
   mark rides beside the project name on the wheel, and `name` is what a
   screen reader reads out in its place. */
export const projects = [
  {
    slug: 'bloctogpt',
    org: { mark: '/img/logos/bloctopus.png', name: 'Bloctopus' },
    title: 'BLOCTOGPT',
    year: '2026',
    lead: 'ai',
    tags: ['ai'],
    blurb: 'AI-driven Web3 infrastructure assistant, built for Bloctopus.',
  },
  {
    slug: 'advice-assistant',
    org: { mark: '/img/logos/citizens-advice.png', name: 'Citizens Advice' },
    title: 'AI LEGAL ADVICE\nASSISTANT',
    year: '2026',
    lead: 'ai',
    tags: ['ai'],
    blurb: 'Source-grounded retrieval for Citizens Advice frontline advisors.',
  },
  {
    slug: 'qualitative-clustering',
    org: { mark: '/img/logos/nhs.png', name: 'NHS' },
    title: 'QUALITATIVE\nCLUSTERING',
    year: '2026',
    lead: 'ml',
    tags: ['ml', 'ai'],
    blurb: 'Human-in-the-loop theme discovery in NHS patient feedback.',
  },
  {
    slug: 'activity-recognition',
    org: { mark: '/img/logos/soton.png', name: 'University of Southampton' },
    title: 'ACTIVITY\nRECOGNITION',
    year: '2025',
    lead: 'vision',
    tags: ['vision', 'ml'],
    blurb: 'Few-shot action recognition in surveillance with a fine-tuned vision-language model.',
  },
  {
    slug: 'laser-revolver',
    org: { mark: '/img/logos/soton.png', name: 'University of Southampton' },
    title: 'LASER REVOLVER',
    year: '2024',
    lead: 'vision',
    tags: ['vision', 'embedded', 'hardware'],
    blurb: 'A scored laser shooting range: Pi Pico, camera, and vision that reads the ring.',
  },
  {
    slug: 'spiking-networks',
    org: { mark: '/img/logos/soton.png', name: 'University of Southampton' },
    title: 'SPIKING NEURAL\nNETWORKS',
    year: '2026',
    lead: 'ml',
    tags: ['ml'],
    blurb: 'Reproducing, and then complicating, an ICLR claim about frequency in spiking networks.',
  },
  {
    slug: 'gaussian-processes',
    org: { mark: '/img/logos/soton.png', name: 'University of Southampton' },
    title: 'GAUSSIAN PROCESSES',
    year: '2026',
    lead: 'ml',
    tags: ['ml'],
    blurb: 'Kernel inductive bias, and how an over-confident surrogate stops exploring.',
  },
  {
    slug: 'rlhf-mathematics',
    org: { mark: '/img/logos/soton.png', name: 'University of Southampton' },
    title: 'THE MATHEMATICS\nOF RLHF',
    year: '2026',
    lead: 'ml',
    tags: ['ml', 'ai'],
    blurb: 'Policy gradients to PPO to DPO, derived — and where clipping biases learning.',
  },
  {
    slug: 'kalman-filter',
    org: { mark: '/img/logos/soton.png', name: 'University of Southampton' },
    title: '2D KALMAN FILTER',
    year: '2026',
    lead: 'ml',
    tags: ['ml', 'signal'],
    blurb: 'Tracking, uncertainty, and how a filter can be confident and wrong at once.',
  },
  {
    slug: 'optimal-control',
    org: { mark: '/img/logos/soton.png', name: 'University of Southampton' },
    title: 'OPTIMAL &\nLEARNING CONTROL',
    year: '2025',
    lead: 'control',
    tags: ['control'],
    blurb: 'PID, MPC, LQR and ILC on two unstable platforms, compared under real limits.',
  },
  {
    slug: 'hft-architectures',
    org: { mark: '/img/logos/soton.png', name: 'University of Southampton' },
    title: 'EVENT-DRIVEN HFT\nARCHITECTURES',
    year: '2026',
    lead: 'hardware',
    tags: ['hardware', 'ml'],
    blurb: 'A survey of FPGA, neuromorphic and spiking approaches to low-latency trading.',
  },
]

/* Everything filed under a category, its own projects first. */
export const projectsIn = (id) =>
  projects
    .filter((project) => project.tags.includes(id))
    .sort((a, b) => (a.lead === id ? -1 : 0) - (b.lead === id ? -1 : 0))

/* Four bits covers sixteen categories, which is more than this will need. */
export const toBinary = (n) => n.toString(2).padStart(4, '0')
