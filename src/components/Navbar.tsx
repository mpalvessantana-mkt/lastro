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
    <header className="sticky top-0 z-50 bg-white border-b border-[#E0DEDA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Lado Esquerdo: Marca Oficial BNB | LASTRO */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-7 h-7 flex items-center justify-center">
              <Image
                src="/logo-bnb.png"
                alt="Banco do Nordeste"
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
            <div className="h-4 w-px bg-[#D8D6D2]" />
            <span className="text-[15px] font-medium tracking-[0.08em] text-[#231F20] font-ui">
              LASTRO
            </span>
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
                className={`px-3 py-1.5 text-xs font-ui rounded-[4px] transition-colors ${
                  ativo
                    ? "bg-[#F3F3F1] text-[#231F20] font-semibold border-b-2 border-[#A6193C]"
                    : "text-[#6B6762] hover:text-[#231F20] hover:bg-[#F3F3F1]"
                }`}
              >
                {link.rotulo}
              </Link>
            );
          })}
        </nav>

        {/* Lado Direito: Seletor de Papel e Identificação do Usuário */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-[#6B6762] font-ui">
            <span className="text-[11px] uppercase tracking-wider text-[#96918A] font-medium">Papel:</span>
            <select
              value={usuario.papel}
              onChange={(e) => trocarPapel(e.target.value as Papel)}
              className="text-xs bg-[#F3F3F1] border border-[#E0DEDA] rounded-[4px] px-2 py-1 text-[#231F20] font-medium focus:outline-none focus:border-[#A6193C]"
            >
              <option value="analista">Analista (Ana Ribeiro)</option>
              <option value="revisor">Revisor (Carlos Mendes)</option>
              <option value="auditor">Auditor (Mariana Costa)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-[#E0DEDA]">
            <div className="w-7 h-7 rounded-[4px] bg-[#E0DEDA] text-[#231F20] flex items-center justify-center text-xs font-semibold font-ui">
              {usuario.nome.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-medium text-[#231F20] leading-tight font-ui">
                {usuario.nome}
              </span>
              <span className="text-[10px] text-[#96918A] leading-tight capitalize font-ui">
                {usuario.papel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
