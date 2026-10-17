import { lazy, Suspense } from 'react'
import Stage from './panels/Stage'
import About from './panels/About'
import Contact from './panels/Contact'
import Cv from './panels/Cv'
import PanelNav from './components/PanelNav'
import Projects from './panels/Projects'

/* /admin is the notes page. It only exists while this is running on your
   own machine: `import.meta.env.DEV` is replaced with `false` at build
   time, so the whole branch — and the page behind it — is dropped from
   the deployed bundle rather than merely hidden. */
const inDev = import.meta.env.DEV
const onAdmin = inDev && typeof window !== 'undefined' && window.location.pathname === '/admin'
const Admin = inDev ? lazy(() => import('./panels/Admin')) : null

export default function App() {
  if (onAdmin && Admin) {
    return (
      <Suspense fallback={null}>
        <Admin />
      </Suspense>
    )
  }

  return (
    <>
      <Stage />
      <Projects />
      <About />
      <Contact />
      <Cv />
      <PanelNav />
    </>
  )
}
