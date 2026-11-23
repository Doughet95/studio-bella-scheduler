"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, ArrowLeft, History, PlayCircle, RefreshCw, X } from "lucide-react"
import Link from "next/link"
import { ExerciseVideoButton } from "@/components/ExerciseVideoModal"

type WorkoutItem = {
  id: string
  exercise_id: string
  default_sets: number
  default_reps: string
  is_superset: boolean
  exercises: { name: string; target_muscle: string }
}

type LastSetRecord = {
  set_number: number
  reps: number
  weight: number
}

export default function ViewWorkoutPage() {
  const { id } = useParams()
  const router = useRouter()
  const [workoutName, setWorkoutName] = useState("")
  const [items, setItems] = useState<WorkoutItem[]>([])
  const [lastSessionLogs, setLastSessionLogs] = useState<Record<string, LastSetRecord[]>>({})
  const [lastSessionDate, setLastSessionDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [replacingEx, setReplacingEx] = useState<Record<string, boolean>>({})
  const [replaceNotes, setReplaceNotes] = useState<Record<string, string>>({})
  const [triedReplaceIds, setTriedReplaceIds] = useState<Record<string, string[]>>({})

  useEffect(() => {
    async function load() {
      const { data: wData } = await supabase.from("workouts").select("name").eq("id", id).single()
      if (wData) setWorkoutName(wData.name)

      const { data: exData } = await supabase
        .from("workout_exercises")
        .select("id, exercise_id, default_sets, default_reps, is_superset, exercises(name, target_muscle)")
        .eq("workout_id", id)
        .order("order_index", { ascending: true })

      if (exData) {
        setItems(exData as any)
      }

      const { data: prevSessions } = await supabase
        .from("workout_sessions")
        .select("id, start_time, exercise_logs(exercise_id, set_number, reps, weight)")
        .eq("workout_id", id)
        .order("start_time", { ascending: false })
        .limit(5)

      if (prevSessions && prevSessions.length > 0) {
        const latestWithLogs = prevSessions.find((s: any) => s.exercise_logs && s.exercise_logs.length > 0)
        if (latestWithLogs) {
          setLastSessionDate(
            new Date(latestWithLogs.start_time).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric"
            })
          )
          const map: Record<string, LastSetRecord[]> = {}
          ;(latestWithLogs.exercise_logs as any[]).forEach(l => {
            if (!map[l.exercise_id]) map[l.exercise_id] = []
            map[l.exercise_id].push({
              set_number: l.set_number,
              reps: l.reps,
              weight: l.weight
            })
          })
          Object.keys(map).forEach(k => {
            map[k].sort((a, b) => a.set_number - b.set_number)
          })
          setLastSessionLogs(map)
        }
      }

      setLoading(false)
    }
    load()
  }, [id])

  const replaceExerciseWithAI = async (item: WorkoutItem) => {
    const rowId = item.id
    const oldExId = item.exercise_id
    const oldName = item.exercises.name

    setReplacingEx(prev => ({ ...prev, [rowId]: true }))
    try {
      const prevTried = triedReplaceIds[rowId] || []
      const currentWorkoutExIds = items.map(i => i.exercise_id)
      const excludeIds = Array.from(new Set([...currentWorkoutExIds, ...prevTried, oldExId]))

      const res = await fetch("/api/ai/replace-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutExerciseRowId: rowId,
          currentExerciseId: oldExId,
          currentExerciseName: oldName,
          targetMuscle: item.exercises.target_muscle,
          excludeExerciseIds: excludeIds
        })
      })

      const data = await res.json()
      if (data.error || !data.exercise) {
        alert("Não foi possível substituir o exercício: " + (data.error || "Tente novamente"))
        return
      }

      const newEx = data.exercise as { id: string; name: string; target_muscle: string }

      setTriedReplaceIds(prev => ({
        ...prev,
        [rowId]: Array.from(new Set([...(prev[rowId] || []), oldExId, newEx.id]))
      }))

      setItems(prev =>
        prev.map(it =>
          it.id === rowId
            ? {
                ...it,
                exercise_id: newEx.id,
                exercises: {
                  name: newEx.name,
                  target_muscle: newEx.target_muscle
                }
              }
            : it
        )
      )

      setReplaceNotes(prev => ({
        ...prev,
        [rowId]: `🔄 Substituído (${oldName} → ${newEx.name}): ${data.reason || "Mesma biomecânica e grupamento muscular."}`
      }))
    } catch (e) {
      console.error(e)
      alert("Erro ao buscar substituto com a IA.")
    } finally {
      setReplacingEx(prev => ({ ...prev, [rowId]: false }))
    }
  }

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{workoutName}</h1>
            <p className="text-gray-300 text-sm mt-1">Visualize os exercícios e suas últimas cargas.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/history/${id}`}>
            <Button variant="secondary" size="sm" className="font-semibold">
              <History className="w-4 h-4 mr-1.5" />
              Histórico
            </Button>
          </Link>
          <Link href={`/dashboard/workout/${id}`}>
            <Button size="sm" className="font-bold">
              <PlayCircle className="w-4 h-4 mr-1.5" />
              Treinar
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-6 mt-8">
        {items.map((item: any) => {
          const prevSets = lastSessionLogs[item.exercise_id] || []
          return (
            <div key={item.id} className="relative">
              {item.is_superset && <div className="absolute -top-6 left-8 h-6 w-1 bg-primary z-10"></div>}
              <Card
                className={`bg-card/20 backdrop-blur-xl ${
                  item.is_superset ? "border-primary/50 shadow-primary/20" : "border-white/10"
                } shadow-xl relative z-20 overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                {item.is_superset && (
                  <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full shadow-lg shadow-primary/30">
                    BI-SET
                  </div>
                )}
                <CardHeader
                  className={`pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 relative z-10 ${
                    item.is_superset ? "pt-6" : ""
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-xl text-foreground">{item.exercises.name}</CardTitle>
                      <ExerciseVideoButton
                        exerciseName={item.exercises.name}
                        targetMuscle={item.exercises.target_muscle}
                      />
                    </div>
                    <CardDescription className="text-sm mt-1 text-muted-foreground">
                      Músculo alvo: <span className="text-primary font-medium">{item.exercises.target_muscle}</span>
                    </CardDescription>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-amber-300 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-xs shrink-0 w-fit"
                    onClick={() => replaceExerciseWithAI(item)}
                    disabled={replacingEx[item.id]}
                    title="Não tem este aparelho na academia? Clique para a IA substituir por outro de mesma biomecânica"
                  >
                    {replacingEx[item.id] ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Sem aparelho? Trocar c/ IA
                  </Button>
                </CardHeader>
                <CardContent className="pt-0 relative z-10 space-y-3">
                  {replaceNotes[item.id] && (
                    <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-start justify-between gap-2 text-xs text-amber-100">
                      <span className="leading-relaxed">{replaceNotes[item.id]}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setReplaceNotes(prev => {
                            const copy = { ...prev }
                            delete copy[item.id]
                            return copy
                          })
                        }
                        className="text-amber-300 hover:text-white p-0.5 shrink-0"
                        title="Fechar aviso"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

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

                  {prevSets.length > 0 && (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1.5">
                      <p className="text-xs font-semibold text-primary">
                        Último treino registrado ({lastSessionDate}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {prevSets.map((ps, i) => (
                          <span
                            key={i}
                            className="text-xs bg-background/60 border border-white/10 px-2.5 py-1 rounded-md text-gray-200"
                          >
                            {ps.set_number}ª série: <strong>{ps.reps} reps</strong> ×{" "}
                            <strong className="text-emerald-400">{ps.weight}kg</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}
