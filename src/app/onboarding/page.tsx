"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

type Goal = { id: string, name: string }

export default function Onboarding() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.from('goals').select('*').then(({ data }) => {
      if (data) setGoals(data)
      setLoading(false)
    })
  }, [])

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id])
  }

  const handleSave = () => {
    // Na vida real, salvaríamos no banco de dados para o usuário autenticado.
    // Como ainda vamos fazer o login depois, vou só redirecionar por enquanto.
    router.push('/dashboard')
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando objetivos...</div>
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="max-w-md w-full bg-card/50 shadow-xl shadow-primary/5">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Qual o seu foco?</CardTitle>
          <CardDescription className="text-center">
            Selecione um ou mais objetivos para que a Inteligência Artificial personalize suas dicas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {goals.map(goal => (
              <Button
                key={goal.id}
                variant={selected.includes(goal.id) ? "default" : "outline"}
                className={`h-14 text-lg justify-start px-6 ${selected.includes(goal.id) ? "border-primary" : "border-border/50"}`}
                onClick={() => toggle(goal.id)}
              >
                {selected.includes(goal.id) && <span className="mr-3">✓</span>}
                {goal.name}
              </Button>
            ))}
          </div>

          <Button 
            className="w-full h-12 mt-6 text-lg font-bold" 
            disabled={selected.length === 0}
            onClick={handleSave}
          >
            Continuar
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
