# Knowledge notes

Anything dropped in this folder becomes something the about-page
assistant can answer from. It is for the things the site has no pages
about — the music, the car, whatever else — where there is no project
write-up for the index to read.

One note per file, `.md` or `.txt`. A header is optional:

    ---
    title: Releases
    topics: music production
    ---

    I have 36 tracks out. The first was in 2021...

`topics` decides which bubble favours the note; use the hobby keys from
src/lib/about.js (`music production`, `making`, `cars`, `exercise`). Leave
it out and the note is available to every bubble.

Paragraphs are indexed separately, so write in paragraphs and keep each
one about one thing.

After editing, run `npm run index` — or just `npm run build`, which does
it for you.
