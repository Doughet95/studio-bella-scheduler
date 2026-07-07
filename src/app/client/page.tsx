import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function ClientAppointmentsPage() {
  const upcomingAppointments = [
    {
      id: 'app-1',
      service: 'Cílios Volume Brasileiro',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Em 2 dias
      status: 'confirmed',
      price: 80,
    }
  ]

  const pastAppointments = [
    {
      id: 'app-2',
      service: 'Design de Sobrancelhas',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Há 30 dias
      status: 'completed',
      price: 45,
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge className="bg-emerald-500 hover:bg-emerald-600">Confirmado</Badge>
      case 'pending': return <Badge variant="secondary">Pendente</Badge>
      case 'completed': return <Badge variant="outline">Concluído</Badge>
      default: return <Badge variant="destructive">Cancelado</Badge>
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Agendamentos</h1>
          <p className="text-muted-foreground mt-1">Acompanhe seus horários e histórico no Studio Bella.</p>
        </div>
        <Button asChild variant="gradient">
          <Link href="/book">
            Novo Agendamento
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Próximos Agendamentos */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Próximos Horários
          </h2>
          {upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              {upcomingAppointments.map((app) => (
                <Card key={app.id} className="border-primary/20 glow-primary">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{app.service}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="w-4 h-4" />
                          {format(app.date, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Clock className="w-4 h-4" />
                          {format(app.date, "HH:mm")}
                        </div>
                      </div>
                      {getStatusBadge(app.status)}
                    </div>
                    <div className="pt-4 border-t flex justify-between items-center">
                      <span className="font-medium">R$ {app.price},00</span>
                      <Button variant="outline" size="sm">Remarcar</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                <p>Nenhum agendamento futuro.</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Histórico */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            Histórico Passado
          </h2>
          <div className="space-y-4">
            {pastAppointments.map((app) => (
              <Card key={app.id} className="bg-muted/30">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{app.service}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(app.date, "dd MMM yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(app.status)}
                    <p className="text-xs font-medium mt-2">R$ {app.price},00</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button variant="ghost" className="w-full text-sm">
            Ver todo o histórico <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </section>
      </div>
    </div>
  )
}
