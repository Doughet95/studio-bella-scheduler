import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Clock, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ServiceCategory } from '@/types'

interface ServiceCardProps {
  icon: string
  name: string
  description: string
  duration: string
  price: string
  category: ServiceCategory
  highlight: boolean
}

const categoryColors: Record<ServiceCategory, string> = {
  sobrancelha: 'text-primary border-primary/30 bg-primary/10',
  cilios: 'text-secondary border-secondary/30 bg-secondary/10',
  combo: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
  outros: 'text-muted-foreground border-border bg-muted',
}

const categoryLabels: Record<ServiceCategory, string> = {
  sobrancelha: 'Sobrancelhas',
  cilios: 'Cílios',
  combo: 'Combo',
  outros: 'Outros',
}

export function ServiceCard({
  icon, name, description, duration, price, category, highlight,
}: ServiceCardProps) {
  return (
    <div
      className={cn(
        'relative group rounded-2xl border p-6 transition-all duration-300',
        'hover:shadow-card-hover hover:-translate-y-1',
        highlight
          ? 'border-primary/40 bg-gradient-card glow-primary'
          : 'border-border bg-card hover:border-primary/30'
      )}
    >
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-brand text-white shadow-brand">
            Mais Popular
          </span>
        </div>
      )}

      {/* Category badge */}
      <div className="flex items-center justify-between mb-4">
        <span
          className={cn(
            'px-2.5 py-1 rounded-full text-xs font-medium border',
            categoryColors[category]
          )}
        >
          {categoryLabels[category]}
        </span>
        <span className="text-2xl opacity-60 group-hover:opacity-100 transition-opacity">{icon}</span>
      </div>

      {/* Content */}
      <h3 className="font-semibold text-foreground text-lg mb-2 leading-tight">{name}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-5">{description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>{duration}</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">a partir de</p>
          <p className="font-bold text-foreground text-base">{price}</p>
        </div>
      </div>

      <Button asChild className="w-full mt-4" size="sm" variant={highlight ? 'gradient' : 'outline'}>
        <Link href={`/book?service=${encodeURIComponent(name)}`}>
          Agendar
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </Button>
    </div>
  )
}
