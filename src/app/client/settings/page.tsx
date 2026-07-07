import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function ClientSettingsPage() {
  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais e preferências.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações da Conta</CardTitle>
          <CardDescription>Esta área será implementada na próxima fase.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Aqui você poderá alterar sua senha, atualizar seu telefone de contato e foto de perfil.</p>
        </CardContent>
      </Card>
    </div>
  )
}
