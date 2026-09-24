"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, BrainCircuit, CheckCircle2, Timer, X } from "lucide-react"

type WorkoutItem = {
  id: string
  exercise_id: string
  default_sets: number
  default_reps: string
  exercises: { name: string, target_muscle: string }
}

type SetLog = {
  set_number: number
  reps: number | ""
  weight: number | ""
}

export default function WorkoutSessionPage() {
  const { id } = useParams()
  const router = useRouter()
  const [workoutName, setWorkoutName] = useState("")
  const [items, setItems] = useState<WorkoutItem[]>([])
  const [logs, setLogs] = useState<Record<string, SetLog[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [aiTips, setAiTips] = useState<Record<string, string>>({})
  const [loadingAi, setLoadingAi] = useState<Record<string, boolean>>({})
  const [restTimeLeft, setRestTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    if (restTimeLeft === null || restTimeLeft <= 0) return
    const interval = setInterval(() => setRestTimeLeft(prev => prev! - 1), 1000)
    return () => clearInterval(interval)
  }, [restTimeLeft])

  const startRest = (seconds: number) => setRestTimeLeft(seconds)

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
        
        // Inicializar os logs vazios
        const initialLogs: Record<string, SetLog[]> = {}
        exData.forEach((item: any) => {
          initialLogs[item.exercise_id] = Array.from({ length: item.default_sets }).map((_, i) => ({
            set_number: i + 1,
            reps: "",
            weight: ""
          }))
        })
        setLogs(initialLogs)
      }
      setLoading(false)
    }
    load()
  }, [id])

  const updateLog = (exerciseId: string, setIndex: number, field: 'reps' | 'weight', value: string) => {
    const val = value === "" ? "" : Number(value)
    setLogs(prev => {
      const updated = { ...prev }
      updated[exerciseId][setIndex][field] = val
      return updated
    })
  }

  const getAiTip = async (exerciseId: string, exerciseName: string) => {
    setLoadingAi(prev => ({ ...prev, [exerciseId]: true }))
    try {
      // Aqui faríamos um POST para /api/ai/coach enviando o histórico
      // Como ainda vamos criar a API, vamos simular:
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId,
          exerciseName,
          currentLogs: logs[exerciseId]
        })
      })
      
      const data = await res.json()
      setAiTips(prev => ({ ...prev, [exerciseId]: data.tip || "Mantenha o foco na execução!" }))
    } catch (e) {
      setAiTips(prev => ({ ...prev, [exerciseId]: "Concentre-se no movimento e não tenha pressa." }))
    } finally {
      setLoadingAi(prev => ({ ...prev, [exerciseId]: false }))
    }
  }

  const finishWorkout = async () => {
    setSaving(true)
    
    // 1. Criar a sessão de treino
    const { data: session } = await supabase
      .from('workout_sessions')
      .insert([{ workout_id: id }])
      .select()
      .single()

    if (!session) {
      alert("Erro ao iniciar a sessão.")
      setSaving(false)
      return
    }

    // 2. Salvar todos os logs preenchidos
    const logsToInsert: any[] = []
    
    Object.keys(logs).forEach(exerciseId => {
      logs[exerciseId].forEach(log => {
        if (log.reps !== "" && log.weight !== "") {
          logsToInsert.push({
            session_id: session.id,
            exercise_id: exerciseId,
            set_number: log.set_number,
            reps: log.reps,
            weight: log.weight
          })
        }
      })
    })

    if (logsToInsert.length > 0) {
      await supabase.from('exercise_logs').insert(logsToInsert)
    }

    // Marca fim do treino
    await supabase.from('workout_sessions').update({ end_time: new Date().toISOString() }).eq('id', session.id)

    // REGISTRA O CHECK-IN NO HISTÓRICO
    await supabase.from('workout_history').insert([{ workout_id: id }])

    router.push('/dashboard')
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{workoutName}</h1>
        <p className="text-muted-foreground mt-1">Preencha as repetições e carga (kg) realizadas.</p>
      </div>

      <div className="space-y-6">
        {items.map((item: any, index: number) => (
          <div key={item.id} className="relative">
            {item.is_superset && (
              <div className="absolute -top-6 left-8 h-6 w-1 bg-primary z-10"></div>
            )}
            <Card className={`bg-card/40 ${item.is_superset ? 'border-primary/50' : 'border-border/50'} relative z-20`}>
              {item.is_superset && (
                <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                  BI-SET
                </div>
              )}
              <CardHeader className={`pb-3 flex flex-row items-start justify-between ${item.is_superset ? 'pt-6' : ''}`}>
              <div>
                <CardTitle className="text-xl">{item.exercises.name}</CardTitle>
                <CardDescription>Músculo: {item.exercises.target_muscle} • Alvo: {item.default_reps} reps</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-primary border-primary/50 hover:bg-primary/10"
                onClick={() => getAiTip(item.exercise_id, item.exercises.name)}
                disabled={loadingAi[item.exercise_id]}
              >
                {loadingAi[item.exercise_id] ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BrainCircuit className="w-4 h-4 mr-2" />}
                Dica IA
              </Button>
            </CardHeader>
            <CardContent>
              {/* Espaço para a Dica da IA */}
              {aiTips[item.exercise_id] && (
                <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm flex gap-3">
                  <BrainCircuit className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-foreground/90 font-medium">{aiTips[item.exercise_id]}</p>
                </div>
              )}

              <div className="space-y-3">
                {logs[item.exercise_id]?.map((log, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-12 text-sm font-medium text-muted-foreground">
                      Série {log.set_number}
                    </div>
                    <div className="flex-1">
                      <Label className="sr-only">Repetições</Label>
                      <Input 
                        type="number" 
                        placeholder="Reps" 
                        value={log.reps}
                        onChange={e => updateLog(item.exercise_id, idx, 'reps', e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="sr-only">Peso (kg)</Label>
                      <Input 
                        type="number" 
                        placeholder="Kg" 
                        value={log.weight}
                        onChange={e => updateLog(item.exercise_id, idx, 'weight', e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-10 w-10 text-emerald-500 border-emerald-500/50 hover:bg-emerald-500/10 shrink-0" 
                      onClick={() => startRest(60)}
                      title="Iniciar Descanso de 60s"
                    >
                      <Timer className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border z-10 flex flex-col items-center gap-3">
        {restTimeLeft !== null && restTimeLeft > 0 && (
          <div className="bg-emerald-500 text-white px-6 py-2.5 rounded-full shadow-xl shadow-emerald-500/20 font-bold flex items-center gap-2 animate-in slide-in-from-bottom-4">
            <Timer className="w-5 h-5 animate-pulse" />
            Descanso: {Math.floor(restTimeLeft / 60)}:{(restTimeLeft % 60).toString().padStart(2, '0')}
            <Button variant="ghost" size="icon" className="h-6 w-6 ml-2 hover:bg-emerald-600 rounded-full" onClick={() => setRestTimeLeft(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        <Button 
          size="lg" 
          className="w-full max-w-2xl font-bold h-14 text-lg shadow-xl shadow-primary/20"
          onClick={finishWorkout}
          disabled={saving}
        >
          {saving ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <CheckCircle2 className="w-6 h-6 mr-2" />}
          Finalizar Treino
        </Button>
      </div>
    </div>
  )
}
