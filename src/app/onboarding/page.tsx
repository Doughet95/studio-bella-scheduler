"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Sparkles, ArrowRight, ArrowLeft, Loader2, Dumbbell, Activity, Calendar, HeartPulse, CheckCircle2, ThumbsUp, ThumbsDown, X, Plus } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { supabase } from "@/lib/supabase"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [replaceExisting, setReplaceExisting] = useState(true)
  const [hasExistingWorkouts, setHasExistingWorkouts] = useState(false)
  const [catalogExercises, setCatalogExercises] = useState<{ id: string; name: string; target_muscle: string }[]>([])
  const [selectedLikeInput, setSelectedLikeInput] = useState("")
  const [selectedDislikeInput, setSelectedDislikeInput] = useState("")

  const [formData, setFormData] = useState({
    idade: "",
    peso: "",
    altura: "",
    genero: "",
    objetivos: ["hipertrofia"] as string[],
    experiencia: "iniciante",
    diasPorSemana: "3",
    tempoPorTreino: "45",
    lesoes: "",
    observacoes: "",
    exerciciosQueGosta: [] as string[],
    exerciciosQueNaoGosta: [] as string[],
    medidas_braco: "",
    medidas_peito: "",
    medidas_cintura: "",
    medidas_coxa: "",
    medidas_quadril: "",
    medidas_bumbum: "",
    dieta_refeicoes: "",
    dieta_doces_frituras: "",
    dieta_agua: ""
  })

  const addLikedExercise = (name: string) => {
    const clean = name.trim()
    if (!clean) return
    setFormData(prev => ({
      ...prev,
      exerciciosQueGosta: prev.exerciciosQueGosta.includes(clean)
        ? prev.exerciciosQueGosta
        : [...prev.exerciciosQueGosta, clean],
      exerciciosQueNaoGosta: prev.exerciciosQueNaoGosta.filter(x => x.toLowerCase() !== clean.toLowerCase())
    }))
    setSelectedLikeInput("")
  }

  const removeLikedExercise = (name: string) => {
    setFormData(prev => ({
      ...prev,
      exerciciosQueGosta: prev.exerciciosQueGosta.filter(x => x !== name)
    }))
  }

  const addDislikedExercise = (name: string) => {
    const clean = name.trim()
    if (!clean) return
    setFormData(prev => ({
      ...prev,
      exerciciosQueNaoGosta: prev.exerciciosQueNaoGosta.includes(clean)
        ? prev.exerciciosQueNaoGosta
        : [...prev.exerciciosQueNaoGosta, clean],
      exerciciosQueGosta: prev.exerciciosQueGosta.filter(x => x.toLowerCase() !== clean.toLowerCase())
    }))
    setSelectedDislikeInput("")
  }

  const removeDislikedExercise = (name: string) => {
    setFormData(prev => ({
      ...prev,
      exerciciosQueNaoGosta: prev.exerciciosQueNaoGosta.filter(x => x !== name)
    }))
  }

  useEffect(() => {
    async function loadExistingProfile() {
      // Carrega catálogo de exercícios para seleção rápida na anamnese
      const { data: exList } = await supabase
        .from("exercises")
        .select("id, name, target_muscle")
        .order("name")
      if (exList) {
        const map = new Map<string, { id: string; name: string; target_muscle: string }>()
        for (const item of exList) {
          const k = item.name.toLowerCase().trim()
          if (!map.has(k)) map.set(k, item)
        }
        setCatalogExercises(Array.from(map.values()))
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const meta = session.user.user_metadata || {}
      const savedProfile = meta.onboarding_profile || {}

      setFormData(prev => ({
        ...prev,
        idade: savedProfile.idade || (meta.age ? String(meta.age) : prev.idade),
        peso: savedProfile.peso || prev.peso,
        altura: savedProfile.altura || (meta.height_cm ? String(meta.height_cm) : prev.altura),
        genero: savedProfile.genero || meta.workout_plan_cycle?.gender || prev.genero,
        objetivos:
          Array.isArray(savedProfile.objetivos) && savedProfile.objetivos.length > 0
            ? savedProfile.objetivos
            : prev.objetivos,
        experiencia: savedProfile.experiencia || meta.workout_plan_cycle?.current_level || prev.experiencia,
        diasPorSemana: savedProfile.diasPorSemana || prev.diasPorSemana,
        tempoPorTreino: savedProfile.tempoPorTreino || prev.tempoPorTreino,
        lesoes: savedProfile.lesoes || prev.lesoes,
        observacoes: savedProfile.observacoes || prev.observacoes,
        exerciciosQueGosta: Array.isArray(savedProfile.exerciciosQueGosta)
          ? savedProfile.exerciciosQueGosta
          : prev.exerciciosQueGosta,
        exerciciosQueNaoGosta: Array.isArray(savedProfile.exerciciosQueNaoGosta)
          ? savedProfile.exerciciosQueNaoGosta
          : prev.exerciciosQueNaoGosta
      }))

      const { count } = await supabase
        .from("workouts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.user.id)

      if (count && count > 0) {
        setHasExistingWorkouts(true)
      }
    }
    loadExistingProfile()
  }, [])

  const handleNext = () => {
    if (step === 1 && !formData.genero) {
      alert("Por favor, selecione o seu Gênero (Masculino ou Feminino) para que a IA monte a biomecânica correta para o seu corpo.")
      return
    }
    if (step === 2 && formData.objetivos.length === 0) {
      alert("Selecione pelo menos um objetivo principal.")
      return
    }
    setStep(s => s + 1)
  }

  const handlePrev = () => setStep(s => s - 1)

  const handleGenerate = async () => {
    if (!formData.genero) {
      alert("Selecione o gênero no Passo 1 antes de gerar a ficha.")
      setStep(1)
      return
    }

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert("Você precisa estar logado para criar treinos.")
        setLoading(false)
        router.push("/")
        return
      }

      // 1. Chamar a IA Especialista em Periodização
      const res = await fetch("/api/generate-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const planResponse = await res.json()

      if (planResponse.error) {
        alert("Erro na IA: " + planResponse.error)
        setLoading(false)
        return
      }

      const workoutsArray = Array.isArray(planResponse)
        ? planResponse
        : Array.isArray(planResponse.workouts)
        ? planResponse.workouts
        : [planResponse]

      const metaInfo = planResponse.meta || null

      // Se o usuário optou por substituir as fichas atuais ao gerar um novo ciclo completo
      if (hasExistingWorkouts && replaceExisting) {
        const { data: oldWorkouts } = await supabase
          .from("workouts")
          .select("id")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: true })

        if (oldWorkouts && oldWorkouts.length > 0) {
          // Atualiza in-place as fichas existentes (preservando vínculo de histórico) e cria/remove a diferença
          const minLen = Math.min(oldWorkouts.length, workoutsArray.length)
          for (let i = 0; i < minLen; i++) {
            const w = workoutsArray[i]
            const targetId = oldWorkouts[i].id
            await supabase
              .from("workouts")
              .update({
                name: w.workout_name || "Treino IA",
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

          // Se o novo plano tem mais fichas que o anterior, insere as novas
          for (let i = minLen; i < workoutsArray.length; i++) {
            const w = workoutsArray[i]
            const { data: workout } = await supabase
              .from("workouts")
              .insert([
                {
                  name: w.workout_name || "Treino IA",
                  days_of_week: w.days_of_week && w.days_of_week.length > 0 ? `{${w.days_of_week.join(",")}}` : null,
                  user_id: session.user.id
                }
              ])
              .select()
              .single()

            if (workout && Array.isArray(w.exercises)) {
              const exercisesToInsert = w.exercises.map((ex: any, idx: number) => ({
                workout_id: workout.id,
                exercise_id: ex.exercise_id,
                default_sets: ex.default_sets || 3,
                default_reps: ex.default_reps || "10-12",
                order_index: idx,
                is_superset: Boolean(ex.is_superset)
              }))
              await supabase.from("workout_exercises").insert(exercisesToInsert)
            }
          }

          // Se o plano antigo tinha fichas sobrando além do novo plano, remove-as com limpeza segura
          for (let i = workoutsArray.length; i < oldWorkouts.length; i++) {
            const extraId = oldWorkouts[i].id
            await supabase.from("workout_exercises").delete().eq("workout_id", extraId)
            const { data: oldSessions } = await supabase.from("workout_sessions").select("id").eq("workout_id", extraId)
            if (oldSessions && oldSessions.length > 0) {
              const sIds = oldSessions.map(s => s.id)
              await supabase.from("exercise_logs").delete().in("session_id", sIds)
              await supabase.from("workout_sessions").delete().eq("workout_id", extraId)
            }
            await supabase.from("workouts").delete().eq("id", extraId)
          }
        }
      } else {
        // 2. Salvar novas Fichas no Supabase
        for (const w of workoutsArray) {
          const { data: workout, error: workoutError } = await supabase
            .from("workouts")
            .insert([
              {
                name: w.workout_name || "Treino IA",
                days_of_week: w.days_of_week && w.days_of_week.length > 0 ? `{${w.days_of_week.join(",")}}` : null,
                user_id: session.user.id
              }
            ])
            .select()
            .single()

          if (workoutError) {
            console.error(workoutError)
            alert("Erro ao salvar no banco: " + workoutError.message)
          }

          if (!workoutError && workout && w.exercises) {
            const exercisesToInsert = w.exercises.map((ex: any, idx: number) => ({
              workout_id: workout.id,
              exercise_id: ex.exercise_id,
              default_sets: ex.default_sets || 3,
              default_reps: ex.default_reps || "10-12",
              order_index: idx,
              is_superset: Boolean(ex.is_superset)
            }))
            await supabase.from("workout_exercises").insert(exercisesToInsert)
          }
        }
      }

      // 3. Salvar perfil, medidas e ciclo de validade de 30 dias no user_metadata
      try {
        const parseNum = (v: string) => (v && !isNaN(Number(v)) ? Number(v) : null)
        const existingHistory = Array.isArray(session.user.user_metadata?.measurements_history)
          ? session.user.user_metadata.measurements_history
          : []

        const hasAnyMeasurement =
          formData.peso ||
          formData.medidas_braco ||
          formData.medidas_peito ||
          formData.medidas_cintura ||
          formData.medidas_coxa ||
          formData.medidas_quadril ||
          formData.medidas_bumbum

        const updatedMeasurementsHistory = hasAnyMeasurement
          ? [
              {
                id: String(Date.now()),
                date: new Date().toISOString().split("T")[0],
                created_at: new Date().toISOString(),
                weight: parseNum(formData.peso),
                arm: parseNum(formData.medidas_braco),
                chest: parseNum(formData.medidas_peito),
                waist: parseNum(formData.medidas_cintura),
                thigh: parseNum(formData.medidas_coxa),
                hips: parseNum(formData.medidas_quadril),
                glutes: parseNum(formData.medidas_bumbum),
                calf: null,
                body_fat: null,
                notes: "Avaliação no questionário IA"
              },
              ...existingHistory
            ]
          : existingHistory

        const nowIso = new Date().toISOString()
        const expiresIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        const prevCycleNum = Number(session.user.user_metadata?.workout_plan_cycle?.cycle_number) || 0

        await supabase.auth.updateUser({
          data: {
            height_cm: parseNum(formData.altura) ?? session.user.user_metadata?.height_cm ?? "",
            age: parseNum(formData.idade) ?? session.user.user_metadata?.age ?? "",
            measurements_history: updatedMeasurementsHistory,
            onboarding_profile: {
              idade: formData.idade,
              peso: formData.peso,
              altura: formData.altura,
              genero: formData.genero,
              objetivos: formData.objetivos,
              experiencia: formData.experiencia,
              diasPorSemana: formData.diasPorSemana,
              tempoPorTreino: formData.tempoPorTreino,
              lesoes: formData.lesoes,
              observacoes: formData.observacoes,
              exerciciosQueGosta: formData.exerciciosQueGosta,
              exerciciosQueNaoGosta: formData.exerciciosQueNaoGosta
            },
            workout_plan_cycle: {
              started_at: nowIso,
              expires_at: expiresIso,
              duration_days: 30,
              cycle_number: prevCycleNum + 1,
              current_level: metaInfo?.target_level || formData.experiencia || "iniciante",
              level_label: metaInfo?.level_label || formData.experiencia || "Iniciante",
              gender: formData.genero,
              goals: formData.objetivos,
              goal_title: metaInfo?.goal_title || "Hipertrofia",
              evolution_summary: metaInfo?.evolution_summary || ""
            }
          }
        })
      } catch (err) {
        console.warn("Aviso ao atualizar metadados do ciclo:", err)
      }

      // 4. Redirecionar para o Dashboard
      router.push("/dashboard")
    } catch (e) {
      console.error(e)
      alert("Falha ao gerar treino. Tente novamente.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full">
        {/* Progresso */}
        <div className="flex gap-2 mb-8 px-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors ${step >= i ? "bg-primary" : "bg-primary/20"}`}
            />
          ))}
        </div>

        <Card className="bg-card/40 border-border/50 shadow-2xl backdrop-blur-xl">
          {/* PASSO 1: DADOS BÁSICOS & GÊNERO BIOMECÂNICO */}
          {step === 1 && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <UserIcon />
                </div>
                <CardTitle className="text-2xl">Perfil & Biomecânica</CardTitle>
                <CardDescription>
                  A IA adapta completamente a divisão muscular e a seleção de exercícios conforme o seu gênero e biotipo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-4">
                <div className="space-y-2.5">
                  <Label className="text-sm font-semibold">Gênero (Define a ênfase biomecânica da ficha) *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, genero: "feminino" })}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        formData.genero === "feminino"
                          ? "border-primary bg-primary/20 text-white shadow-lg shadow-primary/20"
                          : "border-border/60 bg-background/40 text-gray-300 hover:bg-white/5"
                      }`}
                    >
                      <div className="font-bold text-base flex items-center justify-between">
                        <span>Feminino</span>
                        {formData.genero === "feminino" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </div>
                      <p className="text-xs text-gray-300 mt-1">
                        Ênfase diferenciada em Glúteos, Quadríceps, Posteriores, Abdômen e Superiores Estéticos.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, genero: "masculino" })}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        formData.genero === "masculino"
                          ? "border-primary bg-primary/20 text-white shadow-lg shadow-primary/20"
                          : "border-border/60 bg-background/40 text-gray-300 hover:bg-white/5"
                      }`}
                    >
                      <div className="font-bold text-base flex items-center justify-between">
                        <span>Masculino</span>
                        {formData.genero === "masculino" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </div>
                      <p className="text-xs text-gray-300 mt-1">
                        Ênfase em densidade de Peitoral, Costas em V, Deltoides 3D, Braços e Pernas Pesadas.
                      </p>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Idade</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 25"
                      value={formData.idade}
                      onChange={e => setFormData({ ...formData, idade: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Peso (kg)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 68.5"
                      value={formData.peso}
                      onChange={e => setFormData({ ...formData, peso: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Altura (cm)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 168"
                      value={formData.altura}
                      onChange={e => setFormData({ ...formData, altura: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* PASSO 2: OBJETIVO E EXPERIÊNCIA */}
          {step === 2 && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <Dumbbell className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Objetivo & Nível Atual</CardTitle>
                <CardDescription>
                  A IA ajusta séries, faixas de repetições, técnicas de Bi-set e seleção de exercícios para o seu foco.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="space-y-3">
                  <Label>Qual o seu foco principal?</Label>
                  <div className="space-y-2">
                    {[
                      {
                        id: "hipertrofia",
                        label: "Hipertrofia (Ganho de Massa & Modelagem)",
                        desc: "Séries de 8 a 12 reps com foco em tensão mecânica e volume muscular."
                      },
                      {
                        id: "emagrecimento",
                        label: "Emagrecimento & Definição Muscular",
                        desc: "Séries dinâmicas de 12 a 15+ reps com Bi-sets metabólicos e foco em gasto calórico."
                      },
                      {
                        id: "forca",
                        label: "Força Absoluta & Progressão de Carga",
                        desc: "Séries de 5 a 8 reps nos multiarticulares básicos para ganho máximo de força."
                      },
                      {
                        id: "resistencia",
                        label: "Resistência Muscular & Condicionamento",
                        desc: "Séries de 15 a 20 reps focadas em vigor físico, estabilidade articular e Core."
                      }
                    ].map(obj => (
                      <label
                        key={obj.id}
                        className={`flex items-start space-x-3 border p-3 rounded-lg cursor-pointer transition-colors ${
                          formData.objetivos.includes(obj.id)
                            ? "border-primary bg-primary/10"
                            : "border-border/50 hover:bg-primary/5"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 mt-1 text-primary bg-background border-primary/50 rounded focus:ring-primary"
                          checked={formData.objetivos.includes(obj.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setFormData({ ...formData, objetivos: [...formData.objetivos, obj.id] })
                            } else {
                              setFormData({ ...formData, objetivos: formData.objetivos.filter(o => o !== obj.id) })
                            }
                          }}
                        />
                        <div className="flex-1">
                          <span className="font-semibold block text-sm text-white">{obj.label}</span>
                          <span className="text-xs text-gray-300">{obj.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Qual o seu nível de experiência atual?</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={formData.experiencia}
                    onChange={e => setFormData({ ...formData, experiencia: e.target.value })}
                  >
                    <option value="iniciante">Iniciante (Adaptação / Menos de 6 meses)</option>
                    <option value="intermediario">Intermediário (Treino consistente há +6 meses)</option>
                    <option value="avancado">Avançado (Treino intenso há mais de 2 anos)</option>
                  </select>
                  <p className="text-xs text-gray-300">
                    📅 Sua ficha terá validade de <strong>30 dias</strong>. Ao final do ciclo, a IA poderá evoluir seu treino para o próximo nível usando seu histórico de cargas!
                  </p>
                </div>
              </CardContent>
            </>
          )}

          {/* PASSO 3: MEDIDAS CORPORAIS */}
          {step === 3 && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Suas Medidas</CardTitle>
                <CardDescription>Para acompanharmos sua evolução detalhadamente (Opcional).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Braço (cm)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 35"
                      value={formData.medidas_braco}
                      onChange={e => setFormData({ ...formData, medidas_braco: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Peito/Busto (cm)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 96"
                      value={formData.medidas_peito}
                      onChange={e => setFormData({ ...formData, medidas_peito: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cintura (cm)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 74"
                      value={formData.medidas_cintura}
                      onChange={e => setFormData({ ...formData, medidas_cintura: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quadril (cm)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 102"
                      value={formData.medidas_quadril}
                      onChange={e => setFormData({ ...formData, medidas_quadril: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Coxa (cm)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 58"
                      value={formData.medidas_coxa}
                      onChange={e => setFormData({ ...formData, medidas_coxa: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Glúteo / Bumbum (cm)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 105"
                      value={formData.medidas_bumbum}
                      onChange={e => setFormData({ ...formData, medidas_bumbum: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* PASSO 4: DIETA E HÁBITOS */}
          {step === 4 && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Alimentação</CardTitle>
                <CardDescription>O que você come dita 70% dos seus resultados.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label>Quantas refeições você faz por dia em média?</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 4"
                    value={formData.dieta_refeicoes}
                    onChange={e => setFormData({ ...formData, dieta_refeicoes: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantos litros de água você bebe por dia?</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 2.5"
                    value={formData.dieta_agua}
                    onChange={e => setFormData({ ...formData, dieta_agua: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <Label>Consome muito doce, frituras ou açúcar?</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={formData.dieta_doces_frituras}
                    onChange={e => setFormData({ ...formData, dieta_doces_frituras: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    <option value="nunca">Quase nunca, sou bem focado(a)</option>
                    <option value="as_vezes">Às vezes (finais de semana)</option>
                    <option value="frequentemente">Frequentemente (quase todo dia)</option>
                  </select>
                </div>
              </CardContent>
            </>
          )}

          {/* PASSO 5: ROTINA */}
          {step === 5 && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Sua Rotina</CardTitle>
                <CardDescription>Para a IA distribuir o treino perfeitamente nos seus dias.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="space-y-3">
                  <Label>Quantos dias por semana você vai treinar?</Label>
                  <div className="flex gap-2 flex-wrap">
                    {["1", "2", "3", "4", "5", "6", "7"].map(d => (
                      <Button
                        key={d}
                        type="button"
                        variant={formData.diasPorSemana === d ? "default" : "outline"}
                        onClick={() => setFormData({ ...formData, diasPorSemana: d })}
                        className="flex-1 h-12 text-lg"
                      >
                        {d}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Quanto tempo disponível por treino?</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={formData.tempoPorTreino}
                    onChange={e => setFormData({ ...formData, tempoPorTreino: e.target.value })}
                  >
                    <option value="30">Rápido e Intenso (30 - 40 min • 5 exercícios)</option>
                    <option value="45">Ideal / Padrão (45 - 60 min • 6 a 7 exercícios)</option>
                    <option value="90">Completo / Longo (+60 min • 7 a 8 exercícios)</option>
                  </select>
                </div>
              </CardContent>
            </>
          )}

          {/* PASSO 6: SAÚDE, EXERCÍCIOS QUE MAIS GOSTA / NÃO GOSTA E GERAR */}
          {step === 6 && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <HeartPulse className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Preferências de Exercícios & Saúde</CardTitle>
                <CardDescription>
                  Escolha quais exercícios você mais gosta (para incluir na ficha) e quais não gosta (para retirar da ficha).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-4">
                {/* 1. EXERCÍCIOS QUE MAIS GOSTA (INCLUIR) */}
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-emerald-400 shrink-0" />
                    <Label className="text-sm font-bold text-emerald-300">
                      Quais exercícios você MAIS GOSTA de fazer? (Incluir na ficha)
                    </Label>
                  </div>

                  <div className="flex gap-2">
                    <select
                      className="flex h-9 flex-1 rounded-md border border-emerald-500/30 bg-background px-3 py-1 text-xs sm:text-sm"
                      value={selectedLikeInput}
                      onChange={e => {
                        if (e.target.value) {
                          addLikedExercise(e.target.value)
                        }
                      }}
                    >
                      <option value="">Selecionar exercício para incluir...</option>
                      {catalogExercises.map(ex => (
                        <option key={ex.id} value={ex.name}>
                          {ex.name} ({ex.target_muscle})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sugestões rápidas para clicar */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-gray-300 block">Toque rápido para incluir:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(formData.genero === "feminino"
                        ? [
                            "Elevação Pélvica com Barra",
                            "Agachamento Búlgaro com Halteres",
                            "Cadeira Abdutora",
                            "Glúteo na Polia Baixa (Coice no Cabo)",
                            "Leg Press",
                            "Stiff",
                            "Agachamento Sumô com Halter ou Barra",
                            "Puxada Frontal"
                          ]
                        : [
                            "Barra Fixa",
                            "Supino Reto com Barra",
                            "Agachamento Livre",
                            "Leg Press",
                            "Remada curvada",
                            "Desenvolvimento com Halteres",
                            "Rosca Direta",
                            "Tríceps Corda"
                          ]
                      ).map(sug => {
                        const isSelected = formData.exerciciosQueGosta.includes(sug)
                        return (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => (isSelected ? removeLikedExercise(sug) : addLikedExercise(sug))}
                            className={`text-[11px] px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                              isSelected
                                ? "bg-emerald-500 text-black font-bold border-emerald-400"
                                : "bg-background/60 text-gray-300 border-white/15 hover:border-emerald-400/50"
                            }`}
                          >
                            <Plus className="w-3 h-3" />
                            {sug}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {formData.exerciciosQueGosta.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[11px] font-semibold text-emerald-300 block mb-1.5">
                        ✅ Garantidos na sua ficha:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {formData.exerciciosQueGosta.map(item => (
                          <span
                            key={item}
                            className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-500/25 text-emerald-200 border border-emerald-500/40 px-2.5 py-1 rounded-full"
                          >
                            {item}
                            <button
                              type="button"
                              onClick={() => removeLikedExercise(item)}
                              className="hover:text-white"
                              title="Remover"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. EXERCÍCIOS QUE NÃO GOSTA (EXCLUIR DA FICHA) */}
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <ThumbsDown className="w-4 h-4 text-rose-400 shrink-0" />
                    <Label className="text-sm font-bold text-rose-300">
                      Quais exercícios você NÃO GOSTA de fazer? (Não colocar na ficha)
                    </Label>
                  </div>

                  <div className="flex gap-2">
                    <select
                      className="flex h-9 flex-1 rounded-md border border-rose-500/30 bg-background px-3 py-1 text-xs sm:text-sm"
                      value={selectedDislikeInput}
                      onChange={e => {
                        if (e.target.value) {
                          addDislikedExercise(e.target.value)
                        }
                      }}
                    >
                      <option value="">Selecionar exercício para retirar da ficha...</option>
                      {catalogExercises.map(ex => (
                        <option key={ex.id} value={ex.name}>
                          {ex.name} ({ex.target_muscle})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sugestões rápidas para evitar */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-gray-300 block">Toque rápido para evitar:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Levantamento Terra",
                        "Agachamento Livre",
                        "Barra Fixa",
                        "Agachamento Búlgaro com Halteres",
                        "Afundo / Passada com Halteres",
                        "Stiff",
                        "Supino Reto com Barra",
                        "Leg Press"
                      ].map(sug => {
                        const isBlocked = formData.exerciciosQueNaoGosta.includes(sug)
                        return (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => (isBlocked ? removeDislikedExercise(sug) : addDislikedExercise(sug))}
                            className={`text-[11px] px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                              isBlocked
                                ? "bg-rose-500 text-white font-bold border-rose-400"
                                : "bg-background/60 text-gray-300 border-white/15 hover:border-rose-400/50"
                            }`}
                          >
                            <X className="w-3 h-3" />
                            {sug}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {formData.exerciciosQueNaoGosta.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[11px] font-semibold text-rose-300 block mb-1.5">
                        🚫 Bloqueados (não entrarão na ficha):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {formData.exerciciosQueNaoGosta.map(item => (
                          <span
                            key={item}
                            className="inline-flex items-center gap-1.5 text-xs font-bold bg-rose-500/25 text-rose-200 border border-rose-500/40 px-2.5 py-1 rounded-full"
                          >
                            {item}
                            <button
                              type="button"
                              onClick={() => removeDislikedExercise(item)}
                              className="hover:text-white"
                              title="Remover"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. LESÕES E OBSERVAÇÕES */}
                <div className="space-y-2">
                  <Label>Possui alguma lesão ou restrição articular?</Label>
                  <Textarea
                    placeholder="Ex: Condromalácia patelar (dor no joelho), hérnia de disco lombar, dor no ombro..."
                    value={formData.lesoes}
                    onChange={e => setFormData({ ...formData, lesoes: e.target.value })}
                    className="min-h-[65px]"
                  />
                  <p className="text-xs text-muted-foreground">Deixe em branco se estiver 100% apto(a).</p>
                </div>

                <div className="space-y-2">
                  <Label>Alguma outra observação sobre o treino? (Opcional)</Label>
                  <Textarea
                    placeholder="Ex: Quero dar foco extra em glúteo médio ou porção lateral do ombro..."
                    value={formData.observacoes}
                    onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                    className="min-h-[60px]"
                  />
                </div>

                {hasExistingWorkouts && (
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-primary/10 border border-primary/30 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={replaceExisting}
                      onChange={e => setReplaceExisting(e.target.checked)}
                      className="mt-1 w-4 h-4 accent-primary"
                    />
                    <div className="text-xs text-gray-200">
                      <span className="font-bold text-white block">
                        Atualizar minhas fichas atuais para este novo ciclo de 30 dias
                      </span>
                      Substitui os exercícios antigos pelas novas fichas mantendo o seu histórico de sessões salvo.
                    </div>
                  </label>
                )}
              </CardContent>
            </>
          )}

          {/* NAVEGAÇÃO */}
          <div className="p-6 pt-2 flex justify-between gap-4">
            {step > 1 ? (
              <Button variant="outline" onClick={handlePrev} className="w-32">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
            ) : (
              <div className="w-32"></div>
            )}

            {step < 6 ? (
              <Button onClick={handleNext} className="flex-1 font-bold">
                Próximo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                className="flex-1 font-bold text-lg bg-gradient-to-r from-primary to-primary/80 hover:scale-105 transition-transform"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
                Gerar Ficha Profissional IA
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function UserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
