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
    
    const updateData = {
      date: body.date,
      amount: Number(body.amount),
      description: body.description,
      category: finalCategory,
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
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao atualizar transação' }, { status: 400 })
  }
}
