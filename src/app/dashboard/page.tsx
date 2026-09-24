"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { PlusCircle, PlayCircle, Loader2, Trash2, Edit } from "lucide-react"

type Workout = { id: string, name: string, created_at: string, days_of_week: string[] }

export default function DashboardPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)

  const loadWorkouts = () => {
    setLoading(true)
    supabase.from('workouts')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setWorkouts(data)
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
          {workouts.map(workout => (
            <Card key={workout.id} className="bg-card/40 border-border/50 hover:border-primary/50 transition-colors group relative">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Link href={`/dashboard/edit-workout/${workout.id}`}>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10">
                    <Edit className="w-4 h-4" />
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => deleteWorkout(workout.id, workout.name)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <CardHeader className="pb-3 pr-20">
                <CardTitle className="text-xl truncate">{workout.name}</CardTitle>
                <CardDescription>
                  {workout.days_of_week && workout.days_of_week.length > 0 
                    ? `Dias: ${workout.days_of_week.join(', ')}` 
                    : `Criado em ${new Date(workout.created_at).toLocaleDateString('pt-BR')}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/dashboard/workout/${workout.id}`}>
                  <Button className="w-full font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <PlayCircle className="w-5 h-5 mr-2" />
                    Iniciar Treino
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
