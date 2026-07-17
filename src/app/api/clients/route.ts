import { NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Retorna os clientes cadastrados em ordem decrescente (mais recentes primeiro)
  const sortedClients = [...mockDb.clients].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return NextResponse.json({ data: sortedClients })
}
