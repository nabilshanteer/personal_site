import { useEffect, useRef } from 'react'
import Intro from './Intro'
import Signature from '../components/Signature'
import Marquee from '../components/Marquee'

/* The hand-off from panel one to panel two.

   Scrolling through this stage pulls panel one back until it reads as a
   framed picture rather than a screen, signs it, runs two bands of text
   past behind it, and then lets the whole thing go as panel two arrives.
   Scrolling back up plays it in reverse, because every value is a pure
   function of the scroll position rather than a triggered animation.

   The progress is written to CSS custom properties rather than React
   state — the browser then does the work on the compositor, and nothing
   re-renders while you scroll. */

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n)
const ease = (n) => n * n * (3 - 2 * n)

/* How far through the stage a given phase runs. */
const phase = (p, from, to) => clamp01((p - from) / (to - from))

export default function Stage() {
  const stage = useRef(null)

  useEffect(() => {
    const element = stage.current
    if (!element) return

    let frame = null

    const apply = () => {
      frame = null
      // Measured against the stage's full height, not its scrollable
      // height: that way p reaches 1 at the moment panel two fills the
      // screen, instead of a whole viewport earlier — which is where the
      // empty black stretch was coming from.
      const height = element.offsetHeight
      const p = height > 0 ? clamp01(-element.getBoundingClientRect().top / height) : 0

      // The picture pulls back and dims as the stage is scrolled...
      const pull = ease(phase(p, 0.02, 0.3))
      // ...and once it has been signed it leaves upward rather than fading.
      const lift = ease(phase(p, 0.52, 1))

      const style = element.style
      style.setProperty('--p', p.toFixed(4))
      style.setProperty('--frame-scale', (1 - 0.46 * pull).toFixed(4))
      style.setProperty('--frame-fade', (1 - 0.32 * pull).toFixed(4))
      style.setProperty('--frame-edge', ease(phase(p, 0.05, 0.26)).toFixed(4))
      style.setProperty('--frame-y', `${(-118 * lift).toFixed(2)}vh`)

      // The autograph is written across the print, left to right.
      style.setProperty('--sign', ease(phase(p, 0.06, 0.4)).toFixed(4))
      // Just enough of a fade at the very start that the first stroke does
      // not pop into existence.
      style.setProperty('--sign-fade', phase(p, 0.05, 0.09).toFixed(4))

      // The bands come in on the first touch of the wheel.
      style.setProperty('--band', (ease(phase(p, 0.005, 0.08)) * (1 - ease(phase(p, 0.62, 0.8)))).toFixed(4))

      element.dataset.past = p > 0.92 ? 'true' : 'false'
    }

    const onScroll = () => {
      if (frame === null) frame = requestAnimationFrame(apply)
    }

    apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className="stage" ref={stage}>
      {/* behind the picture */}
      <Marquee />

      {/* the picture itself */}
      <div className="frame">
        <Intro />
      </div>

      {/* over the picture, exceeding it */}
      <Signature />
    </div>
  )
}
