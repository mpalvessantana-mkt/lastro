"use client";

import React, { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { LastroCopilot } from "@/components/LastroCopilot";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <>
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
      <footer className="border-t-[3px] border-[#F28C00] bg-[#3D0C15] py-3.5 mt-auto text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-white/80 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#F28C00]">LASTRO</span>
            <span className="text-white/40">·</span>
            <span>Banco do Nordeste (Hubine) + SEBRAE · Desafio STS 2026</span>
          </div>
          <div className="text-[11px] text-white/60">
            Toda decisão com lastro · Peça técnica imutável
          </div>
        </div>
      </footer>
    </>
  );
}
