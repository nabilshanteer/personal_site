/* -----------------------------------------------------------------
   Reinforcement Learning — the mathematics behind the RL step in
   language-model alignment.

   A derivation report rather than an implementation, so it carries no
   metrics: inventing numbers for a maths paper would be worse than
   having none. The panel drops the block when the list is empty.

   Sourced from the report in images/projects/rlhf-mathematics/, whose
   pages the asset pipeline renders (it is vector throughout).
   ----------------------------------------------------------------- */

const FIG = '/img/projects/rlhf-mathematics'

export default {
  slug: 'rlhf-mathematics',
  title: 'The Mathematics of RLHF',
  subtitle: 'from Monte Carlo policy gradients to PPO and DPO, derived end to end',

  lead: 'ml',
  tags: ['ml', 'ai'],

  client: 'University of Southampton · COMP6257',
  role: 'Author — individual coursework',
  period: '2026',
  place: 'Southampton, UK',

  summary:
    'A derivation of the reinforcement-learning step in modern language-model alignment, taken from ' +
    'the policy gradient theorem through trust-region methods to PPO and then to DPO, justifying ' +
    'each modelling choice rather than quoting it. The point is not to restate the algorithms but ' +
    'to find the assumptions they inherit — including a case where PPO’s clipping systematically ' +
    'biases learning against rare, high-value actions.',

  problem: [
    'The alignment pipeline everyone uses is a stack of approximations, each made for a reason that ' +
    'is rarely stated where the algorithm is. PPO is a first-order approximation of TRPO, TRPO is a ' +
    'trust-region construction on top of the performance difference lemma, and DPO removes the ' +
    'reinforcement-learning step entirely by exploiting a closed form. Used as a recipe, the stack ' +
    'works. Debugged as a recipe, it does not, because the failure modes live in the ' +
    'approximations.',
    'The specific gap this report targets is that the clipped PPO objective is presented as a cheap ' +
    'stand-in for a KL constraint, and the ways it is not equivalent are left implicit.',
  ],

  solution: [
    'The derivation starts from the policy gradient theorem and the bias-variance behaviour of its ' +
    'Monte Carlo estimator, establishing when variance reduction preserves unbiasedness and why the ' +
    'advantage function is the baseline to use — including what happens to that interpretation when ' +
    'the reward is itself learned from preference data rather than given.',
    'Trust-region methods are then built from Kakade and Langford’s performance difference lemma, ' +
    'giving the TRPO surrogate, its second-order local approximation through the Fisher information ' +
    'matrix, and the asymmetry of the KL constraint — the Fisher matrix is shown to be the Hessian ' +
    'of the expected KL at the base point rather than asserted to be.',
    'PPO follows as the first-order approximation that replaces that constraint with per-sample ' +
    'clipping, and the report extracts what the clipped objective quietly assumes. A scenario is ' +
    'then constructed where the clipping biases learning against rare high-value actions — exactly ' +
    'the actions an alignment process most needs to be able to learn from.',
    'The pipeline closes with the Bradley-Terry preference model, the closed-form optimum of the ' +
    'KL-regularised objective derived through its Lagrangian, and the step where DPO exploits that ' +
    'closed form to turn preference learning into supervised classification.',
  ],

  contribution: [
    'Derived the full chain from the policy gradient theorem to the DPO gradient, with each approximation justified at the point it is introduced.',
    'Identified three structural threads running through the whole derivation: the score-mean-zero identity as the algebraic engine of every gradient rearrangement, the performance difference lemma as the anchor of trust-region methods, and the progression from on-policy through quasi-off-policy to fully off-policy as a sample-efficiency against adaptivity trade-off.',
    'Constructed the failure case for PPO clipping on rare, high-value actions rather than describing it abstractly.',
    'Derived the closed-form KL-regularised optimum via Lagrange multipliers and showed strict positivity falls out of the exponential form, so the non-negativity constraints can be dropped.',
    'Showed the Fisher information matrix is the Hessian of the expected KL divergence at the base point, giving the second-order Taylor expansion TRPO relies on.',
  ],

  outcome: [
    'The derivation makes the stack legible as a sequence of deliberate trades rather than a recipe: ' +
    'each step buys sample efficiency or stability and pays for it somewhere specific, and knowing ' +
    'where is the difference between tuning an alignment run and guessing at it.',
    'The PPO clipping result is the part I would take further. If the clipped objective is biased ' +
    'against rare high-value actions, that bias has a direction and a magnitude that could be ' +
    'measured on a small controlled task rather than argued about — which is the natural follow-up, ' +
    'and the one thing a derivation alone cannot settle.',
  ],

  /* The document this panel was written from. Served straight out of
     public/doc by the asset pipeline, opened in a new tab. */
  report: { href: '/doc/projects/rlhf-mathematics/submission.pdf', label: 'Read Report' },

  stack: [
    'Reinforcement learning', 'Policy gradients', 'TRPO', 'PPO', 'DPO',
    'RLHF', 'Bradley-Terry model', 'Convex optimisation', 'LaTeX',
  ],

  hero: {
    src: `${FIG}/submission-page1.webp`,
    caption: 'From the policy gradient theorem to DPO — the report’s opening derivation',
  },

  check: [
    'The panel carries no metrics block, on purpose: this is a derivation, and the alternative was inventing numbers for it. Say if you would rather have something there.',
    'The pages are rendered images of the PDF, so the figures band shows pages of mathematics. That reads fine on the whiteboard viewer but it is not a diagram — if the report has one figure worth pulling out, point me at the page.',
    'Period is my guess from the module sequence.',
  ],
}
