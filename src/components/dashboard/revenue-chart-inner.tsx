'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import type { RevenueByDay } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  data: RevenueByDay[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-sm font-bold text-foreground">
          {formatCurrency(payload[0].value as number)}
        </p>
      </div>
    )
  }
  return null
}

export default function RevenueChartInner({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(340 40% 55%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(340 40% 55%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(340 12% 18%)" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: 'hsl(340 8% 55%)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'hsl(340 8% 55%)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="hsl(340 40% 55%)"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          dot={{ fill: 'hsl(340 40% 55%)', strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6, fill: 'hsl(340 40% 55%)' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
