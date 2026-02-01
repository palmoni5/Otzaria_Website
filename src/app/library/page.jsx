import Header from '@/components/Header'
import Hero from '@/components/Hero'
import StatsSection from '@/components/StatsSection'
import Features from '@/components/Features'
import ContributeSection from '@/components/ContributeSection'

export default function LibraryHome() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <Hero />
        
        <StatsSection /> 
        
        <Features />
        <ContributeSection />
      </main>
    </div>
  )
}