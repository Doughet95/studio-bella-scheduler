import { ReactNode } from 'react'
import Link from 'next/link'
import { Sparkles, Calendar, CreditCard, LogOut, Settings } from 'lucide-react'

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center transition-transform group-hover:scale-105">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-semibold text-lg text-gradient">Studio Bella</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/client" className="text-foreground transition-colors hover:text-primary">
              Meus Agendamentos
            </Link>
            <Link href="/client/billing" className="text-muted-foreground transition-colors hover:text-primary">
              Faturas e Pagamentos
            </Link>
            <Link href="/client/settings" className="text-muted-foreground transition-colors hover:text-primary">
              Perfil
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium">Olá, Cliente</span>
              <span className="text-xs text-muted-foreground">Plano Mensal Ativo</span>
            </div>
            <Link href="/login" className="text-muted-foreground hover:text-destructive transition-colors" title="Sair">
              <LogOut className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Nav (Bottom) */}
      <nav className="md:hidden fixed bottom-0 left-0 z-50 w-full border-t bg-background/80 backdrop-blur pb-safe">
        <div className="flex justify-around items-center h-16">
          <Link href="/client" className="flex flex-col items-center gap-1 text-primary">
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-medium">Agendamentos</span>
          </Link>
          <Link href="/client/billing" className="flex flex-col items-center gap-1 text-muted-foreground">
            <CreditCard className="w-5 h-5" />
            <span className="text-[10px] font-medium">Faturas</span>
          </Link>
          <Link href="/client/settings" className="flex flex-col items-center gap-1 text-muted-foreground">
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium">Perfil</span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container py-8 md:py-12 pb-24 md:pb-12">
        {children}
      </main>
    </div>
  )
}
