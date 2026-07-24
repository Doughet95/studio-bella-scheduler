import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'

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
    default: 'Studio Bella — Design de Sobrancelhas & Cílios',
    template: '%s | Studio Bella',
  },
  description:
    'Agende seu horário online para design de sobrancelhas e extensão de cílios. Atendimento premium, profissional especializada.',
  keywords: ['sobrancelhas', 'cílios', 'extensão de cílios', 'design de sobrancelhas', 'agendamento online'],
  authors: [{ name: 'Studio Bella' }],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Studio Bella',
    title: 'Studio Bella — Design de Sobrancelhas & Cílios',
    description: 'Agende seu horário online para design de sobrancelhas e extensão de cílios.',
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
