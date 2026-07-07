'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreditCard, Download, ExternalLink, CheckCircle2, AlertCircle, ArrowLeft, X, Copy, QrCode } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

export default function ClientBillingPage() {
  const [showCardOptions, setShowCardOptions] = useState(false)
  const [showPixModal, setShowPixModal] = useState(false)

  const pixKey = '48182c44-7b4f-4cf7-89a4-2c5312688674'

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pixKey)
    toast({
      title: 'Chave copiada!',
      description: 'Chave PIX copiada para a área de transferência.',
    })
  }

  const invoices = [
    {
      id: 'inv-1',
      month: 'Julho 2026',
      amount: 65,
      status: 'pending',
      dueDate: '10/07/2026',
      plan: 'Plano Mensal - Cílios',
    },
    {
      id: 'inv-2',
      month: 'Junho 2026',
      amount: 65,
      status: 'paid',
      dueDate: '10/06/2026',
      plan: 'Plano Mensal - Cílios',
    }
  ]

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Faturas e Pagamentos</h1>
        <p className="text-muted-foreground mt-1">Gerencie seu plano mensal e histórico financeiro.</p>
      </div>

      {/* Plano Atual */}
      <Card className="border-primary/30 glow-primary overflow-hidden relative">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <CreditCard className="w-32 h-32 text-primary" />
        </div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Assinatura Ativa
          </CardTitle>
          <CardDescription>Você está inscrito no plano mensal.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-1">Plano Mensal (Cílios Volume Brasileiro)</h3>
              <p className="text-muted-foreground">Inclui 1 colocação e manutenção sempre que precisar.</p>
              <div className="mt-4 flex gap-4">
                <div className="bg-background rounded-lg px-4 py-2 border">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Valor da Mensalidade</p>
                  <p className="text-xl font-bold text-foreground">R$ 65,00</p>
                </div>
                <div className="bg-background rounded-lg px-4 py-2 border">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Dia de Vencimento</p>
                  <p className="text-xl font-bold text-foreground">Dia 10</p>
                </div>
              </div>
            </div>
            
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <>
                  <Button variant="outline" className="flex items-center gap-2" onClick={() => setShowPixModal(true)}>
                    <span className="text-emerald-500 font-bold">PIX</span>
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    💵 Dinheiro
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2" 
                    onClick={() => window.open('https://invoice.infinitepay.io/plans/douglastc/hR03SswIuT', '_blank')}
                  >
                    <CreditCard className="w-4 h-4" /> Cartão
                  </Button>
                </>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Faturas */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Histórico de Cobranças</h2>
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id} className={invoice.status === 'pending' ? 'border-orange-500/30' : ''}>
              <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    invoice.status === 'pending' ? 'bg-orange-500/10 text-orange-500' : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {invoice.status === 'pending' ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{invoice.month}</h4>
                    <p className="text-sm text-muted-foreground">{invoice.plan}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {invoice.status === 'pending' ? (
                        <Badge variant="outline" className="border-orange-500 text-orange-500">Aguardando Pagamento</Badge>
                      ) : (
                        <Badge variant="outline" className="border-emerald-500 text-emerald-500">Pago</Badge>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        Vencimento: {invoice.dueDate}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 pt-4 sm:pt-0 mt-4 sm:mt-0">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="text-xl font-bold">R$ {invoice.amount},00</p>
                  </div>
                  {invoice.status === 'pending' ? (
                    <Button variant="gradient">
                      Pagar Agora
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon" title="Baixar Recibo">
                      <Download className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* PIX Modal */}
      {showPixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
          <Card className="w-full max-w-sm shadow-xl glow-primary border-primary/20 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPixModal(false)}
            >
              <X className="w-5 h-5" />
            </Button>
            <CardHeader className="text-center pb-2">
              <CardTitle className="flex items-center justify-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-500" />
                Pagamento via PIX
              </CardTitle>
              <CardDescription>Escaneie o QR Code ou copie a chave</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6 pt-4">
              <div className="bg-white p-2 rounded-xl">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${pixKey}`}
                  alt="QR Code PIX"
                  className="w-48 h-48 rounded-lg"
                />
              </div>
              
              <div className="w-full space-y-2">
                <p className="text-sm text-center text-muted-foreground font-medium">Chave Aleatória</p>
                <div className="flex items-center gap-2 bg-muted p-3 rounded-lg border">
                  <span className="text-xs font-mono truncate flex-1 select-all">{pixKey}</span>
                  <Button variant="outline" size="sm" className="shrink-0" onClick={copyToClipboard}>
                    <Copy className="w-4 h-4 mr-1" /> Copiar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
