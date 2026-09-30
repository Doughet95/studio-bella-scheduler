"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dumbbell, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Label } from "@/components/ui/label";

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Supabase handles the #access_token fragment automatically and sets the session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErrorMsg("Link de recuperação inválido ou expirado. Por favor, solicite um novo.");
      }
      setCheckingAuth(false);
    };
    checkSession();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg("");
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao redefinir a senha.");
      setIsSubmitting(false);
    }
  };

  if (checkingAuth) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="bg-card/50 backdrop-blur-md p-8 rounded-2xl border border-white/10 max-w-md w-full shadow-2xl shadow-primary/20">
        <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
          <Dumbbell className="w-8 h-8 text-primary" />
        </div>
        
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          Nova Senha
        </h1>
        
        <p className="text-muted-foreground mb-6 text-sm">
          {success 
            ? "Sua senha foi redefinida com segurança!"
            : "Digite sua nova senha abaixo."}
        </p>

        {errorMsg && (
          <div className="mb-6 p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {errorMsg}
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center gap-4 py-4 animate-in fade-in zoom-in">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            <p className="text-emerald-500 font-medium">Redirecionando para o painel...</p>
          </div>
        ) : !errorMsg || errorMsg !== "Link de recuperação inválido ou expirado. Por favor, solicite um novo." ? (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4 text-left">
            <div className="space-y-1">
              <Label htmlFor="password">Nova Senha</Label>
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
            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input 
                id="confirmPassword"
                type="password" 
                placeholder="••••••••" 
                className="h-12 bg-background/50 border-white/10 focus-visible:ring-primary"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" size="lg" className="w-full font-bold text-lg h-12 shadow-lg shadow-primary/20 mt-2 bg-primary/90 hover:bg-primary" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Redefinir Senha
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>
        ) : (
          <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>
            Voltar para o início
          </Button>
        )}
      </div>
    </main>
  );
}
