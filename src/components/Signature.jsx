import { useEffect, useState } from 'react'

/* The autograph.

   Built from Priestacy's own outlines by the asset script, so it is a
   joined script rather than something traced by hand. It fades up as the
   picture pulls back — one path, one opacity, nothing recomputed per
   frame. The per-letter write-on that lived here briefly looked better
   and cost far too much to animate. */

export default function Signature() {
  const [sign, setSign] = useState(null)

  useEffect(() => {
    fetch('/img/signature.json')
      .then((r) => (r.ok ? r.json() : null))
      .then(setSign)
      .catch(() => {})
  }, [])

  if (!sign?.d) return null

  return (
    <div className="signature" aria-hidden="true">
      <svg viewBox={sign.viewBox} preserveAspectRatio="xMidYMid meet">
        <path d={sign.d} />
      </svg>
    </div>
  )
}
