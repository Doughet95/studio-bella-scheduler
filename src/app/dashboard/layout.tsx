"use client"

import { Dumbbell, User, LogOut, Sparkles, KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
      } else {
        setUserEmail(session.user.email || "Usuário");
      }
    };
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground hidden md:flex">
              <User className="w-4 h-4" />
              <span className="font-medium max-w-[150px] truncate">{userEmail}</span>
            </div>
            <div className="flex items-center border-l border-white/10 pl-4 gap-1">
              <button onClick={() => setIsChangePasswordOpen(true)} className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10" title="Trocar Senha">
                <KeyRound className="w-5 h-5" />
              </button>
              <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-full hover:bg-destructive/10" title="Sair da conta">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 py-8">
        {children}
      </main>

      <ChangePasswordModal 
        isOpen={isChangePasswordOpen} 
        onClose={() => setIsChangePasswordOpen(false)} 
      />
    </div>
  );
}
