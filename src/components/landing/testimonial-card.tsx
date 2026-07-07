import { Star } from 'lucide-react'
import { getInitials } from '@/lib/utils'

interface TestimonialCardProps {
  name: string
  text: string
  rating: number
  service: string
  initials: string
}

export function TestimonialCard({ name, text, rating, service, initials }: TestimonialCardProps) {
  return (
    <div className="glass rounded-2xl p-6 flex flex-col gap-4 hover:shadow-card-hover transition-shadow duration-300">
      {/* Stars */}
      <div className="flex gap-1">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
        ))}
      </div>

      {/* Text */}
      <p className="text-sm text-muted-foreground leading-relaxed flex-1">&ldquo;{text}&rdquo;</p>

      {/* Author */}
      <div className="flex items-center gap-3 pt-2 border-t border-border/50">
        <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">{service}</p>
        </div>
      </div>
    </div>
  )
}
