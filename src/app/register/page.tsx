'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { Loader2, Users, User, ArrowRight } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [accountType, setAccountType] = useState<'single' | 'couple' | null>(null)

  // Single Form State
  const [singleName, setSingleName] = useState('')
  const [singleEmail, setSingleEmail] = useState('')
  const [singlePassword, setSinglePassword] = useState('')

  // Couple Form State
  const [coupleName1, setCoupleName1] = useState('')
  const [coupleEmail1, setCoupleEmail1] = useState('')
  const [coupleName2, setCoupleName2] = useState('')
  const [coupleEmail2, setCoupleEmail2] = useState('')
  const [couplePassword, setCouplePassword] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = accountType === 'single' 
        ? { accountType, name: singleName, email: singleEmail, password: singlePassword }
        : { accountType, name1: coupleName1, email1: coupleEmail1, name2: coupleName2, email2: coupleEmail2, password: couplePassword }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Erro ao criar conta')

      toast({ title: 'Sucesso!', description: 'Sua conta foi criada. Faça o login para continuar.' })
      router.push('/login')
    } catch (error: unknown) {
      toast({ variant: 'destructive', title: 'Erro no cadastro', description: error instanceof Error ? error.message : 'Erro desconhecido' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background/50 p-4">
      <div className="w-full max-w-md space-y-8 glass p-8 rounded-2xl border border-border/50">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Criar Nova Conta</h1>
          <p className="text-sm text-muted-foreground mt-2">Escolha o formato ideal para as suas finanças</p>
        </div>

        {!accountType ? (
          <div className="grid gap-4 mt-8">
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
              onClick={() => setAccountType('single')}
            >
              <User className="w-6 h-6 text-primary" />
              <div className="text-center">
                <div className="font-semibold text-foreground">Individual</div>
                <div className="text-xs text-muted-foreground font-normal">Para gerenciar apenas o seu dinheiro</div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
              onClick={() => setAccountType('couple')}
            >
              <Users className="w-6 h-6 text-primary" />
              <div className="text-center">
                <div className="font-semibold text-foreground">Conta Casal (Conjunta)</div>
                <div className="text-xs text-muted-foreground font-normal">Compartilhe os lançamentos com seu parceiro(a)</div>
              </div>
            </Button>
            
            <div className="text-center mt-4">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Já tenho uma conta. Fazer Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-6 mt-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                {accountType === 'single' ? 'Plano Individual' : 'Plano Casal'}
              </span>
              <button type="button" onClick={() => setAccountType(null)} className="text-xs text-muted-foreground hover:text-foreground">
                Mudar
              </button>
            </div>

            {accountType === 'single' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Seu Nome</Label>
                  <Input required value={singleName} onChange={e => setSingleName(e.target.value)} placeholder="Como gosta de ser chamado(a)?" />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" required value={singleEmail} onChange={e => setSingleEmail(e.target.value)} placeholder="seu@email.com" />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input type="password" required value={singlePassword} onChange={e => setSinglePassword(e.target.value)} />
                </div>
              </div>
            )}

            {accountType === 'couple' && (
              <div className="space-y-6">
                <div className="space-y-4 border-l-2 border-primary/30 pl-4">
                  <h3 className="text-sm font-semibold text-foreground">Titular</h3>
                  <div className="space-y-2">
                    <Label>Nome do Titular</Label>
                    <Input required value={coupleName1} onChange={e => setCoupleName1(e.target.value)} placeholder="João Silva" />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail do Titular</Label>
                    <Input type="email" required value={coupleEmail1} onChange={e => setCoupleEmail1(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-4 border-l-2 border-secondary/50 pl-4">
                  <h3 className="text-sm font-semibold text-foreground">Parceiro(a)</h3>
                  <div className="space-y-2">
                    <Label>Nome do Parceiro(a)</Label>
                    <Input required value={coupleName2} onChange={e => setCoupleName2(e.target.value)} placeholder="Maria Silva" />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail do Parceiro(a)</Label>
                    <Input type="email" required value={coupleEmail2} onChange={e => setCoupleEmail2(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Label>Senha de Acesso (Única para o casal)</Label>
                  <Input type="password" required value={couplePassword} onChange={e => setCouplePassword(e.target.value)} />
                  <p className="text-[10px] text-muted-foreground">O casal usará a mesma senha para acessar com seus respectivos e-mails.</p>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loading ? 'Criando conta...' : 'Concluir Cadastro'} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
