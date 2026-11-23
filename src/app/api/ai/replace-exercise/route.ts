import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

type CatalogExercise = {
  id: string
  name: string
  target_muscle: string
}

function normalize(str: string): string {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

// Grupos de equivalência biomecânica (mesmo padrão articular, vetor de força e grupamento muscular,
// priorizando halteres, barras livres e polias caso o aparelho específico não exista na academia)
const BIOMECHANICAL_CLUSTERS: {
  id: string
  label: string
  rationale: string
  matchKeywords: string[]
  preferredAlternatives: string[]
}[] = [
  {
    id: "shoulder_abduction",
    label: "Abdução de Ombro (Deltoide Lateral)",
    rationale: "Mantém exatamente o movimento de abdução de ombro no plano escapular com foco na porção lateral do deltoide.",
    matchKeywords: ["elevacao lateral", "abducao de ombro"],
    preferredAlternatives: [
      "Elevação Lateral",
      "Elevação lateral Polia",
      "Elevação lateral Máquina",
      "Remada alta aberta"
    ]
  },
  {
    id: "shoulder_press",
    label: "Desenvolvimento Vertical de Ombros",
    rationale: "Preserva a biomecânica de pressão vertical (abdução e flexão de ombro com extensão de cotovelo) para deltoide anterior e médio.",
    matchKeywords: ["desenvolvimento", "militar", "arnold"],
    preferredAlternatives: [
      "Desenvolvimento com Halteres",
      "Desenvolvimento Militar",
      "Elevação Frontal com Halteres"
    ]
  },
  {
    id: "rear_delt",
    label: "Abdução Horizontal / Deltoide Posterior",
    rationale: "Mantém a extensão horizontal do ombro focada no deltoide posterior e estabilizadores escapulares.",
    matchKeywords: ["posterior ombro", "face pull"],
    preferredAlternatives: [
      "Face Pull na Polia com Corda",
      "Posterior ombro",
      "Remada alta aberta"
    ]
  },
  {
    id: "hip_extension_glute_max",
    label: "Extensão de Quadril (Foco Glúteo Máximo)",
    rationale: "Mantém o vetor horizontal/axial de extensão máxima de quadril para recrutamento direto do glúteo máximo.",
    matchKeywords: ["elevacao pelvica", "coice", "gluteo na polia", "4 apoios", "banco romano"],
    preferredAlternatives: [
      "Elevação Pélvica com Barra",
      "Glúteo na Polia Baixa (Coice no Cabo)",
      "Elevação Pélvica na Máquina",
      "Extensão de Quadril no Banco Romano (Foco Glúteo)",
      "Glúteo 4 Apoios / Máquina Glúteo",
      "Agachamento Sumô com Halter ou Barra"
    ]
  },
  {
    id: "hip_abduction_glute_med",
    label: "Abdução de Quadril (Glúteo Médio e Mínimo)",
    rationale: "Preserva a abdução de quadril para fortalecimento e projeção lateral do glúteo médio e mínimo.",
    matchKeywords: ["abdutora", "abducao de quadril"],
    preferredAlternatives: [
      "Abdução de Quadril na Polia Baixa",
      "Cadeira Abdutora",
      "Cadeira Abdutora com Tronco Inclinado",
      "Glúteo na Polia Baixa (Coice no Cabo)",
      "Agachamento Sumô com Halter ou Barra"
    ]
  },
  {
    id: "hip_adduction",
    label: "Adução de Quadril (Adutores de Coxa)",
    rationale: "Trabalha a musculatura adutora (parte interna da coxa) com estabilidade pélvica.",
    matchKeywords: ["adutora", "aducao"],
    preferredAlternatives: [
      "Agachamento Sumô com Halter ou Barra",
      "Levantamento Terra Sumô",
      "Cadeira Adutora",
      "Leg Press"
    ]
  },
  {
    id: "knee_dominant_squat",
    label: "Dominância de Joelho Bilateral (Quadríceps e Glúteos)",
    rationale: "Mantém o padrão multiarticular de extensão simultânea de joelhos e quadril para quadríceps e glúteos.",
    matchKeywords: ["agachamento livre", "agachamento hack", "agachamento no smith", "agachamento(livre", "leg press"],
    preferredAlternatives: [
      "Agachamento Livre",
      "Leg Press",
      "Agachamento no Smith",
      "Agachamento Hack Machine",
      "Agachamento Sumô com Halter ou Barra",
      "Afundo / Passada com Halteres"
    ]
  },
  {
    id: "unilateral_legs",
    label: "Dominância Unilateral de Membros Inferiores",
    rationale: "Preserva o trabalho unilateral de quadríceps e glúteo com alto recrutamento de estabilizadores do quadril.",
    matchKeywords: ["bulgaro", "afundo", "passada", "recuo no smith", "leg press unilateral"],
    preferredAlternatives: [
      "Afundo / Passada com Halteres",
      "Agachamento Búlgaro com Halteres",
      "Recuo no Smith (Afundo Guiado)",
      "Leg Press Unilateral",
      "Agachamento no Smith"
    ]
  },
  {
    id: "knee_extension_isolation",
    label: "Isolamento de Quadríceps (Extensão de Joelho)",
    rationale: "Foca diretamente no recrutamento dos quatro ventres do quadríceps.",
    matchKeywords: ["cadeira extensora", "extensora"],
    preferredAlternatives: [
      "Afundo / Passada com Halteres",
      "Leg Press Unilateral",
      "Agachamento Hack Machine",
      "Agachamento no Smith",
      "Cadeira Extensora"
    ]
  },
  {
    id: "knee_flexion_hamstrings",
    label: "Flexão de Joelho (Posteriores de Coxa / Isquiotibiais)",
    rationale: "Mantém o trabalho específico de flexão de joelho e tensão nos isquiotibiais (posteriores de coxa).",
    matchKeywords: ["mesa flexora", "cadeira flexora", "flexora unilateral"],
    preferredAlternatives: [
      "Mesa Flexora",
      "Cadeira Flexora Sentado",
      "Flexora Unilateral",
      "Stiff com Halteres",
      "Stiff"
    ]
  },
  {
    id: "hip_hinge_posterior",
    label: "Dobradiça de Quadril / Hip Hinge (Posteriores e Glúteos)",
    rationale: "Preserva o alongamento sob carga da cadeia posterior através da extensão de quadril com joelhos semiflexionados.",
    matchKeywords: ["stiff", "levantamento terra", "bom dia", "pes altos"],
    preferredAlternatives: [
      "Stiff com Halteres",
      "Stiff",
      "Levantamento Terra Sumô",
      "Bom Dia (Good Morning)",
      "Leg Press 45° Pés Altos (Foco Glúteo/Posterior)",
      "Extensão de Quadril no Banco Romano (Foco Glúteo)"
    ]
  },
  {
    id: "horizontal_press_chest",
    label: "Empurrar Horizontal (Peitoral Médio / Esternal)",
    rationale: "Mantém a adução horizontal de ombro com extensão de cotovelo para volume e força de peitoral.",
    matchKeywords: ["supino reto"],
    preferredAlternatives: [
      "Supino reto (Máquina/Halteres)",
      "Supino Reto com Barra",
      "Crossover"
    ]
  },
  {
    id: "incline_press_chest",
    label: "Empurrar Inclinado (Peitoral Superior / Clavicular)",
    rationale: "Preserva o ângulo inclinado de 30° a 45° focado na porção clavicular (superior) do peitoral.",
    matchKeywords: ["supino inclinado"],
    preferredAlternatives: [
      "Supino Inclinado c/ halteres",
      "Supino Inclinado (Máquina)",
      "Crucifixo inclinado c/ Halter"
    ]
  },
  {
    id: "chest_fly_isolation",
    label: "Adução Horizontal Isolada de Peitoral",
    rationale: "Mantém o isolamento do peitoral através da adução horizontal do úmero com amplo alongamento das fibras.",
    matchKeywords: ["crucifixo", "fly", "crossover", "voador", "pec deck"],
    preferredAlternatives: [
      "Crucifixo c/ Halter",
      "Crossover",
      "Crucifixo inclinado c/ Halter",
      "Fly"
    ]
  },
  {
    id: "vertical_pull_back",
    label: "Puxada Vertical (Expansão de Dorsais / Latíssimo)",
    rationale: "Preserva a adução e extensão vertical do ombro para largura dorsal (formato em V).",
    matchKeywords: ["puxada", "barra fixa", "pulldown"],
    preferredAlternatives: [
      "Puxada Frontal",
      "Puxada Supinada / Triângulo",
      "Puxada Fechada",
      "Pulldown",
      "Barra Fixa"
    ]
  },
  {
    id: "horizontal_row_back",
    label: "Remada Horizontal (Espessura de Costas e Retração Escapular)",
    rationale: "Mantém a tração horizontal com retração escapular para densidade de dorsais, romboides e trapézio médio.",
    matchKeywords: ["remada", "cerrote", "serrote", "cavalinho"],
    preferredAlternatives: [
      "Remada Cerrote",
      "Remada Baixa",
      "Remada Baixa Triangulo",
      "Remada curvada",
      "Remada Cavalinho / Máquina Articulada"
    ]
  },
  {
    id: "elbow_flexion_biceps",
    label: "Flexão de Cotovelo (Bíceps Braquial e Braquiorradial)",
    rationale: "Preserva a flexão isolada de cotovelo com foco máximo nos flexores do braço.",
    matchKeywords: ["biceps", "rosca"],
    preferredAlternatives: [
      "Rosca Direta Alternada",
      "Bíceps Barra W",
      "Rosca Direta",
      "Bíceps Martelo",
      "Rosca Inclinada 45° com Halteres",
      "Rosca Scott (Máquina ou Barra W)",
      "Bíceps Máquina"
    ]
  },
  {
    id: "elbow_extension_triceps",
    label: "Extensão de Cotovelo (Tríceps Braquial)",
    rationale: "Mantém o isolamento das três cabeças do tríceps através da extensão completa do cotovelo.",
    matchKeywords: ["triceps", "testa", "frances"],
    preferredAlternatives: [
      "Tríceps Corda",
      "Tríceps Pulley",
      "Tríceps Testa com Barra W ou Halteres",
      "Tríceps Francês corda",
      "Tríceps Supino Fechado"
    ]
  },
  {
    id: "calves_plantar_flexion",
    label: "Flexão Plantar (Panturrilhas / Gastrocnêmio e Sóleo)",
    rationale: "Preserva a flexão plantar completa do tornozelo para desenvolvimento das panturrilhas.",
    matchKeywords: ["panturrilha"],
    preferredAlternatives: [
      "Panturrilha em pé",
      "Panturrilha Sentado",
      "Panturrilhas Hack"
    ]
  },
  {
    id: "core_abdominals",
    label: "Estabilização e Flexão de Tronco (Abdômen e Core)",
    rationale: "Mantém o recrutamento da parede abdominal e estabilizadores profundos do core.",
    matchKeywords: ["abdominal", "prancha", "core"],
    preferredAlternatives: [
      "Abdominal Supra no Solo ou Máquina",
      "Abdominal Infra (Elevação de Pernas)",
      "Prancha Isométrica Abdominal",
      "Abdominal na Polia Alta (Crunch Cabo)"
    ]
  }
]

function findClusterForExercise(exerciseName: string, targetMuscle: string) {
  const normName = normalize(exerciseName)
  const normMuscle = normalize(targetMuscle)

  for (const cluster of BIOMECHANICAL_CLUSTERS) {
    if (cluster.matchKeywords.some(kw => normName.includes(kw))) {
      return cluster
    }
  }

  // Fallback por músculo alvo
  if (normMuscle.includes("ombro")) return BIOMECHANICAL_CLUSTERS[0]
  if (normMuscle.includes("gluteo")) return BIOMECHANICAL_CLUSTERS[3]
  if (normMuscle.includes("adutor")) return BIOMECHANICAL_CLUSTERS[5]
  if (normMuscle.includes("posterior")) return BIOMECHANICAL_CLUSTERS[9]
  if (normMuscle.includes("quadriceps") || normMuscle.includes("perna")) return BIOMECHANICAL_CLUSTERS[6]
  if (normMuscle.includes("peito")) return BIOMECHANICAL_CLUSTERS[11]
  if (normMuscle.includes("costas")) return BIOMECHANICAL_CLUSTERS[15]
  if (normMuscle.includes("biceps")) return BIOMECHANICAL_CLUSTERS[16]
  if (normMuscle.includes("triceps")) return BIOMECHANICAL_CLUSTERS[17]
  if (normMuscle.includes("abdomen") || normMuscle.includes("core")) return BIOMECHANICAL_CLUSTERS[19]

  return BIOMECHANICAL_CLUSTERS[0]
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      workoutExerciseRowId,
      currentExerciseId,
      currentExerciseName = "",
      targetMuscle = "Geral",
      excludeExerciseIds = []
    } = body

    const { data: allExercises } = await supabase
      .from("exercises")
      .select("id, name, target_muscle")
      .order("name")

    if (!allExercises || allExercises.length === 0) {
      return NextResponse.json({ error: "Catálogo de exercícios indisponível" }, { status: 500 })
    }

    // Deduplica catálogo por nome normalizado (mas garante que o ID escolhido exista no banco)
    const dedupMap = new Map<string, CatalogExercise>()
    for (const ex of allExercises) {
      const k = normalize(ex.name)
      if (!dedupMap.has(k)) {
        dedupMap.set(k, ex)
      }
    }
    const catalog = Array.from(dedupMap.values())

    const excludedIds = new Set<string>([
      ...(Array.isArray(excludeExerciseIds) ? excludeExerciseIds : []),
      currentExerciseId
    ].filter(Boolean))

    const normCurrentName = normalize(currentExerciseName)
    const cluster = findClusterForExercise(currentExerciseName, targetMuscle)

    // Candidatos do mesmo cluster biomecânico que não sejam o exercício atual nem estejam excluídos na ficha
    const clusterCandidates: CatalogExercise[] = []
    for (const prefName of cluster.preferredAlternatives) {
      const normPref = normalize(prefName)
      if (normPref === normCurrentName) continue
      const match = catalog.find(
        c =>
          !excludedIds.has(c.id) &&
          normalize(c.name) !== normCurrentName &&
          (normalize(c.name) === normPref || normalize(c.name).includes(normPref))
      )
      if (match && !clusterCandidates.some(x => x.id === match.id)) {
        clusterCandidates.push(match)
      }
    }

    // Caso todos os preferidos do cluster já estejam na ficha/tentados, busca outros do mesmo músculo alvo
    if (clusterCandidates.length === 0) {
      const normTarget = normalize(targetMuscle)
      const sameMuscle = catalog.filter(
        c =>
          !excludedIds.has(c.id) &&
          normalize(c.name) !== normCurrentName &&
          (normalize(c.target_muscle).includes(normTarget) || normTarget.includes(normalize(c.target_muscle)))
      )
      clusterCandidates.push(...sameMuscle)
    }

    // Se o usuário já ciclou por todas as opções possíveis, permite recomeçar pelas alternativas do cluster (exceto o atual)
    if (clusterCandidates.length === 0) {
      for (const prefName of cluster.preferredAlternatives) {
        const normPref = normalize(prefName)
        if (normPref === normCurrentName) continue
        const match = catalog.find(
          c =>
            c.id !== currentExerciseId &&
            normalize(c.name) !== normCurrentName &&
            (normalize(c.name) === normPref || normalize(c.name).includes(normPref))
        )
        if (match && !clusterCandidates.some(x => x.id === match.id)) {
          clusterCandidates.push(match)
        }
      }
    }

    let chosenExercise: CatalogExercise = clusterCandidates[0] || catalog.find(c => c.id !== currentExerciseId) || catalog[0]
    let aiExplanation = `Substituído por ${chosenExercise.name}: ${cluster.rationale}`

    // Se houver chave Gemini, pede à IA para confirmar o melhor substituto dentre os candidatos disponíveis e gerar uma explicação técnica curta
    const apiKey = process.env.GEMINI_API_KEY || ""
    if (apiKey && clusterCandidates.length > 0) {
      try {
        const candidatesListText = clusterCandidates
          .map(c => `[ID: ${c.id}] ${c.name} (${c.target_muscle})`)
          .join("\n")

        const prompt = `O aluno está na academia e NÃO tem o aparelho ou não pode fazer o exercício "${currentExerciseName}" (Músculo alvo: ${targetMuscle}).
Escolha o MELHOR exercício substituto da lista abaixo que possua a MESMA BIOMECÂNICA e trabalhe o MESMO AGRUPAMENTO MUSCULAR, priorizando halteres, barras livres ou polias mais comuns em qualquer academia.

CANDIDATOS DISPONÍVEIS:
${candidatesListText}

Responda EXCLUSIVAMENTE com um JSON válido neste formato (sem crases):
{
  "exercise_id": "UUID-ESCOLHIDO",
  "reason": "Explicação técnica curta (1 frase) de como este exercício substitui ${currentExerciseName} mantendo a mesma biomecânica."
}`

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.2 }
            }),
            signal: controller.signal
          }
        )
        clearTimeout(timeoutId)
        if (res.ok) {
          const data = await res.json()
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
          const jsonMatch = text.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            const found = clusterCandidates.find(c => c.id === parsed.exercise_id)
            if (found) {
              chosenExercise = found
              if (parsed.reason) aiExplanation = parsed.reason
            }
          }
        }
      } catch {
        // Fallback determinístico já pronto em chosenExercise e aiExplanation
      }
    }

    // Atualiza diretamente na linha workout_exercises do banco caso workoutExerciseRowId tenha sido enviado
    if (workoutExerciseRowId && chosenExercise?.id) {
      await supabase
        .from("workout_exercises")
        .update({ exercise_id: chosenExercise.id })
        .eq("id", workoutExerciseRowId)
    }

    return NextResponse.json({
      exercise: chosenExercise,
      reason: aiExplanation,
      clusterLabel: cluster.label
    })
  } catch (error: any) {
    console.error("Erro em /api/ai/replace-exercise:", error)
    return NextResponse.json(
      { error: error.message || "Falha ao substituir exercício" },
      { status: 500 }
    )
  }
}
