import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LandingNav } from '@/components/layout/landing-nav'
import { ServiceCard } from '@/components/landing/service-card'
import { TestimonialCard } from '@/components/landing/testimonial-card'
import { AIAssistantWidget } from '@/components/landing/ai-assistant-widget'
import {
  Sparkles, Star, Clock, Shield, ChevronRight,
  Phone, MapPin, Calendar
} from 'lucide-react'

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  )
}

export const metadata: Metadata = {
  title: 'Studio Bella — Design de Sobrancelhas & Cílios',
}

const services = [
  {
    icon: '✦',
    name: 'Cílios Volume Brasileiro',
    description: 'Técnica de extensão para um olhar volumoso, marcante e expressivo.',
    duration: '2h',
    price: 'R$ 80',
    category: 'cilios' as const,
    highlight: false,
  },
  {
    icon: '◈',
    name: 'Manutenção',
    description: 'Manutenção dos cílios para manter o olhar perfeito.',
    duration: '1h30',
    price: 'R$ 50',
    category: 'cilios' as const,
    highlight: false,
  },
  {
    icon: '✦',
    name: 'Plano Mensal',
    description: 'Colocação de Cílios Volume Brasileiro + Manutenção inclusa sempre que precisar.',
    duration: 'Mensal',
    price: 'R$ 65/mês',
    category: 'cilios' as const,
    highlight: true,
  },
  {
    icon: '◈',
    name: 'Em breve um novo serviço',
    description: 'Novidades chegando no Studio Bella.',
    duration: '-',
    price: '-',
    category: 'outros' as const,
    highlight: false,
  }
]

const testimonials = [
  {
    name: 'Ana Paula S.',
    text: 'Fiz meus cílios Volume Brasileiro e amei! O olhar ficou marcante mas muito elegante. Super recomendo!',
    rating: 5,
    service: 'Cílios Volume Brasileiro',
    initials: 'AP',
  },
  {
    name: 'Fernanda C.',
    text: 'Fechei o Plano Mensal e foi a melhor escolha. A manutenção sempre em dia e o atendimento é impecável.',
    rating: 5,
    service: 'Plano Mensal',
    initials: 'FC',
  },
  {
    name: 'Juliana M.',
    text: 'A manutenção foi super rápida e o resultado maravilhoso. Os cílios voltaram a ficar cheios e perfeitos.',
    rating: 5,
    service: 'Manutenção',
    initials: 'JM',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <LandingNav />

      {/* ──────────────────── HERO ──────────────────── */}
      <section
        id="home"
        className="relative min-h-screen flex items-center justify-center px-4 pt-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hero-bg.png')" }}
      >
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/60 sm:bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />

        {/* Background glow effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none mix-blend-screen">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-secondary/15 blur-[100px]" />
        </div>

        {/* Decorative floating elements */}
        <div className="absolute top-40 left-8 opacity-40 animate-float hidden lg:block z-10">
          <Sparkles className="w-6 h-6 text-secondary" />
        </div>
        <div className="absolute top-60 right-12 opacity-40 animate-float hidden lg:block z-10" style={{ animationDelay: '1s' }}>
          <Star className="w-5 h-5 text-primary" />
        </div>
        <div className="absolute bottom-40 left-16 opacity-30 animate-float hidden lg:block z-10" style={{ animationDelay: '2s' }}>
          <Sparkles className="w-4 h-4 text-secondary" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center animate-fade-in z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>Atendimento Premium em Aperibé, RJ</span>
          </div>

          {/* Main heading */}
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight mb-6">
            <span className="text-foreground">Sua Beleza,</span>
            <br />
            <span className="text-gradient">Redefinida</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Design de sobrancelhas e extensão de cílios com técnica exclusiva.
            Agende online em segundos e transforme seu olhar.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="xl" variant="gradient" className="w-full sm:w-auto group">
              <Link href="/book">
                <Calendar className="w-5 h-5" />
                Agendar Agora
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="w-full sm:w-auto">
              <Link href="#servicos">
                Ver Serviços
              </Link>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-14 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-secondary fill-secondary" />
              <span>+500 clientes satisfeitas</span>
            </div>
            <div className="w-px h-4 bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>Produtos certificados</span>
            </div>
            <div className="w-px h-4 bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-secondary" />
              <span>Horários flexíveis</span>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────── SERVIÇOS ──────────────────── */}
      <section id="servicos" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary text-sm font-medium tracking-widest uppercase mb-3">Nossos Serviços</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
              O que oferecemos
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Cada serviço é personalizado para valorizar sua beleza única.
              Utilizamos apenas produtos de alta qualidade e técnicas aprovadas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <ServiceCard key={service.name} {...service} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg" variant="gradient" className="group">
              <Link href="/book">
                <Calendar className="w-4 h-4" />
                Agendar meu horário
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ──────────────────── DEPOIMENTOS ──────────────────── */}
      <section id="depoimentos" className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-glow opacity-40 pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-16">
            <p className="text-primary text-sm font-medium tracking-widest uppercase mb-3">Depoimentos</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
              O que dizem nossas clientes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.name} {...testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────── CONTATO ──────────────────── */}
      <section id="contato" className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-2xl p-8 sm:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-primary text-sm font-medium tracking-widest uppercase mb-3">Contato</p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
                  Fale conosco
                </h2>
                <div className="space-y-4">
                  <a
                    href="https://wa.me/5522999854403?text=Oi%2C%20quero%20fazer%20um%20agendamento%21"
                    className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">WhatsApp</p>
                      <p className="font-medium text-foreground">(22) 99985-4403</p>
                    </div>
                  </a>
                  <a
                    href="https://instagram.com/studiobella"
                    className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <InstagramIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Instagram</p>
                      <p className="font-medium text-foreground">@studiobella</p>
                    </div>
                  </a>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Localização</p>
                      <p className="font-medium text-foreground">Aperibé, RJ</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground mb-6">
                  Pronta para transformar seu olhar? Agende seu horário agora mesmo!
                </p>
                <Button asChild size="xl" variant="gradient" className="w-full group">
                  <Link href="/book">
                    <Calendar className="w-5 h-5" />
                    Agendar Online
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────── FOOTER ──────────────────── */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-display text-base font-bold text-gradient">Studio Bella</span>
          </div>
          <p>© {new Date().getFullYear()} Studio Bella. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-foreground transition-colors">
              Área Profissional
            </Link>
          </div>
        </div>
      </footer>

      {/* AI Assistant Widget */}
      <AIAssistantWidget />
    </div>
  )
}
