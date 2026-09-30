"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dumbbell, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Label } from "@/components/ui/label";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      } else {
        setIsLoading(false);
      }
    };
    checkUser();
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    
    setIsSubmitting(true);
    setErrorMsg("");
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (!data.session) {
          setErrorMsg("Conta criada! Mas atenção: o Supabase exige confirmação. Desative 'Confirm email' no seu painel Supabase ou verifique sua caixa de entrada.");
          setIsSubmitting(false);
          return;
        }
        
        // Assume success and session exists
        router.push("/onboarding");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Ocorreu um erro. Verifique seus dados.");
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg("Por favor, digite seu e-mail para recuperar a senha.");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg("");
    setResetSent(false);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao tentar enviar o e-mail de recuperação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return null; // Previne piscar a tela de login se já estiver logado

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="bg-card/50 backdrop-blur-md p-8 rounded-2xl border border-white/10 max-w-md w-full shadow-2xl shadow-primary/20">
        <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
          <Dumbbell className="w-8 h-8 text-primary" />
        </div>
        
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">
          Gym Tracker <span className="text-primary">AI</span>
        </h1>
        
        <p className="text-muted-foreground mb-6 text-sm">
          {isForgotPassword 
            ? "Enviaremos um link seguro para você recadastrar sua senha."
            : isLogin 
              ? "Faça login para acessar seus treinos." 
              : "Crie sua conta para começar."}
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {errorMsg}
          </div>
        )}

        {resetSent && (
          <div className="mb-4 p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm">
            Pronto! Verifique sua caixa de e-mail (e a pasta de Spam) para redefinir sua senha.
          </div>
        )}

        {isForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="flex flex-col gap-4 text-left">
            <div className="space-y-1">
              <Label htmlFor="email">E-mail cadastrado</Label>
              <Input 
                id="email"
                type="email" 
                placeholder="seu@email.com" 
                className="h-12 bg-background/50 border-white/10 focus-visible:ring-primary"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" size="lg" className="w-full font-bold text-lg h-12 shadow-lg shadow-primary/20 mt-2 bg-primary/90 hover:bg-primary" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enviar link de recuperação"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleAuth} className="flex flex-col gap-4 text-left">
            <div className="space-y-1">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email"
                type="email" 
                placeholder="seu@email.com" 
                className="h-12 bg-background/50 border-white/10 focus-visible:ring-primary"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Senha</Label>
                {isLogin && (
                  <button 
                    type="button" 
                    onClick={() => { setIsForgotPassword(true); setErrorMsg(""); setResetSent(false); }}
                    className="text-xs text-primary hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <Input 
                id="password"
                type="password" 
                placeholder="••••••••" 
                className="h-12 bg-background/50 border-white/10 focus-visible:ring-primary"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" size="lg" className="w-full font-bold text-lg h-12 shadow-lg shadow-primary/20 mt-2 bg-primary/90 hover:bg-primary" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  {isLogin ? "Entrar" : "Criar Conta"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>
        )}

        <div className="mt-6 flex flex-col items-center gap-2">
          {isForgotPassword ? (
            <button 
              type="button" 
              onClick={() => { setIsForgotPassword(false); setErrorMsg(""); setResetSent(false); }} 
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Voltar para o login
            </button>
          ) : (
            <button 
              type="button" 
              onClick={() => { setIsLogin(!isLogin); setErrorMsg(""); }} 
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? "Não tem uma conta? Cadastre-se grátis." : "Já tem conta? Faça login."}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
