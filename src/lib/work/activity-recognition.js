/* -----------------------------------------------------------------
   Deep Learning for Activity Recognition with Application to
   Surveillance — MEng project report, 29 April 2025.

   Rewritten from the report itself (images/projects/activity-recognition/
   report.pdf, 81 pages) rather than from filenames. The earlier version of
   this panel attributed the 0.9913 ROC-AUC to "fine-tuned ActionCLIP",
   which was wrong: that number belongs to the unsupervised anomaly
   detection reframing, and conventional fine-tuning on UCF Crime actually
   scored 28.18%. The real story is better than the wrong one.
   ----------------------------------------------------------------- */

const FIG = '/img/projects/activity-recognition'

export default {
  slug: 'activity-recognition',
  title: 'Activity Recognition in Surveillance',
  subtitle: 'a vision-language model on CPU, and the three ways of asking it a question',

  lead: 'vision',
  tags: ['vision', 'ml'],

  client: 'University of Southampton · ECS',
  role: 'Author — MEng project report',
  period: 'Apr 2025',
  place: 'Southampton, UK',

  summary:
    'An investigation of ActionCLIP — a vision-language model — for surveillance action ' +
    'recognition under low-resource CPU constraints. The finding that makes it worth reading is ' +
    'that the same model and the same embeddings produced 28.18% accuracy, 44.13%, and 97.56%, ' +
    'depending only on how the question was posed: conventional fine-tuning, prompt engineering, ' +
    'or dropping classification entirely and treating it as anomaly detection.',

  metrics: [
    { label: 'Anomaly detection accuracy', value: '97.56', unit: '%', note: 'Mahalanobis distance over visual embeddings' },
    { label: 'ROC-AUC', value: '0.9913', note: 'the same unsupervised approach' },
    { label: 'Conventional fine-tuning', value: '28.18', unit: '%', note: 'the same model, posed as binary classification' },
    { label: 'Prompt engineering alone', value: '44.13', unit: '%', note: 'no additional training' },
    { label: 'Few-shot on UCF-101', value: '63.61', unit: '%', note: '4-shot top-1 — 60% at 1-shot, 62.19% at 2-shot' },
  ],

  problem: [
    'Surveillance action recognition has traditionally used modality-specific models — handcrafted ' +
    'features, or supervised CNNs — which adapt badly to behaviours that change after the model was ' +
    'trained, and which need more labelled video than a real deployment has.',
    'The events worth detecting are rare by definition, so the labelled examples for them are few. ' +
    'That is exactly the regime where training a video classifier from scratch has least to work ' +
    'with, and the 3D convolutional architectures the field defaulted to are least suited.',
    'And the deployment constraint was CPU. Anything requiring a GPU to run inference is not a ' +
    'candidate for the kind of site that actually operates surveillance cameras, which rules out ' +
    'most of what the literature benchmarks.',
  ],

  solution: [
    'ActionCLIP matches video against text rather than classifying into a closed set, so it arrives ' +
    'carrying a representation learned from image-text pairs at a scale no surveillance dataset ' +
    'reaches. The first phase confirmed that transfers: few-shot learning on UCF-101 reproduced at ' +
    '60%, 62.19% and 63.61% top-1 for one-, two- and four-shot settings.',
    'The second phase moved to UCF Crime — real surveillance footage — posed as binary ' +
    'classification between NormalVideos and Shoplifting. Conventional fine-tuning scored 28.18%, ' +
    'which is worse than guessing. The useful move was to treat that as a diagnosis rather than a ' +
    'dead end and ask which half of the model was failing.',
    'Enhancing the text encoder through prompt engineering lifted the same model to 44.13% with no ' +
    'additional training at all — which localises the failure: the visual backbone was not the ' +
    'problem, the linguistic framing of the class was.',
    'That pointed at the real reframing. If the visual embeddings are good and the text side is ' +
    'fragile, stop using text. Treating the task as unsupervised anomaly detection — Mahalanobis ' +
    'distance over the visual embeddings, with no labelled anomalies at all — reached 97.56% ' +
    'accuracy and a ROC-AUC of 0.9913, against 0.8518 for the strongest conventional architecture.',
  ],

  contribution: [
    'Reproduced ActionCLIP few-shot learning on UCF-101 across one-, two- and four-shot regimes under CPU-only constraints.',
    'Adapted the model to UCF Crime surveillance footage and diagnosed why conventional fine-tuning failed, rather than reporting the failure and stopping.',
    'Isolated the text encoder as the fragile component by improving accuracy from 28.18% to 44.13% through prompt engineering alone, with no retraining.',
    'Reframed the task as unsupervised anomaly detection using Mahalanobis distance over the ViT-B/16 visual embeddings, reaching 97.56% accuracy and 0.9913 ROC-AUC.',
    'Benchmarked against eight models including C3D, two-stream C3D, Inception-V3 and VGG19+LSTM.',
    'Wrote the 81-page report, supervised by Zhiwu Huang.',
  ],

  outcome: [
    'The conclusion is about where a vision-language model’s competence actually lives. ' +
    'ActionCLIP’s ViT-B/16 backbone models rich spatiotemporal features and holds up on ' +
    'surveillance footage it was never trained for; its text encoder is highly sensitive to ' +
    'linguistic design, and that sensitivity is what the 28.18% result was measuring. Three ' +
    'numbers from one model is not inconsistency, it is a map of which component to trust.',
    'In a rare-event setting the operational constraint is the false positive rate rather than raw ' +
    'accuracy, and a 0.9913 AUC curve that rises almost vertically is the difference between a ' +
    'system an operator uses and one they mute. The open question is how far the unsupervised ' +
    'approach holds as the anomaly vocabulary widens beyond shoplifting — one anomaly class against ' +
    'normal is the easiest version of the problem, and the honest next test is many.',
  ],

  stack: [
    'Python', 'PyTorch', 'ActionCLIP', 'CLIP', 'ViT-B/16', 'Vision-language models',
    'Few-shot learning', 'Mahalanobis distance', 'Anomaly detection',
    'UCF-101', 'UCF Crime', 'OpenCV',
  ],

  report: { href: '/doc/projects/activity-recognition/report.pdf', label: 'Read Report' },

  hero: {
    src: `${FIG}/actionclip-model.webp`,
    caption: 'ActionCLIP — video and text encoded into a shared space, which is what makes the anomaly reframing possible',
  },

  diagramSets: [
    {
      id: 'result',
      title: 'Model, configuration and result',
      note: 'The architecture, how it was fine-tuned, and how it compared.',
      figures: [
        { src: `${FIG}/actionclip-model.webp`, caption: 'The ActionCLIP architecture' },
        { src: `${FIG}/parameter-configuration-for-fine-tuning.webp`, caption: 'Parameter configuration used for fine-tuning' },
        { src: `${FIG}/roc-auc-graph.webp`, caption: 'ROC curve comparison across all eight models' },
      ],
    },
    {
      id: 'report',
      title: 'Figures from the report',
      note: 'Pipeline, experiments and results, in order.',
      figures: [
        { src: `${FIG}/report-p11-1.webp`, caption: 'Report figure, page 11' },
        { src: `${FIG}/report-p13-3.webp`, caption: 'Report figure, page 13' },
        { src: `${FIG}/report-p24-6.webp`, caption: 'Report figure, page 24' },
        { src: `${FIG}/report-p30-8.webp`, caption: 'Report figure, page 30' },
        { src: `${FIG}/report-p42-13.webp`, caption: 'Report figure, page 42' },
        { src: `${FIG}/report-p45-19.webp`, caption: 'Report figure, page 45' },
        { src: `${FIG}/report-p52-27.webp`, caption: 'Report figure, page 52' },
        { src: `${FIG}/report-p55-30.webp`, caption: 'Report figure, page 55' },
        { src: `${FIG}/report-p76-34.webp`, caption: 'Report figure, page 76' },
        { src: `${FIG}/report-p79-37.webp`, caption: 'Report figure, page 79' },
      ],
    },
    {
      id: 'notes',
      title: 'Working notes',
      note: 'The notes kept while the work was running.',
      figures: [
        { src: `${FIG}/notes1.webp`, caption: 'Notes, 1' },
        { src: `${FIG}/notes2.webp`, caption: 'Notes, 2' },
        { src: `${FIG}/notes3.webp`, caption: 'Notes, 3' },
        { src: `${FIG}/notes4.webp`, caption: 'Notes, 4' },
        { src: `${FIG}/notes5.webp`, caption: 'Notes, 5' },
        { src: `${FIG}/notes6.webp`, caption: 'Notes, 6' },
        { src: `${FIG}/notes7.webp`, caption: 'Notes, 7' },
        { src: `${FIG}/notes8.webp`, caption: 'Notes, 8' },
        { src: `${FIG}/notes9.webp`, caption: 'Notes, 9' },
        { src: `${FIG}/notes10.webp`, caption: 'Notes, 10' },
        { src: `${FIG}/notes11.webp`, caption: 'Notes, 11' },
        { src: `${FIG}/notes12.webp`, caption: 'Notes, 12' },
        { src: `${FIG}/notes13.webp`, caption: 'Notes, 13' },
        { src: `${FIG}/notes14.webp`, caption: 'Notes, 14' },
        { src: `${FIG}/notes15.webp`, caption: 'Notes, 15' },
      ],
    },
  ],

  check: [
    'I corrected a real error here. The earlier version of this panel credited 0.9913 ROC-AUC to "fine-tuned ActionCLIP". That number belongs to the unsupervised Mahalanobis reframing; conventional fine-tuning scored 28.18%. The panel now says all three numbers, which is both accurate and a stronger story.',
    'The degree is MEng, not BEng as the folder name suggested, and the date on the report is 29 April 2025. Corrected.',
    'The few-shot results image is STILL a zero-byte file and could not be used — but the numbers are in the report abstract (60 / 62.19 / 63.61) and are now on the panel, so nothing is lost except the figure itself.',
    'Report figure captions are page references only. Tell me which figures matter and I will caption those properly; there are 38 in the PDF and the panel shows ten.',
    'The "Working notes" set assumes notes1-15 are your own working notes. If they are something else — lecture notes, a marking rubric — say so and I will drop or relabel the set.',
  ],
}
