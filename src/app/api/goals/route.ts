import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ data: [] })
  }

  const { data: goals, error } = await supabase
    .from('goals')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch all reserve transactions to calculate current_amount dynamically
  const { data: reserveTransactions } = await supabase
    .from('transactions')
    .select('goal_id, amount')
    .eq('type', 'reserve')

  const enrichedGoals = (goals || []).map(goal => {
    const reservesForGoal = (reserveTransactions || []).filter(t => t.goal_id === goal.id)
    const sumOfReserves = reservesForGoal.reduce((acc, curr) => acc + curr.amount, 0)
    // The current_amount in DB acts as an initial baseline (if any)
    return {
      ...goal,
      current_amount: (goal.current_amount || 0) + sumOfReserves
    }
  })

  return NextResponse.json({ data: enrichedGoals })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    
    const newGoal = {
      name: body.name,
      target_amount: body.target_amount ? Number(body.target_amount) : null,
      current_amount: body.current_amount ? Number(body.current_amount) : 0
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ error: 'Banco de dados não configurado' }, { status: 500 })
    }

    const { data, error } = await supabase
      .from('goals')
      .insert([newGoal])
      .select()
      .single()
      
    if (error) throw error

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao criar meta' }, { status: 400 })
  }
}
