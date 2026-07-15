export const mockDb = {
  bookings: [
    {
      id: 'app-1',
      date: new Date().toISOString().split('T')[0],
      time: '14:00',
      client_id: 'client-1',
      professional_id: '50e68e4f-2d93-4a1e-ab22-2580c8dc29cf',
      service_id: 'a127a3c7-4b71-4827-84bc-589dfd04085f',
      scheduled_at: new Date().toISOString().split('T')[0] + 'T14:00:00Z',
      duration_minutes: 60,
      price: 150,
      notes: 'Mock appointment',
      status: 'pending',
      client: {
        id: 'client-1',
        name: 'Maria Silva',
        email: 'maria@example.com',
        phone: '(11) 99999-9999'
      },
      professional: {
        id: '50e68e4f-2d93-4a1e-ab22-2580c8dc29cf',
        profile: { name: 'Isabella Costa', avatar_url: null }
      },
      service: {
        id: 'a127a3c7-4b71-4827-84bc-589dfd04085f',
        name: 'Extensão de Cílios - Fio a Fio',
        duration_minutes: 120,
        price: 150,
        category: 'cilios'
      }
    }
  ] as Array<{ id?: string, date: string; time: string; status?: string; [key: string]: any }>,
  
  // Weekly schedule mapping (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  // Each day contains an array of specific available times.
  weeklySchedule: {
    0: [] as string[],
    1: ['08:00', '10:00', '14:00', '16:00', '18:00'], // Monday
    2: ['08:00', '10:00', '14:00', '16:00', '18:00'], // Tuesday
    3: ['08:00', '10:00', '14:00', '16:00', '18:00'], // Wednesday
    4: ['08:00', '10:00', '14:00', '16:00', '18:00'], // Thursday
    5: ['08:00', '10:00', '14:00', '16:00', '18:00'], // Friday
    6: ['08:00', '10:00', '14:00', '16:00'], // Saturday
  } as Record<number, string[]>,
}
