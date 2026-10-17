/* -----------------------------------------------------------------
   Country outlines for the location card.

   PLACEHOLDER. The shape below is a stand-in, not the United Arab
   Emirates — drawing a national border from memory would be both
   inaccurate and the kind of inaccuracy people notice. Replace `d` with
   a real outline and the card picks it up with no other changes:

     • drop a public-domain SVG of the UAE into images/ and tell me, or
     • say the word and I will fetch one (Wikimedia carries PD/CC0
       country outlines at a few kB).

   Keep `viewBox` matching whatever path you paste in.
   ----------------------------------------------------------------- */

export const country = {
  name: 'United Arab Emirates',
  short: 'UAE',
  city: 'Abu Dhabi',
  placeholder: true,
  viewBox: '0 0 100 100',
  d: 'M 22 38 L 44 30 L 62 33 L 78 44 L 80 58 L 66 70 L 44 72 L 30 64 L 20 52 Z',
}
