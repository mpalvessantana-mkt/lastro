"use client";

import React, { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

// Tema claro/escuro. A classe .dark no <html> é aplicada antes da pintura pelo script de
// layout.tsx (preferência salva ou, na primeira visita, a do sistema). Aqui só se alterna e salva.
export const CHAVE_TEMA = "lastro_tema";

function assinar(aviso: () => void) {
  const observador = new MutationObserver(aviso);
  observador.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observador.disconnect();
}
const escuroAgora = () => document.documentElement.classList.contains("dark");

const ESTILO = {
  // sobre o cabeçalho vinho (igual nos dois temas)
  marca: "border-white/25 text-white/90 hover:bg-white/10 hover:text-white",
  // sobre superfície que muda com o tema (ex.: lado do formulário no login)
  superficie: "border-[var(--c-e0deda)] text-[var(--c-52504e)] hover:bg-[var(--c-f3f3f1)] hover:text-[var(--c-231f20)]"
};

export function AlternarTema({ className = "", sobre = "marca" }: { className?: string; sobre?: keyof typeof ESTILO }) {
  const escuro = useSyncExternalStore(assinar, escuroAgora, () => false);

  const alternar = () => {
    const proximo = !escuro;
    document.documentElement.classList.toggle("dark", proximo);
    try {
      localStorage.setItem(CHAVE_TEMA, proximo ? "escuro" : "claro");
    } catch {
      // sem armazenamento (janela privada): o tema vale só nesta visita
    }
  };

  const rotulo = escuro ? "Mudar para o tema claro" : "Mudar para o tema escuro";
  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={rotulo}
      title={rotulo}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${ESTILO[sobre]} ${className}`}
    >
      {escuro ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

/** Script inline do <head>: aplica o tema antes da primeira pintura (sem piscar). */
export const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem("${CHAVE_TEMA}");var e=t?t==="escuro":window.matchMedia("(prefers-color-scheme: dark)").matches;if(e)document.documentElement.classList.add("dark");}catch(_){}})();`;
