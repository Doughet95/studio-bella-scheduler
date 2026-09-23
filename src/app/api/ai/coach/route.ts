import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { exerciseId, exerciseName, currentLogs } = await req.json()

    // Lógica simples do Coach (Heurística Base) - Pode ser substituída por OpenAI GPT-4 no futuro!
    
    // Pega apenas as séries que já foram preenchidas
    const validLogs = currentLogs.filter((log: any) => log.reps !== "" && log.weight !== "")

    if (validLogs.length === 0) {
      return NextResponse.json({ tip: `Concentre-se na execução perfeita do ${exerciseName}. Respire e vamos lá!` })
    }

    // Pega a última série feita
    const lastLog = validLogs[validLogs.length - 1]
    
    let tip = ""

    if (lastLog.reps >= 12) {
      tip = `Excelente! Você fez ${lastLog.reps} reps com ${lastLog.weight}kg. Se estiver fácil, tente aumentar a carga em 1kg a 2kg na próxima série.`
    } else if (lastLog.reps >= 8) {
      tip = `Boa série! ${lastLog.reps} reps é a faixa ideal para hipertrofia. Tente manter essa carga ou fazer mais 1 repetição.`
    } else {
      tip = `Você fez ${lastLog.reps} reps. Se foi muito pesado, não há problema em reduzir a carga para garantir a técnica perfeita.`
    }

    return NextResponse.json({ tip })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ tip: "Foque no movimento, você consegue!" })
  }
}
