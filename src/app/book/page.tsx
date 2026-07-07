import type { Metadata } from 'next'
import { BookingWizard } from '@/components/booking/booking-wizard'
import Link from 'next/link'
import { Sparkles, ArrowLeft } from 'lucide-react'

import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Agendar Horário',
  description: 'Agende seu horário de design de sobrancelhas ou extensão de cílios online.',
}

export default function BookPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple header for booking page */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-brand flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-display font-bold text-gradient">Studio Bella</span>
          </div>
          <div className="w-16" /> {/* spacer */}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 pb-24">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Agendar Horário
          </h1>
          <p className="text-muted-foreground">
            Escolha o serviço, data e horário de sua preferência
          </p>
        </div>

        <Suspense fallback={<div className="h-40 w-full animate-pulse bg-muted rounded-xl" />}>
          <BookingWizard />
        </Suspense>
      </main>
    </div>
  )
}
