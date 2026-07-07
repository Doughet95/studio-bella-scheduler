'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerClientSchema, type RegisterClientFormData } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Sparkles, Mail, Lock, User, Phone, Eye, EyeOff, UserPlus } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

export default function ClientRegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterClientFormData>({
    resolver: zodResolver(registerClientSchema),
  })

  const watchAllergies = watch('has_allergies')
  const watchExtensions = watch('has_extensions_before')
  const watchPlanType = watch('plan_type')

  const onSubmit = async (data: RegisterClientFormData) => {
    setIsLoading(true)
    try {
      // Mock API call for registration
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: 'Conta criada com sucesso!',
        description: 'Bem-vindo(a) ao Studio Bella.',
      })
      
      if (data.plan_type === 'mensal') {
        window.open('https://invoice.infinitepay.io/plans/douglastc/hR03SswIuT', '_blank')
        router.push('/client/billing')
      } else {
        const pendingBooking = localStorage.getItem('pendingBooking')
        if (pendingBooking) {
          router.push('/book?resume=true')
        } else {
          router.push('/client')
        }
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar conta',
        description: 'Tente novamente mais tarde.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      {/* Background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-primary/6 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gradient">Studio Bella</h1>
          <p className="text-muted-foreground text-sm mt-1">Crie sua conta para agendar e gerenciar seus horários</p>
        </div>

        {/* Form */}
        <div className="glass rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-foreground mb-6">Cadastro de Cliente</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Seu nome"
                  className="pl-10"
                  {...register('name')}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  className="pl-10"
                  {...register('phone')}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>

            {/* Anamnese / Questionário de Saúde */}
            <div className="pt-4 pb-4 border-t border-b border-border/40">
              <h3 className="text-sm font-semibold text-primary mb-4">Questionário de Saúde (Anamnese)</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Você tem algum tipo de alergia a produtos ou medicamentos?</Label>
                  <div className="flex gap-6 mt-1">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" value="yes" className="accent-primary w-4 h-4" {...register('has_allergies')} />
                      Sim
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" value="no" className="accent-primary w-4 h-4" {...register('has_allergies')} />
                      Não
                    </label>
                  </div>
                  {errors.has_allergies && <p className="text-xs text-destructive">{errors.has_allergies.message}</p>}
                </div>

                {watchAllergies === 'yes' && (
                  <div className="space-y-2 animate-fade-in pl-4 border-l-2 border-primary/30">
                    <Label htmlFor="allergy_details">Quais produtos/medicamentos?</Label>
                    <Input
                      id="allergy_details"
                      placeholder="Ex: Esparadrapo, látex, dipirona..."
                      className="bg-background/50"
                      {...register('allergy_details')}
                    />
                    {errors.allergy_details && <p className="text-xs text-destructive">{errors.allergy_details.message}</p>}
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <Label>Já colocou extensão de cílios alguma vez na vida?</Label>
                  <div className="flex gap-6 mt-1">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" value="yes" className="accent-primary w-4 h-4" {...register('has_extensions_before')} />
                      Sim
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" value="no" className="accent-primary w-4 h-4" {...register('has_extensions_before')} />
                      Não
                    </label>
                  </div>
                  {errors.has_extensions_before && <p className="text-xs text-destructive">{errors.has_extensions_before.message}</p>}
                </div>

                {watchExtensions === 'yes' && (
                  <div className="space-y-2 animate-fade-in pl-4 border-l-2 border-primary/30">
                    <Label>Teve alguma reação alérgica quando colocou?</Label>
                    <div className="flex flex-col gap-2 mt-1">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="radio" value="yes" className="accent-primary w-4 h-4" {...register('had_reaction')} />
                        Sim, tive reação alérgica
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="radio" value="no" className="accent-primary w-4 h-4" {...register('had_reaction')} />
                        Não, foi tudo bem
                      </label>
                    </div>
                    {errors.had_reaction && <p className="text-xs text-destructive">{errors.had_reaction.message}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Escolha de Plano */}
            <div className="pt-2 pb-4">
              <h3 className="text-sm font-semibold text-primary mb-4">Como deseja utilizar nossos serviços?</h3>
              <div className="flex flex-col gap-3">
                <label className={`flex flex-col border p-4 rounded-xl cursor-pointer transition-all ${watchPlanType === 'avulso' ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" value="avulso" className="accent-primary w-4 h-4" {...register('plan_type')} />
                    <div>
                      <p className="font-semibold text-foreground text-sm">Serviços Avulsos</p>
                      <p className="text-xs text-muted-foreground mt-1">Quero agendar horários livremente, sem fidelidade.</p>
                    </div>
                  </div>
                </label>
                <label className={`flex flex-col border p-4 rounded-xl cursor-pointer transition-all relative overflow-hidden ${watchPlanType === 'mensal' ? 'border-emerald-500 bg-emerald-500/10' : 'border-border bg-card'}`}>
                  {watchPlanType === 'mensal' && <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500" />}
                  <div className="flex items-center gap-3">
                    <input type="radio" value="mensal" className="accent-emerald-500 w-4 h-4" {...register('plan_type')} />
                    <div>
                      <p className="font-semibold text-emerald-500 text-sm flex items-center gap-2">
                        Plano Mensal VIP <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-xs font-bold">R$ 65/mês</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Colocação de Cílios Volume Brasileiro + Manutenção sempre que precisar.</p>
                    </div>
                  </div>
                </label>
              </div>
              {errors.plan_type && <p className="text-xs text-destructive mt-2">{errors.plan_type.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirm_password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  {...register('confirm_password')}
                />
              </div>
              {errors.confirm_password && (
                <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              variant="gradient"
              className="w-full mt-2"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Criando...
                </div>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Criar Conta
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  )
}
