import { type NextRequest, NextResponse } from 'next/server'
import { bookingSchema } from '@/lib/validations'
import { mockDb } from '@/lib/mock-db'

// GET /api/appointments — listar agendamentos (admin/professional)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')

  return NextResponse.json({ data: mockDb.bookings })
}

// POST /api/appointments — criar agendamento (público — booking flow)
export async function POST(req: NextRequest) {
  const body: unknown = await req.json()
  const result = bookingSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 422 })
  }

  // Mock successful response
  const appointment = {
    id: `mock-id-${Date.now()}`,
    ...result.data,
    status: 'pending',
  }

  // Extrair data e hora do datetime ISO (ex: 2026-07-10T14:00:00.000Z)
  const scheduledDate = new Date(result.data.scheduled_at)
  const dateStr = scheduledDate.toISOString().split('T')[0]
  const timeStr = scheduledDate.toISOString().split('T')[1].substring(0, 5)

  mockDb.bookings.push({
    date: dateStr,
    time: timeStr,
    ...appointment
  })

  return NextResponse.json({ data: appointment }, { status: 201 })
}
