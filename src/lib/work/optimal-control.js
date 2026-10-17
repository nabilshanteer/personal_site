/* -----------------------------------------------------------------
   Optimal, Predictive, and Iterative Learning Control of Two Unstable
   Platforms.

   Sourced from the report in images/projects/optimal-control/. Every
   number below is quoted from it.
   ----------------------------------------------------------------- */

const FIG = '/img/projects/optimal-control'

export default {
  slug: 'optimal-control',
  title: 'Optimal, Predictive & Learning Control',
  subtitle: 'balancing two unstable platforms with PID, MPC, LQR and ILC',

  lead: 'control',
  tags: ['control'],

  client: 'University of Southampton · ECS',
  role: 'Author — individual coursework',
  period: '2025',
  place: 'Southampton, UK',

  summary:
    'Two unstable platforms, four controllers, and the trade-offs between them measured rather than ' +
    'asserted. A two-wheeled robot whose tilt angle doubles every 93 milliseconds is balanced with ' +
    'PID and with MPC; a rotary inverted pendulum tracks a sinusoid under LQR, MPC and two flavours ' +
    'of iterative learning control. The interesting results are the places where the textbook ' +
    'answer and the practical answer disagree.',

  metrics: [
    { label: 'Open-loop doubling time', value: '93', unit: 'ms', note: 'unstable pole at +7.44 rad/s' },
    { label: 'PID peak demand', value: '17.81', unit: 'V', note: 'recovers a 5° tilt in 0.102 s' },
    { label: 'MPC peak demand', value: '7.47', unit: 'V', note: 'same recovery, inside the ±9 V limit' },
    { label: 'Drift with cascade loop', value: '±2', unit: 'rad', note: 'against −200 rad without it' },
    { label: 'ILC convergence', value: '3', note: 'iterations, norm-optimal — against 14 for PD-type' },
  ],

  problem: [
    'Both platforms are unstable in the strict sense: left alone, a small tilt grows. The ' +
    'two-wheeled robot has a pole at +7.44 rad/s, which is a 93 ms doubling time — the system ' +
    'falls over faster than a person could react, so the controller is not an improvement on the ' +
    'open loop, it is the only thing holding the platform up.',
    'The robot is also structurally awkward. Wheel position never influences any other state and ' +
    'leaves no fingerprint on the gyroscope, so it is unobservable from the balance sensor: the ' +
    'observability rank from tilt alone is 3 of 4. A controller that only regulates tilt will ' +
    'balance perfectly and quietly drive itself across the room, because once tilt is zero the ' +
    'motor voltage drops to zero and the wheels stay wherever they stopped.',
    'And the honest constraint is the actuator. The motors accept ±9 V. A controller that achieves ' +
    'a beautiful response by demanding 17.81 V has not solved the problem, it has solved a ' +
    'different one.',
  ],

  solution: [
    'The PID is implemented as structured state feedback on an augmented state with an integrator, ' +
    'tuned for a 60° phase margin. It recovers a 5° tilt in 0.102 s — and demands 17.81 V at peak, ' +
    'which the hardware cannot deliver. Under gyroscope noise its derivative term drives rail-to-rail ' +
    'voltage chattering, which is the behaviour that destroys motors.',
    'The MPC solves a constrained quadratic programme at each step over a finite horizon, with the ' +
    '±9 V limit enforced as a constraint rather than hoped for. It reaches the same recovery inside ' +
    '7.47 V, and because its internal Kalman estimator reconstructs the state from a reduced ' +
    'three-state observable model, it produces smooth commands under exactly the noise that made ' +
    'the PID chatter.',
    'Position drift is handled by a cascade: a slower outer loop reads the wheel encoder and feeds a ' +
    'small tilt reference back into the fast inner balance loop, so a forward displacement commands ' +
    'a slight backward lean. That bounds drift to ±2 rad over a 30-second run against −200 rad ' +
    'without it. Adding integral or derivative action to the outer loop destabilised every ' +
    'configuration tested — the inner derivative gain amplifies each step change in the reference ' +
    'and pushes the combined loop past stability.',
    'On the rotary pendulum, LQR and MPC land in almost the same place: their feedback gains differ ' +
    'only at the third decimal, which is the unconstrained MPC gain converging to the LQR gain as ' +
    'the horizon grows — the theory, visible in the numbers. The two ILC variants then expose the ' +
    'real trade-off. A PD-type update converges in about 14 iterations to an error norm of ~1; a ' +
    'model-based norm-optimal update converges in about 3 but settles higher, at ~2, because it ' +
    'trusts a plant model that is not exact.',
  ],

  contribution: [
    'Derived and linearised the state-space model, located the instability in a single positive matrix entry coupling tilt into tilt acceleration, and established that wheel position is structurally unobservable from the tilt sensor.',
    'Designed and tuned the PID, the cascade PID, and a two-output MPC regulating tilt and position inside one optimisation with a 0.5 s prediction horizon.',
    'Built the Simulink environment with band-limited gyro noise, a 20 ms sensor delay and impulse push disturbances, so the comparison was made under conditions the controllers would actually meet.',
    'Implemented LQR, MPC and two ILC variants on the rotary inverted pendulum and compared convergence rate against steady-state error.',
    'Showed the convergence of the unconstrained MPC gain to the LQR gain numerically rather than citing it.',
  ],

  outcome: [
    'The comparison produced one result worth carrying forward: constrained optimisation is not a ' +
    'more sophisticated way to get the same answer as a tuned PID, it is a way to get an answer the ' +
    'hardware can execute. The PID response looks better on a plot and is unachievable on the ' +
    'platform. Under noise it is worse than unachievable, it is destructive.',
    'The ILC result is the one I would want to test further. Faster convergence came with higher ' +
    'steady-state error, and the mechanism is plant-model mismatch — the norm-optimal update is ' +
    'confident in a model that is approximately right. That suggests the useful design is not ' +
    'either variant but a schedule between them, and the obvious next step is to measure that ' +
    'against the real QUBE-Servo rather than in simulation.',
  ],

  /* The document this panel was written from. Served straight out of
     public/doc by the asset pipeline, opened in a new tab. */
  report: { href: '/doc/projects/optimal-control/report.pdf', label: 'Read Report' },

  stack: [
    'MATLAB', 'Simulink', 'LabVIEW', 'State-space modelling', 'PID', 'LQR',
    'Model Predictive Control', 'Iterative Learning Control', 'Kalman filtering',
  ],

  hero: {
    src: `${FIG}/qube-servo.webp`,
    caption: 'The QUBE-Servo rotary inverted pendulum — the second of the two unstable platforms',
  },

  diagramSets: [
    {
      id: 'parta',
      title: 'Part A — Simulink models and the two-wheeled robot',
      note: 'The models themselves, and what they do under noise and disturbance.',
      figures: [
        { src: `${FIG}/report-p2-1.webp`, caption: 'Open-loop tilt divergence from three initial conditions' },
        { src: `${FIG}/report-p3-2.webp`, caption: 'Simulink model of the cascade PID: inner tilt loop, outer position loop, with noise, delay and push disturbances' },
        { src: `${FIG}/report-p3-3.webp`, caption: 'Cascade PID — tilt held within ±0.07 rad over 30 s' },
        { src: `${FIG}/report-p3-4.webp`, caption: 'Cascade PID — wheel position bounded to ±2 rad' },
        { src: `${FIG}/report-p4-5.webp`, caption: 'MPC model and tuning' },
        { src: `${FIG}/report-p4-6.webp`, caption: 'MPC response under the ±9 V constraint' },
        { src: `${FIG}/report-p4-7.webp`, caption: 'MPC commands under gyroscope noise' },
        { src: `${FIG}/report-p5-8.webp`, caption: 'Two-output MPC regulating tilt and position in one optimisation' },
      ],
    },
    {
      id: 'partb',
      title: 'Part B — the rotary inverted pendulum',
      note: 'LQR and MPC against two iterative learning updates.',
      figures: [
        { src: `${FIG}/lqr-response.webp`, caption: 'LQR response' },
        { src: `${FIG}/lqr-error.webp`, caption: 'LQR tracking error' },
        { src: `${FIG}/mpc-response.webp`, caption: 'MPC response — gains matching LQR to three decimals' },
        { src: `${FIG}/ilc-early.webp`, caption: 'ILC, early iterations' },
        { src: `${FIG}/ilc-late.webp`, caption: 'ILC, converged' },
        { src: `${FIG}/ilc-error.webp`, caption: 'ILC error norm against iteration — 14 for PD-type, 3 for norm-optimal' },
        { src: `${FIG}/error-plot.webp`, caption: 'Steady-state error norms compared' },
      ],
    },
    {
      id: 'more',
      title: 'Further figures and appendices',
      note: 'Including the LabVIEW implementation.',
      figures: [
        { src: `${FIG}/report-p8-9.webp`, caption: 'Report figure, page 8' },
        { src: `${FIG}/report-p9-10.webp`, caption: 'Report figure, page 9' },
        { src: `${FIG}/report-p13-11.webp`, caption: 'Report figure, page 13' },
        { src: `${FIG}/report-p14-12.webp`, caption: 'Report figure, page 14' },
        { src: `${FIG}/report-p15-13.webp`, caption: 'Report figure, page 15' },
        { src: `${FIG}/report-p16-14.webp`, caption: 'Report figure, page 16' },
        { src: `${FIG}/report-p17-15.webp`, caption: 'Report figure, page 17' },
        { src: `${FIG}/report-p18-16.webp`, caption: 'Report figure, page 18' },
        { src: `${FIG}/report-p19-17.webp`, caption: 'Report figure, page 19' },
        { src: `${FIG}/report-p20-18.webp`, caption: 'Report figure, page 20' },
        { src: `${FIG}/report-p21-19.webp`, caption: 'Report figure, page 21' },
      ],
    },
  ],

  check: [
    'Period is my guess from the module sequence — correct it if the year is wrong.',
    'The report has 28 embedded figures; the panel uses the seven you exported as PNGs plus whatever the pipeline lifted from the PDF. Worth a look at images/projects/optimal-control/ to see whether a better hero is in there.',
    'Figure captions for the ILC plots are inferred from their filenames. Check them against the report.',
  ],
}
