export const maxDuration = 60

import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

type CatalogExercise = {
  id: string
  name: string
  target_muscle: string
}

type GeneratedExerciseItem = {
  exercise_id: string
  default_sets: number
  default_reps: string
  is_superset?: boolean
  notes?: string
}

type GeneratedWorkout = {
  workout_name: string
  days_of_week: string[]
  focus_summary?: string
  exercises: GeneratedExerciseItem[]
}

const ESSENTIAL_EXERCISES: { name: string; target_muscle: string }[] = [
  // Glúteos e Quadril (Foco Feminino e Membros Inferiores Avançados)
  { name: "Elevação Pélvica com Barra", target_muscle: "Glúteos" },
  { name: "Elevação Pélvica na Máquina", target_muscle: "Glúteos" },
  { name: "Agachamento Búlgaro com Halteres", target_muscle: "Glúteos/Quadríceps" },
  { name: "Afundo / Passada com Halteres", target_muscle: "Glúteos/Quadríceps" },
  { name: "Recuo no Smith (Afundo Guiado)", target_muscle: "Glúteos/Quadríceps" },
  { name: "Agachamento Sumô com Halter ou Barra", target_muscle: "Glúteos/Adutores" },
  { name: "Levantamento Terra Sumô", target_muscle: "Glúteos/Posterior" },
  { name: "Cadeira Abdutora", target_muscle: "Glúteos" },
  { name: "Cadeira Abdutora com Tronco Inclinado", target_muscle: "Glúteos" },
  { name: "Glúteo na Polia Baixa (Coice no Cabo)", target_muscle: "Glúteos" },
  { name: "Abdução de Quadril na Polia Baixa", target_muscle: "Glúteo Médio" },
  { name: "Glúteo 4 Apoios / Máquina Glúteo", target_muscle: "Glúteos" },
  { name: "Extensão de Quadril no Banco Romano (Foco Glúteo)", target_muscle: "Glúteos/Posterior" },
  { name: "Bom Dia (Good Morning)", target_muscle: "Posterior/Glúteos" },
  // Quadríceps, Posteriores e Adutores
  { name: "Cadeira Adutora", target_muscle: "Adutores de Coxa" },
  { name: "Cadeira Flexora Sentado", target_muscle: "Posterior de Coxa" },
  { name: "Stiff com Halteres", target_muscle: "Posterior/Glúteos" },
  { name: "Agachamento Hack Machine", target_muscle: "Quadríceps" },
  { name: "Agachamento no Smith", target_muscle: "Quadríceps/Glúteos" },
  { name: "Leg Press 45° Pés Altos (Foco Glúteo/Posterior)", target_muscle: "Glúteos/Posterior" },
  { name: "Leg Press Unilateral", target_muscle: "Quadríceps/Glúteos" },
  // Core e Abdômen
  { name: "Abdominal Supra no Solo ou Máquina", target_muscle: "Abdômen" },
  { name: "Abdominal Infra (Elevação de Pernas)", target_muscle: "Abdômen" },
  { name: "Prancha Isométrica Abdominal", target_muscle: "Core/Abdômen" },
  { name: "Abdominal na Polia Alta (Crunch Cabo)", target_muscle: "Abdômen" },
  // Superiores Complementares
  { name: "Face Pull na Polia com Corda", target_muscle: "Ombro Posterior" },
  { name: "Elevação Frontal com Halteres", target_muscle: "Ombro" },
  { name: "Tríceps Testa com Barra W ou Halteres", target_muscle: "Tríceps" },
  { name: "Rosca Scott (Máquina ou Barra W)", target_muscle: "Bíceps" },
  { name: "Rosca Inclinada 45° com Halteres", target_muscle: "Bíceps" },
  { name: "Puxada Supinada / Triângulo", target_muscle: "Costas" },
  { name: "Remada Cavalinho / Máquina Articulada", target_muscle: "Costas" }
]

async function ensureCompleteCatalog(): Promise<CatalogExercise[]> {
  const { data: initial } = await supabase.from("exercises").select("id, name, target_muscle")
  const list: CatalogExercise[] = initial ? [...initial] : []

  const existingNames = new Set(list.map(e => e.name.toLowerCase().trim()))
  const missing = ESSENTIAL_EXERCISES.filter(e => !existingNames.has(e.name.toLowerCase().trim()))

  if (missing.length > 0) {
    try {
      const { data: inserted } = await supabase.from("exercises").insert(missing).select("id, name, target_muscle")
      if (inserted && inserted.length > 0) {
        list.push(...inserted)
      }
    } catch (err) {
      console.warn("Aviso ao inserir exercícios complementares:", err)
    }
  }

  // Deduplica mantendo o primeiro ID por nome normalizado
  const dedupMap = new Map<string, CatalogExercise>()
  for (const ex of list) {
    const key = ex.name.toLowerCase().trim()
    if (!dedupMap.has(key)) {
      dedupMap.set(key, ex)
    }
  }

  return Array.from(dedupMap.values())
}

function findExId(catalog: CatalogExercise[], keywords: string[], fallbackMuscle?: string): string {
  for (const kw of keywords) {
    const k = kw.toLowerCase()
    const exact = catalog.find(e => e.name.toLowerCase() === k)
    if (exact) return exact.id
    const partial = catalog.find(e => e.name.toLowerCase().includes(k))
    if (partial) return partial.id
  }
  if (fallbackMuscle) {
    const fm = fallbackMuscle.toLowerCase()
    const byMuscle = catalog.find(e => e.target_muscle.toLowerCase().includes(fm))
    if (byMuscle) return byMuscle.id
  }
  return catalog[0]?.id || ""
}

function computeNextLevel(currentLevel: string, isEvolution?: boolean): {
  effectiveLevel: "iniciante" | "intermediario" | "avancado" | "avancado_pro"
  levelLabel: string
} {
  const norm = (currentLevel || "iniciante").toLowerCase().trim()
  if (!isEvolution) {
    if (norm.includes("avanc")) return { effectiveLevel: "avancado", levelLabel: "Avançado" }
    if (norm.includes("inter")) return { effectiveLevel: "intermediario", levelLabel: "Intermediário" }
    return { effectiveLevel: "iniciante", levelLabel: "Iniciante" }
  }

  // Se for evolução de 30 dias, sobe um degrau na periodização
  if (norm === "iniciante") {
    return { effectiveLevel: "intermediario", levelLabel: "Intermediário (Evolução de Ciclo)" }
  }
  if (norm === "intermediario") {
    return { effectiveLevel: "avancado", levelLabel: "Avançado (Evolução de Ciclo)" }
  }
  return { effectiveLevel: "avancado_pro", levelLabel: "Avançado Pro / Periodização de Choque" }
}

function getGoalParameters(
  objetivos: string[],
  effectiveLevel: "iniciante" | "intermediario" | "avancado" | "avancado_pro"
) {
  const goals = (objetivos || []).map(o => o.toLowerCase())
  const isForca = goals.includes("forca")
  const isEmagrecimento = goals.includes("emagrecimento")
  const isResistencia = goals.includes("resistencia")
  const isHipertrofia = goals.includes("hipertrofia") || (!isForca && !isEmagrecimento && !isResistencia)

  const baseSetsCompound =
    effectiveLevel === "iniciante" ? 3 : effectiveLevel === "intermediario" ? 4 : 4
  const baseSetsIsolation =
    effectiveLevel === "iniciante" ? 3 : effectiveLevel === "intermediario" ? 3 : 4

  if (isForca && !isEmagrecimento) {
    return {
      primaryGoal: "forca" as const,
      goalTitle: "Força Pura & Tensão Mecânica",
      compoundSets: effectiveLevel === "iniciante" ? 4 : 5,
      isolationSets: 3,
      compoundReps: "05-08",
      secondaryCompoundReps: "06-08",
      isolationReps: "08-10",
      gluteIsolationReps: "10-12",
      calfCoreReps: "12-15",
      useSupersets: effectiveLevel === "avancado_pro"
    }
  }

  if (isEmagrecimento) {
    return {
      primaryGoal: "emagrecimento" as const,
      goalTitle: isHipertrofia ? "Definição Muscular & Emagrecimento (Recomposição)" : "Emagrecimento & Alta Densidade Metabólica",
      compoundSets: baseSetsCompound,
      isolationSets: baseSetsIsolation,
      compoundReps: isHipertrofia ? "10-12" : "12-15",
      secondaryCompoundReps: "12-15",
      isolationReps: "12-15",
      gluteIsolationReps: "15-20",
      calfCoreReps: "15-20",
      useSupersets: true // Bi-sets elevam o gasto calórico e o efeito EPOC
    }
  }

  if (isResistencia && !isHipertrofia) {
    return {
      primaryGoal: "resistencia" as const,
      goalTitle: "Resistência Muscular & Condicionamento Físico",
      compoundSets: 3,
      isolationSets: 3,
      compoundReps: "15-18",
      secondaryCompoundReps: "15-20",
      isolationReps: "15-20",
      gluteIsolationReps: "15-20",
      calfCoreReps: "20-25",
      useSupersets: true
    }
  }

  // Hipertrofia Clássica ou Combinada
  return {
    primaryGoal: "hipertrofia" as const,
    goalTitle: "Hipertrofia Máxima & Modelagem Corporal",
    compoundSets: baseSetsCompound,
    isolationSets: baseSetsIsolation,
    compoundReps: effectiveLevel === "iniciante" ? "10-12" : "08-10",
    secondaryCompoundReps: "08-12",
    isolationReps: "10-12",
    gluteIsolationReps: "12-15",
    calfCoreReps: "15-20",
    useSupersets: effectiveLevel === "avancado" || effectiveLevel === "avancado_pro"
  }
}

function getTargetExerciseCount(tempoPorTreino: string | number, effectiveLevel: string): number {
  const mins = Number(tempoPorTreino) || 45
  if (mins <= 35) return effectiveLevel === "iniciante" ? 5 : 5
  if (mins >= 75) return effectiveLevel === "iniciante" ? 6 : 8
  return effectiveLevel === "iniciante" ? 6 : 7
}

function buildProfessionalWorkoutPlan(
  formData: any,
  catalog: CatalogExercise[]
): {
  workouts: GeneratedWorkout[]
  meta: {
    target_level: string
    level_label: string
    goal_title: string
    gender_focus: string
    evolution_summary: string
    cycle_days: number
  }
} {
  const gender = (formData.genero || "masculino").toLowerCase().trim()
  const isFemale = gender === "feminino"
  const days = Math.min(7, Math.max(1, Number(formData.diasPorSemana) || 3))
  const isEvolution = Boolean(formData.isEvolution)
  const { effectiveLevel, levelLabel } = computeNextLevel(formData.experiencia || "iniciante", isEvolution)
  const goalParams = getGoalParameters(formData.objetivos || ["hipertrofia"], effectiveLevel)
  const targetCount = getTargetExerciseCount(formData.tempoPorTreino, effectiveLevel)

  const lesoesText = (formData.lesoes || "").toLowerCase()
  const obsText = (formData.observacoes || "").toLowerCase()
  const hasKneeIssue = lesoesText.includes("joelho") || lesoesText.includes("patela") || lesoesText.includes("menisco")
  const hasBackIssue = lesoesText.includes("lombar") || lesoesText.includes("hérnia") || lesoesText.includes("hernia") || lesoesText.includes("coluna")
  const hasShoulderIssue = lesoesText.includes("ombro") || lesoesText.includes("manguito") || lesoesText.includes("bursite")
  const dislikesFreeSquat = obsText.includes("agachamento livre") && (obsText.includes("não") || obsText.includes("nao") || obsText.includes("detesto") || obsText.includes("odeio"))

  // Verifica quais exercícios já foram muito usados na ficha anterior para promover evolução angular
  const prevExerciseNames = new Set<string>()
  const prevWeightRecords: string[] = []
  if (Array.isArray(formData.previousWorkouts)) {
    for (const pw of formData.previousWorkouts) {
      if (Array.isArray(pw.exercises)) {
        for (const ex of pw.exercises) {
          if (ex.name) prevExerciseNames.add(ex.name.toLowerCase())
          if (ex.name && ex.max_weight && Number(ex.max_weight) > 0) {
            prevWeightRecords.push(`${ex.name} (${ex.max_weight}kg)`)
          }
        }
      }
    }
  }

  const exItem = (
    keywords: string[],
    sets: number,
    reps: string,
    isSuperset = false,
    fallbackMuscle = "Geral"
  ): GeneratedExerciseItem => ({
    exercise_id: findExId(catalog, keywords, fallbackMuscle),
    default_sets: sets,
    default_reps: reps,
    is_superset: isSuperset
  })

  const trimExercises = (items: GeneratedExerciseItem[]): GeneratedExerciseItem[] => {
    // Evita IDs duplicados na mesma ficha
    const seen = new Set<string>()
    const unique: GeneratedExerciseItem[] = []
    for (const item of items) {
      if (item.exercise_id && !seen.has(item.exercise_id)) {
        seen.add(item.exercise_id)
        unique.push(item)
      }
    }
    const sliced = unique.slice(0, targetCount)
    if (sliced.length > 0) sliced[0].is_superset = false
    return sliced
  }

  const workouts: GeneratedWorkout[] = []

  // ============================================================================
  // MONTAGEM ESPECIALIZADA FEMININA (Foco Biomecânico em Glúteos, Quadríceps, Posteriores, Core e Superiores Estéticos)
  // ============================================================================
  if (isFemale) {
    // Bloco 1: Quadríceps, Adutores e Panturrilha (Foco Anterior de Coxa & Modelagem)
    const buildFemaleQuadWorkout = (workoutLabel: string, daysList: string[], variant = 1): GeneratedWorkout => {
      const mainSquat =
        hasBackIssue || hasKneeIssue || dislikesFreeSquat
          ? ["Agachamento Hack Machine", "Agachamento no Smith"]
          : effectiveLevel === "iniciante" && !isEvolution
          ? ["Agachamento no Smith", "Agachamento(livre/smith/Hack)"]
          : variant === 2 || isEvolution
          ? ["Agachamento Hack Machine", "Agachamento Livre"]
          : ["Agachamento Livre", "Agachamento no Smith"]

      const unilateralQuad = hasKneeIssue
        ? ["Leg Press Unilateral", "Cadeira Extensora"]
        : effectiveLevel === "iniciante" && !isEvolution
        ? ["Recuo no Smith (Afundo Guiado)", "Afundo / Passada com Halteres"]
        : ["Afundo / Passada com Halteres", "Agachamento Búlgaro com Halteres"]

      const list: GeneratedExerciseItem[] = [
        exItem(mainSquat, goalParams.compoundSets, goalParams.compoundReps, false, "Quadríceps"),
        exItem(["Leg Press", "Leg Press Unilateral"], goalParams.compoundSets, goalParams.secondaryCompoundReps, false, "Pernas"),
        exItem(unilateralQuad, goalParams.isolationSets, goalParams.secondaryCompoundReps, false, "Glúteos/Quadríceps"),
        exItem(["Cadeira Extensora"], goalParams.isolationSets, goalParams.isolationReps, goalParams.useSupersets, "Pernas"),
        exItem(["Cadeira Adutora"], goalParams.isolationSets, goalParams.gluteIsolationReps, false, "Adutores de Coxa"),
        exItem(["Cadeira Abdutora"], goalParams.isolationSets, goalParams.gluteIsolationReps, goalParams.useSupersets, "Glúteos"),
        exItem(["Panturrilha Sentado", "Panturrilha em pé"], 3, goalParams.calfCoreReps, false, "Pernas"),
        exItem(["Abdominal Infra (Elevação de Pernas)", "Prancha Isométrica Abdominal"], 3, goalParams.calfCoreReps, false, "Abdômen")
      ]

      return {
        workout_name: workoutLabel,
        days_of_week: daysList,
        focus_summary: "Ênfase biomecânica no volume e desenho do Quadríceps, Adutores de coxa e estabilidade pélvica.",
        exercises: trimExercises(list)
      }
    }

    // Bloco 2: Glúteos (Máximo, Médio e Mínimo) & Posteriores de Coxa (Isquiotibiais)
    const buildFemaleGluteHamWorkout = (workoutLabel: string, daysList: string[], variant = 1): GeneratedWorkout => {
      const hipThrust =
        effectiveLevel === "iniciante" && !isEvolution
          ? ["Elevação Pélvica na Máquina", "Elevação Pélvica com Barra"]
          : ["Elevação Pélvica com Barra", "Elevação Pélvica na Máquina"]

      const hingeEx = hasBackIssue
        ? ["Leg Press 45° Pés Altos (Foco Glúteo/Posterior)", "Extensão de Quadril no Banco Romano (Foco Glúteo)"]
        : variant === 2 || isEvolution
        ? ["Levantamento Terra Sumô", "Stiff com Halteres"]
        : ["Stiff", "Stiff com Halteres"]

      const deepGluteUnilateral =
        effectiveLevel === "iniciante" && !isEvolution
          ? ["Agachamento Sumô com Halter ou Barra", "Recuo no Smith (Afundo Guiado)"]
          : ["Agachamento Búlgaro com Halteres", "Agachamento Sumô com Halter ou Barra"]

      const list: GeneratedExerciseItem[] = [
        exItem(hipThrust, goalParams.compoundSets, goalParams.compoundReps, false, "Glúteos"),
        exItem(deepGluteUnilateral, goalParams.compoundSets, goalParams.secondaryCompoundReps, false, "Glúteos/Quadríceps"),
        exItem(hingeEx, goalParams.compoundSets, goalParams.secondaryCompoundReps, false, "Posterior/Glúteos"),
        exItem(["Mesa Flexora", "Cadeira Flexora Sentado"], goalParams.isolationSets, goalParams.isolationReps, false, "Pernas"),
        exItem(
          variant === 2 ? ["Cadeira Abdutora com Tronco Inclinado", "Cadeira Abdutora"] : ["Cadeira Abdutora"],
          goalParams.isolationSets,
          goalParams.gluteIsolationReps,
          goalParams.useSupersets,
          "Glúteos"
        ),
        exItem(
          ["Glúteo na Polia Baixa (Coice no Cabo)", "Glúteo 4 Apoios / Máquina Glúteo"],
          goalParams.isolationSets,
          goalParams.gluteIsolationReps,
          false,
          "Glúteos"
        ),
        exItem(["Cadeira Flexora Sentado", "Flexora Unilateral"], 3, goalParams.isolationReps, false, "Posterior de Coxa"),
        exItem(["Prancha Isométrica Abdominal", "Abdominal Supra no Solo ou Máquina"], 3, goalParams.calfCoreReps, false, "Core/Abdômen")
      ]

      return {
        workout_name: workoutLabel,
        days_of_week: daysList,
        focus_summary: "Recrutamento profundo de Glúteo Máximo, Glúteo Médio (projeção lateral) e Posteriores de Coxa.",
        exercises: trimExercises(list)
      }
    }

    // Bloco 3: Membros Superiores Femininos (Definição, Postura, Linha de Cintura, Ombros e Tríceps Firme)
    const buildFemaleUpperCoreWorkout = (workoutLabel: string, daysList: string[], variant = 1): GeneratedWorkout => {
      const shoulderPress = hasShoulderIssue
        ? ["Elevação lateral Máquina", "Face Pull na Polia com Corda"]
        : ["Desenvolvimento com Halteres", "Desenvolvimento Militar"]

      const list: GeneratedExerciseItem[] = [
        exItem(
          variant === 2 ? ["Puxada Supinada / Triângulo", "Puxada Frontal"] : ["Puxada Frontal", "Puxada Fechada"],
          goalParams.isolationSets,
          goalParams.isolationReps,
          false,
          "Costas"
        ),
        exItem(
          ["Remada Baixa", "Remada Baixa Triangulo", "Remada Cavalinho / Máquina Articulada"],
          goalParams.isolationSets,
          goalParams.isolationReps,
          false,
          "Costas"
        ),
        exItem(shoulderPress, goalParams.isolationSets, goalParams.isolationReps, false, "Ombros"),
        exItem(
          ["Elevação Lateral", "Elevação lateral Polia"],
          goalParams.isolationSets,
          "12-15",
          goalParams.useSupersets,
          "Ombro"
        ),
        exItem(
          ["Tríceps Corda", "Tríceps Pulley", "Tríceps Francês corda"],
          goalParams.isolationSets,
          "12-15",
          false,
          "Tríceps"
        ),
        exItem(
          ["Rosca Direta Alternada", "Bíceps Martelo"],
          3,
          "12-15",
          goalParams.useSupersets,
          "Bíceps"
        ),
        exItem(
          ["Abdominal Supra no Solo ou Máquina", "Abdominal na Polia Alta (Crunch Cabo)"],
          3,
          goalParams.calfCoreReps,
          false,
          "Abdômen"
        ),
        exItem(["Prancha Isométrica Abdominal", "Abdominal Infra (Elevação de Pernas)"], 3, goalParams.calfCoreReps, true, "Core/Abdômen")
      ]

      return {
        workout_name: workoutLabel,
        days_of_week: daysList,
        focus_summary: "Definição de membros superiores, alinhamento postural, firmeza de tríceps/ombros e cintura abdominal.",
        exercises: trimExercises(list)
      }
    }

    // Bloco 4: Glúteos Isolados & Detalhamento Inferior (Especial 4 ou 5+ dias)
    const buildFemaleGluteSculptWorkout = (workoutLabel: string, daysList: string[]): GeneratedWorkout => {
      const list: GeneratedExerciseItem[] = [
        exItem(["Elevação Pélvica com Barra", "Elevação Pélvica na Máquina"], 4, goalParams.compoundReps, false, "Glúteos"),
        exItem(["Agachamento Sumô com Halter ou Barra", "Levantamento Terra Sumô"], 4, goalParams.secondaryCompoundReps, false, "Glúteos/Adutores"),
        exItem(["Extensão de Quadril no Banco Romano (Foco Glúteo)", "Bom Dia (Good Morning)"], 3, "12-15", false, "Glúteos/Posterior"),
        exItem(["Glúteo na Polia Baixa (Coice no Cabo)"], 4, "12-15", false, "Glúteos"),
        exItem(["Abdução de Quadril na Polia Baixa", "Cadeira Abdutora com Tronco Inclinado"], 4, "15-20", true, "Glúteo Médio"),
        exItem(["Glúteo 4 Apoios / Máquina Glúteo", "Cadeira Abdutora"], 3, "15-20", false, "Glúteos"),
        exItem(["Flexora Unilateral", "Cadeira Flexora Sentado"], 3, "12-15", false, "Pernas"),
        exItem(["Abdominal Infra (Elevação de Pernas)"], 3, "15-20", false, "Abdômen")
      ]

      return {
        workout_name: workoutLabel,
        days_of_week: daysList,
        focus_summary: "Isolamento avançado de Glúteo Máximo e Glúteo Médio em múltiplos ângulos + estímulo metabólico.",
        exercises: trimExercises(list)
      }
    }

    if (days === 1) {
      workouts.push(buildFemaleGluteHamWorkout("Treino Único - Inferior Completo (Foco Glúteos e Pernas)", ["Quarta"]))
    } else if (days === 2) {
      workouts.push(
        buildFemaleQuadWorkout("Treino A - Quadríceps, Glúteos e Core", ["Terça"]),
        buildFemaleGluteHamWorkout("Treino B - Glúteos, Posteriores e Superiores Definição", ["Quinta"])
      )
    } else if (days === 3) {
      workouts.push(
        buildFemaleQuadWorkout("Treino A - Quadríceps, Adutores e Panturrilha", ["Segunda"]),
        buildFemaleUpperCoreWorkout("Treino B - Superiores Definição, Postura e Abdômen", ["Quarta"]),
        buildFemaleGluteHamWorkout("Treino C - Glúteos e Posteriores de Coxa", ["Sexta"])
      )
    } else if (days === 4) {
      workouts.push(
        buildFemaleQuadWorkout("Treino A - Quadríceps, Adutores e Panturrilha", ["Segunda"]),
        buildFemaleUpperCoreWorkout("Treino B - Costas, Ombros, Braços e Core", ["Terça"]),
        buildFemaleGluteHamWorkout("Treino C - Glúteos e Posteriores de Coxa", ["Quinta"]),
        buildFemaleGluteSculptWorkout("Treino D - Glúteos Isolados (Foco Máximo) & Abdômen", ["Sexta"])
      )
    } else if (days === 5) {
      workouts.push(
        buildFemaleQuadWorkout("Treino A - Quadríceps, Afundo e Adutores", ["Segunda"], 1),
        buildFemaleUpperCoreWorkout("Treino B - Costas, Deltoides e Core", ["Terça"], 1),
        buildFemaleGluteHamWorkout("Treino C - Glúteos Pesado e Isquiotibiais", ["Quarta"], 1),
        buildFemaleUpperCoreWorkout("Treino D - Superiores Definição (Tríceps/Ombros) & Abdômen", ["Quinta"], 2),
        buildFemaleGluteSculptWorkout("Treino E - Glúteo 3D (Elevação Pélvica, Sumô e Polia)", ["Sexta"])
      )
    } else {
      workouts.push(
        buildFemaleQuadWorkout("Treino A - Quadríceps, Adutores e Panturrilhas", ["Segunda", "Quinta"], 1),
        buildFemaleUpperCoreWorkout("Treino B - Superiores Definição, Postura e Core", ["Terça", "Sexta"], 1),
        buildFemaleGluteHamWorkout("Treino C - Glúteos e Posteriores em Alta Intensidade", ["Quarta", "Sábado"], 2)
      )
    }
  } else {
    // ============================================================================
    // MONTAGEM ESPECIALIZADA MASCULINA (Foco em Densidade de Peito, Costas em V, Deltoides 3D, Braços e Pernas Pesadas)
    // ============================================================================
    const buildMalePushChestTri = (workoutLabel: string, daysList: string[], includeShoulders = false): GeneratedWorkout => {
      const mainBench =
        effectiveLevel === "iniciante" && !isEvolution
          ? ["Supino reto (Máquina/Halteres)", "Supino Reto com Barra"]
          : ["Supino Reto com Barra", "Supino reto (Máquina/Halteres)"]

      const inclinePress = isEvolution
        ? ["Supino Inclinado c/ halteres", "Supino Inclinado (Máquina)"]
        : ["Supino Inclinado (Máquina)", "Supino Inclinado c/ halteres"]

      const list: GeneratedExerciseItem[] = [
        exItem(mainBench, goalParams.compoundSets, goalParams.compoundReps, false, "Peito"),
        exItem(inclinePress, goalParams.compoundSets, goalParams.secondaryCompoundReps, false, "Peito"),
        exItem(["Crossover", "Crucifixo inclinado c/ Halter", "Fly"], goalParams.isolationSets, goalParams.isolationReps, goalParams.useSupersets, "Peito"),
        ...(includeShoulders
          ? [
              exItem(
                hasShoulderIssue ? ["Elevação lateral Máquina"] : ["Desenvolvimento com Halteres", "Desenvolvimento Militar"],
                goalParams.compoundSets,
                goalParams.secondaryCompoundReps,
                false,
                "Ombros"
              ),
              exItem(["Elevação Lateral", "Elevação lateral Polia"], goalParams.isolationSets, goalParams.isolationReps, false, "Ombro")
            ]
          : [
              exItem(["Fly", "Crucifixo c/ Halter"], 3, goalParams.isolationReps, false, "Peito")
            ]),
        exItem(["Tríceps Pulley", "Tríceps Testa com Barra W ou Halteres"], goalParams.isolationSets, goalParams.isolationReps, false, "Tríceps"),
        exItem(["Tríceps Corda", "Tríceps Francês corda"], goalParams.isolationSets, goalParams.isolationReps, goalParams.useSupersets, "Tríceps"),
        exItem(["Abdominal Supra no Solo ou Máquina", "Abdominal na Polia Alta (Crunch Cabo)"], 3, goalParams.calfCoreReps, false, "Abdômen")
      ]

      return {
        workout_name: workoutLabel,
        days_of_week: daysList,
        focus_summary: "Tensão mecânica para densidade de Peitoral (feixes clavicular e esternal), Deltoides e Tríceps.",
        exercises: trimExercises(list)
      }
    }

    const buildMalePullBackBi = (workoutLabel: string, daysList: string[]): GeneratedWorkout => {
      const mainPull =
        effectiveLevel === "avancado" || effectiveLevel === "avancado_pro"
          ? ["Barra Fixa", "Puxada Frontal"]
          : ["Puxada Frontal", "Puxada Supinada / Triângulo"]

      const mainRow = hasBackIssue
        ? ["Remada Cavalinho / Máquina Articulada", "Remada Baixa"]
        : ["Remada curvada", "Remada Cavalinho / Máquina Articulada"]

      const list: GeneratedExerciseItem[] = [
        exItem(mainPull, goalParams.compoundSets, goalParams.compoundReps, false, "Costas"),
        exItem(mainRow, goalParams.compoundSets, goalParams.compoundReps, false, "Costas"),
        exItem(["Remada Baixa Triangulo", "Remada Cerrote", "Puxada Fechada"], goalParams.isolationSets, goalParams.secondaryCompoundReps, false, "Costas"),
        exItem(["Pulldown", "Remada Cerrote"], goalParams.isolationSets, goalParams.isolationReps, goalParams.useSupersets, "Costas"),
        exItem(["Face Pull na Polia com Corda", "Posterior ombro"], 3, goalParams.isolationReps, false, "Ombro Posterior"),
        exItem(["Bíceps Barra W", "Rosca Direta", "Rosca Scott (Máquina ou Barra W)"], goalParams.isolationSets, goalParams.isolationReps, false, "Bíceps"),
        exItem(["Bíceps Martelo", "Rosca Inclinada 45° com Halteres", "Rosca Direta Alternada"], goalParams.isolationSets, goalParams.isolationReps, goalParams.useSupersets, "Biceps"),
        exItem(["Encolhimento"], 3, "12-15", false, "Trapézio")
      ]

      return {
        workout_name: workoutLabel,
        days_of_week: daysList,
        focus_summary: "Expansão dorsal (formato em V), espessura escapular, deltoide posterior e pico de Bíceps.",
        exercises: trimExercises(list)
      }
    }

    const buildMaleLegsComplete = (workoutLabel: string, daysList: string[]): GeneratedWorkout => {
      const mainSquat =
        hasBackIssue || hasKneeIssue || dislikesFreeSquat
          ? ["Agachamento Hack Machine", "Agachamento no Smith"]
          : ["Agachamento Livre", "Agachamento Hack Machine"]

      const list: GeneratedExerciseItem[] = [
        exItem(mainSquat, goalParams.compoundSets, goalParams.compoundReps, false, "Pernas"),
        exItem(["Leg Press"], goalParams.compoundSets, goalParams.secondaryCompoundReps, false, "Pernas"),
        exItem(["Agachamento Hack Machine", "Afundo / Passada com Halteres"], goalParams.isolationSets, goalParams.secondaryCompoundReps, false, "Quadríceps"),
        exItem(["Cadeira Extensora"], goalParams.isolationSets, goalParams.isolationReps, goalParams.useSupersets, "Pernas"),
        exItem(hasBackIssue ? ["Cadeira Flexora Sentado"] : ["Stiff", "Levantamento Terra"], goalParams.compoundSets, goalParams.secondaryCompoundReps, false, "Pernas"),
        exItem(["Mesa Flexora", "Cadeira Flexora Sentado"], goalParams.isolationSets, goalParams.isolationReps, goalParams.useSupersets, "Pernas"),
        exItem(["Panturrilha em pé", "Panturrilhas Hack"], 4, goalParams.calfCoreReps, false, "Pernas"),
        exItem(["Panturrilha Sentado"], 3, goalParams.calfCoreReps, true, "Pernas")
      ]

      return {
        workout_name: workoutLabel,
        days_of_week: daysList,
        focus_summary: "Desenvolvimento completo de Membros Inferiores: Quadríceps, Isquiotibiais e Panturrilhas.",
        exercises: trimExercises(list)
      }
    }

    const buildMaleShouldersTrapCore = (workoutLabel: string, daysList: string[]): GeneratedWorkout => {
      const list: GeneratedExerciseItem[] = [
        exItem(
          hasShoulderIssue ? ["Desenvolvimento com Halteres"] : ["Desenvolvimento Militar", "Desenvolvimento com Halteres"],
          goalParams.compoundSets,
          goalParams.compoundReps,
          false,
          "Ombro"
        ),
        exItem(["Elevação Lateral"], 4, goalParams.isolationReps, false, "Ombro"),
        exItem(["Elevação lateral Polia", "Elevação lateral Máquina"], 3, "12-15", goalParams.useSupersets, "Ombro"),
        exItem(["Elevação Frontal com Halteres", "Remada alta aberta"], 3, goalParams.isolationReps, false, "Ombro"),
        exItem(["Face Pull na Polia com Corda", "Posterior ombro"], 4, "12-15", false, "Ombro Posterior"),
        exItem(["Encolhimento"], 4, "10-12", false, "Trapézio"),
        exItem(["Abdominal na Polia Alta (Crunch Cabo)", "Abdominal Supra no Solo ou Máquina"], 3, goalParams.calfCoreReps, false, "Abdômen"),
        exItem(["Abdominal Infra (Elevação de Pernas)", "Prancha Isométrica Abdominal"], 3, goalParams.calfCoreReps, true, "Abdômen")
      ]

      return {
        workout_name: workoutLabel,
        days_of_week: daysList,
        focus_summary: "Deltoides tridimensionais (porções anterior, lateral e posterior), Trapézio e Core.",
        exercises: trimExercises(list)
      }
    }

    const buildMaleArmsSpecial = (workoutLabel: string, daysList: string[]): GeneratedWorkout => {
      const list: GeneratedExerciseItem[] = [
        exItem(["Tríceps Supino Fechado", "Tríceps Testa com Barra W ou Halteres"], 4, goalParams.compoundReps, false, "Tríceps"),
        exItem(["Bíceps Barra W", "Rosca Direta"], 4, goalParams.compoundReps, true, "Bíceps"),
        exItem(["Tríceps Pulley", "Tríceps Testa com Barra W ou Halteres"], 4, goalParams.isolationReps, false, "Tríceps"),
        exItem(["Rosca Scott (Máquina ou Barra W)", "Rosca Inclinada 45° com Halteres"], 4, goalParams.isolationReps, true, "Bíceps"),
        exItem(["Tríceps Corda", "Tríceps Francês corda"], 3, "12-15", false, "Tríceps"),
        exItem(["Bíceps Martelo", "Bíceps invertido"], 3, "12-15", true, "Biceps"),
        exItem(["Abdominal na Polia Alta (Crunch Cabo)", "Prancha Isométrica Abdominal"], 3, goalParams.calfCoreReps, false, "Abdômen")
      ]

      return {
        workout_name: workoutLabel,
        days_of_week: daysList,
        focus_summary: "Especialização em Bíceps, Tríceps e Antebraço com sinergia agonista-antagonista.",
        exercises: trimExercises(list)
      }
    }

    if (days === 1) {
      workouts.push(buildMalePushChestTri("Treino Full Body Masculino - Força & Hipertrofia", ["Quarta"], true))
    } else if (days === 2) {
      workouts.push(
        buildMalePushChestTri("Treino A - Superiores Completos (Peito, Costas, Ombros e Braços)", ["Terça"], true),
        buildMaleLegsComplete("Treino B - Membros Inferiores Completos e Core", ["Quinta"])
      )
    } else if (days === 3) {
      workouts.push(
        buildMalePushChestTri("Treino A (Push) - Peitoral, Deltoides e Tríceps", ["Segunda"], true),
        buildMalePullBackBi("Treino B (Pull) - Dorsais, Trapézio e Bíceps", ["Quarta"]),
        buildMaleLegsComplete("Treino C (Legs) - Quadríceps, Posteriores e Panturrilha", ["Sexta"])
      )
    } else if (days === 4) {
      workouts.push(
        buildMalePushChestTri("Treino A - Peitoral e Tríceps", ["Segunda"], false),
        buildMalePullBackBi("Treino B - Costas Completas e Bíceps", ["Terça"]),
        buildMaleLegsComplete("Treino C - Pernas Completas e Panturrilhas", ["Quinta"]),
        buildMaleShouldersTrapCore("Treino D - Deltoides 3D, Trapézio e Abdômen", ["Sexta"])
      )
    } else if (days === 5) {
      workouts.push(
        buildMalePushChestTri("Treino A - Peitoral Pesado e Tríceps", ["Segunda"], false),
        buildMalePullBackBi("Treino B - Dorsais Largos e Bíceps", ["Terça"]),
        buildMaleLegsComplete("Treino C - Membros Inferiores Completos", ["Quarta"]),
        buildMaleShouldersTrapCore("Treino D - Ombros Completos, Trapézio e Core", ["Quinta"]),
        buildMaleArmsSpecial("Treino E - Braços Completos (Bíceps & Tríceps) e Abdômen", ["Sexta"])
      )
    } else {
      workouts.push(
        buildMalePushChestTri("Treino A (Push) - Peito, Ombros e Tríceps", ["Segunda", "Quinta"], true),
        buildMalePullBackBi("Treino B (Pull) - Costas, Trapézio, Posterior de Ombro e Bíceps", ["Terça", "Sexta"]),
        buildMaleLegsComplete("Treino C (Legs) - Pernas Completas e Panturrilhas", ["Quarta", "Sábado"])
      )
    }
  }

  const genderFocusText = isFemale
    ? "Periodização Feminina Especializada: divisão de membros inferiores separando ênfase em Quadríceps/Adutores e ênfase em Glúteos (Máximo e Médio)/Posteriores de Coxa, combinada com treino de superiores voltado para definição estética, postura e cintura."
    : "Periodização Masculina Especializada: foco em densidade de Peitoral, expansão de Dorsais em V, Deltoides tridimensionais, volume de Braços e base sólida de Membros Inferiores."

  const evolutionSummaryText = isEvolution
    ? `Nova Ficha de Evolução (Ciclo ${formData.cycleNumber || 2} • Nível ${levelLabel}): progressão estruturada a partir do histórico da sua ficha anterior${
        prevWeightRecords.length > 0 ? ` (considerando suas cargas em ${prevWeightRecords.slice(0, 4).join(", ")})` : ""
      }. Foram introduzidos novos ângulos biomecânicos, ajustes de volume (${goalParams.compoundSets} séries nos multiarticulares com meta de ${goalParams.compoundReps} reps) e estímulos mais avançados para quebrar platôs.`
    : `Ficha planejada sob medida para ${levelLabel} com foco em ${goalParams.goalTitle}. Validade programada de 30 dias para adaptação neural e progressão de cargas.`

  return {
    workouts,
    meta: {
      target_level: effectiveLevel,
      level_label: levelLabel,
      goal_title: goalParams.goalTitle,
      gender_focus: genderFocusText,
      evolution_summary: evolutionSummaryText,
      cycle_days: 30
    }
  }
}

function isAiPlanQualityValid(
  aiWorkouts: any[],
  catalog: CatalogExercise[],
  isFemale: boolean
): boolean {
  if (!Array.isArray(aiWorkouts) || aiWorkouts.length === 0) return false
  const catalogIds = new Set(catalog.map(c => c.id))
  const catalogMap = new Map(catalog.map(c => [c.id, c]))

  let totalValidExercises = 0
  let hasFemaleGluteSpecifics = false

  for (const w of aiWorkouts) {
    if (!w || !w.workout_name || !Array.isArray(w.exercises) || w.exercises.length < 4) {
      return false
    }
    // Se for feminino, não aceita que o Treino A seja um clássico masculino "Peito e Tríceps"
    if (isFemale && w.workout_name.toLowerCase().includes("peito e tríceps")) {
      return false
    }
    for (const ex of w.exercises) {
      if (!ex || !catalogIds.has(ex.exercise_id)) return false
      totalValidExercises++
      const item = catalogMap.get(ex.exercise_id)
      if (item) {
        const n = item.name.toLowerCase()
        if (
          n.includes("elevação pélvica") ||
          n.includes("búlgaro") ||
          n.includes("abdutora") ||
          n.includes("glúteo") ||
          n.includes("sumô") ||
          n.includes("afundo")
        ) {
          hasFemaleGluteSpecifics = true
        }
      }
    }
  }

  if (isFemale && !hasFemaleGluteSpecifics) {
    return false
  }

  return totalValidExercises >= aiWorkouts.length * 4
}

export async function POST(req: Request) {
  try {
    const formData = await req.json()
    const catalog = await ensureCompleteCatalog()

    if (!catalog || catalog.length === 0) {
      return NextResponse.json({ error: "Erro ao carregar catálogo de exercícios" }, { status: 500 })
    }

    // Construímos imediatamente a base profissional determinística (Periodização & Biomecânica)
    const expertPlan = buildProfessionalWorkoutPlan(formData, catalog)
    const isFemale = (formData.genero || "").toLowerCase().trim() === "feminino"
    const isEvolution = Boolean(formData.isEvolution)
    const { effectiveLevel, levelLabel } = computeNextLevel(formData.experiencia || "iniciante", isEvolution)
    const goalParams = getGoalParameters(formData.objetivos || ["hipertrofia"], effectiveLevel)

    const apiKey = process.env.GEMINI_API_KEY || ""
    if (!apiKey) {
      return NextResponse.json({
        workouts: expertPlan.workouts,
        meta: expertPlan.meta
      })
    }

    const catalogString = catalog
      .map(e => `[ID: ${e.id}] ${e.name} (Músculo: ${e.target_muscle})`)
      .join("\n")

    const historyContext =
      isEvolution && Array.isArray(formData.previousWorkouts) && formData.previousWorkouts.length > 0
        ? `\nHISTÓRICO REAL DA FICHA ANTERIOR DO ALUNO (ÚLTIMOS 30 DIAS):
O aluno está evoluindo de nível (${formData.experiencia || "iniciante"} -> ${effectiveLevel} / ${levelLabel}).
Resumo das fichas anteriores e cargas máximas atingidas:
${formData.previousWorkouts
  .map(
    (pw: any) =>
      `- ${pw.name} (Feito ${pw.checkins || 0}x): ${(pw.exercises || [])
        .map(
          (e: any) =>
            `${e.name} [${e.default_sets}x${e.default_reps}${e.max_weight ? ` | Carga máx atingida: ${e.max_weight}kg` : ""}]`
        )
        .join(", ")}`
  )
  .join("\n")}
REGRA DE EVOLUÇÃO: NÃO repita exatamente a mesma ficha anterior! Evolua a divisão e os estímulos biomecânicos, introduza variações mais desafiadoras compatíveis com o nível ${levelLabel}, ajuste séries e faixas de repetições e aplique progressão real.`
        : ""

    const genderRules = isFemale
      ? `DIRETRIZES OBRIGATÓRIAS PARA GÊNERO FEMININO:
1. O treino feminino DEVE ter diferenciação real e prioritária nos Membros Inferiores, dividindo os dias de perna entre:
   - Dia de Ênfase em Quadríceps, Adutores e Panturrilhas (Agachamento Livre/Hack/Smith, Leg Press, Afundo/Passada/Recuo, Cadeira Extensora, Cadeira Adutora).
   - Dia de Ênfase em Glúteos (Máximo e Médio) e Posteriores/Isquiotibiais (Elevação Pélvica com Barra/Máquina, Agachamento Búlgaro, Agachamento Sumô/Terra Sumô, Cadeira Abdutora, Cadeira Abdutora Tronco Inclinado, Glúteo na Polia Baixa/Coice, Stiff, Mesa/Cadeira Flexora).
2. Nos Membros Superiores Femininos, monte um treino elegante de Definição, Postura, Costas, Deltoides, Tríceps e Core/Abdômen. NUNCA monte uma ficha masculina de "Peito e Tríceps pesado" para o público feminino.`
      : `DIRETRIZES OBRIGATÓRIAS PARA GÊNERO MASCULINO:
1. Priorize construção densa e simétrica de Peitoral (Supino Reto/Inclinado, Crucifixo/Crossover), Costas em V (Barra Fixa/Puxadas, Remadas Curvada/Cavalinho/Baixa/Serrote), Deltoides Completos (Desenvolvimento, Elevação Lateral, Face Pull/Posterior, Encolhimento), Bíceps e Tríceps volumosos e Membros Inferiores pesados (Agachamento, Leg Press, Hack, Extensora, Stiff, Mesa/Cadeira Flexora, Panturrilhas).`

    const prompt = `Você é um Treinador de Elite Certificado (CREF / NSCA) especialista em Biomecânica e Periodização da Musculação.
Responda EXCLUSIVAMENTE com um ARRAY JSON válido contendo as fichas de treino. Não use markdown nem texto fora do JSON.

Perfil Completo do Aluno:
- Idade: ${formData.idade || "25"} anos | Gênero: ${formData.genero || "masculino"}
- Peso: ${formData.peso || "70"}kg | Altura: ${formData.altura || "170"}cm
- Objetivos selecionados: ${formData.objetivos ? formData.objetivos.join(", ") : "hipertrofia"} (Foco Técnico: ${goalParams.goalTitle})
- Nível de Periodização Alvo: ${levelLabel}
- Frequência Semanal: ${formData.diasPorSemana || 3} dias por semana
- Tempo por Sessão: ${formData.tempoPorTreino || 45} minutos
- Lesões ou Restrições: ${formData.lesoes || "Nenhuma"}
- Preferências / Observações: ${formData.observacoes || "Nenhuma"}
${historyContext}

${genderRules}

REGRAS DE OBJETIVO E INTENSIDADE (${goalParams.goalTitle}):
- Multiarticulares principais: ${goalParams.compoundSets} séries de ${goalParams.compoundReps} repetições.
- Exercícios secundários/isoladores: ${goalParams.isolationSets} séries de ${goalParams.isolationReps} (ou ${goalParams.gluteIsolationReps} para isoladores de glúteo/abdutora/panturrilha/abdômen).
- Cada ficha DEVE conter entre 6 e 8 exercícios bem estruturados do catálogo abaixo.
- Utilize "is_superset": ${goalParams.useSupersets ? "true em 1 ou 2 pares estratégicos de exercícios por ficha (Bi-set)" : "false"}.

CATÁLOGO DE EXERCÍCIOS PERMITIDOS (Use EXATAMENTE o UUID do campo ID):
${catalogString}

FORMATO EXATO DE SAÍDA (Array JSON):
[
  {
    "workout_name": "Nome Técnico da Ficha",
    "days_of_week": ["Segunda"],
    "focus_summary": "Resumo técnico do foco biomecânico desta ficha",
    "exercises": [
      { "exercise_id": "UUID-DO-CATALOGO", "default_sets": ${goalParams.compoundSets}, "default_reps": "${goalParams.compoundReps}", "is_superset": false }
    ]
  }
]`

    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]

    const promises = modelsToTry.map(async modelName => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 14000)

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.4
            }
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error?.message || "Erro na API Gemini")
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (!text) throw new Error("Sem texto na resposta")

        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (!jsonMatch) throw new Error("JSON Array não encontrado")
        const parsed = JSON.parse(jsonMatch[0])
        if (!isAiPlanQualityValid(parsed, catalog, isFemale)) {
          throw new Error("Plano da IA não atingiu os critérios biomecânicos de especificidade")
        }
        return parsed as GeneratedWorkout[]
      } catch (e) {
        clearTimeout(timeoutId)
        throw e
      }
    })

    try {
      const aiWorkouts = await Promise.any(promises)
      return NextResponse.json({
        workouts: aiWorkouts,
        meta: expertPlan.meta
      })
    } catch {
      // Usa o motor de periodização biomecânica determinístico caso a API externa falhe ou retorne ficha genérica
      return NextResponse.json({
        workouts: expertPlan.workouts,
        meta: expertPlan.meta
      })
    }
  } catch (error: any) {
    console.error("Erro em /api/generate-workout:", error)
    return NextResponse.json({ error: error.message || "Falha ao processar ficha" }, { status: 500 })
  }
}
