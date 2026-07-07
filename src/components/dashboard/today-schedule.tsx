import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatTime, getStatusClass, getStatusLabel } from '@/lib/utils'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Appointment } from '@/types'

interface TodayScheduleProps {
  appointments: Appointment[]
}

export function TodaySchedule({ appointments }: TodayScheduleProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          Agenda de Hoje
          <span className="text-xs font-normal text-muted-foreground">
            {appointments.length} atendimento{appointments.length !== 1 ? 's' : ''}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Clock className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">Sem agendamentos para hoje</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[195px] overflow-y-auto no-scrollbar">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors"
              >
                {/* Time */}
                <div className="text-center min-w-[44px] flex-shrink-0">
                  <p className="text-xs font-bold text-foreground leading-none">
                    {formatTime(appt.scheduled_at)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {appt.duration_minutes}min
                  </p>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-border flex-shrink-0" />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {appt.client?.name ?? '—'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {appt.service?.name ?? '—'}
                  </p>
                </div>

                {/* Status */}
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-medium border flex-shrink-0',
                    getStatusClass(appt.status)
                  )}
                >
                  {getStatusLabel(appt.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
