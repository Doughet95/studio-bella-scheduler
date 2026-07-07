import { NextResponse } from 'next/server'

export async function GET() {
  const data = [
    {
      id: '50e68e4f-2d93-4a1e-ab22-2580c8dc29cf',
      profile: {
        id: '50e68e4f-2d93-4a1e-ab22-2580c8dc29cf',
        name: 'Isabella Costa',
        avatar_url: null,
      },
      active: true,
    }
  ]

  return NextResponse.json({ data })
}
