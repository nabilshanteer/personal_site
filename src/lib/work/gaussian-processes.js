/* -----------------------------------------------------------------
   Gaussian Process Regression: Kernel Inductive Bias, Posterior
   Uncertainty, and Bayesian Optimisation.

   Sourced from the report and the exported figures in
   images/projects/gaussian-processes/.
   ----------------------------------------------------------------- */

const FIG = '/img/projects/gaussian-processes'

export default {
  slug: 'gaussian-processes',
  title: 'Gaussian Processes',
  subtitle: 'kernel inductive bias, posterior uncertainty, and where Bayesian optimisation fails',

  lead: 'ml',
  tags: ['ml'],

  client: 'University of Southampton · COMP6257',
  role: 'Author — individual coursework',
  period: '2026',
  place: 'Southampton, UK',

  summary:
    'Five experiments following the kernel from prior construction through to Bayesian ' +
    'optimisation, built around a single question: what does the choice of kernel commit you to ' +
    'before you have seen any data? The answer turns out to be most of the behaviour that matters, ' +
    'and the failure it produces is not a bad fit — it is a confident, smooth, completely wrong ' +
    'extrapolation.',

  metrics: [
    { label: 'Squared-exponential log ML', value: '−11.32', note: 'against −21.11 OU and −22.87 linear' },
    { label: 'Training RMSE', value: '0.195', note: 'squared-exponential model' },
    { label: 'Leave-one-out RMSE', value: '0.272', note: 'a ratio of 1.39 — hyperparameter overfit' },
    { label: 'Next query under EI', value: '6.5', note: 'acquisition value 1.024' },
    { label: 'Kernel families compared', value: '4', note: 'by covariance matrix and prior sample paths' },
  ],

  problem: [
    'A Gaussian process defines a distribution over functions, and the kernel encodes what you ' +
    'believe about them — smoothness, stationarity, periodicity — before any data arrives. Two GPs ' +
    'fitted to identical observations can agree everywhere the data sits and diverge completely the ' +
    'moment they leave it. The kernel is the whole of that difference.',
    'In Bayesian optimisation this stops being an aesthetic concern. The acquisition function reads ' +
    'the surrogate’s uncertainty to decide where to spend the next evaluation. A surrogate that is ' +
    'over-confident reports almost no uncertainty anywhere, the acquisition collapses toward zero, ' +
    'and the search stops exploring — spending the query budget re-confirming what it already ' +
    'believes while an unvisited peak sits outside its posterior.',
  ],

  solution: [
    'Four kernel families were characterised by their covariance matrices and prior sample paths to ' +
    'establish which properties are actually identifiable from a finite sample. Smoothness beyond ' +
    'the first detectable order, exact hyperparameter values, and behaviour outside the observed ' +
    'domain are not — which bounds how much of the kernel choice data can ever justify.',
    'Three kernels were then fitted to f(x) = 1.5x + sin(x) and ranked by log marginal likelihood: ' +
    'squared-exponential at −11.32, Ornstein-Uhlenbeck at −21.11, linear at −22.87. The ordering ' +
    'mirrors the degree of prior mismatch, so the marginal likelihood is doing the job it claims to.',
    'Leave-one-out cross-validation then checks the marginal likelihood against itself: training ' +
    'RMSE of 0.195 against a LOO RMSE of 0.272 is a ratio of 1.39, a detectable signal that ' +
    'maximising marginal likelihood has mildly overfitted the hyperparameters. The objective is ' +
    'biased, measurably, and the measurement is cheap.',
    'The over-confidence failure was then constructed deliberately rather than described. A single ' +
    'badly chosen length scale — 15, on a domain of length 5 — collapses posterior variance ' +
    'globally, producing a 95% interval that excludes the true function in the extrapolation region ' +
    'while the posterior mean stays perfectly smooth. Under expected improvement the calibrated ' +
    'surrogate picks x = 6.5 with an acquisition value of 1.024; the over-confident one has an ' +
    'acquisition that is null everywhere and never explores at all.',
  ],

  contribution: [
    'Implemented GP priors, posteriors and the marginal likelihood from the kernel up, across four kernel families.',
    'Quantified inductive bias by log marginal likelihood on a common regression target and showed the ranking tracks prior mismatch.',
    'Ran leave-one-out cross-validation to detect hyperparameter overfit in the marginal-likelihood objective.',
    'Constructed the over-confidence failure case and showed it collapses the expected-improvement acquisition to zero.',
    'Swept the observation-noise level to characterise the exploration-exploitation balance, and showed the maximum-likelihood noise estimate is what makes the balance land correctly.',
  ],

  outcome: [
    'Covariance matrices and sample paths give real qualitative evidence for kernel identification, ' +
    'but only up to a point that the experiments pin down: past the first detectable smoothness ' +
    'order, a finite sample cannot distinguish between kernels that will behave completely ' +
    'differently off the data.',
    'The practical conclusion is that the exploration-exploitation trade-off is not governed by the ' +
    'acquisition function alone — it is governed just as much by whether the surrogate’s uncertainty ' +
    'is calibrated to the true observation noise. Since the noise level is rarely known in advance ' +
    'and has to be inferred jointly with the kernel hyperparameters, marginal-likelihood estimation ' +
    'is not a tuning detail in a Bayesian optimisation pipeline. It is the component the rest ' +
    'depends on.',
  ],

  /* The document this panel was written from. Served straight out of
     public/doc by the asset pipeline, opened in a new tab. */
  report: { href: '/doc/projects/gaussian-processes/report.pdf', label: 'Read Report' },

  stack: [
    'Python', 'NumPy', 'SciPy', 'Gaussian processes', 'Kernel methods',
    'Bayesian optimisation', 'Cross-validation', 'Matplotlib',
  ],

  hero: {
    src: `${FIG}/section5-1.webp`,
    caption: 'Expected improvement under three noise levels — the calibrated surrogate is the only one that explores sensibly',
  },

  diagramSets: [
    {
      id: 'priors',
      title: 'Priors and kernel identification',
      note: 'Covariance matrices and prior sample paths across four kernel families.',
      figures: [
        { src: `${FIG}/section1-1.webp`, caption: 'Kernel covariance matrices' },
        { src: `${FIG}/section1-2.webp`, caption: 'Prior sample paths' },
        { src: `${FIG}/section1-3.webp`, caption: 'What a finite sample can and cannot identify' },
      ],
    },
    {
      id: 'posterior',
      title: 'Fit, uncertainty and over-confidence',
      note: 'Marginal likelihood, leave-one-out, and the collapsed posterior.',
      figures: [
        { src: `${FIG}/section3.webp`, caption: 'Three kernels fitted to f(x) = 1.5x + sin(x)' },
        { src: `${FIG}/section4-1.webp`, caption: 'Posterior with calibrated length scale' },
        { src: `${FIG}/section4-2.webp`, caption: 'Over-smoothed posterior at ℓ = 15 — smooth, confident, and wrong' },
        { src: `${FIG}/section4-3.webp`, caption: 'Leave-one-out residuals' },
      ],
    },
    {
      id: 'bayesopt',
      title: 'Bayesian optimisation',
      note: 'Expected improvement, and what miscalibration does to it.',
      figures: [
        { src: `${FIG}/section5-1.webp`, caption: 'EI across three noise levels' },
        { src: `${FIG}/section5-2.webp`, caption: 'The calibrated surrogate selects x = 6.5' },
        { src: `${FIG}/section5-3.webp`, caption: 'The over-confident surrogate: acquisition null everywhere' },
      ],
    },
  ],

  check: [
    'Figure captions are inferred from the section each file is named after. Worth checking against the report before this is public.',
    'Period is my guess from the module sequence — correct it if wrong.',
  ],
}
