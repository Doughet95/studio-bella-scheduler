"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, ArrowLeft } from "lucide-react"

type WorkoutItem = {
  id: string
  exercise_id: string
  default_sets: number
  default_reps: string
  is_superset: boolean
  exercises: { name: string, target_muscle: string }
}

export default function ViewWorkoutPage() {
  const { id } = useParams()
  const router = useRouter()
  const [workoutName, setWorkoutName] = useState("")
  const [items, setItems] = useState<WorkoutItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: wData } = await supabase.from('workouts').select('name').eq('id', id).single()
      if (wData) setWorkoutName(wData.name)

      const { data: exData } = await supabase
        .from('workout_exercises')
        .select('id, exercise_id, default_sets, default_reps, is_superset, exercises(name, target_muscle)')
        .eq('workout_id', id)
        .order('order_index', { ascending: true })

      if (exData) {
        setItems(exData as any)
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{workoutName}</h1>
          <p className="text-muted-foreground mt-1">Visualize os exercícios antes de iniciar o treino.</p>
        </div>
      </div>

      <div className="space-y-6 mt-8">
        {items.map((item: any, index: number) => (
          <div key={item.id} className="relative">
            {item.is_superset && (
              <div className="absolute -top-6 left-8 h-6 w-1 bg-primary z-10"></div>
            )}
            <Card className={`bg-card/20 backdrop-blur-xl ${item.is_superset ? 'border-primary/50 shadow-primary/20' : 'border-white/10'} shadow-xl relative z-20 overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
              {item.is_superset && (
                <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full shadow-lg shadow-primary/30">
                  BI-SET
                </div>
              )}
              <CardHeader className={`pb-4 flex flex-col relative z-10 ${item.is_superset ? 'pt-6' : ''}`}>
                <CardTitle className="text-xl text-foreground">{item.exercises.name}</CardTitle>
                <CardDescription className="text-sm mt-1 text-muted-foreground">
                  Músculo alvo: <span className="text-primary font-medium">{item.exercises.target_muscle}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 relative z-10">
                <div className="flex items-center gap-4 bg-background/50 p-3 rounded-lg border border-border/50">
                  <div className="flex-1 text-center border-r border-border/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Séries</p>
                    <p className="text-lg font-bold">{item.default_sets}</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Repetições</p>
                    <p className="text-lg font-bold">{item.default_reps}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
