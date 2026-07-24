import { ThemeToggle } from '@/components/theme-toggle'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie as preferências da sua conta.</p>
      </div>
      
      <div className="max-w-2xl space-y-4">
        <div className="p-6 rounded-xl border border-border/50 glass flex items-center justify-between">
          <div>
            <h3 className="font-medium text-foreground">Aparência do Sistema</h3>
            <p className="text-sm text-muted-foreground">Alternar entre o modo claro e escuro.</p>
          </div>
          <ThemeToggle />
        </div>

        <div className="p-6 rounded-xl border border-border/50 glass">
          <h3 className="font-medium text-foreground mb-4">Dados da Conta</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Conta Principal</p>
              <p className="text-foreground">{session?.user?.name}</p>
              <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
