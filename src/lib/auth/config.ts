import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { SignJWT } from 'jose'
import { createAdminClient } from '@/lib/supabase/admin'
import { loginSchema } from '@/lib/validations/auth'

// Augment next-auth types
declare module 'next-auth' {
  interface Session {
    supabaseToken: string
    user: {
      id: string
      email: string
      name: string
      role: string
      image?: string | null
    }
  }

  interface User {
    id: string
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    supabaseToken: string
    role: string
    userId: string
  }
}

async function generateSupabaseToken(userId: string, email: string): Promise<string> {
  return 'mock-supabase-token-for-demo'
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'supersecret-nextauth-key-for-local-demo-12345',
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        // Mock login para demo (aceita qualquer credencial)
        return {
          id: 'admin-1',
          email: credentials?.email || 'admin@studiobella.com',
          name: 'Admin Studio Bella',
          image: null,
          role: 'admin',
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Primeiro login
      if (user) {
        token.userId = user.id
        token.role = user.role ?? 'client'
        token.supabaseToken = await generateSupabaseToken(user.id, user.email!)
      }

      // Atualização de sessão
      if (trigger === 'update' && session) {
        token.name = session.name
      }

      return token
    },
    async session({ session, token }) {
      session.supabaseToken = token.supabaseToken
      session.user.id = token.userId
      session.user.role = token.role
      return session
    },
  },
}
