"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Loader2,
  ArrowLeft,
  Calendar,
  TrendingUp,
  Dumbbell,
  CheckCircle2,
  Trash2,
  PlayCircle,
  Clock
} from "lucide-react"
import Link from "next/link"

type ExerciseLogItem = {
  id: string
  session_id: string
  exercise_id: string
  set_number: number
  reps: number
  weight: number
  exercises: {
    name: string
    target_muscle: string
  } | null
}

type SessionItem = {
  id: string
  workout_id: string
  start_time: string
  end_time: string | null
  exercise_logs: ExerciseLogItem[]
}

export default function WorkoutHistoryPage() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const justFinished = searchParams.get("justFinished") === "true"
  const finishedDurationParam = searchParams.get("duration")

  const [workoutName, setWorkoutName] = useState("")
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [loading, setLoading] = useState(true)

  const formatDurationHuman = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    if (h > 0) {
      return `${h}h ${m}min ${s}s`
    }
    if (m > 0) {
      return `${m}min ${s}s`
    }
    return `${s}s`
  }

  const getSessionDurationSeconds = (session: SessionItem) => {
    if (!session.start_time || !session.end_time) return null
    const diffSec = Math.round(
      (new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 1000
    )
    // Ignora sessões antigas onde start_time e end_time foram gravados no mesmo segundo (< 3s)
    if (diffSec < 3) return null
    return diffSec
  }

  const loadHistory = async () => {
    setLoading(true)
    const { data: wData } = await supabase
      .from("workouts")
      .select("name")
      .eq("id", id)
      .single()

    if (wData) setWorkoutName(wData.name)

    const { data: sData, error } = await supabase
      .from("workout_sessions")
      .select("id, workout_id, start_time, end_time, exercise_logs(id, session_id, exercise_id, set_number, reps, weight, exercises(name, target_muscle))")
      .eq("workout_id", id)
      .order("start_time", { ascending: false })

    if (error) {
      console.error("Erro ao carregar histórico:", error)
    }

    if (sData) {
      setSessions(sData as unknown as SessionItem[])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadHistory()
  }, [id])

  const deleteSession = async (sessionId: string, dateLabel: string) => {
    if (!confirm(`Deseja excluir o registro do treino de ${dateLabel}?`)) return
    await supabase.from("exercise_logs").delete().eq("session_id", sessionId)
    await supabase.from("workout_sessions").delete().eq("id", sessionId)
    loadHistory()
  }

  const groupLogsByExercise = (logs: ExerciseLogItem[]) => {
    const map = new Map<
      string,
      {
        exerciseId: string
        name: string
        targetMuscle: string
        sets: ExerciseLogItem[]
        maxWeight: number
        totalVolume: number
      }
    >()

    const sorted = [...(logs || [])].sort((a, b) => a.set_number - b.set_number)

    sorted.forEach(log => {
      const exId = log.exercise_id
      const exName = log.exercises?.name || "Exercício"
      const exMuscle = log.exercises?.target_muscle || "Geral"

      if (!map.has(exId)) {
        map.set(exId, {
          exerciseId: exId,
          name: exName,
          targetMuscle: exMuscle,
          sets: [],
          maxWeight: 0,
          totalVolume: 0
        })
      }

      const group = map.get(exId)!
      group.sets.push(log)
      if (Number(log.weight) > group.maxWeight) {
        group.maxWeight = Number(log.weight)
      }
      group.totalVolume += Number(log.reps) * Number(log.weight)
    })

    return Array.from(map.values())
  }

  const getEvolutionBadge = (sessionIndex: number, exerciseId: string, currentMaxWeight: number, currentVolume: number) => {
    if (sessionIndex >= sessions.length - 1) return null
    const previousSession = sessions[sessionIndex + 1]
    if (!previousSession) return null

    const prevGroups = groupLogsByExercise(previousSession.exercise_logs)
    const prevEx = prevGroups.find(g => g.exerciseId === exerciseId)
    if (!prevEx) return null

    const weightDiff = currentMaxWeight - prevEx.maxWeight
    const volumeDiff = currentVolume - prevEx.totalVolume

    if (weightDiff > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <TrendingUp className="w-3.5 h-3.5" />
          +{weightDiff}kg na carga máx!
        </span>
      )
    }

    if (weightDiff === 0 && volumeDiff > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
          <TrendingUp className="w-3.5 h-3.5" />
          Mais repetições / volume (+{volumeDiff}kg)
        </span>
      )
    }

    if (weightDiff < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">
          {weightDiff}kg vs treino anterior
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/10 text-gray-300">
        Carga mantida ({currentMaxWeight}kg)
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {justFinished && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-md flex items-center gap-3 text-emerald-200 shadow-lg">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-white">
              Treino finalizado e salvo com sucesso! 💪
              {finishedDurationParam && !isNaN(Number(finishedDurationParam)) && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold bg-emerald-500/30 text-white px-2.5 py-0.5 rounded-full">
                  <Clock className="w-3.5 h-3.5" />
                  Tempo total: {formatDurationHuman(Number(finishedDurationParam))}
                </span>
              )}
            </p>
            <p className="text-xs text-emerald-200/90 mt-0.5">
              Confira abaixo o histórico completo das suas séries, repetições, cargas e tempo de treino.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Histórico: {workoutName}
            </h1>
            <p className="text-gray-300 text-sm mt-0.5">
              Acompanhe suas cargas, repetições, tempo de duração e evolução.
            </p>
          </div>
        </div>

        <Link href={`/dashboard/workout/${id}`}>
          <Button className="font-bold shadow-lg shadow-primary/25">
            <PlayCircle className="w-4 h-4 mr-2" />
            Novo Treino
          </Button>
        </Link>
      </div>

      {sessions.length === 0 ? (
        <Card className="bg-card/25 backdrop-blur-xl border-white/10 text-center py-12">
          <CardContent className="space-y-4">
            <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto opacity-60" />
            <div>
              <CardTitle className="text-xl text-white">Nenhum treino registrado ainda</CardTitle>
              <CardDescription className="text-gray-300 mt-1">
                Inicie o treino, preencha suas cargas e clique em Finalizar Treino para ver seu histórico aqui.
              </CardDescription>
            </div>
            <Link href={`/dashboard/workout/${id}`}>
              <Button className="mt-2 font-bold">
                <PlayCircle className="w-4 h-4 mr-2" />
                Iniciar Treino Agora
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sessions.map((session, sIdx) => {
            const dateObj = new Date(session.start_time)
            const dateFormatted = dateObj.toLocaleDateString("pt-BR", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
              year: "numeric"
            })
            const timeFormatted = dateObj.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit"
            })

            const groupedExercises = groupLogsByExercise(session.exercise_logs)
            const totalSets = session.exercise_logs?.length || 0
            const totalSessionVolume = groupedExercises.reduce((acc, g) => acc + g.totalVolume, 0)
            const durationSec = getSessionDurationSeconds(session)

            return (
              <Card
                key={session.id}
                className={`bg-card/30 backdrop-blur-xl ${
                  sIdx === 0 ? "border-primary/50 shadow-primary/15" : "border-white/10"
                } shadow-2xl overflow-hidden`}
              >
                <CardHeader className="pb-3 border-b border-white/10 bg-white/5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-primary/20 text-primary">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg text-white capitalize">
                            {dateFormatted} às {timeFormatted}
                          </CardTitle>
                          {sIdx === 0 && (
                            <span className="text-[11px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                              Mais Recente
                            </span>
                          )}
                          {durationSec !== null && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold bg-white/10 border border-white/15 text-emerald-300 px-2.5 py-0.5 rounded-full">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDurationHuman(durationSec)}
                            </span>
                          )}
                        </div>
                        <CardDescription className="text-gray-300 text-xs mt-0.5">
                          {groupedExercises.length} exercício(s) • {totalSets} série(s) registradas • Volume total:{" "}
                          <strong className="text-white">{totalSessionVolume.toLocaleString("pt-BR")} kg</strong>
                        </CardDescription>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-destructive hover:bg-destructive/15 shrink-0"
                      onClick={() => deleteSession(session.id, `${dateFormatted} às ${timeFormatted}`)}
                      title="Excluir registro deste dia"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  {groupedExercises.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">
                      Treino finalizado sem séries preenchidas.
                    </p>
                  ) : (
                    groupedExercises.map(ex => (
                      <div
                        key={ex.exerciseId}
                        className="p-3.5 rounded-xl bg-background/50 border border-white/10 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <h3 className="font-bold text-white text-base">{ex.name}</h3>
                            <p className="text-xs text-gray-400">
                              Músculo: <span className="text-primary font-medium">{ex.targetMuscle}</span> • Carga máx:{" "}
                              <strong className="text-white">{ex.maxWeight} kg</strong>
                            </p>
                          </div>
                          {getEvolutionBadge(sIdx, ex.exerciseId, ex.maxWeight, ex.totalVolume)}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                          {ex.sets.map(set => (
                            <div
                              key={set.id}
                              className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm"
                            >
                              <span className="text-xs font-medium text-gray-400">
                                {set.set_number}ª Série
                              </span>
                              <span className="font-bold text-white">
                                {set.reps} <span className="text-xs font-normal text-gray-300">reps</span> ×{" "}
                                <span className="text-emerald-400">{set.weight}kg</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
