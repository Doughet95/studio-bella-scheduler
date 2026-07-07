export default function ClientsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
        <p className="text-muted-foreground">Gerencie a base de clientes do estúdio.</p>
      </div>
      <div className="flex h-[400px] shrink-0 items-center justify-center rounded-md border border-dashed border-border">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">Em breve</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            A listagem e gerenciamento de clientes será implementada nesta página na próxima fase.
          </p>
        </div>
      </div>
    </div>
  )
}
