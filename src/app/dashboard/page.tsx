"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { PlusCircle, PlayCircle, Loader2 } from "lucide-react"

type Workout = { id: string, name: string, created_at: string }

export default function DashboardPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('workouts')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setWorkouts(data)
        setLoading(false)
      })
  }, [])

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
            <Card key={workout.id} className="bg-card/40 border-border/50 hover:border-primary/50 transition-colors group">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">{workout.name}</CardTitle>
                <CardDescription>Criado em {new Date(workout.created_at).toLocaleDateString('pt-BR')}</CardDescription>
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
