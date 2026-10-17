# Getting the message

The contact form posts to `api/contact.js`, which delivers down two
independent channels. A message counts as delivered if **either** one
works, so you can set up one, or both, in any order.

Until at least one is configured the route answers `503` and the form
falls back to opening a prefilled mail draft in the sender's own mail
app — so nothing anyone writes is ever lost to missing plumbing.

---

## 1. The phone notification — Telegram (≈ 2 minutes, free, no card)

This is the one that actually buzzes your phone. Telegram's own push
carries the full message, so you read it from the lock screen without
opening anything.

1. Install Telegram and open a chat with **@BotFather**.
2. Send `/newbot`, give it any name. It replies with a **token** that
   looks like `8012345678:AAH...`. That is `TELEGRAM_BOT_TOKEN`.
3. Open a chat with your new bot and send it any message — "hello" is
   fine. A bot cannot message you until you have messaged it first.
4. Visit, in a browser, replacing `<TOKEN>`:

       https://api.telegram.org/bot<TOKEN>/getUpdates

   Find `"chat":{"id":123456789` in the JSON. That number is
   `TELEGRAM_CHAT_ID`.

Add both to `.env.local`, and to the Vercel project's environment
variables when you deploy.

## 2. The email copy — Resend (optional, but worth it)

The push is good for knowing; the email is good for answering. Its
reply-to is set to the sender, so hitting reply goes straight back to
them, and it gives you a searchable record.

1. A free key from https://resend.com — `MAIL_API_KEY`.
2. Optionally `MAIL_TO` (defaults to the address on the page) and
   `MAIL_FROM` (defaults to Resend's shared `onboarding@resend.dev`,
   which works without a verified domain).

---

## .env.local

Unprefixed on purpose. Anything named `VITE_*` is compiled into the
bundle and served to every visitor — these must never be.

    AI_API_KEY=...

    TELEGRAM_BOT_TOKEN=...
    TELEGRAM_CHAT_ID=...

    MAIL_API_KEY=...
    MAIL_TO=nabilshanteer03@gmail.com

## Checking it

With the dev server up:

    curl -X POST http://localhost:5173/api/contact \
      -H "content-type: application/json" \
      -d '{"name":"Test","from":"you@example.com","body":"Testing."}'

- `503 sending is not set up yet` — neither channel configured.
- `200 {"sent":true,"by":{"push":true,"mail":false}}` — tells you which
  channel actually took it, so a half-configured setup is obvious rather
  than silent.
