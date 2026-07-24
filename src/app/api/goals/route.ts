import { NextResponse } from 'next/server'
import { mockDb, Goal } from '@/lib/mock-db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  return NextResponse.json({ data: mockDb.goals })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    
    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      name: body.name,
      target_amount: body.target_amount ? Number(body.target_amount) : null,
      current_amount: body.current_amount ? Number(body.current_amount) : 0
    }

    mockDb.goals.push(newGoal)
    
    return NextResponse.json({ data: newGoal })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar meta' }, { status: 400 })
  }
}
