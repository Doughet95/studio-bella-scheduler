import { Button } from "@/components/ui/button";
import { Dumbbell } from "lucide-react";
import Link from "next/link";

export default function Home() {
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
          Seu personal trainer inteligente. Monitore seus treinos e deixe a inteligência artificial guiar sua evolução.
        </p>

        <Link href="/onboarding">
          <Button size="lg" className="w-full font-bold text-lg h-12 shadow-lg shadow-primary/20">
            Começar Treino
          </Button>
        </Link>
      </div>
    </main>
  );
}
