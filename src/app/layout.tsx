import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { SCRIPT_TEMA } from "@/components/AlternarTema";

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
    <html lang="pt-BR" className="h-full" suppressHydrationWarning>
      <head>
        {/* Aplica o tema (claro/escuro) antes da primeira pintura */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--c-f3f3f1)] text-[var(--c-231f20)] antialiased">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}

