'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import type { RevenueByDay } from '@/types'

// Prevent SSR — Recharts requires browser APIs
const Chart = dynamic(() => import('./revenue-chart-inner'), { ssr: false })

interface RevenueChartProps {
  data: RevenueByDay[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Receita Mensal</CardTitle>
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Últimos 6 meses</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[220px]">
          <Chart data={data} />
        </div>
      </CardContent>
    </Card>
  )
}
