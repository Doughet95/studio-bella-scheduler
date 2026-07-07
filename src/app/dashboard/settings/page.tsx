export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Ajuste as preferências e informações do estúdio.</p>
      </div>
      <div className="flex h-[400px] shrink-0 items-center justify-center rounded-md border border-dashed border-border">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">Em breve</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            A configuração do horário de funcionamento e preferências do sistema estará aqui.
          </p>
        </div>
      </div>
    </div>
  )
}
