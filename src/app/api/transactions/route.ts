import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Se o Supabase não estiver configurado ainda, evita quebrar a tela retornando vazio
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ data: [] })
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    
    let autoNecessity: 'essential' | 'unnecessary' | 'investment' | 'none' = 'essential'
    
    if (body.type === 'income') {
      autoNecessity = 'none'
    } else {
      const desc = body.description.toLowerCase()
      const unnecessaryKeywords = [
        'ifood', 'uber', '99', 'shopee', 'shein', 'aliexpress', 
        'netflix', 'spotify', 'amazon prime', 'cinema', 'ingresso', 
        'bar', 'cerveja', 'lanche', 'pizza', 'mcdonalds', 'bk', 'burger',
        'sorvete', 'doce', 'shopping', 'roupa', 'sapato', 'padaria', 'lanchonete', 'bobs'
      ]
      const investmentKeywords = ['curso', 'livro', 'treinamento', 'poupança', 'tesouro', 'ações']

      if (unnecessaryKeywords.some(keyword => desc.includes(keyword))) {
        autoNecessity = 'unnecessary'
      } else if (investmentKeywords.some(keyword => desc.includes(keyword))) {
        autoNecessity = 'investment'
      }
    }
    
    const paymentMethod = body.type === 'expense' ? (body.paymentMethod || null) : null
    const newTransaction = {
      date: body.date,
      amount: Number(body.amount),
      description: body.description,
      category: body.type === 'income' ? 'Renda' : (autoNecessity === 'unnecessary' ? 'Lazer/Supérfluo' : 'Essencial'),
      type: body.type,
      necessity: autoNecessity,
      author_name: session.user.name || 'Desconhecido',
      payment_method: paymentMethod,
      is_paid: paymentMethod === 'Cartão de Crédito' ? false : true,
      card_name: paymentMethod === 'Cartão de Crédito' ? (body.cardName || null) : null,
      goal_id: body.type === 'reserve' ? (body.goalId || null) : null
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ error: 'Banco de dados não configurado' }, { status: 500 })
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert([newTransaction])
      .select()
      .single()
      
    if (error) throw error

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao criar transação' }, { status: 400 })
  }
}
