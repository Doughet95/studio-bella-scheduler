'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { Loader2, Plus, ArrowUpIcon, ArrowDownIcon, Sparkles, Trash2, CreditCard, Banknote, Target } from 'lucide-react'
import { Transaction, Goal } from '@/lib/mock-db'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form State
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [type, setType] = useState<'income'|'expense'|'reserve'>('expense')
  const [paymentMethod, setPaymentMethod] = useState('Cartão de Crédito')
  const [cards, setCards] = useState<{id: string, name: string}[]>([])
  const [selectedCard, setSelectedCard] = useState('')
  const [goals, setGoals] = useState<Goal[]>([])
  const [selectedGoal, setSelectedGoal] = useState('')
  const [category, setCategory] = useState('')

  const EXPENSE_CATEGORIES = [
    'Mercado', 'Farmácia', 'Padaria', 'Alimentação (Restaurante/Fast Food/Lanchonete)', 
    'Combustível', 'Transporte', 'Saúde', 'Moradia', 'Contas da Casa', 'Educação', 
    'Pets', 'Roupas', 'Beleza', 'Perfumaria', 'Casa', 'Compras Online', 'Lazer', 
    'Cinema', 'Viagens', 'Assinaturas', 'Presentes', 'Investimentos', 
    'Cartão de Crédito', 'Impostos/Taxas', 'Outros'
  ]

  useEffect(() => {
    fetchTransactions()
    fetchCards()
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/goals')
      const data = await res.json()
      if (data.data) {
        setGoals(data.data)
        if (data.data.length > 0 && !selectedGoal) setSelectedGoal(data.data[0].id)
      }
    } catch (e) {}
  }

  const fetchCards = async () => {
    try {
      const res = await fetch('/api/cards')
      const data = await res.json()
      if (data.data) {
        setCards(data.data)
        if (data.data.length > 0 && !selectedCard) {
          setSelectedCard(data.data[0].name)
        }
      }
    } catch (e) {
      console.error('Failed to fetch cards')
    }
  }

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions')
      const data = await res.json()
      if (data.data) setTransactions(data.data)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    try {
      const url = editingId ? `/api/transactions/${editingId}` : '/api/transactions'
      const method = editingId ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: desc,
          amount: parseFloat(amount),
          date,
          type,
          paymentMethod,
          cardName: paymentMethod === 'Cartão de Crédito' ? selectedCard : null,
          goalId: type === 'reserve' ? selectedGoal : null,
          category: type === 'expense' ? category : null
        })
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Falha ao salvar')
      }
      
      toast({ title: editingId ? 'Lançamento atualizado!' : 'Lançamento adicionado!' })
      fetchTransactions() // Refresh list
      cancelEdit()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message })
    } finally {
      setAdding(false)
    }
  }

  const handleEditClick = (t: Transaction) => {
    setEditingId(t.id)
    setDesc(t.description)
    setAmount(t.amount.toString())
    setDate(t.date.split('T')[0])
    setType(t.type)
    if (t.category) setCategory(t.category)
    if (t.payment_method) setPaymentMethod(t.payment_method)
    if ((t as any).card_name) setSelectedCard((t as any).card_name)
    if (t.goal_id) setSelectedGoal(t.goal_id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDesc('')
    setAmount('')
    setDate(new Date().toISOString().split('T')[0])
    setType('expense')
    setCategory('')
    setPaymentMethod('Cartão de Crédito')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja apagar este lançamento?')) return

    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Falha ao apagar')
      }
      toast({ title: 'Lançamento apagado!' })
      fetchTransactions()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Lançamentos</h1>
        <p className="text-muted-foreground mt-1">Registre suas receitas e despesas do dia a dia.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Form */}
        <div className="lg:col-span-1">
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle>{editingId ? 'Editar Lançamento' : 'Novo Lançamento'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant={type === 'income' ? 'default' : 'outline'} className={type === 'income' ? "w-full bg-emerald-500 hover:bg-emerald-600 text-white border-0 px-1" : "w-full px-1"} onClick={() => setType('income')}>
                      Receita
                    </Button>
                    <Button type="button" variant={type === 'expense' ? 'destructive' : 'outline'} className="w-full px-1" onClick={() => setType('expense')}>
                      Despesa
                    </Button>
                    <Button type="button" variant={type === 'reserve' ? 'default' : 'outline'} className={type === 'reserve' ? "w-full bg-blue-500 hover:bg-blue-600 text-white border-0 px-1" : "w-full px-1"} onClick={() => setType('reserve')}>
                      Reserva
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input required value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Supermercado" />
                </div>

                {type === 'expense' && (
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      required
                    >
                      <option value="" disabled>Selecione uma categoria</option>
                      {EXPENSE_CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input required type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                </div>

                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input required type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>

                {type === 'expense' && (
                  <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                    >
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="PIX">PIX</option>
                      <option value="Dinheiro">Dinheiro</option>
                    </select>
                  </div>
                )}

                {type === 'reserve' && (
                  <div className="space-y-2">
                    <Label>Para qual Meta?</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedGoal}
                      onChange={e => setSelectedGoal(e.target.value)}
                      required
                    >
                      <option value="" disabled>Selecione uma meta</option>
                      {goals.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {type === 'expense' && paymentMethod === 'Cartão de Crédito' && (
                  <div className="space-y-2 border-l-2 border-primary pl-4 ml-1">
                    <Label className="flex justify-between items-center">
                      Qual Cartão?
                      <Button type="button" variant="link" className="h-auto p-0 text-xs text-primary" onClick={async () => {
                        const newName = prompt('Nome do novo cartão:')
                        if (newName) {
                          try {
                            const res = await fetch('/api/cards', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ name: newName })
                            })
                            if (res.ok) {
                              fetchCards()
                              setSelectedCard(newName)
                            }
                          } catch (e) {}
                        }
                      }}>
                        + Novo Cartão
                      </Button>
                    </Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedCard}
                      onChange={e => setSelectedCard(e.target.value)}
                    >
                      {cards.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="pt-2 text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary" /> 
                  O sistema classificará automaticamente seus gastos inteligentemente.
                </div>

                <div className="flex gap-2 mt-2">
                  <Button type="submit" disabled={adding} className="w-full gap-2">
                    {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? null : <Plus className="w-4 h-4" />)}
                    {editingId ? 'Salvar Alterações' : 'Adicionar'}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={cancelEdit} disabled={adding}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
          <Card className="glass border-border/50 h-full">
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : (
                (() => {
                  const currentMonthYear = new Date().toISOString().substring(0, 7)
                  const visibleTransactions = transactions.filter(t => {
                    const isCurrentMonth = t.date.startsWith(currentMonthYear)
                    const isUnpaidCreditCard = t.is_paid === false
                    return isCurrentMonth || isUnpaidCreditCard
                  })

                  if (visibleTransactions.length === 0) {
                    return <div className="text-center py-10 text-muted-foreground">Nenhuma transação registrada neste mês.</div>
                  }

                  return (
                    <div className="space-y-4">
                      {visibleTransactions.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : t.type === 'reserve' ? 'bg-blue-500/10 text-blue-500' : 'bg-destructive/10 text-destructive'}`}>
                          {t.type === 'income' ? <ArrowUpIcon className="w-5 h-5" /> : t.type === 'reserve' ? <Target className="w-5 h-5" /> : <ArrowDownIcon className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-foreground break-words">{t.description}</p>
                          <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-[10px] sm:text-xs text-muted-foreground mt-1">
                            <span>{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                            <span className="opacity-50">•</span>
                            <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full text-foreground/80">
                              <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[8px] font-bold">
                                {((t as any).author_name || t.authorName) ? ((t as any).author_name || t.authorName).charAt(0).toUpperCase() : '?'}
                              </span>
                              {((t as any).author_name || t.authorName)?.split(' ')[0] || 'Desconhecido'}
                            </span>
                            {t.type === 'expense' && (
                              <>
                                <span className="opacity-50">•</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold ${t.necessity === 'unnecessary' ? 'bg-secondary/20 text-secondary' : 'bg-primary/10 text-primary'}`}>
                                  {t.necessity === 'unnecessary' ? 'Evitável' : t.necessity === 'essential' ? 'Essencial' : 'Investimento'}
                                </span>
                                {((t as any).payment_method) && (
                                  <>
                                    <span className="opacity-50">•</span>
                                    <span className="flex items-center gap-1 text-[10px] font-medium uppercase text-muted-foreground">
                                      {((t as any).payment_method === 'Dinheiro' || (t as any).payment_method === 'PIX') ? <Banknote className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                                      {(t as any).payment_method} {((t as any).payment_method === 'Cartão de Crédito' && (t as any).card_name) ? `(${(t as any).card_name})` : ''}
                                    </span>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`font-bold ${t.type === 'income' ? 'text-emerald-500' : t.type === 'reserve' ? 'text-blue-500' : 'text-foreground'}`}>
                          {t.type === 'income' ? '+' : t.type === 'reserve' ? '-' : '-'}{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                        </div>
                        <div className="flex">
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleEditClick(t)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                          </Button>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(t.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                )
              })()
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
