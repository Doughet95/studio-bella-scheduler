import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Minhas Finanças — Controle Financeiro',
    template: '%s | Minhas Finanças',
  },
  description:
    'Controle suas finanças pessoais de forma inteligente. Acompanhe gastos, metas e construa sua reserva de emergência.',
  keywords: ['finanças', 'controle financeiro', 'despesas', 'metas', 'reserva de emergência'],
  authors: [{ name: 'Minhas Finanças' }],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Minhas Finanças',
    title: 'Minhas Finanças — Controle Financeiro',
    description: 'Controle suas finanças pessoais de forma inteligente.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: '#1a0a10',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
