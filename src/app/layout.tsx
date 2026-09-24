import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import Image from "next/image";
import novoFundo from "../../public/novo-fundo.jpg";

export const metadata: Metadata = {
  title: "Gym Tracker AI",
  description: "Seu assistente virtual de academia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-foreground selection:bg-primary selection:text-primary-foreground bg-background relative">
        {/* Fixed background color to ensure no white flash */}
        <div className="fixed inset-0 z-0 bg-background pointer-events-none"></div>
        
        {/* Background Image Layer - 100% Opacity */}
        <div className="fixed inset-0 z-[1] pointer-events-none opacity-100">
          <Image 
            src={novoFundo} 
            alt="Gym Background"
            fill
            className="object-cover"
            priority
          />
        </div>
        
        {/* Removed Dark Gradient Overlay completely to ensure full visibility */}
        
        <div className="relative z-10 flex-1 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
