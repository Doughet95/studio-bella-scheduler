export interface Transaction {
  id: string
  date: string
  amount: number
  description: string
  category: string
  type: 'income' | 'expense'
  necessity: 'essential' | 'unnecessary' | 'investment' | 'none'
  created_at: string
}

export const mockDb = {
  transactions: [
    {
      id: 'tx-1',
      date: new Date().toISOString().split('T')[0],
      amount: 5000,
      description: 'Salário',
      category: 'Renda',
      type: 'income',
      necessity: 'none',
      created_at: new Date().toISOString()
    },
    {
      id: 'tx-2',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: 150,
      description: 'Ifood (Lanche)',
      category: 'Alimentação',
      type: 'expense',
      necessity: 'unnecessary',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tx-3',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: 800,
      description: 'Aluguel',
      category: 'Moradia',
      type: 'expense',
      necessity: 'essential',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ] as Transaction[]
}
