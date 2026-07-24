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
    
    const newTransaction: Transaction = {
      id: `tx-${Date.now()}`,
      date: body.date,
      amount: Number(body.amount),
      description: body.description,
      category: body.category,
      type: body.type,
      necessity: body.necessity || 'none',
      created_at: new Date().toISOString()
    }

    mockDb.transactions.push(newTransaction)
    
    return NextResponse.json({ data: newTransaction })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar transação' }, { status: 400 })
  }
}
