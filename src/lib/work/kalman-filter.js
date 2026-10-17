/* -----------------------------------------------------------------
   Tracking, Uncertainty, and Information Over Time — the 2D
   constant-velocity Kalman filter.

   Sourced from the report in images/projects/kalman-filter/. Figures are
   lifted out of the PDF by the asset pipeline.
   ----------------------------------------------------------------- */

const FIG = '/img/projects/kalman-filter'

export default {
  slug: 'kalman-filter',
  title: '2D Kalman Filter',
  subtitle: 'tracking, uncertainty, and what a confident filter can still get wrong',

  lead: 'ml',
  tags: ['ml', 'signal'],

  client: 'University of Southampton · COMP6257',
  role: 'Author — individual coursework',
  period: '2026',
  place: 'Southampton, UK',

  summary:
    'A constant-velocity Kalman filter built from first principles for two-dimensional tracking, ' +
    'then pushed past the usual stopping point: the uncertainty it reports is analysed in units of ' +
    'information, using differential entropy and KL divergence. The finding that matters is that a ' +
    'filter can be confident and wrong at the same time, and that its own covariance will not tell ' +
    'you which.',

  metrics: [
    { label: 'State dimension', value: '4', note: 'position and velocity in x and y' },
    { label: 'Velocity observed', value: '0', note: 'recovered entirely from noisy position' },
    { label: 'Steady-state KL, tight noise', value: '0.022', note: 'nats per measurement' },
    { label: 'Steady-state KL, loose noise', value: '1.521', note: 'nats — each measurement far more informative' },
  ],

  problem: [
    'The object is observed through noisy position measurements only. Velocity is never measured ' +
    'and has to be inferred from how position changes, which is the part of state estimation that ' +
    'makes it worth doing rather than just smoothing.',
    'The harder question is not whether the filter tracks, but whether its reported uncertainty ' +
    'means anything. A Kalman filter always returns a covariance, and that covariance is a ' +
    'statement about confidence that an engineer downstream will act on. If the process noise is ' +
    'set too low, the filter becomes certain of a trajectory that is drifting away from the truth — ' +
    'and nothing in its own output flags that.',
  ],

  solution: [
    'The state-space model, the prediction step and the update recursion were derived and ' +
    'implemented from scratch rather than called from a library, so the covariance propagation is ' +
    'visible rather than assumed.',
    'Uncertainty was then tracked through time under varied process and measurement noise ' +
    'configurations, producing the characteristic predict-update sawtooth: covariance grows during ' +
    'prediction, collapses on measurement, and converges to a steady state set by the ratio of ' +
    'process to measurement noise rather than by either alone.',
    'The information-theoretic view is what turns that from a plot into a diagnosis. Differential ' +
    'entropy measures the filter’s confidence in nats; KL divergence between the prediction and the ' +
    'posterior measures how much each observation actually told it. Across three noise ' +
    'configurations the steady-state KL ran 0.022, 0.220 and 1.521 nats — the same convergence ' +
    'behaviour the covariance shows, but expressed as information gained per measurement, which is ' +
    'the quantity you can compare across filters.',
  ],

  contribution: [
    'Derived the constant-velocity state-space model and implemented the full predict-update recursion from first principles.',
    'Simulated the trajectory and the measurement process, and set the filter initialisation deliberately rather than by default.',
    'Ran the uncertainty analysis across process and measurement noise configurations and identified the Q/R ratio as the governing parameter for both responsiveness and steady-state uncertainty.',
    'Built the information-theoretic analysis — differential entropy and KL divergence — and used it to demonstrate the mis-calibration failure mode.',
  ],

  outcome: [
    'The filter recovers both position and the unobserved velocity, and the entropy and KL analyses ' +
    'confirm that the information view and the covariance view describe the same convergence.',
    'The result worth keeping is the failure case: when process noise is underestimated, the filter ' +
    'is simultaneously confident and poorly calibrated. Low reported uncertainty does not imply ' +
    'accuracy. That makes principled noise-parameter selection as important as implementing the ' +
    'recursion correctly — which is the opposite of how the filter is usually taught, where the ' +
    'recursion is the lesson and Q and R are handed to you.',
  ],

  /* The document this panel was written from. Served straight out of
     public/doc by the asset pipeline, opened in a new tab. */
  report: { href: '/doc/projects/kalman-filter/report.pdf', label: 'Read Report' },

  stack: [
    'Python', 'NumPy', 'Bayesian filtering', 'State-space modelling',
    'Differential entropy', 'KL divergence', 'Matplotlib',
  ],

  hero: {
    src: `${FIG}/report-p2-2.webp`,
    caption: 'Tracking the simulated trajectory from noisy position measurements alone',
  },

  diagramSets: [
    {
      id: 'figures',
      title: 'Figures from the report',
      note: 'Trajectory, covariance over time, and the information analysis.',
      figures: [
        { src: `${FIG}/report-p2-1.webp`, caption: 'The constant-velocity model' },
        { src: `${FIG}/report-p2-2.webp`, caption: 'Simulated trajectory against noisy measurements' },
        { src: `${FIG}/report-p3-3.webp`, caption: 'Filter estimate against ground truth' },
        { src: `${FIG}/report-p3-4.webp`, caption: 'Position uncertainty — the predict-update sawtooth' },
        { src: `${FIG}/report-p4-5.webp`, caption: 'Velocity recovered from position alone' },
        { src: `${FIG}/report-p4-6.webp`, caption: 'Covariance convergence under varied noise' },
        { src: `${FIG}/report-p5-9.webp`, caption: 'Differential entropy over time' },
        { src: `${FIG}/report-p5-10.webp`, caption: 'KL divergence per measurement' },
      ],
    },
  ],

  check: [
    'The report is submitted anonymously ("Anonymous Submission, Assignment II") — it carries no name. Fine for a portfolio, but worth knowing if anyone asks for the original.',
    'Figure captions are inferred from their order in the report, not from the caption text. Check them before this goes in front of anyone.',
    'The pipeline lifted twelve figures out of the PDF; the panel uses eight. The rest are on disk if you want to swap any in.',
  ],
}
