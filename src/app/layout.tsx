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
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground relative">
        {/* Background Image Layer */}
        <div 
          className="fixed inset-0 z-[-2] bg-cover bg-center bg-no-repeat opacity-30"
          style={{ backgroundImage: 'url(/bg-gym.jpg)' }}
        ></div>
        {/* Dark Gradient Overlay for readability */}
        <div className="fixed inset-0 z-[-1] bg-gradient-to-t from-background via-background/90 to-background/50"></div>
        
        {children}
      </body>
    </html>
  );
}
