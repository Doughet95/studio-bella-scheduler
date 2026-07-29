import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { createAdminClient } from '@/lib/supabase/admin'
import bcrypt from 'bcryptjs'

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
      familyId: string
    }
  }

  interface User {
    id: string
    role: string
    familyId: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    supabaseToken: string
    role: string
    userId: string
    familyId: string
  }
}

async function generateSupabaseToken(): Promise<string> {
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
        if (!credentials?.email) return null
        
        const email = credentials.email.toLowerCase()
        const supabase = createAdminClient()

        const { data: user, error } = await supabase
          .from('app_users')
          .select('*')
          .eq('email', email)
          .single()

        if (error || !user) return null

        const passwordMatch = await bcrypt.compare(credentials.password, user.password_hash)
        
        if (!passwordMatch) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: null,
          role: 'owner',
          familyId: user.family_id
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
        token.familyId = user.familyId
        token.supabaseToken = await generateSupabaseToken()
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
      session.user.familyId = token.familyId
      return session
    },
  },
}
