import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: 'Banco de dados não configurado' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const { storeName, amount } = body

    if (!storeName || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Dados inválidos para o pagamento' }, { status: 400 })
    }

    // Buscar todas as compras não pagas desta loja no crediário
    const { data: transactions, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('payment_method', 'Crediário')
      .eq('card_name', storeName)
      .eq('is_paid', false)
      .eq('family_id', session.user.familyId)
      .order('date', { ascending: true }) // Mais antigas primeiro

    if (fetchError) throw fetchError

    let remainingPayment = amount

    for (const t of transactions) {
      if (remainingPayment <= 0) break

      const totalDueForThis = t.amount - (t.paid_amount || 0)
      
      // Quanto podemos abater desta transação?
      const amountToAbate = Math.min(totalDueForThis, remainingPayment)
      
      const newPaidAmount = (t.paid_amount || 0) + amountToAbate
      const isNowFullyPaid = newPaidAmount >= t.amount

      const paymentRecord = {
        date: new Date().toISOString(),
        amount: amountToAbate
      }
      
      const newHistory = [...(t.payment_history || []), paymentRecord]

      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          paid_amount: newPaidAmount,
          is_paid: isNowFullyPaid,
          payment_history: newHistory
        })
        .eq('id', t.id)

      if (updateError) throw updateError

      remainingPayment -= amountToAbate
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao pagar crediário' }, { status: 400 })
  }
}
