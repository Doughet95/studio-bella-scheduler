export default function ServicesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
        <p className="text-muted-foreground">Gerencie o catálogo de serviços, preços e durações.</p>
      </div>
      <div className="flex h-[400px] shrink-0 items-center justify-center rounded-md border border-dashed border-border">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">Em breve</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            O catálogo de serviços estará disponível aqui na próxima fase.
          </p>
        </div>
      </div>
    </div>
  )
}
