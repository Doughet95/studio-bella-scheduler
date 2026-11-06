import { NextResponse } from "next/server"

type SetEntry = {
  set_number: number
  reps: number | ""
  weight: number | ""
}

function getBiomechanicsGuide(exerciseName: string, targetMuscle: string): {
  execution: string
  safety: string
} {
  const n = exerciseName.toLowerCase()
  const m = (targetMuscle || "").toLowerCase()

  if (n.includes("extensora")) {
    return {
      execution:
        "Ajuste o encosto para que a articulação do joelho fique exatamente alinhada ao eixo de rotação da máquina. Na fase concêntrica (subida), estenda completamente os joelhos e sustente 1 segundo de contração máxima no quadríceps; na fase excêntrica (descida), controle o retorno em 2 a 3 segundos sem deixar os pesos baterem.",
      safety:
        "Mantenha o quadril e a lombar firmemente apoiados no banco (use os apoios laterais para puxar o quadril para baixo). Evite usar impulso nos primeiros graus do movimento para proteger o tendão patelar."
    }
  }

  if (n.includes("leg press") || n.includes("leg 45")) {
    return {
      execution:
        "Posicione os pés na largura dos ombros com as pontas levemente voltadas para fora, acompanhando a linha dos joelhos. Desça a plataforma de forma controlada (2 a 3s) até atingir cerca de 90° ou o limite onde a pelve permanece colada ao encosto.",
      safety:
        "Jamais hiperestenda (trave) os joelhos no topo do movimento e não permita que o quadril desprenda do banco na parte baixa (retroversão pélvica), preservando os discos lombares."
    }
  }

  if (n.includes("flexora") || n.includes("mesa flexora") || n.includes("cadeira flexora")) {
    return {
      execution:
        "Alinhe o eixo da máquina ao joelho e mantenha o rolo apoiado logo acima do tendão de Aquiles. Concentre-se em puxar o rolo ativando os isquiotibiais, segurando uma breve pausa no pico de flexão antes de retornar devagar.",
      safety:
        "Evite arquear a coluna lombar ou levantar o quadril do apoio para tentar vencer a carga no final da série. Se o quadril subir, a carga está acima do ideal para isolamento muscular."
    }
  }

  if (n.includes("agachamento") || n.includes("hack")) {
    return {
      execution:
        "Mantenha o core firme (bracing abdominal), peito aberto e inicie o movimento flexionando simultaneamente quadril e joelhos. Empurre o chão distribuindo a força pelo meio do pé e calcanhar.",
      safety:
        "Certifique-se de que os joelhos acompanhem a direção da ponta dos pés sem colapsar para dentro (valgo dinâmico). Respeite sua mobilidade de tornozelo e quadril para manter a coluna neutra."
    }
  }

  if (n.includes("stiff") || n.includes("terra") || n.includes("levantamento")) {
    return {
      execution:
        "Realize o movimento como uma dobradiça de quadril (hip hinge): projete o quadril para trás mantendo os joelhos levemente semiflexionados e a barra/halteres rente às pernas durante todo o trajeto.",
      safety:
        "Mantenha as escápulas firmes e a coluna vertebral totalmente neutra. Desça apenas até o ponto em que sente o alongamento máximo dos posteriores de coxa sem arredondar a lombar."
    }
  }

  if (n.includes("supino")) {
    return {
      execution:
        "Faça a retração e depressão escapular (ombros para trás e para baixo, firmes no banco) antes de tirar o peso. Desça de forma controlada em direção à linha inferior do peitoral com os cotovelos a cerca de 45° a 60° em relação ao tronco.",
      safety:
        "Evite abrir os cotovelos a 90° na linha dos ombros, pois isso aumenta o impacto subacromial e a sobrecarga no manguito rotador. Mantenha os punhos firmes e neutros."
    }
  }

  if (n.includes("crucifixo") || n.includes("fly") || n.includes("voador") || n.includes("pec deck")) {
    return {
      execution:
        "Mantenha uma leve semiflexão constante nos cotovelos e foque em aproximar os braços pensando em unir os cotovelos à frente do peitoral, valorizando o alongamento controlado na fase excêntrica.",
      safety:
        "Na fase de abertura (alongamento), não deixe os cotovelos passarem excessivamente da linha do tronco para evitar tensão articular desnecessária na cápsula anterior do ombro."
    }
  }

  if (n.includes("desenvolvimento") || n.includes("militar") || n.includes("arnold")) {
    return {
      execution:
        "Mantenha o abdômen contraído e os antebraços verticais embaixo da carga. Trabalhe no plano escapular (cotovelos levemente à frente da linha lateral do tronco, cerca de 30°), subindo com controle até próximo da extensão.",
      safety:
        "Evite hiperestender a coluna lombar quando a carga ficar pesada nas últimas repetições. Se precisar jogar o tronco para trás, reduza levemente o peso para manter a tensão nos deltoides."
    }
  }

  if (n.includes("elevação lateral") || n.includes("elevacao lateral")) {
    return {
      execution:
        "Inicie a abdução dos ombros conduzindo o movimento pelos cotovelos (não pelas mãos) até a linha dos ombros, com o tronco levemente inclinado à frente ou no plano escapular.",
      safety:
        "Evite usar balanço do quadril (impulso) ou encolher o trapézio superior durante a subida. Uma carga moderada com cadência controlada gera muito mais recrutamento do deltoide lateral."
    }
  }

  if (n.includes("remada") || n.includes("serrote") || n.includes("cavalinho")) {
    return {
      execution:
        "Inicie cada repetição destravando e retraindo as escápulas antes de flexionar os cotovelos, puxando a carga em direção à linha inferior do tronco/abdômen e segurando 1s na contração máxima das costas.",
      safety:
        "Evite puxar apenas com a força dos bíceps ou arredondar a região torácica/lombar. O foco deve ser a movimentação limpa das escápulas."
    }
  }

  if (n.includes("puxada") || n.includes("pulley") && m.includes("costas") || n.includes("barra fixa")) {
    return {
      execution:
        "Deprima as escápulas (abaixe os ombros longe das orelhas) e puxe a barra em direção à parte superior do peitoral, mantendo os cotovelos apontados para baixo em direção ao quadril.",
      safety:
        "Evite jogar o corpo exageradamente para trás transformando a puxada vertical em impulso lombar, e nunca puxe a barra por trás da nuca para preservar a coluna cervical e os ombros."
    }
  }

  if (n.includes("tríceps") || n.includes("triceps") || n.includes("testa") || n.includes("francês")) {
    return {
      execution:
        "Estabilize os cotovelos fixos ao lado do tronco (ou alinhados acima da cabeça no francês), permitindo que apenas o antebraço se mova. Estenda completamente na fase final para ativar todas as cabeças do tríceps.",
      safety:
        "Não deixe os cotovelos abrirem ou se deslocarem para frente e para trás usando o peitoral/ombro para empurrar o peso. Se houver desconforto no cotovelo, priorize um aquecimento articular prévio."
    }
  }

  if (n.includes("rosca") || n.includes("bíceps") || n.includes("biceps") || n.includes("scott")) {
    return {
      execution:
        "Mantenha as escápulas estabilizadas e os cotovelos fixos ao lado das costelas. Realize a flexão completa do cotovelo sem jogar os ombros para frente no topo do movimento e desça resistindo à gravidade.",
      safety:
        "Evite o balanço lombar (roubo) para subir a carga e mantenha os punhos firmes para prevenir sobrecarga nos tendões do antebraço (epicondilite)."
    }
  }

  return {
    execution: `Mantenha postura estável e foco total no recrutamento de ${targetMuscle || "músculo alvo"}. Utilize uma cadência controlada (cerca de 1 a 2 segundos na fase de força e 2 a 3 segundos segurando a volta do peso) em toda a amplitude segura do movimento.`,
    safety:
      "Priorize sempre a precisão biomecânica antes do aumento bruto de carga. A falha deve ser técnica (quando não é mais possível manter a postura limpa), preservando suas articulações."
  }
}

function parseTargetRange(targetReps?: string): { min: number; max: number } {
  if (!targetReps) return { min: 8, max: 12 }
  const nums = targetReps.match(/\d+/g)?.map(Number) || []
  if (nums.length >= 2) {
    return { min: Math.min(nums[0], nums[1]), max: Math.max(nums[0], nums[1]) }
  }
  if (nums.length === 1) {
    return { min: Math.max(1, nums[0] - 2), max: nums[0] }
  }
  return { min: 8, max: 12 }
}

function buildExpertAnalysis(params: {
  exerciseName: string
  targetMuscle: string
  targetReps: string
  defaultSets: number
  validLogs: { set_number: number; reps: number; weight: number }[]
  previousLogs: { set_number: number; reps: number; weight: number }[]
}): string {
  const { exerciseName, targetMuscle, targetReps, defaultSets, validLogs, previousLogs } = params
  const { min: minTarget, max: maxTarget } = parseTargetRange(targetReps)
  const bio = getBiomechanicsGuide(exerciseName, targetMuscle)

  // Caso ainda não tenha preenchido nenhuma série hoje
  if (validLogs.length === 0) {
    let prevText = `Para a meta de ${targetReps || "8-12"} repetições neste exercício, escolha uma carga inicial em que você consiga finalizar a 1ª série restando cerca de 1 a 2 repetições na reserva (RIR 1-2) com técnica impecável.`
    if (previousLogs && previousLogs.length > 0) {
      const prevSummary = previousLogs.map(p => `${p.set_number}ª: ${p.reps}x${p.weight}kg`).join(", ")
      const maxPrevWeight = Math.max(...previousLogs.map(p => Number(p.weight) || 0))
      prevText = `No seu último registro você realizou (${prevSummary}), atingindo pico de ${maxPrevWeight}kg. Hoje, inicie sua 1ª série de trabalho buscando manter ou superar em 1 repetição essa marca dentro da faixa alvo de ${targetReps || "8-12"} reps.`
    }

    return [
      `📊 Planejamento de Carga: ${prevText}`,
      `🎯 Biomecânica e Execução: ${bio.execution}`,
      `🛡️ Orientação Ética e Articular: ${bio.safety}`
    ].join("\n\n")
  }

  // Análise detalhada de todas as séries preenchidas hoje
  const firstSet = validLogs[0]
  const lastSet = validLogs[validLogs.length - 1]
  const weights = validLogs.map(l => l.weight)
  const repsList = validLogs.map(l => l.reps)
  const maxWeightToday = Math.max(...weights)
  const minWeightToday = Math.min(...weights)
  const isPyramidUp = validLogs.length >= 2 && lastSet.weight > firstSet.weight
  const completedAllSets = validLogs.length >= (defaultSets || 3)

  let performanceAnalysis = ""

  if (isPyramidUp) {
    const setsDesc = validLogs.map(l => `${l.reps} reps com ${l.weight}kg`).join(" → ")
    if (firstSet.reps > maxTarget && lastSet.reps >= minTarget && lastSet.reps <= maxTarget) {
      performanceAnalysis = `Você aplicou uma progressão piramidal crescente excelente (${setsDesc}). As séries iniciais com ${firstSet.reps} reps serviram como preparação neuromotora e, na série de topo com ${lastSet.weight}kg, você cravou ${lastSet.reps} repetições — exatamente dentro da janela alvo de hipertrofia (${targetReps} reps). ${
        completedAllSets
          ? `Para o próximo treino, como você já domina ${lastSet.weight}kg para ${lastSet.reps} reps, experimente iniciar suas séries principais já com cerca de ${
              validLogs[1]?.weight || lastSet.weight
            }kg após 1 série de aquecimento, otimizando o volume efetivo.`
          : `Para a próxima série, mantenha ${lastSet.weight}kg buscando permanecer entre ${minTarget} e ${maxTarget} repetições.`
      }`
    } else if (lastSet.reps > maxTarget) {
      performanceAnalysis = `Você subiu a carga progressivamente (${setsDesc}), mas mesmo na série mais pesada (${lastSet.weight}kg) realizou ${lastSet.reps} repetições, acima do teto proposto de ${maxTarget} reps. Isso indica que sua força atual já supera essa carga: ${
        completedAllSets
          ? `no próximo treino, inicie as séries de trabalho a partir de ${lastSet.weight}kg para trabalhar de fato na faixa de ${targetReps} repetições.`
          : `na próxima série, você pode ajustar a carga em +2kg a +5kg com segurança, desde que mantenha o controle excêntrico.`
      }`
    } else {
      performanceAnalysis = `Você realizou uma progressão de carga (${setsDesc}) chegando a ${lastSet.reps} repetições com ${lastSet.weight}kg (abaixo do mínimo alvo de ${minTarget} reps). Isso mostra que ${lastSet.weight}kg exigiu esforço máximo próximo da falha: ${
        completedAllSets
          ? `no próximo treino, consolide a carga de ${lastSet.weight}kg buscando ganhar 1 a 2 repetições com boa amplitude antes de subir o peso novamente.`
          : `para a próxima série, mantenha ou reduza levemente (5% a 10%) para recuperar a faixa de ${minTarget} a ${maxTarget} repetições.`
      }`
    }
  } else {
    // Carga linear / mantida ou regressiva
    const setsDesc = validLogs.map(l => `${l.set_number}ª: ${l.reps}x${l.weight}kg`).join(" • ")
    if (lastSet.reps > maxTarget) {
      performanceAnalysis = `Nas séries registradas (${setsDesc}), você superou o limite superior da faixa alvo (${targetReps} reps) fazendo ${lastSet.reps} repetições com ${lastSet.weight}kg. Sob o ponto de vista fisiológico, quando ultrapassamos ${maxTarget} reps com margem, o estímulo migra para resistência muscular: ${
        completedAllSets
          ? `na próxima sessão, ajuste a carga inicial em cerca de 5% a 10% para trabalhar com maior tensão mecânica dentro de ${minTarget}-${maxTarget} reps.`
          : `na próxima série, um incremento moderado de carga colocará você exatamente na zona alvo de ${minTarget}-${maxTarget} reps.`
      }`
    } else if (lastSet.reps >= minTarget && lastSet.reps <= maxTarget) {
      const repDrop = firstSet.reps - lastSet.reps
      performanceAnalysis = `Excelente consistência de série (${setsDesc})! Você manteve a carga de ${lastSet.weight}kg dentro da janela ideal de ${targetReps} repetições${
        repDrop > 0
          ? `, com uma queda natural de ${repDrop} repetição(ões) causada pela fadiga acumulada entre as séries`
          : ""
      }. ${
        completedAllSets
          ? `Você concluiu todas as ${validLogs.length} séries no alvo: no próximo treino, tente progredir 1 repetição em cada série com ${lastSet.weight}kg antes de elevar a carga.`
          : `Mantenha ${lastSet.weight}kg na próxima série respeitando 60s a 90s de descanso para sustentar a qualidade das repetições.`
      }`
    } else {
      performanceAnalysis = `Registro atual (${setsDesc}): na última série você atingiu ${lastSet.reps} repetições com ${lastSet.weight}kg, ficando abaixo da faixa proposta de ${minTarget}-${maxTarget} reps. Isso indica alta fadiga periférica ou carga momentaneamente acima da faixa: ${
        completedAllSets
          ? `no próximo treino, mantenha essa faixa de peso ou reduza 2kg a 4kg nas séries finais para acumular mais volume limpo dentro de ${targetReps} reps.`
          : `aumente o intervalo de descanso para 90s-120s ou reduza cerca de 10% da carga na próxima série para preservar a mecânica do movimento.`
      }`
    }
  }

  // Comparação com o treino anterior se existir
  if (previousLogs && previousLogs.length > 0) {
    const prevMaxWeight = Math.max(...previousLogs.map(p => Number(p.weight) || 0))
    if (maxWeightToday > prevMaxWeight && prevMaxWeight > 0) {
      performanceAnalysis += ` Além disso, você registrou uma evolução real de +${
        maxWeightToday - prevMaxWeight
      }kg na carga máxima em relação ao seu último treino (${prevMaxWeight}kg → ${maxWeightToday}kg)!`
    }
  }

  return [
    `📊 Análise de Desempenho e Progressão: ${performanceAnalysis}`,
    `🎯 Biomecânica e Execução (${exerciseName}): ${bio.execution}`,
    `🛡️ Conduta Ética e Segurança: ${bio.safety}`
  ].join("\n\n")
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      exerciseName = "Exercício",
      targetMuscle = "Geral",
      targetReps = "08-12",
      defaultSets = 3,
      currentLogs = [],
      previousLogs = []
    } = body

    const validLogs = (currentLogs as SetEntry[])
      .filter(log => log.reps !== "" && log.weight !== "")
      .map(log => ({
        set_number: Number(log.set_number),
        reps: Number(log.reps),
        weight: Number(log.weight)
      }))

    const validPrevLogs = Array.isArray(previousLogs)
      ? previousLogs.map((p: any) => ({
          set_number: Number(p.set_number),
          reps: Number(p.reps),
          weight: Number(p.weight)
        }))
      : []

    // Prepara a análise técnica estruturada como base/fallback imediato
    const structuredFallback = buildExpertAnalysis({
      exerciseName,
      targetMuscle,
      targetReps,
      defaultSets: Number(defaultSets) || 3,
      validLogs,
      previousLogs: validPrevLogs
    })

    const apiKey = process.env.GEMINI_API_KEY || ""
    if (!apiKey) {
      return NextResponse.json({ tip: structuredFallback })
    }

    const currentSetsText =
      validLogs.length > 0
        ? validLogs.map(l => `Série ${l.set_number}: ${l.reps} repetições com ${l.weight}kg`).join(" | ")
        : "Nenhuma série preenchida ainda neste treino."

    const prevSetsText =
      validPrevLogs.length > 0
        ? validPrevLogs.map(l => `Série ${l.set_number}: ${l.reps} repetições com ${l.weight}kg`).join(" | ")
        : "Sem registro de treino anterior."

    const prompt = `Você é um Treinador de Musculação Certificado (CREF) e Especialista em Biomecânica e Fisiologia do Exercício.
Forneça uma análise técnica, ética, explicativa e personalizada em Português do Brasil para o aluno que está executando o exercício abaixo.
NÃO use frases genéricas ou simplórias. Analise TODAS as séries que ele preencheu em conjunto (observando se houve pirâmide de peso, se as repetições ficaram acima/dentro/abaixo da faixa alvo, se ele já completou todas as séries previstas ou se ainda há séries restantes, e compare com o treino anterior).

Dados do Exercício:
- Nome do Exercício: ${exerciseName}
- Músculo Alvo: ${targetMuscle}
- Meta da Ficha: ${defaultSets} séries de ${targetReps} repetições
- Séries realizadas HOJE até o momento (${validLogs.length} de ${defaultSets} séries): ${currentSetsText}
- Séries realizadas no ÚLTIMO TREINO: ${prevSetsText}

Estruture sua resposta EXATAMENTE nestes 3 parágrafos curtos e diretos (use os emojis indicados no início de cada parágrafo, sem usar asteriscos de markdown **):

📊 Análise de Desempenho e Progressão: (Analise tecnicamente os números de todas as séries feitas hoje em relação à meta de ${targetReps} reps e ao treino anterior, explicando por que a progressão dele foi boa ou como ajustar a carga/repetições de forma inteligente para a próxima série ou próximo treino).

🎯 Biomecânica e Execução: (Explique de forma profissional como otimizar a postura, o alinhamento articular, a cadência excêntrica/concêntrica e a ativação de ${targetMuscle} especificamente no exercício ${exerciseName}).

🛡️ Conduta Ética e Segurança: (Dê uma orientação ética e responsável sobre controle de movimento, percepção de esforço e preservação articular específica para este movimento).`

    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]

    const promises = modelsToTry.map(async modelName => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 9000)

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.45,
              maxOutputTokens: 550
            }
          }),
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error?.message || "Erro Gemini")
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (text && text.trim().length > 60) {
          return text.replace(/\*\*/g, "").trim()
        }
        throw new Error("Resposta vazia")
      } catch (e) {
        clearTimeout(timeoutId)
        throw e
      }
    })

    try {
      const aiResponse = await Promise.any(promises)
      return NextResponse.json({ tip: aiResponse })
    } catch {
      return NextResponse.json({ tip: structuredFallback })
    }
  } catch (error) {
    console.error("Erro na rota /api/ai/coach:", error)
    return NextResponse.json({
      tip: "📊 Análise Técnica: Mantenha o controle rigoroso da cadência (2 a 3 segundos na fase excêntrica) e priorize a amplitude completa antes de elevar a carga."
    })
  }
}
