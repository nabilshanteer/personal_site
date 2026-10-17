import { useEffect, useRef, useState } from 'react'
import Backdrop from '../layers/Backdrop'
import Portrait from '../layers/Portrait'
import Monogram from '../components/Monogram'
import Controls from '../components/Controls'
import StatusCard from '../components/StatusCard'
import Menu from '../components/Menu'
import { trackPointer } from '../lib/pointer'

/* Panel one.

   Stacking order matters here and is the whole trick:

     1  grey field
     2  backdrop — a circuit-board photograph with drifting line work
        over it, both unveiled by the cursor's trail and by ripples
     3  portrait
     4  name, mark, controls and the location card
*/

export default function Intro() {
  const panel = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!panel.current) return
    return trackPointer(panel.current)
  }, [])

  return (
    <section className="panel" ref={panel}>
      <div className="field" aria-hidden="true" />
      <Backdrop />

      <Portrait />

      <Monogram />
      <Controls onMenu={() => setMenuOpen((open) => !open)} menuOpen={menuOpen} />
      <StatusCard />
      <Menu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <h1 className="mark">
        <a className="mark__link" href="/" aria-label="Nabil Al-Shanteer — home">
          <span className="mark__given">NABIL</span>
          <span className="mark__family">
            AL<span className="mark__hyphen">-</span>SHANTEER
          </span>
        </a>
      </h1>
    </section>
  )
}
