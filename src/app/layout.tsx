import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";

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
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}

