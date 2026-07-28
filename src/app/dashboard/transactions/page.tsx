'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { Loader2, Plus, ArrowUpIcon, ArrowDownIcon, Sparkles, Trash2, CreditCard, Banknote } from 'lucide-react'
import { Transaction } from '@/lib/mock-db'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  // Form State
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [type, setType] = useState<'income'|'expense'>('expense')
  const [paymentMethod, setPaymentMethod] = useState('Cartão de Crédito')

  useEffect(() => {
    fetchTransactions()
  }, [])

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
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: desc,
          amount: parseFloat(amount),
          date,
          type,
          paymentMethod
        })
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Falha ao adicionar')
      }
      
      toast({ title: 'Lançamento adicionado com sucesso!' })
      fetchTransactions() // Refresh list
      setDesc(''); setAmount('')
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao adicionar', description: error.message })
    } finally {
      setAdding(false)
    }
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
              <CardTitle>Novo Lançamento</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant={type === 'income' ? 'default' : 'outline'} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white border-0" onClick={() => setType('income')}>
                      Receita
                    </Button>
                    <Button type="button" variant={type === 'expense' ? 'destructive' : 'outline'} className="w-full" onClick={() => setType('expense')}>
                      Despesa
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input required value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Supermercado" />
                </div>

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

                <div className="pt-2 text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary" /> 
                  O sistema classificará automaticamente seus gastos inteligentemente.
                </div>

                <Button type="submit" disabled={adding} className="w-full gap-2 mt-2">
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Adicionar
                </Button>
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
              ) : transactions.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">Nenhuma transação registrada.</div>
              ) : (
                <div className="space-y-4">
                  {transactions.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                          {t.type === 'income' ? <ArrowUpIcon className="w-5 h-5" /> : <ArrowDownIcon className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{t.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
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
                                      {(t as any).payment_method}
                                    </span>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`font-bold ${t.type === 'income' ? 'text-emerald-500' : 'text-foreground'}`}>
                          {t.type === 'income' ? '+' : '-'}{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                        </div>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(t.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
