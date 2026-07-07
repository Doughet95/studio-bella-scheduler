'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  formatDateTime, formatCurrency, getStatusLabel, getStatusClass, cn
} from '@/lib/utils'
import { Calendar, Search, Filter, ChevronDown, Check, Clock } from 'lucide-react'
import type { Appointment, AppointmentStatus } from '@/types'
import { toast } from '@/components/ui/use-toast'

const statusOptions: AppointmentStatus[] = [
  'pending', 'confirmed', 'completed', 'cancelled', 'no_show'
]

interface AppointmentsResponse {
  data: Appointment[]
}

export function AppointmentsView() {
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | ''>('')
  const [search, setSearch] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery<AppointmentsResponse>({
    queryKey: ['appointments', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/appointments?${params.toString()}`)
      return res.json() as Promise<AppointmentsResponse>
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) => {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar')
      return res.json()
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['appointments'] })
      toast({ title: 'Status atualizado!', variant: 'default' as any })
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erro ao atualizar status' })
    },
  })

  const appointments = (data?.data ?? []).filter((appt) => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      appt.client?.name?.toLowerCase().includes(term) ||
      appt.service?.name?.toLowerCase().includes(term) ||
      appt.client?.phone?.includes(term)
    )
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, serviço ou telefone..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-input text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | '')}
          className="h-10 px-3 rounded-lg border border-input bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todos os status</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>{getStatusLabel(s)}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Nenhum agendamento encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {appointments.map((appt) => (
            <div
              key={appt.id}
              className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              {/* Time block */}
              <div className="flex items-center gap-3 sm:w-44 flex-shrink-0">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {formatDateTime(appt.scheduled_at)}
                  </p>
                  <p className="text-xs text-muted-foreground">{appt.duration_minutes} min</p>
                </div>
              </div>

              {/* Client & Service */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{appt.client?.name ?? '—'}</p>
                <p className="text-sm text-muted-foreground">{appt.service?.name ?? '—'}</p>
              </div>

              {/* Price */}
              <p className="font-bold text-foreground hidden sm:block">
                {formatCurrency(appt.price)}
              </p>

              {/* Status + Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium border', getStatusClass(appt.status))}>
                  {getStatusLabel(appt.status)}
                </span>

                {appt.status === 'pending' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateMutation.mutate({ id: appt.id, status: 'confirmed' })}
                    disabled={updateMutation.isPending}
                    className="h-7 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <Check className="w-3 h-3" />
                    Confirmar
                  </Button>
                )}

                {appt.status === 'confirmed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateMutation.mutate({ id: appt.id, status: 'completed' })}
                    disabled={updateMutation.isPending}
                    className="h-7 text-xs"
                  >
                    Concluir
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
