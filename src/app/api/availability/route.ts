import { NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  
  if (!date) return NextResponse.json({ error: 'Date is required' }, { status: 400 })

  const selectedDate = new Date(date)
  const dayOfWeek = selectedDate.getUTCDay() // 0 = Sunday, 1 = Monday, etc.

  // Busca a configuração exata de horários para este dia da semana
  const times = mockDb.weeklySchedule[dayOfWeek] || []

  if (times.length === 0) {
    return NextResponse.json({ data: [] })
  }
  
  const data = times.map(time => {
    // Verifica se já existe agendamento neste dia e horário no mockDb
    const isBooked = mockDb.bookings.some(b => b.date === date && b.time === time)
    
    return {
      datetime: `${date}T${time}:00Z`,
      time,
      available: !isBooked
    }
  })

  return NextResponse.json({ data })
}
