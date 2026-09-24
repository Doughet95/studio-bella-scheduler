"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dumbbell, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("gym_username");
    if (savedUser) {
      router.push("/dashboard");
    } else {
      setIsLoading(false);
    }
  }, [router]);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    localStorage.setItem("gym_username", username.trim());
    // Se for o primeiro acesso, vamos para o onboarding (anamnese)
    router.push("/onboarding");
  };

  if (isLoading) return null; // Previne piscar a tela de login se já estiver logado

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="bg-card/50 p-8 rounded-2xl border border-border/50 max-w-md w-full shadow-2xl shadow-primary/10">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Dumbbell className="w-8 h-8 text-primary" />
        </div>
        
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">
          Gym Tracker <span className="text-primary">AI</span>
        </h1>
        
        <p className="text-muted-foreground mb-8 text-lg">
          Seu personal trainer inteligente. Digite seu nome para continuar.
        </p>

        <form onSubmit={handleStart} className="flex flex-col gap-4">
          <Input 
            type="text" 
            placeholder="Seu nome (ex: Douglas)" 
            className="h-14 text-lg bg-background border-primary/20 focus-visible:ring-primary"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Button type="submit" size="lg" className="w-full font-bold text-lg h-14 shadow-lg shadow-primary/20">
            Entrar / Começar
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </form>
      </div>
    </main>
  );
}
