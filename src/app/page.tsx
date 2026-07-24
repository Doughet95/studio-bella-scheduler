import Link from 'next/link'
import { Sparkles, Wallet, PiggyBank, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-gradient">Minhas Finanças</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:inline-flex">Entrar</Button>
            </Link>
            <Link href="/login">
              <Button className="bg-gradient-brand text-white border-0">Começar</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-24 px-4 max-w-5xl mx-auto text-center animate-fade-in">
        <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-foreground mb-6">
          Controle seu dinheiro, <br className="hidden md:block" />
          <span className="text-gradient">construa seu futuro.</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Descubra para onde seu dinheiro está indo, identifique gastos desnecessários e alcance suas metas financeiras e sua reserva de emergência mais rápido.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <Link href="/login">
            <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg bg-gradient-brand text-white border-0 shadow-lg shadow-primary/20">
              Acessar Painel
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-left">
          <div className="glass p-6 rounded-2xl border-border/50">
            <Wallet className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">Visão Clara</h3>
            <p className="text-muted-foreground">Veja exatamente quanto entrou e quanto saiu no mês em um painel intuitivo e bonito.</p>
          </div>
          <div className="glass p-6 rounded-2xl border-border/50">
            <Target className="w-10 h-10 text-secondary mb-4" />
            <h3 className="text-xl font-bold mb-2">Corte o Desnecessário</h3>
            <p className="text-muted-foreground">O sistema identifica e soma automaticamente os gastos evitáveis que sabotam seu orçamento.</p>
          </div>
          <div className="glass p-6 rounded-2xl border-border/50">
            <PiggyBank className="w-10 h-10 text-emerald-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Reserva de Emergência</h3>
            <p className="text-muted-foreground">Economize dinheiro inteligentemente para criar sua rede de segurança financeira.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
