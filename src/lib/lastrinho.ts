import type { Norma } from "@/types";

// Regra 4 aplicada ao Lastrinho: norma só se cita por normaId do corpus. Toda menção
// a dispositivo que não esteja coberta por uma norma citada é marcada como não
// verificada. Funções puras, testáveis sem rede.

function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function palavras(texto: string): Set<string> {
  return new Set(semAcento(texto).split(/[^a-z0-9]+/).filter((p) => p.length >= 4));
}

/** Normas cujo texto mais se sobrepõe às palavras da pergunta (sem semelhança semântica). */
export function selecionarNormas(pergunta: string, corpus: Norma[], limite = 6): Norma[] {
  const termos = palavras(pergunta);
  const idsNaPergunta = corpus.filter((n) => pergunta.toUpperCase().includes(n.id));
  const pontuadas = corpus
    .map((n) => {
      const alvo = palavras(`${n.dispositivo} ${n.ementa} ${n.tags.join(" ")} ${n.texto}`);
      let pontos = 0;
      for (const t of termos) if (alvo.has(t)) pontos++;
      return { n, pontos };
    })
    .filter((x) => x.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos)
    .map((x) => x.n);
  const escolhidas = [...idsNaPergunta, ...pontuadas.filter((n) => !idsNaPergunta.includes(n))];
  return escolhidas.slice(0, limite);
}

export interface AuditoriaReferencias {
  /** IDs do corpus que aparecem na resposta. */
  normasCitadas: string[];
  /** Menções a dispositivo que nenhuma norma citada cobre. */
  naoVerificadas: string[];
}

// Nomes das fontes do corpus: mencioná-las não é citar dispositivo.
const NOME_DE_FONTE = /\b(?:lei|decreto|instrucao normativa|in)\s*(?:rfb\s*)?(?:n[oº°.]?\s*)?(?:11\.?196|5\.?798|1\.?187)\b/;

const MENCOES: RegExp[] = [
  /\bart(?:igo)?s?\.?\s*\d+(?:-[a-z])?(?:o|º|°)?/gi,
  /§\s*\d+(?:o|º|°)?/g,
  /\b(?:lei|decreto|instru[çc][ãa]o normativa|IN)\s*(?:RFB\s*)?(?:n[º°o.]?\s*)?\d[\d.]*(?:\/\d{2,4})?/gi,
  /\b(?:ac[óo]rd[ãa]o|s[úu]mula|solu[çc][ãa]o de consulta)\s*(?:n[º°o.]?\s*)?[\d.\-/]+/gi
];

function numero(mencao: string): string | null {
  return mencao.match(/\d+/)?.[0] ?? null;
}

/** Confere cada menção normativa da resposta contra as normas do corpus que ela cita. */
export function auditarReferencias(resposta: string, corpus: Norma[]): AuditoriaReferencias {
  const citadas = corpus.filter((n) => resposta.includes(n.id));
  // Os próprios IDs não são menções a conferir.
  let texto = resposta;
  for (const n of corpus) texto = texto.split(n.id).join(" ");

  const naoVerificadas: string[] = [];
  for (const re of MENCOES) {
    for (const m of texto.matchAll(re)) {
      const mencao = m[0].trim();
      const norm = semAcento(mencao);
      if (NOME_DE_FONTE.test(norm)) continue;
      const num = numero(mencao);
      const antes = semAcento(texto.slice(Math.max(0, (m.index ?? 0) - 25), m.index ?? 0));

      let coberta = false;
      if (/^art/.test(norm)) {
        coberta = citadas.some((n) => /^art/i.test(n.dispositivo) && numero(n.dispositivo) === num);
      } else if (norm.startsWith("§")) {
        // § logo depois de um artigo faz parte da menção ao artigo.
        if (/art(?:igo)?s?\.?\s*\d+/.test(antes)) continue;
        // Coberto se for o parágrafo citado (Frascati) ou se existir no texto de uma norma citada.
        const paragrafo = new RegExp(`§\\s*${num}(?!\\d)`);
        coberta = citadas.some((n) => paragrafo.test(n.dispositivo) || paragrafo.test(n.texto));
      }
      if (!coberta && !naoVerificadas.includes(mencao)) naoVerificadas.push(mencao);
    }
  }
  return { normasCitadas: citadas.map((n) => n.id), naoVerificadas };
}

/** Nota anexada à resposta quando há menção normativa fora do corpus citado. */
export function notaNaoVerificadas(naoVerificadas: string[]): string {
  if (naoVerificadas.length === 0) return "";
  return (
    `\n\n---\n⚠️ **Referência não verificada no corpus:** ${naoVerificadas.join(" · ")}. ` +
    "Não está no corpus normativo do LASTRO (ou não foi citada pelo seu normaId) e não pode fundamentar o parecer."
  );
}
