'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowDownIcon, ArrowUpIcon, Wallet, PiggyBank, Target, Loader2 } from 'lucide-react'
import { Transaction } from '@/lib/mock-db'

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/transactions')
      .then(res => res.json())
      .then(data => {
        if (data.data) setTransactions(data.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0)
  const balance = totalIncome - totalExpense
  const unnecessaryExpenses = transactions
    .filter(t => t.type === 'expense' && t.necessity === 'unnecessary')
    .reduce((acc, curr) => acc + curr.amount, 0)

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Visão Geral</h1>
        <p className="text-muted-foreground mt-1">Acompanhe suas finanças e identifique onde economizar.</p>
      </div>

      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Saldo disponível no momento</p>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total recebido no mês</p>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpense)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total gasto no mês</p>
          </CardContent>
        </Card>

        <Card className="glass border-border/50 bg-secondary/5 border-secondary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-secondary">Gastos Desnecessários</CardTitle>
            <Target className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(unnecessaryExpenses)}
            </div>
            <p className="text-xs text-secondary/80 mt-1">Potencial de economia!</p>
          </CardContent>
        </Card>
      </div>

      {/* Insights Section */}
      {unnecessaryExpenses > 0 && (
        <Card className="border-secondary/30 bg-secondary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-secondary">
              <PiggyBank className="w-5 h-5" />
              Alerta de Inteligência Artificial
            </CardTitle>
            <CardDescription className="text-foreground/80 mt-2 text-sm leading-relaxed">
              O sistema analisou seus gastos e identificou que você gastou <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(unnecessaryExpenses)}</strong> em coisas desnecessárias recentemente 
              (como aplicativos de delivery, serviços de streaming, e compras de lazer).
              <br /><br />
              Se você cortar esses gastos supérfluos pela metade neste mês, poderá guardar <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(unnecessaryExpenses / 2)}</strong> direto para sua reserva de emergência!
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
