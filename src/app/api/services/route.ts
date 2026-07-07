import { NextResponse } from 'next/server'

export async function GET() {
  const data = [
    {
      id: 'd9b75654-e67c-482d-88f2-53a56dc25287',
      name: 'Cílios Volume Brasileiro',
      description: 'Técnica de extensão para um olhar volumoso, marcante e expressivo.',
      duration_minutes: 120,
      price: 80,
      category: 'cilios',
      active: true,
      sort_order: 1,
    },
    {
      id: 'e2b761a2-93c4-4b95-a1d8-3e5f7b8a1c9e',
      name: 'Manutenção',
      description: 'Manutenção dos cílios para manter o olhar perfeito.',
      duration_minutes: 90,
      price: 50,
      category: 'cilios',
      active: true,
      sort_order: 2,
    },
    {
      id: 'f3914a1e-84b2-4d43-bb8a-1a86a60e041d',
      name: 'Plano Mensal',
      description: 'Colocação de Cílios Volume Brasileiro + Manutenção inclusa sempre que precisar.',
      duration_minutes: 120,
      price: 65,
      category: 'cilios',
      active: true,
      sort_order: 3,
    },
    {
      id: 'a8d56b4c-1e2f-4c3a-9b7d-8e6f5a4b3c2d',
      name: 'Em breve um novo serviço',
      description: 'Novidades chegando no Studio Bella.',
      duration_minutes: 0,
      price: 0,
      category: 'outros',
      active: true,
      sort_order: 4,
    }
  ]

  return NextResponse.json({ data })
}
