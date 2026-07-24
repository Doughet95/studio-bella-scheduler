'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowDownIcon, ArrowUpIcon, Wallet, PiggyBank, Target, Loader2, Users } from 'lucide-react'
import { Transaction } from '@/lib/mock-db'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'

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

  // Data for charts
  const expensesByCategory = Object.entries(
    transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)
  ).map(([name, total]) => ({ name, total }))

  const expensesByAuthor = Object.entries(
    transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const author = t.authorName?.split(' ')[0] || 'Desconhecido'
        acc[author] = (acc[author] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)
  ).map(([name, total]) => ({ name, total }))

  const COLORS = ['hsl(142, 76%, 36%)', 'hsl(217, 91%, 60%)', 'hsl(340, 40%, 48%)', 'hsl(42, 55%, 45%)']

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Visão Geral</h1>
        <p className="text-muted-foreground mt-1">Acompanhe suas finanças e interprete seus dados com gráficos.</p>
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

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass border-border/50 col-span-1 h-[400px] flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Despesas por Categoria</CardTitle>
            <CardDescription>Onde seu dinheiro está sendo gasto</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            {expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expensesByCategory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value: number) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 'Total']}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Nenhuma despesa registrada.</div>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-border/50 col-span-1 h-[400px] flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5" /> Divisão de Gastos</CardTitle>
            <CardDescription>Quem está gastando mais na Conta Conjunta</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            {expensesByAuthor.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByAuthor}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="total"
                  >
                    {expensesByAuthor.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value: number) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 'Gasto']}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Nenhum gasto registrado.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights Section */}
      {unnecessaryExpenses > 0 && (
        <Card className="border-secondary/30 bg-secondary/5 mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-secondary">
              <PiggyBank className="w-5 h-5" />
              Alerta de Inteligência Artificial
            </CardTitle>
            <CardDescription className="text-foreground/80 mt-2 text-sm leading-relaxed">
              O sistema analisou seus gastos e identificou que você gastou <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(unnecessaryExpenses)}</strong> em coisas desnecessárias recentemente 
              (como aplicativos de delivery, serviços de streaming, e compras de lazer).
              <br /><br />
              Se vocês cortarem esses gastos supérfluos pela metade neste mês, poderão guardar <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(unnecessaryExpenses / 2)}</strong> direto para a reserva de emergência!
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
