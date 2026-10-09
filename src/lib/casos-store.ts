"use client";

import { Caso, Parecer, EventoAuditoria, Evidencia } from "@/types";
import { HISTORICOS_REFERENCIA } from "./referencia-data";

const CHAVE_CASOS = "lastro_casos_armazenados";
const CHAVE_PARECERES = "lastro_pareceres_armazenados";
const CHAVE_AUDITORIA = "lastro_auditoria_armazenada";
// Uma chave por caso: o texto extraído dos 14 arquivos ocupa até ~180 KB por caso
const PREFIXO_EVIDENCIAS = "lastro_evidencias_";

// Começa vazio: só entram casos analisados de verdade pelo upload (ou pelo atalho, que usa o
// pacote real). Não há caso, citação, hash ou confronto escrito à mão (§2 regra 3).
function gerarCasosIniciais(): { casos: Caso[]; pareceres: Record<string, Parecer> } {
  return { casos: [], pareceres: {} };
}

export function obterCasos(): Caso[] {
  if (typeof window === "undefined") return gerarCasosIniciais().casos;
  const salvos = localStorage.getItem(CHAVE_CASOS);
  if (!salvos) {
    const iniciais = gerarCasosIniciais();
    salvarCasos(iniciais.casos);
    salvarPareceres(iniciais.pareceres);
    return iniciais.casos;
  }
  try {
    const parsed: Caso[] = JSON.parse(salvos);
    let mudou = false;
    for (const c of parsed) {
      if (!c.titulo || c.titulo === `Projeto ${c.id}` || c.titulo.startsWith("Projeto PRJ")) {
        const hist = HISTORICOS_REFERENCIA.find((h) => h.id.toUpperCase() === c.id.toUpperCase());
        if (hist) {
          c.titulo = hist.titulo;
          mudou = true;
        }
      }
    }
    if (mudou) {
      salvarCasos(parsed);
    }
    return parsed;
  } catch {
    return gerarCasosIniciais().casos;
  }
}

export function salvarCasos(casos: Caso[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHAVE_CASOS, JSON.stringify(casos));
}

export function obterParecerPorId(id: string): Parecer | null {
  if (typeof window === "undefined") return null;
  const salvos = localStorage.getItem(CHAVE_PARECERES);
  if (!salvos) {
    const iniciais = gerarCasosIniciais();
    salvarCasos(iniciais.casos);
    salvarPareceres(iniciais.pareceres);
    return iniciais.pareceres[id] || null;
  }
  try {
    const pareceres = JSON.parse(salvos);
    return pareceres[id] || null;
  } catch {
    return null;
  }
}

export function salvarParecer(parecer: Parecer): void {
  if (typeof window === "undefined") return;
  const salvos = localStorage.getItem(CHAVE_PARECERES);
  const pareceres = salvos ? JSON.parse(salvos) : {};
  pareceres[parecer.id] = parecer;
  localStorage.setItem(CHAVE_PARECERES, JSON.stringify(pareceres));
}

export function salvarPareceres(pareceres: Record<string, Parecer>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHAVE_PARECERES, JSON.stringify(pareceres));
}

export function adicionarCasoComParecer(caso: Caso, parecer: Parecer, evidencias?: Evidencia[]): void {
  const casos = obterCasos();
  const existentes = casos.filter((c) => c.id !== caso.id);
  salvarCasos([caso, ...existentes]);
  salvarParecer(parecer);
  if (evidencias) salvarEvidencias(caso.id, evidencias);
}

/**
 * Guarda as evidências do caso. Sem espaço no localStorage, guarda sem o texto extraído
 * (metadados, força e presença continuam disponíveis). Retorna false nesse caso.
 */
export function salvarEvidencias(casoId: string, evidencias: Evidencia[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(PREFIXO_EVIDENCIAS + casoId, JSON.stringify(evidencias));
    return true;
  } catch {
    const semTexto = evidencias.map((e) => ({ ...e, textoExtraido: null, secoes: undefined }));
    try {
      localStorage.setItem(PREFIXO_EVIDENCIAS + casoId, JSON.stringify(semTexto));
    } catch {
      // sem espaço nem para os metadados: o parecer segue funcionando sem o visualizador
    }
    return false;
  }
}

export function obterEvidencias(casoId: string): Evidencia[] {
  if (typeof window === "undefined") return [];
  try {
    const salvas = localStorage.getItem(PREFIXO_EVIDENCIAS + casoId);
    return salvas ? (JSON.parse(salvas) as Evidencia[]) : [];
  } catch {
    return [];
  }
}

export function registrarAuditoria(evento: EventoAuditoria): void {
  if (typeof window === "undefined") return;
  const salvos = localStorage.getItem(CHAVE_AUDITORIA);
  const lista: EventoAuditoria[] = salvos ? JSON.parse(salvos) : [];
  lista.unshift(evento);
  localStorage.setItem(CHAVE_AUDITORIA, JSON.stringify(lista));
}

export function obterAuditoria(): EventoAuditoria[] {
  if (typeof window === "undefined") return [];
  const salvos = localStorage.getItem(CHAVE_AUDITORIA);
  return salvos ? JSON.parse(salvos) : [];
}

const cacheArquivosEmMemoria: Record<string, Record<string, string>> = {};

export function salvarArquivosCaso(casoId: string, arquivos: Record<string, string>): void {
  cacheArquivosEmMemoria[casoId] = arquivos;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(`lastro_arqs_${casoId}`, JSON.stringify(arquivos));
    } catch {
      // Se estourar cota, preserva na memória
    }
  }
}

export function obterArquivosCaso(casoId: string): Record<string, string> | null {
  if (cacheArquivosEmMemoria[casoId]) {
    return cacheArquivosEmMemoria[casoId];
  }
  if (typeof window !== "undefined") {
    try {
      const s = sessionStorage.getItem(`lastro_arqs_${casoId}`);
      if (s) {
        const arqs = JSON.parse(s);
        cacheArquivosEmMemoria[casoId] = arqs;
        return arqs;
      }
    } catch {}
  }
  return null;
}
