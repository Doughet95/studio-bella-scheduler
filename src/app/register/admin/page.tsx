'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerAdminSchema, type RegisterAdminFormData } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Sparkles, Mail, Lock, User, Phone, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

export default function AdminRegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [masterInput, setMasterInput] = useState('')

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<RegisterAdminFormData>({
    resolver: zodResolver(registerAdminSchema),
  })

  const onSubmit = async (data: RegisterAdminFormData) => {
    setIsLoading(true)
    try {
      // Mock API call for registration
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: 'Conta Administrativa criada com sucesso!',
        description: 'Bem-vindo(a) ao painel do Studio Bella.',
      })
      
      // Redirect to admin dashboard
      router.push('/dashboard')
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
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-secondary/6 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gradient">Studio Bella</h1>
          <p className="text-muted-foreground text-sm mt-1">Configuração de Acesso Administrativo</p>
        </div>

        {/* Form or Lock Screen */}
        <div className="glass rounded-2xl p-6 sm:p-8 border-secondary/20">
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-secondary" />
            Registro Profissional
          </h2>

          {!isUnlocked ? (
            <div className="space-y-6 animate-fade-in text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Lock className="w-8 h-8 text-secondary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Acesso Restrito</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Insira a senha mestre para liberar o formulário de cadastro.
                </p>
              </div>
              <div className="space-y-4">
                <Input
                  type="password"
                  placeholder="Senha Mestre"
                  value={masterInput}
                  onChange={(e) => setMasterInput(e.target.value)}
                  className="text-center tracking-widest"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (masterInput === '920019000') {
                        setIsUnlocked(true)
                        setValue('master_password', masterInput)
                      } else {
                        toast({ variant: 'destructive', title: 'Acesso negado', description: 'Senha mestre incorreta.' })
                      }
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    if (masterInput === '920019000') {
                      setIsUnlocked(true)
                      setValue('master_password', masterInput)
                    } else {
                      toast({ variant: 'destructive', title: 'Acesso negado', description: 'Senha mestre incorreta.' })
                    }
                  }}
                  className="w-full bg-secondary hover:bg-secondary/90 text-white"
                >
                  Desbloquear
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-fade-in">
              {/* Campo hidden para a senha mestre passar no Zod */}
              <input type="hidden" {...register('master_password')} />
              
              <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Seu nome"
                  className="pl-10 focus-visible:ring-secondary/30"
                  {...register('name')}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail Administrativo</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@studiobella.com"
                  className="pl-10 focus-visible:ring-secondary/30"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp Comercial</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  className="pl-10 focus-visible:ring-secondary/30"
                  {...register('phone')}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-border/40">
              <Label htmlFor="password">Senha Forte</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10 focus-visible:ring-secondary/30"
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
                  className="pl-10 pr-10 focus-visible:ring-secondary/30"
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
              className="w-full mt-2 bg-gradient-to-r from-secondary to-purple-500 hover:from-secondary/90 hover:to-purple-500/90 text-white shadow-secondary/20 shadow-lg border-0"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Registrando...
                </div>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Criar Acesso Admin
                </>
              )}
            </Button>
          </form>
        )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Já possui acesso?{' '}
          <Link href="/login" className="text-secondary hover:underline font-medium">
            Entrar no painel
          </Link>
        </p>
      </div>
    </div>
  )
}
