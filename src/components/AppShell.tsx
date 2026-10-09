"use client";

import React, { Suspense, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Lastrinho } from "@/components/Lastrinho";
import { useMontado } from "@/lib/use-carregar-no-cliente";
import { temSessao } from "@/lib/sessao";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const montado = useMontado();
  const isLoginPage = pathname === "/login";
  // O login é a porta de entrada: sem sessão nesta aba, qualquer outra rota volta para ele.
  const liberado = isLoginPage || (montado && temSessao());

  useEffect(() => {
    if (montado && !liberado) {
      const volta = window.location.pathname + window.location.search;
      router.replace(`/login?volta=${encodeURIComponent(volta)}`);
    }
  }, [montado, liberado, router]);
  // Casos e Ajuda usam a largura da tela (a Ajuda tem contêiner próprio); as demais rotas
  // mantêm a coluna de leitura.
  const larguraTotal = pathname === "/casos" || pathname === "/ajuda";

  if (isLoginPage) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  // Nada da página aparece antes de conferir a sessão (nem de relance).
  if (!liberado) {
    return <main className="min-h-screen w-full" aria-busy="true" />;
  }

  return (
    <>
      <Suspense fallback={<div className="h-14 bg-[var(--c-ffffff)] border-b border-[var(--c-e0deda)]" />}>
        <Navbar />
      </Suspense>
      <main className={`flex-1 flex flex-col ${larguraTotal ? "" : "max-w-7xl"} w-full mx-auto px-4 sm:px-6 lg:px-8 py-6`}>
        <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--c-6b6762)]">Carregando...</div>}>
          {children}
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Lastrinho />
      </Suspense>
      <footer className="border-t-[3px] border-[var(--c-f28c00)] bg-[var(--c-3d0c15)] py-3.5 mt-auto text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-white/80 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--c-f28c00)]">LASTRO</span>
            <span className="text-white/40">·</span>
            <span>Banco do Nordeste (Hubine) + SEBRAE · Desafio STS 2026</span>
          </div>
          <div className="text-[11px] text-white/60">
            O analista decide. O LASTRO fundamenta. · Peça técnica imutável
          </div>
        </div>
      </footer>
    </>
  );
}
