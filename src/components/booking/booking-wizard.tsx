'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bookingSchema, type BookingFormData } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { cn, formatCurrency, formatDuration, formatDate, formatTime } from '@/lib/utils'
import {
  CheckCircle2, ChevronRight, ChevronLeft,
  Clock, DollarSign, Sparkles, User, Calendar, Phone, Mail, LogIn, UserPlus
} from 'lucide-react'
import type { Service, Professional, TimeSlot } from '@/types'
import { useSession } from 'next-auth/react'

const steps = [
  { id: 1, label: 'Serviço', icon: Sparkles },
  { id: 2, label: 'Data & Hora', icon: Calendar },
  { id: 3, label: 'Seus Dados', icon: User },
]

interface StepIndicatorProps {
  current: number
}

function StepIndicator({ current }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, idx) => {
        const Icon = step.icon
        const isActive = step.id === current
        const isDone = step.id < current
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-brand'
                    : isDone
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span
                className={cn(
                  'text-xs font-medium',
                  isActive ? 'text-primary' : isDone ? 'text-emerald-400' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  'w-20 sm:w-32 h-px mx-2 mb-5 transition-all duration-500',
                  isDone ? 'bg-emerald-500' : 'bg-border'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Step 1: Service selection ──────────────────────────────────
function Step1({ onSelect }: { onSelect: (service: Service) => void }) {
  const { data, isLoading } = useQuery<{ data: Service[] }>({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await fetch('/api/services')
      if (!res.ok) throw new Error('Erro ao carregar serviços')
      return res.json() as Promise<{ data: Service[] }>
    },
  })

  const categoryLabels: Record<string, string> = {
    sobrancelha: 'Sobrancelhas',
    cilios: 'Cílios',
    combo: 'Combo',
    outros: 'Outros',
  }

  const services = data?.data ?? []
  const grouped = services.reduce<Record<string, Service[]>>((acc, s) => {
    const key = s.category
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Escolha o serviço</h2>
      {Object.entries(grouped).map(([category, svcs]) => (
        <div key={category}>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
            {categoryLabels[category] ?? category}
          </h3>
          <div className="space-y-2">
            {svcs.map((service) => (
              <button
                key={service.id}
                onClick={() => onSelect(service)}
                className="w-full text-left rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {service.name}
                    </p>
                    {service.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDuration(service.duration_minutes)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="font-bold text-foreground text-lg">
                      {formatCurrency(service.price)}
                    </p>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Step 2: Date & Time ────────────────────────────────────────
function Step2({
  service,
  onSelect,
}: {
  service: Service
  onSelect: (professionalId: string, slot: TimeSlot) => void
}) {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]!
  })
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  // Use first professional (hardcoded for single-pro setup)
  const { data: proData } = useQuery<{ data: Professional[] }>({
    queryKey: ['professionals'],
    queryFn: async () => {
      const res = await fetch('/api/professionals')
      if (!res.ok) throw new Error('Erro')
      return res.json() as Promise<{ data: Professional[] }>
    },
  })

  const professional = proData?.data?.[0]

  const { data: slotsData, isLoading: loadingSlots } = useQuery<{ data: TimeSlot[] }>({
    queryKey: ['slots', professional?.id, selectedDate, service.id],
    queryFn: async () => {
      if (!professional) return { data: [] }
      const params = new URLSearchParams({
        professional_id: professional.id,
        date: selectedDate,
        service_id: service.id,
      })
      const res = await fetch(`/api/availability?${params.toString()}`)
      return res.json() as Promise<{ data: TimeSlot[] }>
    },
    enabled: !!professional,
  })

  const slots = slotsData?.data ?? []

  // Generate next 14 days for date selector
  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + 1)
    return d
  })

  const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Escolha a data</h2>

      {/* Date picker */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {dateOptions.map((date) => {
          const dateStr = date.toISOString().split('T')[0]!
          const isSelected = dateStr === selectedDate
          return (
            <button
              key={dateStr}
              onClick={() => { setSelectedDate(dateStr); setSelectedSlot(null) }}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all min-w-[56px] flex-shrink-0',
                isSelected
                  ? 'border-primary bg-primary/20 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40'
              )}
            >
              <span className="text-[10px] font-medium">{dayLabels[date.getDay()]}</span>
              <span className="text-base font-bold">{date.getDate()}</span>
            </button>
          )
        })}
      </div>

      <h2 className="text-xl font-semibold text-foreground">Escolha o horário</h2>

      {loadingSlots ? (
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p>Nenhum horário disponível nesta data.</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {slots.map((slot) => (
            <button
              key={slot.datetime}
              disabled={!slot.available}
              onClick={() => setSelectedSlot(slot)}
              className={cn(
                'h-10 rounded-lg text-sm font-medium transition-all border',
                !slot.available
                  ? 'opacity-30 cursor-not-allowed border-border bg-muted text-muted-foreground'
                  : slot === selectedSlot
                  ? 'border-primary bg-primary text-primary-foreground shadow-brand'
                  : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/10'
              )}
            >
              {slot.time}
            </button>
          ))}
        </div>
      )}

      <Button
        onClick={() => { if (selectedSlot && professional) onSelect(professional.id, selectedSlot) }}
        disabled={!selectedSlot}
        size="lg"
        variant="gradient"
        className="w-full"
      >
        Continuar
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}

// ── Step 3: Client info & confirm ──────────────────────────────
function Step3({
  service,
  slot,
  onSubmit,
  isSubmitting,
}: {
  service: Service
  slot: TimeSlot
  onSubmit: (data: Pick<BookingFormData, 'client_name' | 'client_email' | 'client_phone' | 'notes'>) => void
  isSubmitting: boolean
}) {
  const { status, data: session } = useSession()

  const { register, handleSubmit, formState: { errors } } = useForm<
    Pick<BookingFormData, 'client_name' | 'client_email' | 'client_phone' | 'notes'>
  >()

  const onFormSubmit = (data: Pick<BookingFormData, 'client_name' | 'client_email' | 'client_phone' | 'notes'>) => {
    onSubmit(data)
  }

  return (
    <div className="space-y-6">
      {/* Booking summary */}
      <div className="glass rounded-xl p-4 space-y-2">
        <h3 className="font-semibold text-foreground text-sm mb-3">Resumo do agendamento</h3>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Serviço</span>
          <span className="font-medium text-foreground">{service.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Data</span>
          <span className="font-medium text-foreground">{formatDate(slot.datetime)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Horário</span>
          <span className="font-medium text-foreground">{slot.time}</span>
        </div>
        <div className="flex justify-between text-sm pt-2 border-t border-border/50">
          <span className="text-muted-foreground">Valor</span>
          <span className="font-bold text-foreground text-base">{formatCurrency(service.price)}</span>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-foreground">Seus dados</h2>

      {status === 'loading' ? (
        <div className="flex justify-center p-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : status === 'unauthenticated' ? (
        <div className="text-center bg-muted/30 rounded-xl p-6 border border-border/50">
          <User className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Identificação Necessária</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Para confirmar seu agendamento, você precisa entrar na sua conta ou criar um novo cadastro.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                localStorage.setItem('pendingBooking', JSON.stringify({ service, slot }))
                window.location.href = '/login'
              }}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Já tenho conta
            </Button>
            <Button
              variant="gradient"
              onClick={() => {
                localStorage.setItem('pendingBooking', JSON.stringify({ service, slot }))
                window.location.href = '/register/client'
              }}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Criar Cadastro
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Mostraremos um formulário simplificado já que o usuário está logado */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {session?.user?.name?.charAt(0) || 'C'}
              </div>
              <div>
                <p className="font-medium">{session?.user?.name || 'Cliente logado'}</p>
                <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => {
                import('next-auth/react').then(({ signOut }) => signOut({ callbackUrl: '/book' }))
              }}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors underline"
            >
              Sair
            </button>
          </div>

          <div className="space-y-2 pt-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <textarea
              id="notes"
              placeholder="Alguma alergia ou informação importante para o atendimento de hoje?"
              rows={3}
              className="flex w-full rounded-lg border border-input bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none transition-colors"
              {...register('notes')}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            size="lg"
            variant="gradient"
            className="w-full"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Confirmando...
              </div>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirmar Agendamento
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Você receberá uma confirmação por e-mail. O pagamento é realizado no local.
          </p>
        </form>
      )}
    </div>
  )
}

// ── Success screen ─────────────────────────────────────────────
function SuccessScreen({ onNewBooking }: { onNewBooking: () => void }) {
  return (
    <div className="text-center py-12 animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
      </div>
      <h2 className="font-display text-3xl font-bold text-foreground mb-3">
        Agendamento Confirmado! 🎉
      </h2>
      <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
        Seu agendamento foi realizado com sucesso. Você receberá um e-mail de confirmação em breve.
      </p>
      <Button onClick={onNewBooking} variant="outline" size="lg">
        Fazer novo agendamento
      </Button>
    </div>
  )
}

// ── Main Wizard ────────────────────────────────────────────────
export function BookingWizard() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [professionalId, setProfessionalId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Recupera agendamento pendente se houver (e se viemos de um login/registro bem sucedido)
  useEffect(() => {
    const pending = localStorage.getItem('pendingBooking')
    if (pending && searchParams.get('resume') === 'true') {
      try {
        const parsed = JSON.parse(pending)
        if (parsed.service && parsed.slot) {
          setSelectedService(parsed.service)
          setSelectedSlot(parsed.slot)
          // hardcoded proId for now as in Step2
          setProfessionalId('50e68e4f-2d93-4a1e-ab22-2580c8dc29cf') 
          setStep(3)
        }
      } catch (e) {
        console.error('Failed to parse pending booking', e)
      }
      localStorage.removeItem('pendingBooking') // limpa para não ficar em loop
    }
  }, [searchParams])

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    setStep(2)
  }

  const handleSlotSelect = (proId: string, slot: TimeSlot) => {
    setProfessionalId(proId)
    setSelectedSlot(slot)
    setStep(3)
  }

  const handleSubmit = async (clientData: Pick<BookingFormData, 'client_name' | 'client_email' | 'client_phone' | 'notes'>) => {
    if (!selectedService || !selectedSlot || !professionalId) return

    setIsSubmitting(true)
    try {
      const payload: BookingFormData = {
        service_id: selectedService.id,
        professional_id: professionalId,
        scheduled_at: selectedSlot.datetime,
        // preenchemos com dummy data para passar no zod (já que o backend real usaria a sessão)
        client_name: clientData.client_name || 'Cliente Logado',
        client_email: clientData.client_email || 'cliente@studio.com',
        client_phone: clientData.client_phone || '99999999999',
        notes: clientData.notes,
      }

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = (await res.json()) as { error: string }
        throw new Error(err.error ?? 'Erro ao agendar')
      }

      setIsSuccess(true)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao agendar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setStep(1)
    setSelectedService(null)
    setSelectedSlot(null)
    setProfessionalId(null)
    setIsSuccess(false)
  }

  if (isSuccess) return <SuccessScreen onNewBooking={handleReset} />

  return (
    <div>
      <StepIndicator current={step} />

      <div className="glass rounded-2xl p-6">
        {step === 1 && <Step1 onSelect={handleServiceSelect} />}
        {step === 2 && selectedService && (
          <Step2 service={selectedService} onSelect={handleSlotSelect} />
        )}
        {step === 3 && selectedService && selectedSlot && (
          <Step3
            service={selectedService}
            slot={selectedSlot}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}

        {step > 1 && !isSuccess && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
        )}
      </div>
    </div>
  )
}
