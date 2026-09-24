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
import bgGym from "../../public/bg-gym.jpg";

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
      <body className="min-h-full flex flex-col text-foreground selection:bg-primary selection:text-primary-foreground bg-background">
        {/* Fixed background color to ensure no white flash */}
        <div className="fixed inset-0 z-0 bg-background pointer-events-none"></div>
        
        {/* Background Image Layer */}
        <div className="fixed inset-0 z-[1] pointer-events-none opacity-60">
          <Image 
            src={bgGym} 
            alt="Gym Background"
            fill
            className="object-cover"
            priority
          />
        </div>
        
        {/* Dark Gradient Overlay for readability */}
        <div className="fixed inset-0 z-[2] bg-gradient-to-b from-background/40 via-background/60 to-background/95 pointer-events-none"></div>
        
        <div className="relative z-10 flex-1 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
