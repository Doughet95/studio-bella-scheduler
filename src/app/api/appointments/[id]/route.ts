import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mockDb } from '@/lib/mock-db'
import { appointmentUpdateSchema } from '@/lib/validations'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

// PATCH /api/appointments/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || !['admin', 'professional'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body: unknown = await req.json()
  const result = appointmentUpdateSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 422 })
  }

  const bookingIndex = mockDb.bookings.findIndex(b => b.id === params.id)
  if (bookingIndex >= 0) {
    mockDb.bookings[bookingIndex] = { ...mockDb.bookings[bookingIndex], ...result.data }
  }

  // Mock successful update
  const data = mockDb.bookings[bookingIndex] || { id: params.id, ...result.data }
  return NextResponse.json({ data })
}

// DELETE /api/appointments/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Mock successful delete
  return NextResponse.json({ success: true })
}
