import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: 'Banco de dados não configurado' }, { status: 500 })
  }

  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', params.id)
      .eq('family_id', session.user.familyId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao excluir transação' }, { status: 400 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    
    // Recalculate category and necessity if it's an expense
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
    
    const updateData = {
      date: body.date,
      amount: Number(body.amount),
      description: body.description,
      category: body.type === 'income' ? 'Renda' : (autoNecessity === 'unnecessary' ? 'Lazer/Supérfluo' : 'Essencial'),
      type: body.type,
      necessity: autoNecessity,
      payment_method: paymentMethod,
      card_name: paymentMethod === 'Cartão de Crédito' ? (body.cardName || null) : null,
      goal_id: body.type === 'reserve' ? (body.goalId || null) : null
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', params.id)
      .eq('family_id', session.user.familyId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao atualizar transação' }, { status: 400 })
  }
}
