/* -----------------------------------------------------------------
   A Review On: Spiking Neural Networks Need High-Frequency
   Information — ICLR 2026 Reproducibility Challenge.

   Team project: Anna Obure, Kaylan Bakrania, Nabil Al-Shanteer.
   `contribution` is deliberately written as the team's work, because the
   report does not split authorship by section and a portfolio should not
   invent one. See `check`.

   Sourced from the report in images/projects/spiking-networks/ and the
   public code repository.
   ----------------------------------------------------------------- */

const FIG = '/img/projects/spiking-networks'

export default {
  slug: 'spiking-networks',
  title: 'Spiking Networks Need High Frequency',
  subtitle: 'reproducing, and then complicating, an ICLR submission',

  lead: 'ml',
  tags: ['ml'],

  client: 'University of Southampton · COMP6258',
  role: 'Co-author — three-person team',
  period: '2026',
  place: 'Southampton, UK',

  summary:
    'A reproducibility study of the claim that the accuracy gap between spiking and artificial ' +
    'neural networks is caused not by binary spikes but by low-pass filtering: the LIF charging ' +
    'equation behaves as a first-order IIR filter, and the effect compounds across layers. We ' +
    'reproduced the headline results, then tested the three places the original argument does not ' +
    'quite close — and found it is right about the principle and wrong about the mechanism.',

  metrics: [
    { label: 'CIFAR-10 top-1', value: '96.64', unit: '%', note: 'full MaxFormer, reproduced' },
    { label: 'CIFAR-100 top-1', value: '81.44', unit: '%', note: 'reproduced' },
    { label: 'Gain from learnable β', value: '+0.49', note: 'percentage points over the fixed-β baseline' },
    { label: 'SHD, high-frequency mixing', value: '93.12', unit: '%', note: 'against 92.75% low-pass, 5 seeds' },
    { label: 'Extensions tested', value: '3', note: 'β, token-mixing operator, temporal axis' },
  ],

  problem: [
    'Spiking networks are attractive because binary spike communication costs very little energy on ' +
    'neuromorphic hardware, and unattractive because they have historically been less accurate than ' +
    'conventional networks. The conventional explanation is representation error — binary ' +
    'activations simply cannot carry enough precision.',
    'The paper under review rejects that and argues the real cause is frequency: the LIF neuron ' +
    'low-pass filters its input, with the decay factor β setting the cutoff, and the suppression ' +
    'compounds with depth. Its evidence is a +2.39% CIFAR-100 gain from swapping average-pooling ' +
    'for max-pooling.',
    'That evidence has three gaps. β is treated as fixed at 0.5 despite the transfer function ' +
    'identifying it as the key tunable. The high-frequency claim rests entirely on one operator ' +
    'comparison, so it cannot separate "high frequencies help" from "max-pooling helps". And the ' +
    'theory is about the temporal axis while every validation is on spatial image features.',
  ],

  solution: [
    'The baseline was reproduced first using the authors’ released code and configurations, which ' +
    'is the part most reproducibility attempts skip and the only thing that makes the extensions ' +
    'mean anything.',
    'Each gap then got its own experiment. β was made learnable rather than fixed. The token-mixing ' +
    'operator was swapped for min-pooling, a Laplacian filter and a learned high-pass filter, so ' +
    'that max-pooling could be distinguished from high-frequency amplification in general. And the ' +
    'analysis was extended onto the temporal axis using the Spiking Heidelberg Digits dataset, ' +
    'where the cochlear and timestep axes can be measured separately.',
    'That last experiment is the one that pays. Measuring high-frequency energy along both axes ' +
    'shows max-pooling restoring it along the cochlear axis and not along the timestep axis — so ' +
    'the architectural fix acts spatially while the theory motivating it is temporal.',
  ],

  contribution: [
    'Reproduced the paper’s headline results from the released codebase, reaching 96.64% on CIFAR-10 and 81.44% on CIFAR-100.',
    'Extended the model with a learnable decay factor β, beating the fixed-β baseline by 0.49 percentage points.',
    'Tested whether the benefit is specific to max-pooling by comparing min-pooling, Laplacian and learned high-pass token mixers — and found the high-frequency amplifiers outperform max-pooling itself.',
    'Took the analysis onto the temporal axis with the SHD dataset over five seeds, and measured high-frequency energy separately along the cochlear and timestep axes.',
    'Wrote up the partial validation honestly rather than claiming either a clean reproduction or a refutation.',
  ],

  outcome: [
    'The paper’s direction holds: the ANN-to-SNN gap is not explained by binary spikes alone, and ' +
    'the frequency suppression caused by LIF dynamics matters. But the mechanism is broader than ' +
    'claimed — LearnedHP and Laplacian operators beat max-pooling using different mechanisms, so ' +
    'the original gain belongs to the principle of restoring high-frequency information, not to ' +
    'max-pooling as such.',
    'And the SHD result leaves the theory half-validated in a specific, useful way: spatial ' +
    'high-frequency restoration is not enough to overcome temporal information suppression, because ' +
    'the operator and the theory act on different axes. The next experiment follows directly — ' +
    'operators that act along the timestep axis, such as temporal depthwise convolutions or ' +
    'learnable temporal high-pass filters. The honest limitation is that walltime prevented full ' +
    '400-epoch training, and the SHD ANN baselines stayed weak.',
  ],

  /* The document this panel was written from. Served straight out of
     public/doc by the asset pipeline, opened in a new tab. */
  report: { href: '/doc/projects/spiking-networks/reproducibility-challenge-report.pdf', label: 'Read Report' },

  stack: [
    'Python', 'PyTorch', 'Spiking neural networks', 'Transformers',
    'CIFAR-10 / CIFAR-100', 'Spiking Heidelberg Digits', 'Signal analysis',
  ],

  hero: {
    src: `${FIG}/reproducibility-challenge-report-p4-2.webp`,
    caption: 'High-frequency energy across processing stages — restored along the cochlear axis, not the temporal one',
  },

  diagramSets: [
    {
      id: 'results',
      title: 'Results',
      note: 'The reproduction, then the three extensions.',
      figures: [
        { src: `${FIG}/reproduction-results.webp`, caption: 'Reproduced baselines — 96.64% on CIFAR-10, 81.44% on CIFAR-100' },
        { src: `${FIG}/fixed-beta-sweep-table.webp`, caption: 'Sweeping the fixed decay factor β, against making it learnable' },
        { src: `${FIG}/alternative-token-mixing.webp`, caption: 'Alternative token mixers — min-pool, Laplacian and learned high-pass against max-pooling' },
        { src: `${FIG}/mean-top-1-acc.webp`, caption: 'Mean top-1 accuracy on SHD across five seeds' },
      ],
    },
    {
      id: 'frequency',
      title: 'Where the high-frequency energy goes',
      note: 'The measurement that leaves the original theory half-validated.',
      figures: [
        { src: `${FIG}/reproducibility-challenge-report-p2-1.webp`, caption: 'Reproduced baselines, as published in the report' },
        { src: `${FIG}/reproducibility-challenge-report-p4-2.webp`, caption: 'High-frequency energy by stage: cochlear axis (left) against temporal axis (right)' },
        { src: `${FIG}/reproducibility-challenge-report-p4-3.webp`, caption: 'SHD results across five seeds' },
      ],
    },
  ],

  links: [
    { label: 'Code', href: 'https://github.com/COMP6258-Reproducibility-Challenge/SNNs_need_HF_info' },
  ],

  check: [
    'This is a three-person project with Anna Obure and Kaylan Bakrania. The panel says so in the role line and writes MY PART IN IT as the team’s work, because the report does not divide authorship. If you did specific parts, tell me and I will narrow those bullets to yours — that is strictly better than the current wording.',
    'The report header says "Under review as a conference paper at ICLR 2026", which is the challenge template rather than a real submission. Nobody is likely to misread it, but be ready for the question.',
    'Figure captions for the first and third figures are inferred from position. Check them.',
  ],
}
