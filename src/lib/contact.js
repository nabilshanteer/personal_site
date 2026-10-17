/* -----------------------------------------------------------------
   The switchboard's lines.

   This is the file to edit. Order here is the order on the panel, top to
   bottom. Four fits the board comfortably; five is tight.

   `kind: 'address'` shows the value and offers to copy it, rather than
   navigating away — which is what you want for an email. Anything else
   opens its href in a new tab.
   ----------------------------------------------------------------- */

/* The address is assembled at runtime rather than written out, so it is
   not sitting in the page source for a scraper to lift. It is a speed
   bump, not a lock — but it is the difference between being harvested by
   a crawler and not. */
const MAILBOX = ['nabilshanteer03', 'gmail', 'com'] // ← replace: [user, domain, tld]

export const email = () => `${MAILBOX[0]}@${MAILBOX[1]}.${MAILBOX[2]}`

/* Shown as written; the spaces are how a person reads a number, and the
   tel: link strips them. */
export const PHONE = '+44 7402 449929'
export const tel = () => PHONE.replace(/\s+/g, '')

export const LINES = [
  {
    id: 'message',
    label: 'MESSAGE',
    note: 'write something here',
    kind: 'form',
  },
  {
    id: 'linkedin',
    label: 'LINKEDIN',
    note: 'the professional one',
    href: 'https://www.linkedin.com/in/nabil-al-shanteer/',
  },
  {
    id: 'github',
    label: 'GITHUB',
    note: 'the code',
    href: 'https://github.com/nabilshanteer',
  },
]

/* How long the cable takes to reach you before the board resolves.
   Short: a contact page's whole job is to be got through. */
export const CONNECT_AT = 2.6
