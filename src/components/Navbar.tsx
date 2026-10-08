"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { Papel } from "@/types";

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
    <header className="sticky top-0 z-50 bg-[#3D0C15] border-b-[3px] border-[#F28C00] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
        {/* Lado Esquerdo: Marca Oficial BNB | LASTRO */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-[6px] border border-[#F28C00] bg-[#4D111D] flex items-center justify-center p-1">
              <Image
                src="/logo-bnb.png"
                alt="Banco do Nordeste"
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold tracking-[0.06em] text-white leading-tight font-ui">
                LASTRO
              </span>
              <span className="text-[9px] font-medium tracking-[0.14em] text-[#F28C00] uppercase leading-tight font-ui">
                DECISÃO COM LASTRO
              </span>
            </div>
          </Link>
        </div>

        {/* Centro: Navegação Principal */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((link) => {
            const ativo =
              pathname === link.href ||
              (link.href !== "/casos" && link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1 text-xs font-ui rounded-[6px] transition-colors ${
                  ativo
                    ? "bg-[#A6193C] text-white font-medium shadow-xs"
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
              className="text-xs bg-[#4D111D] border border-white/20 rounded-[4px] px-2 py-1 text-white font-medium focus:outline-none focus:border-[#F28C00]"
            >
              <option value="analista" className="bg-[#3D0C15] text-white">Analista (Ana Ribeiro)</option>
              <option value="revisor" className="bg-[#3D0C15] text-white">Revisor (Carlos Mendes)</option>
              <option value="auditor" className="bg-[#3D0C15] text-white">Auditor (Mariana Costa)</option>
            </select>
          </div>

          <Link
            href="/login"
            className="px-3 py-1 rounded-[4px] border border-white/25 text-white/90 hover:text-white hover:bg-white/10 text-xs font-medium font-ui transition-colors"
          >
            Sair
          </Link>

          <div className="flex items-center gap-2 pl-2 border-l border-white/15">
            <div className="w-7 h-7 rounded-full bg-[#F28C00] text-[#3D0C15] flex items-center justify-center text-xs font-bold font-ui shrink-0">
              {usuario.nome.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-medium text-white leading-tight font-ui">
                {usuario.nome}
              </span>
              <span className="text-[10px] text-white/60 leading-tight capitalize font-ui">
                {usuario.papel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
