"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { PlusCircle, PlayCircle, Loader2, Trash2, Edit, Eye } from "lucide-react"

type Workout = { 
  id: string, 
  name: string, 
  created_at: string, 
  days_of_week: string[],
  workout_history?: [{ count: number }]
}

export default function DashboardPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)

  const loadWorkouts = () => {
    setLoading(true)
    supabase.from('workouts')
      .select('*, workout_history(count)')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error(error)
        if (data) setWorkouts(data as unknown as Workout[])
        setLoading(false)
      })
  }

  useEffect(() => {
    loadWorkouts()
  }, [])

  const deleteWorkout = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o treino "${name}"?`)) return
    
    const { error } = await supabase.from('workouts').delete().eq('id', id)
    if (error) {
      alert("Erro ao excluir. Pode haver sessões atreladas a este treino.")
    } else {
      loadWorkouts()
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minhas Fichas</h1>
          <p className="text-muted-foreground mt-1">Escolha um treino para iniciar hoje.</p>
        </div>
        <Link href="/dashboard/create-workout">
          <Button className="font-bold shadow-lg shadow-primary/20">
            <PlusCircle className="w-5 h-5 mr-2" />
            Nova Ficha
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : workouts.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent text-center py-12">
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <PlusCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl">Nenhuma ficha encontrada</CardTitle>
              <CardDescription className="mt-2">Você ainda não tem treinos cadastrados.</CardDescription>
            </div>
            <Link href="/dashboard/create-workout">
              <Button variant="outline" className="mt-4">Criar meu primeiro treino</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workouts.map(workout => {
            const checkins = workout.workout_history?.[0]?.count || 0;
            return (
            <Card key={workout.id} className="bg-card/20 backdrop-blur-xl border-white/10 hover:border-primary/50 shadow-2xl hover:shadow-primary/20 transition-all duration-300 group relative overflow-hidden">
              {/* Subtle gradient glow behind the card */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                <Link href={`/dashboard/edit-workout/${workout.id}`}>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/20">
                    <Edit className="w-4 h-4" />
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/20"
                  onClick={() => deleteWorkout(workout.id, workout.name)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <CardHeader className="pb-3 pr-20 relative z-10">
                <CardTitle className="text-xl truncate text-foreground group-hover:text-primary transition-colors">{workout.name}</CardTitle>
                <CardDescription>
                  {workout.days_of_week && workout.days_of_week.length > 0 
                    ? `Dias: ${workout.days_of_week.join(', ')}` 
                    : `Criado em ${new Date(workout.created_at).toLocaleDateString('pt-BR')}`}
                  <span className="block mt-2 font-medium text-primary bg-primary/10 border border-primary/20 w-fit px-2.5 py-1 rounded-md text-xs shadow-sm">
                    ✅ Feito {checkins} vez{checkins !== 1 ? 'es' : ''}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 flex flex-col gap-2">
                <Link href={`/dashboard/view-workout/${workout.id}`}>
                  <Button variant="secondary" className="w-full font-medium transition-all duration-300 group-hover:scale-[1.02] active:scale-95 text-foreground hover:text-primary">
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Exercícios
                  </Button>
                </Link>
                <Link href={`/dashboard/workout/${workout.id}`}>
                  <Button className="w-full font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 group-hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/25">
                    <PlayCircle className="w-5 h-5 mr-2" />
                    Iniciar Treino
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )})}
        </div>
      )}
    </div>
  )
}
