import type { Metadata } from 'next'
import { AppointmentsView } from '@/components/appointments/appointments-view'

export const metadata: Metadata = { title: 'Agendamentos' }

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Agendamentos</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie todos os agendamentos</p>
      </div>
      <AppointmentsView />
    </div>
  )
}
