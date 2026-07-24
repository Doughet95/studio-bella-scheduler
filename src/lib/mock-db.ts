export interface Transaction {
  id: string
  date: string
  amount: number
  description: string
  category: string
  type: 'income' | 'expense'
  necessity: 'essential' | 'unnecessary' | 'investment' | 'none'
  created_at: string
  authorName?: string
}

export interface Goal {
  id: string
  name: string
  target_amount: number | null // null means "undefined value, just saving"
  current_amount: number
}

export const mockDb = {
  goals: [
    {
      id: 'goal-1',
      name: 'Reserva de Emergência',
      target_amount: 10000,
      current_amount: 1500
    }
  ] as Goal[],
  transactions: [
    {
      id: 'tx-1',
      date: new Date().toISOString().split('T')[0],
      amount: 5000,
      description: 'Salário',
      category: 'Renda',
      type: 'income',
      necessity: 'none',
      created_at: new Date().toISOString(),
      authorName: 'Douglas Teixeira'
    },
    {
      id: 'tx-2',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: 150,
      description: 'Ifood (Lanche)',
      category: 'Alimentação',
      type: 'expense',
      necessity: 'unnecessary',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      authorName: 'Douglas Teixeira'
    },
    {
      id: 'tx-3',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: 800,
      description: 'Aluguel',
      category: 'Moradia',
      type: 'expense',
      necessity: 'essential',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      authorName: 'Tairine Rodrigues'
    }
  ] as Transaction[]
}
