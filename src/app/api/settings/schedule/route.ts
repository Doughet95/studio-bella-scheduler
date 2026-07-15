import { NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

export async function GET() {
  return NextResponse.json({ data: mockDb.weeklySchedule })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    // Update the mock DB
    mockDb.weeklySchedule = { ...mockDb.weeklySchedule, ...body }
    return NextResponse.json({ data: mockDb.weeklySchedule })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao processar dados' }, { status: 400 })
  }
}
