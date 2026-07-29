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
    .eq('family_id', session.user.familyId)
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
    let finalCategory = 'Essencial'
    
    if (body.type === 'income') {
      autoNecessity = 'none'
      finalCategory = 'Renda'
    } else if (body.type === 'reserve') {
      autoNecessity = 'investment'
      finalCategory = 'Reserva'
    } else {
      finalCategory = body.category || 'Outros'
      
      const essentialCategories = [
        'Mercado', 'Farmácia', 'Padaria', 'Combustível', 'Transporte', 
        'Saúde', 'Moradia', 'Contas da Casa', 'Educação', 'Pets', 
        'Casa', 'Cartão de Crédito', 'Impostos/Taxas'
      ]
      const investmentCategories = ['Investimentos']
      
      if (essentialCategories.includes(finalCategory)) {
        autoNecessity = 'essential'
      } else if (investmentCategories.includes(finalCategory)) {
        autoNecessity = 'investment'
      } else {
        autoNecessity = 'unnecessary'
      }
    }
    
    const paymentMethod = body.type === 'expense' ? (body.paymentMethod || null) : null
    const newTransaction = {
      date: body.date,
      amount: Number(body.amount),
      description: body.description,
      category: finalCategory,
      type: body.type,
      necessity: autoNecessity,
      author_name: session.user.name || 'Desconhecido',
      payment_method: paymentMethod,
      is_paid: paymentMethod === 'Cartão de Crédito' ? false : true,
      card_name: paymentMethod === 'Cartão de Crédito' ? (body.cardName || null) : null,
      goal_id: body.type === 'reserve' ? (body.goalId || null) : null,
      family_id: session.user.familyId
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
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao criar transação' }, { status: 400 })
  }
}
