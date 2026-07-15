import { ScheduleSettings } from '@/components/dashboard/schedule-settings'

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie as preferências e a disponibilidade da sua agenda.</p>
      </div>
      
      <div className="max-w-4xl">
        <ScheduleSettings />
      </div>
    </div>
  )
}
