"use client"

import { Dumbbell, User, LogOut, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [username, setUsername] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("gym_username");
    if (!savedUser) {
      router.push("/");
    } else {
      setUsername(savedUser);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("gym_username");
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
            <Dumbbell className="w-6 h-6 text-primary" />
            <span className="tracking-tight hidden sm:inline">Gym Tracker</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/onboarding">
              <button className="text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors">
                <Sparkles className="w-3 h-3" />
                Nova Ficha com IA
              </button>
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span className="font-medium">{username}</span>
            </div>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors ml-2" title="Sair da conta">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 py-8">
        {children}
      </main>
    </div>
  );
}
