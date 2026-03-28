import { useTheme } from './hooks/useTheme'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Workflow from './components/Workflow'
import Skills from './components/Skills'
import Install from './components/Install'
import Platforms from './components/Platforms'
import Faq from './components/Faq'
import Footer from './components/Footer'

export default function App() {
  const { theme, toggle } = useTheme()

  return (
    <>
      <Navbar theme={theme} onToggleTheme={toggle} />
      <Hero />
      <Workflow />
      <Skills />
      <Install />
      <Platforms />
      <Faq />
      <Footer />
    </>
  )
}
