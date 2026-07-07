import { NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  
  if (!date) return NextResponse.json({ error: 'Date is required' }, { status: 400 })

  const selectedDate = new Date(date)
  const isSunday = selectedDate.getUTCDay() === 0

  // Se for domingo, não tem horários disponíveis
  if (isSunday) {
    return NextResponse.json({ data: [] })
  }

  // Horários fixos solicitados
  const times = ['08:00', '10:00', '14:00', '16:00', '18:00']
  
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
