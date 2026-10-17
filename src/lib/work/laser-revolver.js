/* -----------------------------------------------------------------
   Laser Revolver Target Practice — group university project.

   Sourced from the diagrams, photographs and the performance report in
   images/projects/laser-revolver/. The folder holds no written report,
   so the detail below is read off the system diagram, the circuit
   diagram and the scoring output. See `check`.

   NOTE: olympic.png was removed from the asset folder. It is a
   third-party Olympic broadcast still showing an identifiable athlete,
   and republishing it would be a copyright and likeness problem.
   ----------------------------------------------------------------- */

const FIG = '/img/projects/laser-revolver'

export default {
  slug: 'laser-revolver',
  title: 'Laser Revolver Target Practice',
  subtitle: 'a scored shooting range built from a Pi Pico, a laser and a camera',

  lead: 'vision',
  tags: ['vision', 'embedded', 'hardware'],

  client: 'University of Southampton · ECS',
  role: 'Developer — group project',
  period: '2024',
  place: 'Southampton, UK',

  summary:
    'A target-shooting trainer with no projectile: a laser revolver fires at a printed target, a ' +
    'camera watches where the spot lands, and vision scores the shot against Olympic ten-metre ' +
    'rings. The scoring is the interesting half — turning a bright dot on a camera frame into a ' +
    'ring number, reliably, under whatever lighting the room happens to have.',

  metrics: [
    { label: 'Scoring rings', value: '6—10', note: 'Olympic ten-metre target geometry' },
    { label: 'Session score achieved', value: '86', note: 'from the system’s own performance report' },
    { label: 'Link', value: '2.4', unit: 'GHz', note: 'wireless, gun to receiver' },
    { label: 'Controllers', value: '2', note: 'Pi Pico in the gun, Raspberry Pi at the target' },
  ],

  problem: [
    'Live-fire practice needs a range, supervision and consumables. A laser replaces all three, but ' +
    'only if the shot can be scored as precisely as a real one — and a laser leaves no hole, so ' +
    'there is nothing to measure after the fact. The scoring has to happen in the instant the ' +
    'trigger is pulled.',
    'That makes it a timing problem as much as a vision problem. The camera has to be looking when ' +
    'the laser fires, which means the gun and the receiver have to agree on when a shot happened ' +
    'despite being separate devices with no wired connection between them.',
    'And the vision has to survive the room. A laser spot is the brightest thing in the frame until ' +
    'someone turns on a light or the target catches a reflection, at which point naive brightness ' +
    'thresholding scores a lamp.',
  ],

  solution: [
    'The system splits across two controllers. In the gun, a Pi Pico handles the trigger switch, ' +
    'power management, the laser driver and a heartbeat sensor; at the target, a Raspberry Pi drives ' +
    'the camera and talks to the terminal over serial. The two coordinate over a 2.4 GHz link, so ' +
    'pulling the trigger both fires the laser and tells the receiver to start capturing — the shot ' +
    'and the exposure are the same event rather than two things that have to be matched up ' +
    'afterwards.',
    'The target is rendered as concentric scoring rings from 6 at the edge to 10 at the centre, ' +
    'following the Olympic ten-metre layout, so the vision stage has a known geometry to map the ' +
    'detected spot into rather than having to infer the target from the image.',
    'Scoring then resolves the spot position against those rings and reports the result through a ' +
    'display-side interface, which accumulates the session and prints a performance summary at the ' +
    'end — including where the score sits against international competition, which is what turns a ' +
    'number into something a person will try to beat.',
  ],

  contribution: [
    'Worked on the system architecture spanning the gun-side Pi Pico, the target-side Raspberry Pi and the wireless link between them.',
    'Built the computer-vision scoring: detecting the laser spot in the camera frame and resolving it against the target ring geometry.',
    'Produced the target map used as the scoring reference.',
    'Contributed to the circuit design for the gun — trigger, laser driver, heartbeat sensor and power management.',
    'Worked on the display-side software that reports each shot and summarises the session.',
  ],

  outcome: [
    'The system works end to end: trigger to laser to camera to score to display, with the shot and ' +
    'the capture synchronised across two devices over a wireless link, and a session report at the ' +
    'end that places the result against competitive scores.',
    'What it does not have is a measured accuracy figure. There is a score the system produced, but ' +
    'no evaluation of how closely its scoring agrees with where the laser actually hit — no runs ' +
    'against a ground truth marked on the paper target. For a device whose entire value is scoring ' +
    'precision, that is the measurement I would want before claiming anything about it, and it is ' +
    'cheap to do: fire at marked positions and compare.',
  ],

  stack: [
    'Python', 'OpenCV', 'Raspberry Pi', 'Raspberry Pi Pico', 'C',
    'Serial communication', '2.4 GHz wireless', 'CAD', 'Circuit design',
  ],

  hero: {
    src: `${FIG}/performance-report.webp`,
    caption: 'End-of-session performance report — the score, placed against international competition',
  },

  diagramSets: [
    {
      id: 'system',
      title: 'System and hardware',
      note: 'How the two halves fit together, and what they are made of.',
      figures: [
        { src: `${FIG}/system-diagram.webp`, caption: 'System diagram — gun, target, receiver' },
        { src: `${FIG}/circuit-diagram.webp`, caption: 'Gun-side circuit: trigger, driver, heartbeat sensor, power' },
        { src: `${FIG}/revolver-cad-design.webp`, caption: 'Revolver CAD design' },
        { src: `${FIG}/pi-pico-and-laser-module.webp`, caption: 'The Pi Pico and laser module as built' },
      ],
    },
    {
      id: 'scoring',
      title: 'Vision and scoring',
      note: 'From a spot on a frame to a ring number.',
      figures: [
        { src: `${FIG}/target-map-cv.webp`, caption: 'The scoring target: rings 6 to 10, Olympic ten-metre geometry' },
        { src: `${FIG}/testing-laser-on-paper-target.webp`, caption: 'Testing the laser against a paper target', scale: 2.2 },
        { src: `${FIG}/software-construction.webp`, caption: 'Software construction' },
        { src: `${FIG}/display-side-software.webp`, caption: 'Display-side interface' },
      ],
    },
  ],

  check: [
    'I removed olympic.png from the asset folder: it is a third-party Olympic broadcast still of an identifiable athlete, so publishing it on your site would be a copyright and likeness problem. Nothing else was touched.',
    'This was a group project and the folder does not say who did what, so MY PART IN IT is written as "worked on" rather than "built". Tell me which parts were actually yours and I will make those bullets specific — vague contribution claims are the thing interviewers probe hardest.',
    'There is no written report in the folder, so the problem and approach are read off the diagrams. Confirm the 2.4 GHz link is used for shot synchronisation as described, rather than for something else.',
    'Period (2024) is a guess. Correct it.',
    'The performance report figure was the one you named "to_be_cropped" — the pipeline lifted the image out of the PDF, which crops it to the content. Check it looks right.',
  ],
}
