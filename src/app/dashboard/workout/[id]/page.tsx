"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Loader2,
  BrainCircuit,
  CheckCircle2,
  Timer,
  X,
  History,
  ArrowLeft,
  Plus,
  Minus,
  Minimize2,
  Maximize2,
  Clock,
  RotateCcw
} from "lucide-react"
import Link from "next/link"
import { ExerciseVideoButton } from "@/components/ExerciseVideoModal"

type WorkoutItem = {
  id: string
  exercise_id: string
  default_sets: number
  default_reps: string
  is_superset?: boolean
  exercises: { name: string; target_muscle: string }
}

type SetLog = {
  set_number: number
  reps: number | ""
  weight: number | ""
}

type LastSetRecord = {
  set_number: number
  reps: number
  weight: number
}

export default function WorkoutSessionPage() {
  const { id } = useParams()
  const router = useRouter()
  const [workoutName, setWorkoutName] = useState("")
  const [items, setItems] = useState<WorkoutItem[]>([])
  const [logs, setLogs] = useState<Record<string, SetLog[]>>({})
  const [lastSessionLogs, setLastSessionLogs] = useState<Record<string, LastSetRecord[]>>({})
  const [lastSessionDate, setLastSessionDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [aiTips, setAiTips] = useState<Record<string, string>>({})
  const [loadingAi, setLoadingAi] = useState<Record<string, boolean>>({})

  // Cronômetro do Tempo Total de Treino
  const [workoutStartTimestamp, setWorkoutStartTimestamp] = useState<number | null>(null)
  const [workoutElapsedSeconds, setWorkoutElapsedSeconds] = useState<number>(0)
  const [isWorkoutTimerRunning, setIsWorkoutTimerRunning] = useState<boolean>(true)

  // Estados do Cronômetro de Descanso Sobreposto
  const [restTimeLeft, setRestTimeLeft] = useState<number | null>(null)
  const [restTotalTime, setRestTotalTime] = useState<number>(60)
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false)
  const [activeTimerLabel, setActiveTimerLabel] = useState<string>("")

  const startStorageKey = id ? `workout_start_time_${id}` : ""
  const logsStorageKey = id ? `workout_draft_logs_${id}` : ""

  // Inicializa o cronômetro total usando localStorage (não perde se abrir o WhatsApp ou a tela apagar)
  useEffect(() => {
    if (!id || typeof window === "undefined") return
    const savedStart = localStorage.getItem(startStorageKey)
    let startTs = Date.now()

    if (savedStart && !isNaN(Number(savedStart))) {
      startTs = Number(savedStart)
    } else {
      localStorage.setItem(startStorageKey, String(startTs))
    }

    setWorkoutStartTimestamp(startTs)
    setWorkoutElapsedSeconds(Math.max(0, Math.floor((Date.now() - startTs) / 1000)))
    setIsWorkoutTimerRunning(true)
  }, [id, startStorageKey])

  // Atualiza o cronômetro de tempo total de treino a cada segundo E quando o usuário volta do WhatsApp/tela bloqueada
  useEffect(() => {
    if (!isWorkoutTimerRunning || workoutStartTimestamp === null) return

    const updateElapsed = () => {
      setWorkoutElapsedSeconds(Math.max(0, Math.floor((Date.now() - workoutStartTimestamp) / 1000)))
    }

    const interval = setInterval(updateElapsed, 1000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateElapsed()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [isWorkoutTimerRunning, workoutStartTimestamp])

  useEffect(() => {
    if (restTimeLeft === null || restTimeLeft <= 0) {
      if (restTimeLeft === 0 && typeof window !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate([250, 120, 250])
        } catch {}
      }
      return
    }
    const interval = setInterval(() => {
      setRestTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [restTimeLeft])

  const startRest = (seconds: number, exerciseName?: string, setNumber?: number) => {
    setRestTotalTime(seconds)
    setRestTimeLeft(seconds)
    if (exerciseName && setNumber) {
      setActiveTimerLabel(`${exerciseName} • ${setNumber}ª Série`)
    } else if (!activeTimerLabel) {
      setActiveTimerLabel("Descanso entre séries")
    }
    setIsTimerModalOpen(true)
  }

  const adjustRestTime = (deltaSeconds: number) => {
    setRestTimeLeft(prev => {
      const next = Math.max(0, (prev ?? 0) + deltaSeconds)
      if (next > restTotalTime) setRestTotalTime(next)
      return next
    })
  }

  const closeRestTimer = () => {
    setRestTimeLeft(null)
    setIsTimerModalOpen(false)
  }

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

        // Inicializa a estrutura padrão de séries
        const initialLogs: Record<string, SetLog[]> = {}
        exData.forEach((item: any) => {
          initialLogs[item.exercise_id] = Array.from({ length: item.default_sets }).map((_, i) => ({
            set_number: i + 1,
            reps: "",
            weight: ""
          }))
        })

        // Restaura automaticamente qualquer repetição/peso salvo no celular (localStorage)
        if (typeof window !== "undefined" && id) {
          try {
            const savedDraftRaw = localStorage.getItem(`workout_draft_logs_${id}`)
            if (savedDraftRaw) {
              const savedDraft = JSON.parse(savedDraftRaw) as Record<string, SetLog[]>
              Object.keys(initialLogs).forEach(exId => {
                if (savedDraft[exId] && Array.isArray(savedDraft[exId])) {
                  initialLogs[exId] = initialLogs[exId].map((defaultSet, idx) => {
                    const savedSet = savedDraft[exId][idx]
                    if (savedSet) {
                      return {
                        set_number: defaultSet.set_number,
                        reps: savedSet.reps ?? "",
                        weight: savedSet.weight ?? ""
                      }
                    }
                    return defaultSet
                  })
                }
              })
            }
          } catch (e) {
            console.error("Erro ao restaurar rascunho do treino:", e)
          }
        }

        setLogs(initialLogs)
      }

      // Carrega o último treino realizado desta ficha para mostrar referência de carga/reps
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
              month: "2-digit"
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

  // Salva cada repetição e peso imediatamente no localStorage para nunca perder ao sair do navegador/apagar a tela
  const updateLog = (exerciseId: string, setIndex: number, field: "reps" | "weight", value: string) => {
    const val = value === "" ? "" : Number(value)
    setLogs(prev => {
      const updated = { ...prev }
      updated[exerciseId] = [...(updated[exerciseId] || [])]
      updated[exerciseId][setIndex] = {
        ...updated[exerciseId][setIndex],
        [field]: val
      }
      if (typeof window !== "undefined" && logsStorageKey) {
        try {
          localStorage.setItem(logsStorageKey, JSON.stringify(updated))
        } catch {}
      }
      return updated
    })
  }

  const resetCurrentDraft = () => {
    if (!confirm("Deseja zerar os campos preenchidos e reiniciar o cronômetro deste treino?")) return
    const cleared: Record<string, SetLog[]> = {}
    items.forEach((item: any) => {
      cleared[item.exercise_id] = Array.from({ length: item.default_sets }).map((_, i) => ({
        set_number: i + 1,
        reps: "",
        weight: ""
      }))
    })
    setLogs(cleared)
    const nowTs = Date.now()
    setWorkoutStartTimestamp(nowTs)
    setWorkoutElapsedSeconds(0)
    if (typeof window !== "undefined") {
      if (logsStorageKey) localStorage.removeItem(logsStorageKey)
      if (startStorageKey) localStorage.setItem(startStorageKey, String(nowTs))
    }
  }

  const getAiTip = async (item: WorkoutItem) => {
    const exerciseId = item.exercise_id
    setLoadingAi(prev => ({ ...prev, [exerciseId]: true }))
    try {
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId,
          exerciseName: item.exercises.name,
          targetMuscle: item.exercises.target_muscle,
          targetReps: item.default_reps,
          defaultSets: item.default_sets,
          currentLogs: logs[exerciseId] || [],
          previousLogs: lastSessionLogs[exerciseId] || []
        })
      })

      const data = await res.json()
      setAiTips(prev => ({ ...prev, [exerciseId]: data.tip || "Mantenha o foco na execução!" }))
    } catch (e) {
      setAiTips(prev => ({
        ...prev,
        [exerciseId]:
          "📊 Análise Técnica: Mantenha cadência controlada (2 a 3s na descida) e respeite o alinhamento articular."
      }))
    } finally {
      setLoadingAi(prev => ({ ...prev, [exerciseId]: false }))
    }
  }

  const finishWorkout = async () => {
    // Para o cronômetro imediatamente ao clicar em Finalizar Treino
    setIsWorkoutTimerRunning(false)
    setSaving(true)

    const endTimestamp = Date.now()
    const startTimestamp = workoutStartTimestamp ?? endTimestamp - workoutElapsedSeconds * 1000
    const finalDurationSeconds = Math.max(1, Math.floor((endTimestamp - startTimestamp) / 1000))
    const durationMinutes = Math.max(1, Math.round(finalDurationSeconds / 60))

    // 1. Criar a sessão de treino (sem user_id pois workout_sessions possui FK para tabela legada profiles)
    const { data: session, error: sessionError } = await supabase
      .from("workout_sessions")
      .insert([
        {
          workout_id: id,
          start_time: new Date(startTimestamp).toISOString(),
          end_time: new Date(endTimestamp).toISOString()
        }
      ])
      .select()
      .single()

    if (!session || sessionError) {
      console.error("Erro ao criar workout_session:", sessionError)
      alert("Erro ao salvar a sessão de treino: " + (sessionError?.message || "Tente novamente."))
      setIsWorkoutTimerRunning(true)
      setSaving(false)
      return
    }

    // 2. Salvar todos os logs preenchidos
    const logsToInsert: any[] = []

    Object.keys(logs).forEach(exerciseId => {
      logs[exerciseId].forEach(log => {
        if (log.reps !== "" || log.weight !== "") {
          logsToInsert.push({
            session_id: session.id,
            exercise_id: exerciseId,
            set_number: log.set_number,
            reps: log.reps === "" ? 0 : Math.round(Number(log.reps)),
            weight: log.weight === "" ? 0 : Number(log.weight)
          })
        }
      })
    })

    if (logsToInsert.length > 0) {
      const { error: logsError } = await supabase.from("exercise_logs").insert(logsToInsert)
      if (logsError) {
        console.error("Erro ao salvar exercise_logs:", logsError)
      }
    }

    // 3. Registra o check-in no histórico (sem bloquear caso haja política/constraint)
    try {
      const { data: authData } = await supabase.auth.getSession()
      const userId = authData?.session?.user?.id || null
      await supabase.from("workout_history").insert([
        {
          workout_id: id,
          duration_minutes: durationMinutes,
          ...(userId ? { user_id: userId } : {})
        }
      ])
    } catch {}

    // 4. Limpa o rascunho salvo no celular somente após salvar com sucesso no banco!
    if (typeof window !== "undefined") {
      if (logsStorageKey) localStorage.removeItem(logsStorageKey)
      if (startStorageKey) localStorage.removeItem(startStorageKey)
    }

    // Redireciona diretamente para a tela de Histórico enviando o tempo total gasto
    router.push(`/dashboard/history/${id}?justFinished=true&duration=${finalDurationSeconds}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const formatTotalDuration = (sec: number) => {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    if (h > 0) {
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
        .toString()
        .padStart(2, "0")}`
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const progressPercent =
    restTimeLeft !== null && restTotalTime > 0
      ? Math.min(100, Math.max(0, (restTimeLeft / restTotalTime) * 100))
      : 0

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-40">
      {/* Cabeçalho com botão de voltar e acesso rápido ao Histórico */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{workoutName}</h1>
            <p className="text-emerald-400 text-xs font-medium mt-0.5">
              ✓ Suas repetições e pesos ficam salvos automaticamente no aparelho
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetCurrentDraft}
            className="text-xs border-white/15 bg-white/5 hover:bg-white/10 text-gray-300"
            title="Zerar campos e reiniciar tempo"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Zerar
          </Button>
          <Link href={`/dashboard/history/${id}`}>
            <Button variant="secondary" size="sm" className="font-semibold">
              <History className="w-4 h-4 mr-1.5" />
              Histórico
            </Button>
          </Link>
        </div>
      </div>

      {/* Painel em Destaque do Cronômetro de Tempo Total do Treino */}
      <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-primary/15 border border-primary/40 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/25 text-primary">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-300">
              Tempo Total de Treino
            </p>
            <p className="text-xs text-gray-400">
              Contando desde o início • Para ao finalizar
            </p>
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-white bg-background/60 px-3.5 py-1.5 rounded-xl border border-white/10">
          {formatTotalDuration(workoutElapsedSeconds)}
        </div>
      </div>

      {/* Pílula flutuante no topo quando o cronômetro de descanso está rodando minimizado */}
      {typeof document !== "undefined" &&
        restTimeLeft !== null &&
        !isTimerModalOpen &&
        createPortal(
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9997] w-[92%] max-w-sm">
            <div
              onClick={() => setIsTimerModalOpen(true)}
              className={`cursor-pointer px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center justify-between transition-all ${
                restTimeLeft === 0
                  ? "bg-emerald-600/95 border-emerald-300 text-white animate-bounce"
                  : "bg-zinc-900/95 border-emerald-500/50 text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-400">
                  <Timer className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs text-gray-300 font-medium truncate max-w-[160px]">
                    {activeTimerLabel || "Descanso"}
                  </p>
                  <p className="text-lg font-extrabold tracking-wider text-emerald-400">
                    {restTimeLeft === 0 ? "Finalizado! 💪" : formatTimer(restTimeLeft)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-200 hover:text-white hover:bg-white/10"
                  onClick={e => {
                    e.stopPropagation()
                    setIsTimerModalOpen(true)
                  }}
                  title="Expandir cronômetro"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-200 hover:text-white hover:bg-white/10"
                  onClick={e => {
                    e.stopPropagation()
                    closeRestTimer()
                  }}
                  title="Fechar cronômetro"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* CRONÔMETRO SOBREPOSTO (MODAL EM FRENTE À TELA - SEM PRECISAR ROLAR) */}
      {typeof document !== "undefined" &&
        restTimeLeft !== null &&
        isTimerModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-emerald-500/40 shadow-2xl shadow-emerald-500/20 p-6 text-center space-y-5 relative overflow-hidden">
              {/* Barra superior de progresso */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/10">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 animate-pulse" />
                  Cronômetro de Descanso
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-white rounded-full"
                    onClick={() => setIsTimerModalOpen(false)}
                    title="Minimizar para continuar vendo a ficha"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-white rounded-full"
                    onClick={closeRestTimer}
                    title="Fechar cronômetro"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {activeTimerLabel && (
                <p className="text-sm text-gray-300 font-medium truncate px-2">{activeTimerLabel}</p>
              )}

              {/* Display Gigante do Tempo */}
              <div className="py-4">
                {restTimeLeft > 0 ? (
                  <div className="text-6xl font-black tracking-tight text-white font-mono">
                    {formatTimer(restTimeLeft)}
                  </div>
                ) : (
                  <div className="space-y-1 py-2">
                    <p className="text-3xl font-extrabold text-emerald-400 animate-bounce">
                      00:00 • Bora! 💪
                    </p>
                    <p className="text-xs text-gray-300">Seu tempo de descanso terminou!</p>
                  </div>
                )}
              </div>

              {/* Botões rápidos de ajuste (-15s / +15s / +30s) */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-white/15 bg-white/5 hover:bg-white/10 text-white"
                  onClick={() => adjustRestTime(-15)}
                >
                  <Minus className="w-3.5 h-3.5 mr-1" />
                  15s
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-white/15 bg-white/5 hover:bg-white/10 text-white"
                  onClick={() => adjustRestTime(15)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  15s
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-white/15 bg-white/5 hover:bg-white/10 text-white"
                  onClick={() => adjustRestTime(30)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  30s
                </Button>
              </div>

              {/* Tempos pré-definidos */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[45, 60, 90, 120].map(sec => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => startRest(sec)}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      restTotalTime === sec
                        ? "bg-emerald-500/25 border-emerald-400 text-emerald-300"
                        : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>

              {/* Ações principais do Modal */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 font-semibold"
                  onClick={() => setIsTimerModalOpen(false)}
                >
                  Minimizar
                </Button>
                <Button
                  type="button"
                  className="flex-1 font-bold bg-emerald-500 hover:bg-emerald-600 text-white"
                  onClick={closeRestTimer}
                >
                  {restTimeLeft === 0 ? "Próxima Série" : "Pular Descanso"}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <div className="space-y-6">
        {items.map((item: any) => {
          const prevSets = lastSessionLogs[item.exercise_id] || []

          return (
            <div key={item.id} className="relative">
              {item.is_superset && (
                <div className="absolute -top-6 left-8 h-6 w-1 bg-primary z-10"></div>
              )}
              <Card
                className={`bg-card/25 backdrop-blur-xl ${
                  item.is_superset ? "border-primary/50 shadow-primary/20" : "border-white/10"
                } shadow-2xl relative z-10 overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                {item.is_superset && (
                  <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full shadow-lg shadow-primary/30">
                    BI-SET
                  </div>
                )}
                <CardHeader
                  className={`pb-3 flex flex-row items-start justify-between relative z-10 ${
                    item.is_superset ? "pt-6" : ""
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-xl text-white">{item.exercises.name}</CardTitle>
                      <ExerciseVideoButton
                        exerciseName={item.exercises.name}
                        targetMuscle={item.exercises.target_muscle}
                      />
                    </div>
                    <CardDescription className="text-gray-300 mt-0.5">
                      Músculo: {item.exercises.target_muscle} • Alvo: {item.default_reps} reps
                    </CardDescription>

                    {/* Resumo do último treino para acompanhar evolução em tempo real */}
                    {prevSets.length > 0 && (
                      <div className="mt-2 inline-flex flex-wrap items-center gap-1.5 text-xs bg-white/10 border border-white/15 text-gray-200 px-2.5 py-1 rounded-md">
                        <span className="font-semibold text-primary">
                          Último ({lastSessionDate}):
                        </span>
                        {prevSets.map((ps, i) => (
                          <span key={i} className="font-medium">
                            {ps.set_number}ª: {ps.reps}x{" "}
                            <strong className="text-emerald-400">{ps.weight}kg</strong>
                            {i < prevSets.length - 1 ? " • " : ""}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-primary border-primary/50 hover:bg-primary/10 shrink-0"
                    onClick={() => getAiTip(item)}
                    disabled={loadingAi[item.exercise_id]}
                  >
                    {loadingAi[item.exercise_id] ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <BrainCircuit className="w-4 h-4 mr-2" />
                    )}
                    Análise IA
                  </Button>
                </CardHeader>
                <CardContent className="relative z-10">
                  {aiTips[item.exercise_id] && (
                    <div className="mb-4 p-4 rounded-xl bg-zinc-900/90 border border-primary/35 shadow-lg space-y-2.5">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                          <BrainCircuit className="w-4 h-4 shrink-0" />
                          <span>Análise Técnica & Biomecânica (Coach IA)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setAiTips(prev => {
                              const copy = { ...prev }
                              delete copy[item.exercise_id]
                              return copy
                            })
                          }
                          className="text-gray-400 hover:text-white p-0.5 rounded"
                          title="Fechar análise"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-2 text-xs sm:text-sm text-gray-200 leading-relaxed">
                        {aiTips[item.exercise_id]
                          .split("\n\n")
                          .filter(Boolean)
                          .map((paragraph, pIdx) => (
                            <p
                              key={pIdx}
                              className="p-2.5 rounded-lg bg-white/5 border border-white/5"
                            >
                              {paragraph}
                            </p>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {logs[item.exercise_id]?.map((log, idx) => {
                      const prevSet = prevSets.find(p => p.set_number === log.set_number)
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-14 text-sm font-medium text-gray-300">
                            Série {log.set_number}
                          </div>
                          <div className="flex-1">
                            <Label className="sr-only">Repetições</Label>
                            <Input
                              type="number"
                              inputMode="numeric"
                              placeholder={prevSet ? `Reps (ant: ${prevSet.reps})` : "Reps"}
                              value={log.reps}
                              onChange={e => updateLog(item.exercise_id, idx, "reps", e.target.value)}
                              className="h-10"
                            />
                          </div>
                          <div className="flex-1">
                            <Label className="sr-only">Peso (kg)</Label>
                            <Input
                              type="number"
                              inputMode="decimal"
                              placeholder={prevSet ? `Kg (ant: ${prevSet.weight}kg)` : "Kg"}
                              value={log.weight}
                              onChange={e => updateLog(item.exercise_id, idx, "weight", e.target.value)}
                              className="h-10"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/20 shrink-0"
                            onClick={() => startRest(60, item.exercises.name, log.set_number)}
                            title="Abrir Cronômetro de Descanso"
                          >
                            <Timer className="w-4 h-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>

      {/* Barra fixa inferior com o cronômetro total em tempo real + botão Finalizar Treino */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-md border-t border-border z-40 flex flex-col items-center gap-2.5">
        <div className="w-full max-w-2xl flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs sm:text-sm">
          <span className="flex items-center gap-1.5 text-gray-300 font-medium">
            <Clock className="w-4 h-4 text-primary animate-pulse" />
            Tempo de treino em andamento:
          </span>
          <span className="font-mono font-extrabold text-white text-sm sm:text-base">
            {formatTotalDuration(workoutElapsedSeconds)}
          </span>
        </div>
        <Button
          size="lg"
          className="w-full max-w-2xl font-bold h-12 sm:h-14 text-base sm:text-lg shadow-xl shadow-primary/20"
          onClick={finishWorkout}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
          ) : (
            <CheckCircle2 className="w-6 h-6 mr-2" />
          )}
          Finalizar Treino ({formatTotalDuration(workoutElapsedSeconds)})
        </Button>
      </div>
    </div>
  )
}
