import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { LastroCopilot } from "@/components/LastroCopilot";

export const metadata: Metadata = {
  title: "LASTRO — Sistema de Apoio à Decisão | Banco do Nordeste",
  description: "Análise de elegibilidade de projetos na Lei do Bem com rastreabilidade, recálculo aritmético e congelamento de pareceres.",
  icons: {
    icon: "/logo-bnb.png"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&family=Spectral:ital,wght@0,400;0,500;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#F3F3F1] text-[#231F20] antialiased">
        <AuthProvider>
          <Suspense fallback={<div className="h-14 bg-white border-b border-[#E0DEDA]" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Suspense fallback={<div className="p-8 text-center text-xs text-[#6B6762]">Carregando...</div>}>
              {children}
            </Suspense>
          </main>
          <Suspense fallback={null}>
            <LastroCopilot />
          </Suspense>
          <footer className="border-t border-[#E0DEDA] bg-white py-4 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#6B6762] gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#A6193C]">LASTRO</span>
                <span>·</span>
                <span>Banco do Nordeste (Hubine) + SEBRAE · Desafio STS 2026</span>
              </div>
              <div className="text-[11px] text-[#96918A]">
                Toda decisão com lastro · Peça técnica imutável
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
