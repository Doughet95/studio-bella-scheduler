'use client'

import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="flex items-center gap-3 w-full p-4 mt-6 rounded-xl border border-destructive/20 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors justify-center"
    >
      <LogOut className="w-5 h-5" />
      Sair da Conta
    </button>
  )
}
