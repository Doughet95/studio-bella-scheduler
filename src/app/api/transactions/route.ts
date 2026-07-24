import { NextResponse } from 'next/server'
import { mockDb, Transaction } from '@/lib/mock-db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const sorted = [...mockDb.transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return NextResponse.json({ data: sorted })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    
    // Motor de Classificação Automática
    let autoNecessity: 'essential' | 'unnecessary' | 'investment' | 'none' = 'essential'
    
    if (body.type === 'income') {
      autoNecessity = 'none'
    } else {
      const desc = body.description.toLowerCase()
      
      // Dicionário de palavras-chave para gastos desnecessários / evitáveis
      const unnecessaryKeywords = [
        'ifood', 'uber', '99', 'shopee', 'shein', 'aliexpress', 
        'netflix', 'spotify', 'amazon prime', 'cinema', 'ingresso', 
        'bar', 'cerveja', 'lanche', 'pizza', 'mcdonalds', 'bk', 'burger',
        'sorvete', 'doce', 'shopping', 'roupa', 'sapato'
      ]
      
      // Dicionário para investimentos/educação
      const investmentKeywords = [
        'curso', 'livro', 'treinamento', 'poupança', 'tesouro', 'ações'
      ]

      if (unnecessaryKeywords.some(keyword => desc.includes(keyword))) {
        autoNecessity = 'unnecessary'
      } else if (investmentKeywords.some(keyword => desc.includes(keyword))) {
        autoNecessity = 'investment'
      }
    }
    
    const newTransaction: Transaction = {
      id: `tx-${Date.now()}`,
      date: body.date,
      amount: Number(body.amount),
      description: body.description,
      category: body.type === 'income' ? 'Renda' : (autoNecessity === 'unnecessary' ? 'Lazer/Supérfluo' : 'Essencial'),
      type: body.type,
      necessity: autoNecessity,
      created_at: new Date().toISOString(),
      authorName: session.user.name || 'Desconhecido'
    }

    mockDb.transactions.push(newTransaction)
    
    return NextResponse.json({ data: newTransaction })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar transação' }, { status: 400 })
  }
}
