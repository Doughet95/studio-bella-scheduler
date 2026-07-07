'use client'

import { useQuery } from '@tanstack/react-query'
import { MetricCard } from '@/components/dashboard/metric-card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { TodaySchedule } from '@/components/dashboard/today-schedule'
import { formatCurrency } from '@/lib/utils'
import { Calendar, DollarSign, Users, TrendingDown } from 'lucide-react'
import type { DashboardStats, RevenueByDay, Appointment } from '@/types'

interface StatsResponse {
  data: {
    stats: DashboardStats
    revenue_by_month: RevenueByDay[]
    today_appointments: Appointment[]
  }
}

export function DashboardContent() {
  const { data, isLoading, error } = useQuery<StatsResponse>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats')
      if (!res.ok) throw new Error('Erro ao carregar dados')
      return res.json() as Promise<StatsResponse>
    },
    refetchInterval: 60_000, // refresh a cada minuto
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 rounded-xl bg-muted/50 animate-pulse" />
          <div className="h-72 rounded-xl bg-muted/50 animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Erro ao carregar dados. Tente recarregar a página.</p>
      </div>
    )
  }

  const { stats, revenue_by_month, today_appointments } = data.data

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Agendamentos Hoje"
          value={stats.appointments_today.toString()}
          icon={Calendar}
          iconColor="text-primary"
          iconBg="bg-primary/10"
          description="confirmados e pendentes"
        />
        <MetricCard
          title="Receita do Mês"
          value={formatCurrency(stats.total_revenue_month)}
          icon={DollarSign}
          iconColor="text-secondary"
          iconBg="bg-secondary/10"
          description="serviços concluídos"
        />
        <MetricCard
          title="Total de Clientes"
          value={stats.total_clients.toString()}
          icon={Users}
          iconColor="text-blue-400"
          iconBg="bg-blue-400/10"
          description="cadastrados no sistema"
        />
        <MetricCard
          title="Taxa de Cancelamento"
          value={`${stats.cancellation_rate}%`}
          icon={TrendingDown}
          iconColor={stats.cancellation_rate > 20 ? 'text-destructive' : 'text-emerald-400'}
          iconBg={stats.cancellation_rate > 20 ? 'bg-destructive/10' : 'bg-emerald-400/10'}
          description="este mês"
        />
      </div>

      {/* Charts & Today */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenue_by_month} />
        <TodaySchedule appointments={today_appointments} />
      </div>
    </div>
  )
}
