"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import {
  PlusCircle,
  PlayCircle,
  Loader2,
  Trash2,
  Edit,
  Eye,
  History,
  Scale,
  Sparkles,
  CalendarClock,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  X
} from "lucide-react"

type Workout = {
  id: string
  name: string
  created_at: string
  days_of_week: string[]
  workout_history?: [{ count: number }]
  workout_sessions?: [{ count: number }]
}

type CycleMetadata = {
  started_at: string
  expires_at: string
  duration_days: number
  cycle_number: number
  current_level: string
  level_label: string
  gender: string
  goals: string[]
  goal_title?: string
  evolution_summary?: string
}

type PreviousWorkoutSummary = {
  id: string
  name: string
  days_of_week: string[]
  checkins: number
  exercises: {
    exercise_id: string
    name: string
    target_muscle: string
    default_sets: number
    default_reps: string
    max_weight: number
    total_sets_logged: number
  }[]
}

const CYCLE_VALIDITY_DAYS = 30

export default function DashboardPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)

  // Estados de validade de 30 dias e evolução por IA
  const [cycleMeta, setCycleMeta] = useState<CycleMetadata | null>(null)
  const [daysElapsed, setDaysElapsed] = useState<number>(0)
  const [daysRemaining, setDaysRemaining] = useState<number>(CYCLE_VALIDITY_DAYS)
  const [cycleStartDateStr, setCycleStartDateStr] = useState<string>("")
  const [cycleEndDateStr, setCycleEndDateStr] = useState<string>("")
  const [isExpiredModalOpen, setIsExpiredModalOpen] = useState<boolean>(false)
  const [showEvolutionConfig, setShowEvolutionConfig] = useState<boolean>(false)
  const [renewingSamePlan, setRenewingSamePlan] = useState<boolean>(false)
  const [generatingEvolution, setGeneratingEvolution] = useState<boolean>(false)
  const [previousSummary, setPreviousSummary] = useState<PreviousWorkoutSummary[]>([])
  const [evolutionBannerMsg, setEvolutionBannerMsg] = useState<string | null>(null)

  // Configurações para a evolução da nova ficha
  const [evoGender, setEvoGender] = useState<string>("feminino")
  const [evoLevel, setEvoLevel] = useState<string>("iniciante")
  const [evoGoals, setEvoGoals] = useState<string[]>(["hipertrofia"])
  const [evoDays, setEvoDays] = useState<string>("3")
  const [evoTime, setEvoTime] = useState<string>("45")
  const [evoNotes, setEvoNotes] = useState<string>("")
  const [evoLikedExercises, setEvoLikedExercises] = useState<string>("")
  const [evoDislikedExercises, setEvoDislikedExercises] = useState<string>("")

  const getNextLevelLabel = (lvl: string) => {
    const n = (lvl || "iniciante").toLowerCase()
    if (n === "iniciante") return "Iniciante → Intermediário"
    if (n === "intermediario") return "Intermediário → Avançado"
    return "Avançado → Avançado Pro (Periodização de Choque)"
  }

  const getCurrentLevelHuman = (lvl: string) => {
    const n = (lvl || "iniciante").toLowerCase()
    if (n.includes("pro")) return "Avançado Pro"
    if (n.includes("avanc")) return "Avançado"
    if (n.includes("inter")) return "Intermediário"
    return "Iniciante"
  }

  const loadWorkoutsAndCycle = async () => {
    setLoading(true)
    const {
      data: { user }
    } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from("workouts")
      .select("*, workout_history(count), workout_sessions(count)")
      .order("created_at", { ascending: true })

    if (error) console.error(error)
    const loadedWorkouts = (data as unknown as Workout[]) || []
    setWorkouts(loadedWorkouts)

    if (user && loadedWorkouts.length > 0) {
      const meta = user.user_metadata || {}
      const savedCycle: CycleMetadata | undefined = meta.workout_plan_cycle
      const savedOnboarding = meta.onboarding_profile || {}

      // Determina o início do ciclo (do metadata ou da criação da ficha mais antiga/atual)
      const earliestWorkoutDate = loadedWorkouts[0]?.created_at || new Date().toISOString()
      const startIso = savedCycle?.started_at || earliestWorkoutDate
      const startDate = new Date(startIso)
      const endDate = new Date(startDate.getTime() + CYCLE_VALIDITY_DAYS * 24 * 60 * 60 * 1000)

      const diffMs = Date.now() - startDate.getTime()
      const elapsed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
      const remaining = Math.max(0, CYCLE_VALIDITY_DAYS - elapsed)

      setDaysElapsed(elapsed)
      setDaysRemaining(remaining)
      setCycleStartDateStr(startDate.toLocaleDateString("pt-BR"))
      setCycleEndDateStr(endDate.toLocaleDateString("pt-BR"))

      const resolvedGender = savedCycle?.gender || savedOnboarding.genero || "feminino"
      const resolvedLevel = savedCycle?.current_level || savedOnboarding.experiencia || "iniciante"
      const resolvedGoals =
        Array.isArray(savedCycle?.goals) && savedCycle!.goals.length > 0
          ? savedCycle!.goals
          : Array.isArray(savedOnboarding.objetivos) && savedOnboarding.objetivos.length > 0
          ? savedOnboarding.objetivos
          : ["hipertrofia"]
      const resolvedDays = String(savedOnboarding.diasPorSemana || loadedWorkouts.length || 3)
      const resolvedTime = String(savedOnboarding.tempoPorTreino || "45")

      setEvoGender(resolvedGender)
      setEvoLevel(resolvedLevel)
      setEvoGoals(resolvedGoals)
      setEvoDays(resolvedDays)
      setEvoTime(resolvedTime)
      setEvoNotes(savedOnboarding.observacoes || "")
      setEvoLikedExercises(
        Array.isArray(savedOnboarding.exerciciosQueGosta)
          ? savedOnboarding.exerciciosQueGosta.join(", ")
          : savedOnboarding.exerciciosQueGosta || ""
      )
      setEvoDislikedExercises(
        Array.isArray(savedOnboarding.exerciciosQueNaoGosta)
          ? savedOnboarding.exerciciosQueNaoGosta.join(", ")
          : savedOnboarding.exerciciosQueNaoGosta || ""
      )

      setCycleMeta(
        savedCycle || {
          started_at: startIso,
          expires_at: endDate.toISOString(),
          duration_days: CYCLE_VALIDITY_DAYS,
          cycle_number: 1,
          current_level: resolvedLevel,
          level_label: getCurrentLevelHuman(resolvedLevel),
          gender: resolvedGender,
          goals: resolvedGoals
        }
      )

      // Carrega o histórico detalhado das fichas atuais para alimentar a evolução de 30 dias
      loadPreviousWorkoutsHistory(loadedWorkouts)

      // Se completou 30 dias ou mais, abre automaticamente a pergunta ao usuário
      if (elapsed >= CYCLE_VALIDITY_DAYS) {
        setIsExpiredModalOpen(true)
      }
    }

    setLoading(false)
  }

  const loadPreviousWorkoutsHistory = async (currentWorkouts: Workout[]) => {
    try {
      const wIds = currentWorkouts.map(w => w.id)
      if (wIds.length === 0) return

      const [{ data: wExercises }, { data: wSessions }] = await Promise.all([
        supabase
          .from("workout_exercises")
          .select("workout_id, exercise_id, default_sets, default_reps, exercises(name, target_muscle)")
          .in("workout_id", wIds)
          .order("order_index", { ascending: true }),
        supabase
          .from("workout_sessions")
          .select("id, workout_id, exercise_logs(exercise_id, reps, weight)")
          .in("workout_id", wIds)
      ])

      const maxWeightByEx = new Map<string, { maxWeight: number; totalSets: number }>()
      if (wSessions) {
        for (const s of wSessions as any[]) {
          for (const log of s.exercise_logs || []) {
            const prev = maxWeightByEx.get(log.exercise_id) || { maxWeight: 0, totalSets: 0 }
            const w = Number(log.weight) || 0
            maxWeightByEx.set(log.exercise_id, {
              maxWeight: Math.max(prev.maxWeight, w),
              totalSets: prev.totalSets + 1
            })
          }
        }
      }

      const summaries: PreviousWorkoutSummary[] = currentWorkouts.map(w => {
        const historyCount = w.workout_history?.[0]?.count || 0
        const sessionsCount = w.workout_sessions?.[0]?.count || 0
        const checkins = Math.max(historyCount, sessionsCount)

        const exList = ((wExercises as any[]) || [])
          .filter(we => we.workout_id === w.id)
          .map(we => {
            const stats = maxWeightByEx.get(we.exercise_id) || { maxWeight: 0, totalSets: 0 }
            return {
              exercise_id: we.exercise_id,
              name: we.exercises?.name || "Exercício",
              target_muscle: we.exercises?.target_muscle || "Geral",
              default_sets: we.default_sets,
              default_reps: we.default_reps,
              max_weight: stats.maxWeight,
              total_sets_logged: stats.totalSets
            }
          })

        return {
          id: w.id,
          name: w.name,
          days_of_week: w.days_of_week || [],
          checkins,
          exercises: exList
        }
      })

      setPreviousSummary(summaries)
    } catch (e) {
      console.warn("Erro ao carregar resumo do histórico:", e)
    }
  }

  useEffect(() => {
    loadWorkoutsAndCycle()
  }, [])

  // Opção 1: Permanecer com a mesma ficha por mais 30 dias
  const handleKeepSameWorkoutPlan = async () => {
    setRenewingSamePlan(true)
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user) return

      const nowIso = new Date().toISOString()
      const expiresIso = new Date(Date.now() + CYCLE_VALIDITY_DAYS * 24 * 60 * 60 * 1000).toISOString()
      const currentCycle = user.user_metadata?.workout_plan_cycle || {}

      const updatedCycle: CycleMetadata = {
        started_at: nowIso,
        expires_at: expiresIso,
        duration_days: CYCLE_VALIDITY_DAYS,
        cycle_number: Number(currentCycle.cycle_number || 1),
        current_level: currentCycle.current_level || evoLevel || "iniciante",
        level_label: currentCycle.level_label || getCurrentLevelHuman(evoLevel),
        gender: currentCycle.gender || evoGender,
        goals: currentCycle.goals || evoGoals,
        goal_title: currentCycle.goal_title || "Manutenção de Ciclo",
        evolution_summary:
          "Ciclo renovado por mais 30 dias mantendo a estrutura atual para consolidação de cargas e execução técnica."
      }

      await supabase.auth.updateUser({
        data: {
          workout_plan_cycle: updatedCycle
        }
      })

      setCycleMeta(updatedCycle)
      setDaysElapsed(0)
      setDaysRemaining(CYCLE_VALIDITY_DAYS)
      setCycleStartDateStr(new Date(nowIso).toLocaleDateString("pt-BR"))
      setCycleEndDateStr(new Date(expiresIso).toLocaleDateString("pt-BR"))
      setIsExpiredModalOpen(false)
      setShowEvolutionConfig(false)
      setEvolutionBannerMsg("✅ Validade renovada! Você permaneceu com a sua ficha atual por mais 30 dias.")
    } catch (e) {
      console.error(e)
      alert("Erro ao renovar a validade da ficha.")
    } finally {
      setRenewingSamePlan(false)
    }
  }

  // Opção 2: Iniciar uma nova ficha evoluída com a IA usando todo o histórico anterior
  const handleEvolveWorkoutPlanWithAI = async () => {
    if (evoGoals.length === 0) {
      alert("Selecione pelo menos um objetivo para a nova ficha.")
      return
    }

    setGeneratingEvolution(true)
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      if (!session) return

      const meta = session.user.user_metadata || {}
      const savedProfile = meta.onboarding_profile || {}
      const nextCycleNumber = (Number(cycleMeta?.cycle_number) || 1) + 1

      const likedArr = evoLikedExercises
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
      const dislikedArr = evoDislikedExercises
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)

      const payload = {
        ...savedProfile,
        genero: evoGender,
        objetivos: evoGoals,
        experiencia: evoLevel,
        diasPorSemana: evoDays,
        tempoPorTreino: evoTime,
        observacoes: evoNotes,
        exerciciosQueGosta: likedArr,
        exerciciosQueNaoGosta: dislikedArr,
        isEvolution: true,
        cycleNumber: nextCycleNumber,
        previousWorkouts: previousSummary
      }

      const res = await fetch("/api/generate-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const planResponse = await res.json()
      if (planResponse.error) {
        alert("Erro ao gerar evolução da ficha: " + planResponse.error)
        setGeneratingEvolution(false)
        return
      }

      const newWorkoutsArray = Array.isArray(planResponse)
        ? planResponse
        : Array.isArray(planResponse.workouts)
        ? planResponse.workouts
        : [planResponse]

      const metaInfo = planResponse.meta || {}

      // Atualiza as fichas existentes in-place (para preservar as sessões de histórico vinculadas)
      const minLen = Math.min(workouts.length, newWorkoutsArray.length)
      for (let i = 0; i < minLen; i++) {
        const w = newWorkoutsArray[i]
        const targetId = workouts[i].id

        await supabase
          .from("workouts")
          .update({
            name: w.workout_name || "Treino Evoluído IA",
            days_of_week: w.days_of_week && w.days_of_week.length > 0 ? `{${w.days_of_week.join(",")}}` : null
          })
          .eq("id", targetId)

        await supabase.from("workout_exercises").delete().eq("workout_id", targetId)

        if (Array.isArray(w.exercises) && w.exercises.length > 0) {
          const exercisesToInsert = w.exercises.map((ex: any, idx: number) => ({
            workout_id: targetId,
            exercise_id: ex.exercise_id,
            default_sets: ex.default_sets || 3,
            default_reps: ex.default_reps || "10-12",
            order_index: idx,
            is_superset: Boolean(ex.is_superset)
          }))
          await supabase.from("workout_exercises").insert(exercisesToInsert)
        }
      }

      // Insere novas fichas se o novo ciclo tiver mais divisões
      for (let i = minLen; i < newWorkoutsArray.length; i++) {
        const w = newWorkoutsArray[i]
        const { data: createdWorkout } = await supabase
          .from("workouts")
          .insert([
            {
              name: w.workout_name || "Treino Evoluído IA",
              days_of_week: w.days_of_week && w.days_of_week.length > 0 ? `{${w.days_of_week.join(",")}}` : null,
              user_id: session.user.id
            }
          ])
          .select()
          .single()

        if (createdWorkout && Array.isArray(w.exercises)) {
          const exercisesToInsert = w.exercises.map((ex: any, idx: number) => ({
            workout_id: createdWorkout.id,
            exercise_id: ex.exercise_id,
            default_sets: ex.default_sets || 3,
            default_reps: ex.default_reps || "10-12",
            order_index: idx,
            is_superset: Boolean(ex.is_superset)
          }))
          await supabase.from("workout_exercises").insert(exercisesToInsert)
        }
      }

      // Remove fichas excedentes se o usuário diminuiu os dias
      for (let i = newWorkoutsArray.length; i < workouts.length; i++) {
        const extraId = workouts[i].id
        await supabase.from("workout_exercises").delete().eq("workout_id", extraId)
        const { data: oldSessions } = await supabase.from("workout_sessions").select("id").eq("workout_id", extraId)
        if (oldSessions && oldSessions.length > 0) {
          const sIds = oldSessions.map(s => s.id)
          await supabase.from("exercise_logs").delete().in("session_id", sIds)
          await supabase.from("workout_sessions").delete().eq("workout_id", extraId)
        }
        await supabase.from("workouts").delete().eq("id", extraId)
      }

      const nowIso = new Date().toISOString()
      const expiresIso = new Date(Date.now() + CYCLE_VALIDITY_DAYS * 24 * 60 * 60 * 1000).toISOString()
      const newLevel = metaInfo.target_level || "intermediario"

      const newCycleMeta: CycleMetadata = {
        started_at: nowIso,
        expires_at: expiresIso,
        duration_days: CYCLE_VALIDITY_DAYS,
        cycle_number: nextCycleNumber,
        current_level: newLevel,
        level_label: metaInfo.level_label || getCurrentLevelHuman(newLevel),
        gender: evoGender,
        goals: evoGoals,
        goal_title: metaInfo.goal_title || "Evolução de Periodização",
        evolution_summary:
          metaInfo.evolution_summary ||
          "Nova ficha evoluída pela IA com base no seu histórico de cargas e progressão de nível."
      }

      await supabase.auth.updateUser({
        data: {
          onboarding_profile: {
            ...savedProfile,
            genero: evoGender,
            objetivos: evoGoals,
            experiencia: newLevel,
            diasPorSemana: evoDays,
            tempoPorTreino: evoTime,
            observacoes: evoNotes,
            exerciciosQueGosta: likedArr,
            exerciciosQueNaoGosta: dislikedArr
          },
          workout_plan_cycle: newCycleMeta
        }
      })

      setIsExpiredModalOpen(false)
      setShowEvolutionConfig(false)
      setEvolutionBannerMsg(
        `🚀 Nova Ficha Evoluída (Ciclo ${nextCycleNumber} • ${newCycleMeta.level_label}) criada com sucesso a partir do seu histórico!`
      )
      await loadWorkoutsAndCycle()
    } catch (e) {
      console.error(e)
      alert("Erro ao evoluir ficha com a IA.")
    } finally {
      setGeneratingEvolution(false)
    }
  }

  const deleteWorkout = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o treino "${name}"?`)) return

    await supabase.from("workout_exercises").delete().eq("workout_id", id)
    const { data: oldSessions } = await supabase.from("workout_sessions").select("id").eq("workout_id", id)
    if (oldSessions && oldSessions.length > 0) {
      const sIds = oldSessions.map(s => s.id)
      await supabase.from("exercise_logs").delete().in("session_id", sIds)
      await supabase.from("workout_sessions").delete().eq("workout_id", id)
    }
    const { error } = await supabase.from("workouts").delete().eq("id", id)
    if (error) {
      alert("Erro ao excluir treino: " + error.message)
    } else {
      loadWorkoutsAndCycle()
    }
  }

  const totalCheckinsAllWorkouts = previousSummary.reduce((acc, w) => acc + (w.checkins || 0), 0)
  const recordedWeightsList = previousSummary
    .flatMap(w => w.exercises)
    .filter(e => e.max_weight > 0)
    .slice(0, 6)

  const progressPercentage = Math.min(100, Math.round((daysElapsed / CYCLE_VALIDITY_DAYS) * 100))
  const isCycleExpired = daysElapsed >= CYCLE_VALIDITY_DAYS

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Minhas Fichas</h1>
          <p className="text-gray-300 mt-1 font-medium">Escolha um treino para iniciar hoje.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/dashboard/profile">
            <Button variant="secondary" className="font-bold">
              <Scale className="w-4 h-4 mr-2 text-primary" />
              Peso e Medidas
            </Button>
          </Link>
          <Link href="/dashboard/create-workout">
            <Button className="font-bold shadow-lg shadow-primary/20">
              <PlusCircle className="w-5 h-5 mr-2" />
              Nova Ficha Manual
            </Button>
          </Link>
        </div>
      </div>

      {evolutionBannerMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-md flex items-center justify-between gap-3 text-emerald-100 shadow-lg">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <p className="text-sm font-semibold text-white">{evolutionBannerMsg}</p>
          </div>
          <button
            onClick={() => setEvolutionBannerMsg(null)}
            className="text-gray-300 hover:text-white p-1"
            title="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PAINEL DE VALIDADE DE 30 DIAS & PERIODIZAÇÃO IA */}
      {!loading && workouts.length > 0 && (
        <Card
          className={`backdrop-blur-xl shadow-2xl overflow-hidden border ${
            isCycleExpired
              ? "bg-amber-500/15 border-amber-500/50 shadow-amber-500/10"
              : "bg-card/30 border-primary/30"
          }`}
        >
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                    <CalendarClock className="w-3.5 h-3.5" />
                    Ciclo {cycleMeta?.cycle_number || 1} • Nível {getCurrentLevelHuman(cycleMeta?.current_level || evoLevel)}
                  </span>
                  {isCycleExpired ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500 text-black">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Validade de 30 dias concluída!
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ⏳ Restam {daysRemaining} dia{daysRemaining !== 1 ? "s" : ""} de validade
                    </span>
                  )}
                </div>

                <h2 className="text-base sm:text-lg font-bold text-white pt-1">
                  {isCycleExpired
                    ? "Sua ficha completou 30 dias! Deseja manter a mesma ficha ou evoluir para uma nova ficha com a IA?"
                    : `Validade da Ficha Atual: ${cycleStartDateStr} até ${cycleEndDateStr} (Dia ${daysElapsed} de ${CYCLE_VALIDITY_DAYS})`}
                </h2>

                {cycleMeta?.evolution_summary && (
                  <p className="text-xs text-gray-300 leading-relaxed max-w-3xl">
                    {cycleMeta.evolution_summary}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {isCycleExpired && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleKeepSameWorkoutPlan}
                    disabled={renewingSamePlan}
                    className="font-semibold"
                  >
                    {renewingSamePlan ? (
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-1.5" />
                    )}
                    Manter Mesma Ficha (+30d)
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => {
                    setIsExpiredModalOpen(true)
                    setShowEvolutionConfig(false)
                  }}
                  className="font-bold bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20"
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  {isCycleExpired ? "Decidir / Evoluir Ficha (30 Dias)" : "Evoluir Ficha com IA (Histórico)"}
                </Button>
              </div>
            </div>

            {/* Barra de progresso dos 30 dias */}
            <div className="space-y-1">
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCycleExpired ? "bg-amber-400" : "bg-primary"
                  }`}
                  style={{ width: `${Math.max(4, progressPercentage)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-gray-400">
                <span>Início: {cycleStartDateStr}</span>
                <span>{totalCheckinsAllWorkouts} treino(s) realizados neste ciclo</span>
                <span>Revisão de 30 dias: {cycleEndDateStr}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              <CardDescription className="mt-2 text-gray-300">
                Você ainda não tem treinos cadastrados. Crie um com a IA personalizada!
              </CardDescription>
            </div>
            <div className="flex gap-3 pt-2">
              <Link href="/onboarding">
                <Button className="font-bold">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Montar Ficha Profissional com IA
                </Button>
              </Link>
              <Link href="/dashboard/create-workout">
                <Button variant="outline">Criar Manualmente</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workouts.map(workout => {
            const historyCount = workout.workout_history?.[0]?.count || 0
            const sessionsCount = workout.workout_sessions?.[0]?.count || 0
            const checkins = Math.max(historyCount, sessionsCount)
            return (
              <Card
                key={workout.id}
                className="bg-card/20 backdrop-blur-xl border-white/10 hover:border-primary/50 shadow-2xl hover:shadow-primary/20 transition-all duration-300 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex gap-1 z-30 bg-background/50 md:bg-transparent rounded-lg backdrop-blur-sm md:backdrop-blur-none p-1">
                  <Link href={`/dashboard/edit-workout/${workout.id}`}>
                    <Button variant="ghost" size="icon" className="text-gray-200 hover:text-primary hover:bg-primary/20">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-200 hover:text-destructive hover:bg-destructive/20"
                    onClick={() => deleteWorkout(workout.id, workout.name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <CardHeader className="pb-3 pr-20 relative z-10">
                  <CardTitle className="text-xl truncate text-white group-hover:text-primary transition-colors">
                    {workout.name}
                  </CardTitle>
                  <CardDescription className="text-gray-300 font-medium space-y-2">
                    <span className="block">
                      {workout.days_of_week && workout.days_of_week.length > 0
                        ? `Dias: ${workout.days_of_week.join(", ")}`
                        : `Criado em ${new Date(workout.created_at).toLocaleDateString("pt-BR")}`}
                    </span>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <Link href={`/dashboard/history/${workout.id}`} className="w-fit">
                        <span className="inline-flex items-center gap-1 font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 px-2.5 py-1 rounded-md text-xs shadow-sm transition-colors">
                          ✅ Feito {checkins} vez{checkins !== 1 ? "es" : ""} • Ver evolução
                        </span>
                      </Link>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md border ${
                          isCycleExpired
                            ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                            : "bg-white/5 border-white/10 text-gray-300"
                        }`}
                      >
                        <CalendarClock className="w-3 h-3" />
                        {isCycleExpired ? "Ciclo 30d vencido" : `Validade: ${daysRemaining}d`}
                      </span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/dashboard/view-workout/${workout.id}`}>
                      <Button
                        variant="secondary"
                        className="w-full font-medium transition-all duration-300 text-foreground hover:text-primary px-2 text-xs sm:text-sm"
                      >
                        <Eye className="w-4 h-4 mr-1.5 shrink-0" />
                        Exercícios
                      </Button>
                    </Link>
                    <Link href={`/dashboard/history/${workout.id}`}>
                      <Button
                        variant="outline"
                        className="w-full font-medium border-white/15 bg-white/5 hover:bg-white/10 text-white px-2 text-xs sm:text-sm"
                      >
                        <History className="w-4 h-4 mr-1.5 shrink-0 text-primary" />
                        Histórico
                      </Button>
                    </Link>
                  </div>
                  <Link href={`/dashboard/workout/${workout.id}`}>
                    <Button className="w-full font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 group-hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/25">
                      <PlayCircle className="w-5 h-5 mr-2" />
                      Iniciar Treino
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* MODAL DE VALIDADE DE 30 DIAS: PERMANECER NA MESMA FICHA OU INICIAR NOVA FICHA EVOLUÍDA COM HISTÓRICO */}
      {isExpiredModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-xl w-full bg-zinc-950 border-primary/40 shadow-2xl my-8 overflow-hidden">
            <CardHeader className="border-b border-white/10 bg-primary/10 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">
                      {isCycleExpired
                        ? "Ciclo de 30 Dias Concluído! 📅"
                        : "Evolução de Ciclo & Renovação de Ficha IA"}
                    </CardTitle>
                    <CardDescription className="text-gray-300 mt-0.5">
                      {isCycleExpired
                        ? "Sua ficha completou 30 dias. Você deseja permanecer com a mesma ficha ou iniciar uma nova ficha evoluída com base no seu histórico?"
                        : "Escolha se deseja renovar sua ficha atual por mais 30 dias ou pedir para a IA montar a próxima fase da sua evolução."}
                    </CardDescription>
                  </div>
                </div>
                <button
                  onClick={() => setIsExpiredModalOpen(false)}
                  className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Resumo do Histórico da Ficha Anterior que a IA vai usar */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    Histórico Analisado da Ficha Atual
                  </span>
                  <span className="text-xs font-semibold text-emerald-400">
                    {totalCheckinsAllWorkouts} treino(s) concluídos
                  </span>
                </div>
                <p className="text-xs text-gray-300">
                  Progressão automática de Nível:{" "}
                  <strong className="text-white">{getNextLevelLabel(evoLevel)}</strong>
                </p>
                {recordedWeightsList.length > 0 ? (
                  <div className="pt-1">
                    <p className="text-[11px] text-gray-400 mb-1.5">
                      Maiores cargas registradas que servirão de base para a evolução:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {recordedWeightsList.map((rw, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] bg-black/50 border border-white/10 px-2 py-0.5 rounded-md text-gray-200"
                        >
                          {rw.name}: <strong className="text-emerald-400">{rw.max_weight}kg</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400">
                    A IA analisará todos os exercícios da sua ficha atual ({workouts.length} divisões) para avançar os estímulos biomecânicos.
                  </p>
                )}
              </div>

              {!showEvolutionConfig ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleKeepSameWorkoutPlan}
                    disabled={renewingSamePlan}
                    className="p-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-left transition-all flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-bold text-white text-base">
                        <RefreshCw className="w-4 h-4 text-emerald-400" />
                        <span>Permanecer com a Mesma Ficha</span>
                      </div>
                      <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                        Mantém todos os seus treinos e exercícios atuais inalterados e renova a validade por mais{" "}
                        <strong>30 dias</strong>.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 inline-flex items-center gap-1">
                      {renewingSamePlan ? "Renovando..." : "Renovar por +30 dias →"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowEvolutionConfig(true)}
                    className="p-4 rounded-xl border border-primary bg-primary/15 hover:bg-primary/25 text-left transition-all flex flex-col justify-between gap-3 shadow-lg shadow-primary/15"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-bold text-white text-base">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span>Iniciar Nova Ficha Evoluída (IA)</span>
                      </div>
                      <p className="text-xs text-gray-200 mt-1.5 leading-relaxed">
                        A IA monta uma nova ficha profissional a partir do seu histórico, evoluindo o seu nível (
                        <strong>{getNextLevelLabel(evoLevel)}</strong>).
                      </p>
                    </div>
                    <span className="text-xs font-bold text-primary inline-flex items-center gap-1">
                      Configurar & Gerar Evolução →
                    </span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 pt-1 border-t border-white/10">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-200">Gênero (Biomecânica)</label>
                      <select
                        className="flex h-9 w-full rounded-md border border-white/15 bg-zinc-900 px-3 py-1 text-sm text-white"
                        value={evoGender}
                        onChange={e => setEvoGender(e.target.value)}
                      >
                        <option value="feminino">Feminino (Foco Glúteos/Inferior & Estética)</option>
                        <option value="masculino">Masculino (Foco Tronco em V, Braços & Pernas)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-200">Transição de Nível</label>
                      <select
                        className="flex h-9 w-full rounded-md border border-white/15 bg-zinc-900 px-3 py-1 text-sm text-white"
                        value={evoLevel}
                        onChange={e => setEvoLevel(e.target.value)}
                      >
                        <option value="iniciante">Era Iniciante → Evoluir p/ Intermediário</option>
                        <option value="intermediario">Era Intermediário → Evoluir p/ Avançado</option>
                        <option value="avancado">Já sou Avançado → Periodização Avançada Pro</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-200">Objetivo desta Nova Fase (30 Dias)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "hipertrofia", label: "Hipertrofia & Modelagem" },
                        { id: "emagrecimento", label: "Emagrecimento & Definição" },
                        { id: "forca", label: "Força & Cargas Altas" },
                        { id: "resistencia", label: "Resistência & Condicionamento" }
                      ].map(g => (
                        <label
                          key={g.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                            evoGoals.includes(g.id)
                              ? "border-primary bg-primary/15 text-white font-semibold"
                              : "border-white/10 bg-white/5 text-gray-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={evoGoals.includes(g.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setEvoGoals([...evoGoals, g.id])
                              } else {
                                setEvoGoals(evoGoals.filter(x => x !== g.id))
                              }
                            }}
                            className="accent-primary"
                          />
                          <span>{g.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-200">Dias por Semana</label>
                      <select
                        className="flex h-9 w-full rounded-md border border-white/15 bg-zinc-900 px-3 py-1 text-sm text-white"
                        value={evoDays}
                        onChange={e => setEvoDays(e.target.value)}
                      >
                        {["2", "3", "4", "5", "6"].map(d => (
                          <option key={d} value={d}>
                            {d} dias por semana
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-200">Tempo por Treino</label>
                      <select
                        className="flex h-9 w-full rounded-md border border-white/15 bg-zinc-900 px-3 py-1 text-sm text-white"
                        value={evoTime}
                        onChange={e => setEvoTime(e.target.value)}
                      >
                        <option value="30">Rápido (30-40 min)</option>
                        <option value="45">Padrão (45-60 min)</option>
                        <option value="90">Completo (+60 min)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-emerald-300">
                        ✅ Exercícios que MAIS GOSTA (Incluir)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Barra Fixa, Elevação Pélvica..."
                        value={evoLikedExercises}
                        onChange={e => setEvoLikedExercises(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-emerald-500/30 bg-zinc-900 px-3 py-1 text-xs text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-rose-300">
                        🚫 Exercícios que NÃO GOSTA (Evitar)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Levantamento Terra, Agachamento Livre..."
                        value={evoDislikedExercises}
                        onChange={e => setEvoDislikedExercises(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-rose-500/30 bg-zinc-900 px-3 py-1 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-200">
                      Quer dar foco especial em algum ponto nesta nova ficha? (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Foco dobrado em glúteo médio e posterior, ou foco em peito superior..."
                      value={evoNotes}
                      onChange={e => setEvoNotes(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-white/15 bg-zinc-900 px-3 py-1 text-sm text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setShowEvolutionConfig(false)}>
                      Voltar
                    </Button>
                    <Button
                      onClick={handleEvolveWorkoutPlanWithAI}
                      disabled={generatingEvolution}
                      className="flex-1 font-bold bg-gradient-to-r from-primary to-primary/80"
                    >
                      {generatingEvolution ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Montando Nova Ficha Evoluída...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Gerar Nova Ficha Evoluída (Validade 30 Dias)
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
