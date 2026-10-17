/* Every project that has a panel written for it, by slug.

   To add one: copy _template.js to <slug>.js, fill it in, import it
   below, and add a matching row to `projects` in src/lib/content.js so
   it appears on the dial. A project listed on the dial without an entry
   here is shown greyed out and cannot be opened. */

import bloctogpt from './bloctogpt'
import adviceAssistant from './advice-assistant'
import qualitativeClustering from './qualitative-clustering'
import hftArchitectures from './hft-architectures'
import optimalControl from './optimal-control'
import kalmanFilter from './kalman-filter'
import gaussianProcesses from './gaussian-processes'
import rlhfMathematics from './rlhf-mathematics'
import spikingNetworks from './spiking-networks'
import activityRecognition from './activity-recognition'
import laserRevolver from './laser-revolver'

export const details = {
  bloctogpt,
  'advice-assistant': adviceAssistant,
  'qualitative-clustering': qualitativeClustering,
  'hft-architectures': hftArchitectures,
  'optimal-control': optimalControl,
  'kalman-filter': kalmanFilter,
  'gaussian-processes': gaussianProcesses,
  'rlhf-mathematics': rlhfMathematics,
  'spiking-networks': spikingNetworks,
  'activity-recognition': activityRecognition,
  'laser-revolver': laserRevolver,
}

export const detailFor = (slug) => details[slug] ?? null
