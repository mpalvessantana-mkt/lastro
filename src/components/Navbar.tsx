"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MarcaLastro, LogoBNB } from "@/components/Marca";
import { AlternarTema } from "@/components/AlternarTema";
import { useAuth } from "@/contexts/AuthContext";
import { Papel } from "@/types";
import { encerrarSessao } from "@/lib/sessao";

export function Navbar() {
  const pathname = usePathname();
  const { usuario, trocarPapel } = useAuth();

  const links = [
    { href: "/casos", rotulo: "Casos" },
    { href: "/referencia", rotulo: "Referência" },
    { href: "/auditoria", rotulo: "Auditoria" },
    { href: "/ajuda", rotulo: "Ajuda" }
  ];

  return (
    <header className="sticky top-0 z-50 bg-[var(--c-3d0c15)] border-b-[3px] border-[var(--c-f28c00)] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-x-4 py-2 md:h-15 md:flex-nowrap md:py-0">
        {/* Lado Esquerdo: marca do produto */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="LASTRO — início">
            <MarcaLastro />
          </Link>
        </div>

        {/* Centro: Navegação Principal */}
        <nav className="order-last flex w-full items-center gap-1 overflow-x-auto pt-2 sm:gap-2 md:order-none md:w-auto md:overflow-visible md:pt-0">
          {links.map((link) => {
            const ativo =
              pathname === link.href ||
              (link.href !== "/casos" && link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 whitespace-nowrap px-3.5 py-1 text-xs font-ui rounded-[6px] transition-colors ${
                  ativo
                    ? "bg-[var(--c-a6193c)] text-white font-medium shadow-xs"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                {link.rotulo}
              </Link>
            );
          })}
        </nav>

        {/* Lado Direito: Seletor de Papel, Botão Sair e Identificação do Usuário */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-white/70 font-ui mr-1">
            <span className="text-[10px] uppercase tracking-wider text-white/50 font-medium">Papel:</span>
            <select
              value={usuario.papel}
              onChange={(e) => trocarPapel(e.target.value as Papel)}
              className="text-xs bg-[var(--c-4d111d)] border border-white/20 rounded-[4px] px-2 py-1 text-white font-medium focus:outline-none focus:border-[var(--c-f28c00)]"
            >
              <option value="analista" className="bg-[var(--c-3d0c15)] text-white">Analista (Ana Ribeiro)</option>
              <option value="revisor" className="bg-[var(--c-3d0c15)] text-white">Revisor (Carlos Mendes)</option>
              <option value="auditor" className="bg-[var(--c-3d0c15)] text-white">Auditor (Mariana Costa)</option>
            </select>
          </div>

          <Link
            href="/login"
            onClick={encerrarSessao}
            className="px-3 py-1 rounded-[4px] border border-white/25 text-white/90 hover:text-white hover:bg-white/10 text-xs font-medium font-ui transition-colors"
          >
            Sair
          </Link>

          <div className="flex items-center gap-2 pl-2 border-l border-white/15">
            <div className="w-7 h-7 rounded-full bg-[var(--c-f28c00)] text-[var(--c-3d0c15)] flex items-center justify-center text-xs font-bold font-ui shrink-0">
              {usuario.nome.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden xl:flex flex-col text-left whitespace-nowrap">
              <span className="text-xs font-medium text-white leading-tight font-ui">
                {usuario.nome}
              </span>
              <span className="text-[10px] text-white/60 leading-tight capitalize font-ui">
                {usuario.papel}
              </span>
            </div>
          </div>

          {/* Tema e marca institucional (canto superior direito) */}
          <AlternarTema />
          <span className="hidden md:flex items-center pl-3 border-l border-white/15">
            <LogoBNB altura={30} />
          </span>
        </div>
      </div>
    </header>
  );
}
