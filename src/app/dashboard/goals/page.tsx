'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { Loader2, Plus, Target, PiggyBank } from 'lucide-react'
import { Goal } from '@/lib/mock-db'

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  // Form
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [hasLimit, setHasLimit] = useState(true)

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/goals')
      const data = await res.json()
      if (data.data) setGoals(data.data)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          target_amount: hasLimit ? parseFloat(targetAmount) : null,
          current_amount: 0
        })
      })
      if (!res.ok) throw new Error('Erro')
      toast({ title: 'Meta criada com sucesso!' })
      fetchGoals()
      setName(''); setTargetAmount('')
    } catch {
      toast({ variant: 'destructive', title: 'Falha ao criar meta' })
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Target className="w-8 h-8 text-primary" />
          Metas Financeiras
        </h1>
        <p className="text-muted-foreground mt-1">Acompanhe seus objetivos e reservas de emergência.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1">
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle>Nova Meta</CardTitle>
              <CardDescription>Crie um objetivo para guardar dinheiro.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Meta</Label>
                  <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Reserva de Emergência" />
                </div>

                <div className="flex items-center gap-2 py-2">
                  <input type="checkbox" id="hasLimit" checked={!hasLimit} onChange={() => setHasLimit(!hasLimit)} className="w-4 h-4 rounded border-input" />
                  <Label htmlFor="hasLimit" className="cursor-pointer font-normal">Valor indefinido (Apenas juntar)</Label>
                </div>

                {hasLimit && (
                  <div className="space-y-2 animate-fade-in">
                    <Label>Qual o valor desejado? (R$)</Label>
                    <Input required type="number" step="0.01" min="1" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="10000.00" />
                  </div>
                )}

                <Button type="submit" disabled={adding} className="w-full gap-2 mt-4">
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Criar Meta
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : goals.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground glass rounded-xl border border-border/50">
              Nenhuma meta cadastrada ainda.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {goals.map(goal => {
                const percentage = goal.target_amount ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)) : null
                
                return (
                  <Card key={goal.id} className="glass border-border/50 hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex justify-between items-start">
                        <span className="truncate pr-2">{goal.name}</span>
                        <PiggyBank className="w-5 h-5 text-emerald-500 shrink-0" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-2">
                        <span className="text-2xl font-bold text-foreground">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.current_amount)}
                        </span>
                        {goal.target_amount && (
                          <span className="text-muted-foreground text-sm ml-1">
                            / {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.target_amount)}
                          </span>
                        )}
                      </div>
                      
                      {goal.target_amount ? (
                        <div className="space-y-1">
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 transition-all duration-1000" 
                              style={{ width: `${percentage}%` }} 
                            />
                          </div>
                          <p className="text-xs text-right font-medium text-emerald-500">{percentage}% atingido</p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-2 inline-flex bg-secondary/10 text-secondary px-2 py-1 rounded-full">
                          Acumulando sem limite
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
