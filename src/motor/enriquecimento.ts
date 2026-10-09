import { Citacao, Evidencia, Parecer } from "../types";
import { ExtracaoTrechoOutput } from "./schemas";

// Incorpora ao parecer proposto o que a IA devolveu (§8.2), já validado por
// validarRespostaIA. A IA só redige o porquê e acrescenta trechos: estado,
// classe, lacunas e citações do motor nunca mudam. A lacuna que a IA apontar
// fica no registro do enriquecimento (enriquecer-parecer.ts). Puro, sem rede.

const ID_NATIVO = /\bPRJ\d+-(?:EV|ATV|S)\d+\b/g;

// Fontes enviadas à IA: as que sustentam os cinco critérios (metodo §1–§6 e revisão).
const ARQUIVOS_PARA_IA = ["metodo.md", "revisao_tecnica.md"];

export interface EntradaIA {
  criterioId: number;
  estadoSugerido: string;
  textosPorId: Record<string, string>;
  idsValidos: string[];
}

/** Uma entrada por ponto com estado proposto. Ponto sem estado é lacuna e fica com o motor. */
export function montarEntradasIA(parecer: Parecer, evidencias: Evidencia[]): EntradaIA[] {
  const textosPorId: Record<string, string> = {};
  for (const ev of evidencias) {
    if (ev.textoExtraido && ARQUIVOS_PARA_IA.some((a) => ev.caminhoNoPacote.endsWith(a) || ev.arquivo.endsWith(a))) {
      textosPorId[ev.id] = ev.textoExtraido;
    }
  }
  if (Object.keys(textosPorId).length === 0) return [];

  // IDs válidos: os do inventário e os IDs nativos que aparecem no próprio pacote.
  const ids = new Set(evidencias.map((e) => e.id));
  for (const ev of evidencias) for (const id of ev.textoExtraido?.match(ID_NATIVO) ?? []) ids.add(id);

  return Object.values(parecer.pontos)
    .filter((p) => p.estadoProposto !== null)
    .map((p) => ({
      criterioId: p.criterioId,
      estadoSugerido: p.estadoProposto as string,
      textosPorId,
      idsValidos: [...ids]
    }));
}

function mesmoTrecho(a: string, b: string): boolean {
  return a.includes(b) || b.includes(a);
}

/** Aplica a saída de um critério. Devolve um parecer novo; o original não é alterado. */
export function incorporarEnriquecimento(
  parecer: Parecer,
  evidencias: Evidencia[],
  criterioId: number,
  output: ExtracaoTrechoOutput
): Parecer {
  const original = parecer.pontos[criterioId];
  if (!original || original.estadoProposto === null) return parecer;

  const porId = new Map(evidencias.map((e) => [e.id, e]));
  const existentes = [...original.citacoesPropostas, ...parecer.citacoesContrarias];
  const novas: Citacao[] = [];

  for (const t of output.trechos) {
    const ev = porId.get(t.evidenciaId);
    const inicio = ev?.textoExtraido?.indexOf(t.trecho) ?? -1;
    if (!ev || inicio === -1) continue; // já validado; defesa extra
    if ([...existentes, ...novas].some((c) => c.evidenciaId === ev.id && mesmoTrecho(c.trecho, t.trecho))) continue;
    const secao = ev.secoes?.find((s) => inicio >= s.inicio && inicio < s.fim);
    novas.push({
      id: `CIT-${parecer.casoId}-C${criterioId}-IA${novas.length + 1}`,
      criterioId,
      evidenciaId: ev.id,
      seletor: secao?.ancora ?? null,
      trecho: t.trecho,
      offsetInicio: inicio,
      offsetFim: inicio + t.trecho.length,
      forcaProbatoria: ev.forcaProbatoria,
      sentido: t.sentido,
      origem: "IA"
    });
  }

  const porque = output.porqueRedigido.trim();
  const ponto = {
    ...original,
    citacoesPropostas: [...original.citacoesPropostas, ...novas],
    ...(porque
      ? { porqueProposto: porque, porqueOrigem: "IA" as const, porqueMotor: original.porqueMotor ?? original.porqueProposto }
      : {})
  };

  const contrarias = novas.filter((c) => c.sentido !== "FAVORAVEL");

  return {
    ...parecer,
    pontos: { ...parecer.pontos, [criterioId]: ponto },
    citacoesContrarias: [...parecer.citacoesContrarias, ...contrarias]
  };
}
