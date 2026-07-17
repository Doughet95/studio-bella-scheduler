import { NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const clientId = params.id
    
    // Remove o cliente do mockDb
    const initialLength = mockDb.clients.length
    mockDb.clients = mockDb.clients.filter(client => client.id !== clientId)
    
    if (mockDb.clients.length === initialLength) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir cliente' }, { status: 500 })
  }
}
