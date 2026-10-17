/* -----------------------------------------------------------------
   The about page's hobbies — the words, and which pictures go with them.

   This is the file to edit. Nothing here is layout; it is what the page
   says. The sections render in the order they appear below.
   ----------------------------------------------------------------- */

/* Each one stands on its own, with its own pictures riding the arcs
   beside it. `groups` are folders under about/about_pics; a hobby with
   none falls back to a shuffle of everything so its section is never
   bare.

   `more` is what the bubble opens to reveal. Write it either way:

     more: 'One paragraph.'

     more: [
       'First paragraph.',
       'Second paragraph, with its own space above it.',
     ]

   A newline starts a new paragraph either way, so the simplest thing is
   one string with 
 wherever you want a break:

     more: 'First paragraph.

Second paragraph.',

   Blank lines, single breaks, an array, a mix — all come out as properly
   spaced paragraphs, justified to both edges inside the card. */
export const HOBBIES = [
  {
    key: 'music production',
    more:
      "I've released 36 songs across streaming platforms, you can actually discover them on Spotify by clicking the icon by the music player on the top left of your screen. \nLately I've been producing songs that I stingily keep to myself to keep the world sane. I take inspiration from 2020-era Yeat with my adlibs, that's the most fun part of recording for me. \nPeople have told me that my songs help them meditate, others have said they'd hit personal records at the gym with them playing, my songs have got no grey area to them. Wild.",
    label: 'Music',
    gloss: 'Creating vibrational rhythms that sound nice to my ears, and probably just mine.',
    groups: ['music'],
  },
  {
    key: 'making',
    more:
      "As I went through several agentic AI projects and learned about the Model Context Protocol (MCP) throughout university, I got a sense for the level of interconnectedness my various every-day ecosystems could achieve. \nI'm referring to AIoT (AI of Things, like IoT), and it's inspiring me to localise existing AI models, having converted an old laptop I own to a cloud server hosting these models. I build electronic projects with seemingly transconscious systems who have access to my resources and advise me on how best to organise my calendar, upcoming tasks, handle emails through sentiment analyses, and more that are in the works. \nThis has got to be my passion, because if it's not, I don't know what is.",
    label: 'Doing It Myself',
    gloss: 'If I come across anything remarkable, my first thought is for me to DIY, or... for me to DIM probably makes more sense in first person.',
    groups: ['diy'],
  },
  {
    key: 'cars',
    more:
      "The journey between scouting marketplaces for the perfect contendor to polishing it up for sale, the process of making profit off a car sale tends to have involved me learning about its mechanical parts, how to identify their wear, and finding a cost-effective solution that typically involves me doing the labour. \nOne such example is of a Ford Fiesta whose previous owner decided to install a fart cannon of an exhaust. After some negotiating, my friend and I took on this project £1,000 down, and now had to learn how to saw off a standard exhaust off a scrapped Fiesta and weld it onto the project car. We didn't realise that there'd be a whole list of parts that needed to be changed. \nBefore cleaning it inside out, we had to replace the dead battery, change the tire rims, fix the leaning of the driver seat, and replace one of the car mirrors. \nCan't disclose how much we lost on this one, but definitely know that we learned a lot going into the next project car.",
    label: 'Automotives',
    gloss: 'Car flipping either goes really well or really wrong.',
    groups: ['car-mechanic'],
  },
  {
    key: 'exercise',
    more:
      "Never was a fan of hiking, but breaking my leg in a pedestrian RTA helped me realise how much I take my legs for granted. \nBefore the accident I would climb, run, and try my hardest with calisthenics. This is something I aspire to reconquer. 3-months into the recovery and I'm back to jogging, walking at least 10,000 steps a day, and slowly regaining my mobility. \nI won't stop there. I promised my physiotherapist that the next time I come around, we'd go on a 5K run together. The gym? I've missed it, but I want to take this opportunity to lessen the weightlifting and focus on core strength, my goal is to move my body weight as I please - muscle ups, front/back levers, and eventually the planche.",
    label: 'Exercise',
    gloss: 'Going uphill on purpose and straining my musculoskeletal system... repeatedly.',
    groups: ['hiking', 'athletism'],
  },
]
