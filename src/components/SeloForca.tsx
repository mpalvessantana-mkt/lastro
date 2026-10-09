import { ShieldCheck, GitBranch, MessageSquareQuote, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Forca } from "@/types";

// Força probatória por ícone e rótulo, não só por cor (CLAUDE.md §12). A força vem do inventário (§6.4).
const FORCAS: Record<Forca, { rotulo: string; titulo: string; Icone: LucideIcon; classes: string }> = {
  PRIMARIA: {
    rotulo: "Primária",
    titulo: "Registro primário ou especificação, conforme o inventário do pacote",
    Icone: ShieldCheck,
    classes: "bg-[var(--c-ebf5f0)] text-[var(--c-0f5132)] border-[var(--c-a3d9be)]"
  },
  DERIVADA: {
    rotulo: "Derivada",
    titulo: "Calculada, transcrita ou sintetizada de outra evidência, conforme o inventário",
    Icone: GitBranch,
    classes: "bg-[var(--c-ffffff)] text-[var(--c-52504e)] border-[var(--c-c9c6c1)]"
  },
  DECLARATORIA: {
    rotulo: "Declaratória",
    titulo: "Depoimento de memória: alegação a confrontar com os registros",
    Icone: MessageSquareQuote,
    classes: "bg-[var(--c-fef9e7)] text-[var(--c-9a6700)] border-[var(--c-f4d089)] border-dashed"
  },
  CONTEXTO: {
    rotulo: "Contexto",
    titulo: "Revisão, registro de versões ou índice: situa a análise, não prova o resultado",
    Icone: Info,
    classes: "bg-[var(--c-f7f7f4)] text-[var(--c-6b6a65)] border-[var(--c-e3e2dd)] border-dotted"
  }
};

export function SeloForca({ forca, prefixo }: { forca: Forca; prefixo?: string }) {
  const f = FORCAS[forca] ?? FORCAS.CONTEXTO;
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${f.classes}`}
      title={f.titulo}
    >
      <f.Icone className="w-3 h-3" aria-hidden="true" />
      {prefixo ? `${prefixo} ${f.rotulo}` : f.rotulo}
    </span>
  );
}
