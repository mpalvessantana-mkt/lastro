import { Confronto, Evidencia, Parecer } from "../types";
import { citarConfrontos } from "./citacoes";

// Resolução de um confronto pelo analista (§2 regra 6, §7.2). O motor só sugere; aqui entra a
// decisão humana. Divergir da sugestão exige razão escrita, o texto do parecer passa a dizer quem
// prevaleceu e por quê, e a citação contraditória passa a ser a afirmação que perdeu de fato.
// A perdedora nunca some do documento. Puro, sem rede.

export type ResultadoResolucao = { ok: true; parecer: Parecer } | { ok: false; motivo: string };

function textoResolvido(conf: Confronto, escolha: "A" | "B", razao: string, sugeridoOriginal: string): string {
  if (escolha === conf.prevalenciaSugerida && razao === (conf.razaoSugerida ?? conf.razaoDaPrevalencia)) {
    return sugeridoOriginal;
  }
  const vencedora = escolha === "A" ? conf.afirmacaoA : conf.afirmacaoB;
  // As duas afirmações ficam como o motor as escreveu; muda só a cláusula de prevalência.
  const corte = sugeridoOriginal.lastIndexOf("; prevalece ");
  const base = corte !== -1
    ? sugeridoOriginal.slice(0, corte)
    : `${conf.afirmacaoA.fonte} afirma “${conf.afirmacaoA.texto}”; ${conf.afirmacaoB.fonte} mostra “${conf.afirmacaoB.texto}”`;
  const quem = escolha === conf.prevalenciaSugerida ? "" : ", contra a sugestão do sistema";
  return `${base}; prevalece ${vencedora.fonte}${quem}, segundo o analista: ${razao.replace(/\.$/, "")}.`;
}

export function resolverConfronto(
  parecer: Parecer,
  evidencias: Evidencia[],
  confId: string,
  escolha: "A" | "B",
  opcoes: { razao?: string; por: string; em: string }
): ResultadoResolucao {
  const conf = parecer.confrontos.find((c) => c.id === confId);
  if (!conf) return { ok: false, motivo: `confronto ${confId} não encontrado` };

  const razaoInformada = opcoes.razao?.trim() ?? "";
  if (escolha !== conf.prevalenciaSugerida && !razaoInformada) {
    return { ok: false, motivo: "Divergir da prevalência sugerida exige a razão escrita." };
  }

  const razaoSugerida = conf.razaoSugerida ?? conf.razaoDaPrevalencia;
  const textoSugerido = conf.textoSugerido ?? conf.textoFormatado;
  const razao = razaoInformada || razaoSugerida;

  const resolvido: Confronto = {
    ...conf,
    prevalencia: escolha,
    razaoDaPrevalencia: razao,
    textoFormatado: textoResolvido({ ...conf, razaoSugerida }, escolha, razao, textoSugerido),
    razaoSugerida,
    textoSugerido,
    resolvidoPor: opcoes.por,
    resolvidoEm: opcoes.em
  };
  const confrontos = parecer.confrontos.map((c) => (c.id === confId ? resolvido : c));

  // Contraditórias recompostas pela prevalência efetiva (resolvida ou, se pendente, sugerida).
  const contraditorias = citarConfrontos(parecer.casoId, confrontos, evidencias);
  const citacoesContrarias = [
    ...parecer.citacoesContrarias.filter((c) => c.sentido !== "CONTRADITORIA"),
    ...contraditorias
  ];

  return { ok: true, parecer: { ...parecer, confrontos, citacoesContrarias } };
}
