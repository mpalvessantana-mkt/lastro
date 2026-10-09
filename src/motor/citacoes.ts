import { Citacao, Confronto, EstadoCriterio, Evidencia, SentidoCitacao } from "../types";
import { normalizarTexto } from "./estados";

/** Um intervalo citável: uma seção (ou o arquivo inteiro) de uma evidência presente. */
export interface FonteCitavel {
  evidencia: Evidencia;
  seletor: string | null;   // "#2" — âncora da seção
  inicio: number;
  fim: number;
}

interface Frase {
  inicio: number;
  fim: number;
  norm: string;
}

const MAX_CITACOES = 3;

// Positivos sustentam a caracterização de P&D; negativos, indeterminação e o limite em aberto a restringem.
const ESTADOS_FAVORAVEIS: EstadoCriterio[] = ["DEMONSTRADA NO RECORTE", "INVESTIGADA", "DOCUMENTADA", "DOCUMENTADA NO ESCOPO"];

/** Sentido provisório — a validar com o especialista de domínio. */
export function sentidoDoEstado(estado: EstadoCriterio): SentidoCitacao {
  return ESTADOS_FAVORAVEIS.includes(estado) ? "FAVORAVEL" : "CONTRARIA";
}

/**
 * Frases de um intervalo do texto, com offsets no texto original. Cabeçalhos markdown e linhas
 * vazias ficam de fora; a frase termina em ".", "!" ou "?" seguido de espaço, ou no fim da linha.
 */
function frasesDoIntervalo(texto: string, inicio: number, fim: number): Frase[] {
  const frases: Frase[] = [];
  const linha = /[^\r\n]+/g;
  linha.lastIndex = inicio;
  for (let m = linha.exec(texto); m && m.index < fim; m = linha.exec(texto)) {
    if (/^\s*#/.test(m[0])) continue;
    const fimLinha = Math.min(m.index + m[0].length, fim);
    const conteudo = texto.slice(m.index, fimLinha);
    const corte = /[.!?](?=\s+\S)/g;
    let ini = 0;
    const cortes = [...conteudo.matchAll(corte)].map((c) => (c.index ?? 0) + 1);
    for (const fimFrase of [...cortes, conteudo.length]) {
      const bruta = conteudo.slice(ini, fimFrase);
      const esq = bruta.length - bruta.trimStart().length;
      const dir = bruta.trimEnd().length;
      if (dir > esq) {
        const a = m.index + ini + esq;
        const b = m.index + ini + dir;
        frases.push({ inicio: a, fim: b, norm: normalizarTexto(texto.slice(a, b)) });
      }
      ini = fimFrase;
    }
  }
  return frases;
}

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * A frase que contém o marcador. Prefere a ocorrência como palavra inteira ("mas" não casa com
 * "mesmas"), depois como início de palavra ("nao preserv" → "não preservou"), depois qualquer uma.
 */
function fraseDoMarcador(frases: Frase[], marcador: string): Frase | undefined {
  const m = escapar(marcador);
  const testes = [new RegExp(`(^|[^a-z0-9])${m}($|[^a-z0-9])`), new RegExp(`(^|[^a-z0-9])${m}`), new RegExp(m)];
  for (const t of testes) {
    const achada = frases.find((f) => t.test(f.norm));
    if (achada) return achada;
  }
  return undefined;
}

function montar(
  casoId: string,
  criterioId: number,
  indice: number,
  fonte: FonteCitavel,
  frase: Frase,
  sentido: SentidoCitacao
): Citacao {
  const texto = fonte.evidencia.textoExtraido ?? "";
  return {
    id: `CIT-${casoId}-C${criterioId}-${indice + 1}`,
    criterioId,
    evidenciaId: fonte.evidencia.id,
    seletor: fonte.seletor,
    trecho: texto.slice(frase.inicio, frase.fim),
    offsetInicio: frase.inicio,
    offsetFim: frase.fim,
    forcaProbatoria: fonte.evidencia.forcaProbatoria,
    sentido,
    origem: "MOTOR"
  };
}

/**
 * Citações literais que sustentam o estado: para cada marcador encontrado, a primeira frase das
 * fontes (na ordem dada) que o contém. Marcador que não for localizado não gera citação — nunca
 * um trecho aproximado.
 */
export function citarMarcadores(
  casoId: string,
  criterioId: number,
  estado: EstadoCriterio,
  marcadores: string[],
  fontes: FonteCitavel[]
): Citacao[] {
  const sentido = sentidoDoEstado(estado);
  const porFonte = fontes
    .filter((f) => f.evidencia.textoExtraido)
    .map((f) => ({ fonte: f, frases: frasesDoIntervalo(f.evidencia.textoExtraido!, f.inicio, f.fim) }));

  const citacoes: Citacao[] = [];
  const usadas = new Set<string>();
  for (const marcador of marcadores) {
    for (const { fonte, frases } of porFonte) {
      const frase = fraseDoMarcador(frases, marcador);
      if (!frase) continue;
      const chave = `${fonte.evidencia.id}:${frase.inicio}`;
      if (!usadas.has(chave)) {
        usadas.add(chave);
        citacoes.push(montar(casoId, criterioId, citacoes.length, fonte, frase, sentido));
      }
      break;
    }
    if (citacoes.length >= MAX_CITACOES) break;
  }
  return citacoes;
}

/** Estado derivado de outro critério: as mesmas passagens, reatribuídas e com o sentido do novo estado. */
export function citarPorDerivacao(casoId: string, criterioId: number, estado: EstadoCriterio, origem: Citacao[]): Citacao[] {
  return origem.map((c, i) => ({
    ...c,
    id: `CIT-${casoId}-C${criterioId}-${i + 1}`,
    criterioId,
    sentido: sentidoDoEstado(estado)
  }));
}

/** Uma linha literal de medicoes.csv por versão medida (apoio do critério 4). */
export function citarVersoesMedidas(casoId: string, criterioId: number, estado: EstadoCriterio, medicoes: Evidencia, versoes: string[]): Citacao[] {
  const texto = medicoes.textoExtraido ?? "";
  const citacoes: Citacao[] = [];
  for (const versao of versoes.slice(0, MAX_CITACOES)) {
    const m = new RegExp(`^[^\\r\\n]*;${escapar(versao)};[^\\r\\n]*`, "m").exec(texto);
    if (!m) continue;
    const frase = { inicio: m.index, fim: m.index + m[0].length, norm: "" };
    citacoes.push(montar(casoId, criterioId, citacoes.length, { evidencia: medicoes, seletor: null, inicio: 0, fim: texto.length }, frase, sentidoDoEstado(estado)));
  }
  return citacoes;
}

// ---------------------------------------------------------------------------
// Evidência contrária e contraditória (§2 regra 9): o parecer não pode ter só evidência favorável
// ---------------------------------------------------------------------------

// Restrição de alcance: a frase do limite que diz o que a conclusão NÃO cobre
const RESTRICAO = /(^|[^a-z0-9])(nao|sem|nenhum|nenhuma|nem|apenas|somente|exceto|limitad)/;

/** Frases do limite da conclusão que restringem o alcance — contrárias a qualquer extrapolação. */
export function citarRestricoesDoLimite(casoId: string, fontes: FonteCitavel[]): Citacao[] {
  const citacoes: Citacao[] = [];
  for (const fonte of fontes) {
    if (!fonte.evidencia.textoExtraido) continue;
    for (const frase of frasesDoIntervalo(fonte.evidencia.textoExtraido, fonte.inicio, fonte.fim)) {
      if (!RESTRICAO.test(frase.norm)) continue;
      const c = montar(casoId, 5, citacoes.length, fonte, frase, "CONTRARIA");
      citacoes.push({ ...c, id: `CIT-${casoId}-C5-R${citacoes.length + 1}` });
    }
  }
  return citacoes;
}

// Campo lógico do confronto (§7) → critério que ele alimenta
const CRITERIO_DO_CAMPO: Record<string, number> = {
  problema_motivador: 1,
  pergunta_registrada: 1,
  referencia_anterior: 1,
  mecanismo_hipotese: 2,
  protocolo_escopo: 4,
  ocorrencia_observada: 4,
  resultados: 4,
  versoes: 4,
  limite_conclusao: 5,
  proxima_acao: 5
};

/**
 * Em cada confronto, a afirmação que perde pela prevalência SUGERIDA (o analista ainda resolve)
 * vira citação CONTRADITORIA — só se o texto for localizado literalmente na evidência.
 */
export function citarConfrontos(casoId: string, confrontos: Confronto[], evidencias: Evidencia[]): Citacao[] {
  const citacoes: Citacao[] = [];
  for (const conf of confrontos) {
    // Prevalência efetiva: a do analista, se resolvido; senão a sugerida.
    const prevalece = conf.prevalencia === "NAO_RESOLVIDO" ? conf.prevalenciaSugerida : conf.prevalencia;
    const perdedora = prevalece === "A" ? conf.afirmacaoB : conf.afirmacaoA;
    let ev = evidencias.find((e) => e.id === perdedora.evidenciaId && e.textoExtraido);
    let texto = ev?.textoExtraido ?? "";
    const alvo = perdedora.texto.trim();
    if (!ev || !alvo) continue;

    // Exato; senão, tolerando quebras de linha do PDF — o trecho é sempre o recorte literal do arquivo
    let inicio = texto.indexOf(alvo);
    let fim = inicio + alvo.length;
    if (inicio === -1) {
      const flex = new RegExp(alvo.split(/\s+/).map(escapar).join("\\s+")).exec(texto);
      if (flex) {
        inicio = flex.index;
        fim = flex.index + flex[0].length;
      }
    }
    // Registro vencido pelo analista: o texto é a descrição do ensaio; o literal é a linha dele em resultados.csv
    const ensaioId = prevalece === "A" ? conf.afirmacaoB.ensaioId : null;
    if (inicio === -1 && ensaioId) {
      const res = evidencias.find((e) => e.arquivo.endsWith("resultados.csv") && e.textoExtraido);
      const linha = res?.textoExtraido ? new RegExp(`^${escapar(ensaioId)};[^\\r\\n]*`, "m").exec(res.textoExtraido) : null;
      if (res && linha) {
        ev = res;
        texto = res.textoExtraido!;
        inicio = linha.index;
        fim = linha.index + linha[0].length;
      }
    }
    if (inicio === -1) continue;
    const secao = ev.secoes?.find((s) => s.inicio <= inicio && fim <= s.fim);
    const fonte: FonteCitavel = { evidencia: ev, seletor: secao?.ancora ?? null, inicio: 0, fim: texto.length };
    const c = montar(casoId, CRITERIO_DO_CAMPO[conf.campoLogico] ?? 4, citacoes.length, fonte, { inicio, fim, norm: "" }, "CONTRADITORIA");
    citacoes.push({ ...c, id: `CIT-${casoId}-X${citacoes.length + 1}` });
  }
  return citacoes;
}
