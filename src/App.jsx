import { Camera } from '@/components/sections/Camera'
import { Checklist } from '@/components/sections/Checklist'
import { FlightPlan } from '@/components/sections/FlightPlan'
import { Footer } from '@/components/sections/Footer'
import { Hero } from '@/components/sections/Hero'
import { Movimentos } from '@/components/sections/Movimentos'
import { Navbar } from '@/components/sections/Navbar'
import { Seguranca } from '@/components/sections/Seguranca'
import { SectionTransition } from '@/components/SectionTransition'

function App() {
  return (
    <div id="top">
      <div className="fixed top-0 right-0 left-0 z-50 border-b border-white/5 bg-dp-night-950/90 backdrop-blur-md">
        <Navbar />
      </div>
      <div className="bg-dp-night-950">
        <div className="h-16" />
        <Hero />
      </div>
      <SectionTransition bg="bg-dp-night-900">
        <FlightPlan />
      </SectionTransition>
      <SectionTransition bg="bg-dp-paper">
        <Checklist />
      </SectionTransition>
      <SectionTransition bg="bg-dp-night-950">
        <Movimentos />
      </SectionTransition>
      <SectionTransition bg="bg-dp-paper">
        <Camera />
      </SectionTransition>
      <SectionTransition bg="bg-dp-night-900">
        <Seguranca />
      </SectionTransition>
      <Footer />
    </div>
  )
}

export default App
