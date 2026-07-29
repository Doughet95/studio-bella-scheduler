'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowDownIcon, ArrowUpIcon, Wallet, Loader2, Printer, CreditCard, Banknote, Calendar } from 'lucide-react'
import { Transaction } from '@/lib/mock-db'
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function InsightsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => {
    fetch('/api/transactions')
      .then(res => res.json())
      .then(data => {
        if (data.data) setTransactions(data.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  // Filter transactions by selected month
  const filteredTransactions = transactions.filter(t => t.date.startsWith(selectedMonth))

  // Summary Metrics
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0)
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0)
  const netBalance = totalIncome - totalExpense

  // Daily Chart Data
  const dailyDataMap = filteredTransactions.reduce((acc, t) => {
    const date = t.date.split('T')[0]
    if (!acc[date]) acc[date] = { date, income: 0, expense: 0 }
    if (t.type === 'income') acc[date].income += t.amount
    else acc[date].expense += t.amount
    return acc
  }, {} as Record<string, { date: string, income: number, expense: number }>)

  const dailyChartData = Object.values(dailyDataMap)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(d => ({
      ...d,
      formattedDate: format(parseISO(d.date), "dd/MMM", { locale: ptBR })
    }))

  // Category Chart Data
  const expensesByCategory = Object.entries(
    filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  const COLORS = ['hsl(142, 76%, 36%)', 'hsl(217, 91%, 60%)', 'hsl(340, 40%, 48%)', 'hsl(42, 55%, 45%)', 'hsl(270, 60%, 50%)']

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-1">Análise detalhada e extrato das suas finanças.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-background border border-input rounded-md px-3 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-sm font-medium"
            />
          </div>
          <Button onClick={() => window.print()} variant="outline" className="gap-2">
            <Printer className="w-4 h-4" /> Imprimir
          </Button>
        </div>
      </div>

      <div className="hidden print:block mb-6">
        <h2 className="text-2xl font-bold">Relatório Financeiro</h2>
        <p className="text-muted-foreground">Período: {format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy', { locale: ptBR })}</p>
      </div>

      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balanço Líquido</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netBalance)}
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Entradas</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome)}
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Saídas</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpense)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass border-border/50 col-span-1 flex flex-col print-chart-card">
          <CardHeader>
            <CardTitle className="text-lg">Fluxo Diário</CardTitle>
            <CardDescription>Entradas e Saídas ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px] print-chart-content">
            {dailyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="formattedDate" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  <Bar name="Receitas" dataKey="income" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                  <Bar name="Despesas" dataKey="expense" fill="hsl(340, 40%, 48%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Nenhum dado para exibir neste mês.</div>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-border/50 col-span-1 flex flex-col print-chart-card">
          <CardHeader>
            <CardTitle className="text-lg">Despesas por Categoria</CardTitle>
            <CardDescription>Detalhamento de onde o dinheiro está indo</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px] print-chart-content">
            {expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value: number) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 'Gasto']}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Nenhuma despesa registrada neste mês.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Extrato */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Extrato Detalhado</CardTitle>
          <CardDescription>Lista completa de todos os lançamentos que compõem este relatório.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-x-auto print-table-container">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 font-medium">Pagamento</th>
                  <th className="px-4 py-3 font-medium text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredTransactions.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhum lançamento encontrado neste mês.</td></tr>
                )}
                {filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {format(parseISO(t.date), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{t.description}</div>
                      <div className="text-[10px] text-muted-foreground">{t.author_name || t.authorName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-[10px] font-medium uppercase text-muted-foreground">
                        {t.payment_method === 'Dinheiro' || t.payment_method === 'PIX' ? <Banknote className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                        {t.payment_method} {t.payment_method === 'Cartão de Crédito' && (t as any).card_name ? `(${(t as any).card_name})` : ''}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${t.type === 'income' ? 'text-emerald-500' : 'text-foreground'}`}>
                      {t.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* CSS para Impressão */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body, html, #__next, .flex.h-screen { 
            height: auto !important; 
            overflow: visible !important; 
            display: block !important; 
            background: white !important;
          }
          nav, aside, .mobile-nav { display: none !important; }
          main { 
            padding: 0 !important; 
            margin: 0 !important; 
            width: 100% !important; 
            overflow: visible !important;
            height: auto !important;
          }
          .glass { 
            background: transparent !important; 
            border: 1px solid #ccc !important; 
            box-shadow: none !important;
          }
          /* Garante que os gráficos tenham um tamanho mínimo na impressão */
          .print-chart-content { 
            min-height: 300px !important;
            display: block !important;
          }
          /* Impede que o bloco do gráfico quebre no meio */
          .print-chart-card { break-inside: avoid; }
          
          /* Remove restrições da tabela para ela fluir entre páginas */
          .print-table-container { overflow: visible !important; }
          
          /* Força as restrições dos gráficos para não vazar a tinta (problema conhecido do Recharts no modo de impressão) */
          .recharts-wrapper, .recharts-surface, .recharts-responsive-container { 
            overflow: hidden !important; 
            max-width: 100% !important;
          }
        }
      `}} />
    </div>
  )
}
