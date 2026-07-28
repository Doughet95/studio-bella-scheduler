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
  payment_method?: string
  is_paid?: boolean
}

export interface Goal {
  id: string
  name: string
  target_amount: number | null // null means "undefined value, just saving"
  current_amount: number
}

export const mockDb = {
  goals: [] as Goal[],
  transactions: [] as Transaction[]
}
