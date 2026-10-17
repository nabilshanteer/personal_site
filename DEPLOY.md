# Putting this online

The site is a Vite build plus three serverless functions in `api/` — the
assistant, the contact form and the notes endpoint. Those functions are
written in Vercel's format, and the site needs them, so a static-only
host (GitHub Pages) will not do: the about-page assistant and the contact
form would both be dead.

Everything below is a one-time setup. After it, publishing a change is
`git push`.

---

## Why the big folders are committed

`public/img`, `public/media` and `public/doc` are generated — by
`npm run assets` and `npm run audio`, which need Python, Pillow,
pypdfium2 and ffmpeg. The deploy only runs `npm run build`, which is
Node and nothing else.

If those folders were left out of the repo, the build would succeed and
the site would come out with no portrait, no project figures, no music
and no CV — and nothing would report an error, because as far as the
build is concerned nothing is missing. So they are committed, and the
host needs only Node.

`public/data/knowledge.json` is the exception: `npm run build` runs
`npm run index` first, so it is rebuilt from source on every deploy.

---

## 1. GitHub

From this folder:

```bash
git remote add origin https://github.com/<you>/<repo>.git
git branch -M main
git push -u origin main
```

Create the repo on github.com first, empty — no README, no .gitignore,
or the first push will be rejected for having unrelated history.

Private or public both work. Private is the safer default; nothing in
the repo is secret (`.env.local` is ignored and stays on your machine),
but a public repo means anyone can read your unpublished notes in
`knowledge/`.

## 2. Vercel

1. vercel.com → sign in with GitHub → **Add New… → Project**.
2. Import the repo. The framework should be detected as **Vite**. Leave
   the build command and output directory alone — `npm run build` and
   `dist` are both correct.
3. Before clicking Deploy, open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `AI_API_KEY` | your Groq key |
   | `TELEGRAM_BOT_TOKEN` | from @BotFather |
   | `TELEGRAM_CHAT_ID` | your chat id |

   They are in your local `.env.local`; copy them across. Set them for
   Production, Preview and Development.

   Leave them out and the site still works — the assistant will say it
   is not configured and the contact form will fall back to opening a
   mail draft. Nothing breaks, it just goes quiet.

4. Deploy. First build takes two or three minutes.

### Check it worked

- The about page's cards answer a question → `AI_API_KEY` is live.
- Send yourself a message from the contact page → the push arrives.
- Open `/doc/nabil-al-shanteer-cv.pdf` → the CV downloads.

## 3. A custom domain

Buy it anywhere — Cloudflare Registrar sells at cost (about £8–10 a year
for a `.com`), Porkbun and Namecheap are similar. Avoid paying a premium
for the first year with a sharp renewal.

In Vercel: **Project → Settings → Domains → Add**. Vercel then tells you
one of two things:

- **Change your nameservers** to theirs — simplest, Vercel runs the DNS.
- **Add an A record** to `76.76.21.21`, and a CNAME for `www`. Use this
  if you want to keep DNS where it is.

The certificate is issued automatically and free. Propagation is usually
minutes, occasionally a few hours.

---

## Publishing a change afterwards

```bash
git add -A && git commit -m "what changed" && git push
```

Vercel builds every push to `main` and puts it live. Pushes to any other
branch get their own preview URL, which is a good way to look at
something before it is public.

### After editing content

| You changed | Run before committing |
|---|---|
| `src/lib/about.js`, a project, `knowledge/*.md` | `npm run index` |
| anything in `images/`, `cv/`, `about/about_pics/` | `npm run assets` |
| a track in `about/` | `npm run audio` then `npm run assets` |

`npm run dev` and `npm run build` both run `npm run index` for you, so
the assistant is never reading a stale index. The asset pipeline is the
one you have to remember — it is Python, and it does not run on deploy.
