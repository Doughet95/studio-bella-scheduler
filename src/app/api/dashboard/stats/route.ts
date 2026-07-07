import { NextResponse } from 'next/server'

export async function GET() {
  // Mock data that exactly matches the DashboardStats interface
  const data = {
    stats: {
      appointments_today: 5,
      total_revenue_month: 4500,
      total_clients: 120,
      cancellation_rate: 5,
    },
    revenue_by_month: [
      { date: '01/07', revenue: 300 },
      { date: '02/07', revenue: 450 },
      { date: '03/07', revenue: 200 },
      { date: '04/07', revenue: 800 },
      { date: '05/07', revenue: 600 },
      { date: '06/07', revenue: 150 },
      { date: '07/07', revenue: 900 },
    ],
    today_appointments: [
      {
        id: 'app-mock-1',
        scheduled_at: new Date().toISOString(),
        service: { name: 'Extensão de Cílios' },
        client: { name: 'Maria Silva' },
        status: 'pending',
      },
      {
        id: 'app-mock-2',
        scheduled_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        service: { name: 'Design de Sobrancelha' },
        client: { name: 'João Santos' },
        status: 'confirmed',
      }
    ]
  }

  return NextResponse.json({ data })
}
