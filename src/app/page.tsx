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
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // Assume success, usually goes to dashboard or asks for email verification depending on Supabase settings.
        // We'll redirect to onboarding for new users.
        router.push("/onboarding");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Ocorreu um erro. Verifique seus dados.");
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
          {isLogin ? "Faça login para acessar seus treinos." : "Crie sua conta para começar."}
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {errorMsg}
          </div>
        )}

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
            <Label htmlFor="password">Senha</Label>
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

        <div className="mt-6">
          <button 
            type="button" 
            onClick={() => { setIsLogin(!isLogin); setErrorMsg(""); }} 
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {isLogin ? "Não tem uma conta? Cadastre-se grátis." : "Já tem conta? Faça login."}
          </button>
        </div>
      </div>
    </main>
  );
}
