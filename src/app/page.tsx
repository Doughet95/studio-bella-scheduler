import Link from 'next/link'
import Image from 'next/image'
import { Wallet, PiggyBank, Target, LineChart, ShieldCheck, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/finance-bg.jpg" 
          fill 
          className="object-cover opacity-20 md:opacity-30 mix-blend-screen" 
          alt="Finance Background" 
          priority 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background z-10" />
      </div>

      <header className="fixed top-0 w-full z-50 bg-background/40 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-brand">
              <LineChart className="w-4 h-4 text-white" />
            </div>
            <span className="font-sans font-bold text-lg text-foreground tracking-tight">Minhas <span className="text-gradient">Finanças</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:inline-flex hover:bg-white/5 text-foreground">Entrar</Button>
            </Link>
            <Link href="/login">
              <Button className="bg-gradient-brand text-white border-0 shadow-brand hover:opacity-90 transition-opacity">Acessar</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-20 pt-32 pb-24 px-4 max-w-5xl mx-auto text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
          <Zap className="w-4 h-4" />
          <span>Controle inteligente de despesas</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-sans font-extrabold tracking-tighter text-foreground mb-6">
          Assuma o controle do seu <br className="hidden md:block" />
          <span className="text-gradient">futuro financeiro.</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          Nossa plataforma tecnológica identifica gastos invisíveis, organiza seu fluxo de caixa e acelera a construção da sua reserva de emergência com inteligência de dados.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
          <Link href="/login">
            <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-lg font-semibold bg-foreground text-background hover:bg-foreground/90 transition-all shadow-xl hover:scale-105 active:scale-95">
              Começar Agora
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 text-left">
          <div className="glass p-8 rounded-2xl border-white/10 hover:border-primary/30 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">Visão 360°</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">Painel de dados avançado para você saber exatamente de onde seu dinheiro vem e para onde ele vai, em tempo real.</p>
          </div>
          
          <div className="glass p-8 rounded-2xl border-white/10 hover:border-blue-500/30 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">Detecção de Vazamentos</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">O algoritmo de classificação marca despesas desnecessárias automaticamente, apontando onde você pode cortar gastos hoje mesmo.</p>
          </div>
          
          <div className="glass p-8 rounded-2xl border-white/10 hover:border-emerald-500/30 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">Reserva Blindada</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">Defina metas de proteção financeira. Acompanhe a progressão do seu patrimônio com métricas claras e precisas.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
