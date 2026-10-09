import { Confronto, Ensaio } from "../types";
import { Inventario, ForcaInventario } from "./inventario";
import { SecaoFatiada, PERGUNTAS_ENTREVISTA, PerguntaEntrevista, BLOCOS_DOSSIE } from "./secoes";

/**
 * Detector de divergência (CLAUDE.md §7).
 *
 * 1. Campos espelhados: o mesmo conteúdo aparece em vários arquivos. Comparação literal normalizada;
 *    onde as cópias diferem, nasce um Confronto.
 * 2. Afirmação de resultado da entrevista ("Como ficou a conclusão da rodada?"): cruzada numericamente
 *    com o ensaio correspondente em medicoes.csv/resultados.csv (§7.1, passo 4).
 *
 * O detector só SUGERE a prevalência (pela força probatória do inventário). Todo Confronto nasce
 * NAO_RESOLVIDO: quem resolve é o analista (regra 6).
 */

export interface OcorrenciaCampo {
  fonte: string;          // rótulo legível: "evidencias/metodo.md#6", "entrevista: “Que ponto…?”"
  evidenciaId: string;    // ID nativo do inventário
  ensaioId?: string | null;
  texto: string;
  forca: ForcaInventario;
}

export interface LinhaAtividade {
  id_atividade: string;
  fase: string;
  descricao: string;
  resultado_ou_saida: string;
}

export interface LinhaObservacao {
  observacao_id: string;
  saida_ou_situacao: string;
}

export interface LinhaCronologia {
  evento_id: string;
  versao: string;
}

export interface EntradaRedundancia {
  casoId: string;
  inventario: Inventario;
  metodo: Record<number, SecaoFatiada>;
  revisao: Record<string, string>;
  atividades: LinhaAtividade[];
  configuracao: { escopo?: string; versoes_registradas?: string[] } | null;
  observacoes: LinhaObservacao[];
  cronologia: LinhaCronologia[];
  entrevista: Partial<Record<PerguntaEntrevista, string>>;
  dossie: Partial<Record<(typeof BLOCOS_DOSSIE)[number], string>>;
  versoesMedidas: string[];
  ensaios: Ensaio[];
}

export interface ResultadoRedundancia {
  confrontos: Confronto[];
  camposEspelhados: Record<string, string[]>;   // campo lógico → fontes onde foi encontrado
  lacunas: string[];
}

// ---------------------------------------------------------------------------
// Normalização e utilitários
// ---------------------------------------------------------------------------

export function normalizarTexto(t: string): string {
  return (t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}%]+/gu, " ")
    .trim();
}

/** Cópias concordam se forem iguais ou se uma for trecho literal da outra (excertos de seção). */
function concordam(a: string, b: string): boolean {
  const na = normalizarTexto(a);
  const nb = normalizarTexto(b);
  if (!na || !nb) return true;
  return na === nb || na.includes(nb) || nb.includes(na);
}

// Respostas da entrevista que só remetem a um documento: não afirmam nada a confrontar.
const REMISSAO = /\b(descrit[ao]s?|registrad[ao]s?) n[oa]s? (metodo|recortes?|registros?)\b|limitada aos cenarios documentados/;
// Respostas que admitem a falta de material: coerentes com a lacuna, não são afirmação de resultado.
const ADMISSAO = /\bnao (localiz|acompanh|relacion|consig|tenho|ha )/;

const RANK: Record<ForcaInventario, number> = { PRIMARIA: 3, DERIVADA: 2, CONTEXTO: 1, DECLARATORIA: 0 };


function razaoPorForca(vencedora: OcorrenciaCampo, perdedora: OcorrenciaCampo): string {
  if (RANK[vencedora.forca] === RANK[perdedora.forca]) {
    return "as duas fontes têm a mesma força probatória no inventário; sugere-se a fonte de referência do campo, e a decisão é do analista";
  }
  if (vencedora.forca === "PRIMARIA") return "por ser registro primário declarado no inventário";
  if (perdedora.forca === "DECLARATORIA") return "por ser documento entregue, e não depoimento de memória";
  return `por ter força probatória maior no inventário (${vencedora.forca} frente a ${perdedora.forca})`;
}

function rotuloFonte(o: OcorrenciaCampo): string {
  return `${o.fonte} (${o.evidenciaId})`;
}

// ---------------------------------------------------------------------------
// Coleta dos campos espelhados (§7)
// ---------------------------------------------------------------------------

function coletarCampos(e: EntradaRedundancia): Record<string, OcorrenciaCampo[]> {
  const inv = e.inventario;
  const ev = (arquivo: string) => inv.porArquivo(arquivo);
  const campos: Record<string, OcorrenciaCampo[]> = {};
  const add = (campo: string, arquivo: string, fonte: string, texto: string | undefined) => {
    const item = ev(arquivo);
    if (!item || !texto || !texto.trim()) return;
    (campos[campo] ||= []).push({ fonte, evidenciaId: item.id, texto: texto.trim(), forca: item.forca });
  };

  const atv = (n: number) => e.atividades.find((a) => a.id_atividade.endsWith(`ATV${String(n).padStart(2, "0")}`));
  const sec = (n: number) => e.metodo[n]?.conteudo;
  const ent = (p: PerguntaEntrevista) => e.entrevista[p];
  const fEnt = (p: PerguntaEntrevista) => `a entrevista (“${PERGUNTAS_ENTREVISTA[p]}”)`;
  const ENT = "transcricao_entrevista_tecnica.pdf";
  const DOS = "dossie_projeto.pdf";

  // A primeira fonte de cada campo é a referência contra a qual as outras são comparadas.
  add("problema_motivador", "atividades.csv", `atividades.csv ${atv(1)?.id_atividade ?? "ATV01"}`, atv(1)?.descricao);
  add("problema_motivador", DOS, "o dossiê (Contexto)", e.dossie["Contexto"]);
  add("problema_motivador", ENT, fEnt("situacao"), ent("situacao"));

  add("pergunta_registrada", DOS, "o dossiê (Pergunta registrada)", e.dossie["Pergunta registrada"]);
  add("pergunta_registrada", "atividades.csv", `atividades.csv ${atv(1)?.id_atividade ?? "ATV01"} (saída)`,
    atv(1)?.resultado_ou_saida?.replace(/^Pergunta:\s*/i, ""));

  add("referencia_anterior", "evidencias/metodo.md", "evidencias/metodo.md#1", sec(1));
  add("referencia_anterior", DOS, "o dossiê (Referência anterior)", e.dossie["Referência anterior"]);
  add("referencia_anterior", "atividades.csv", `atividades.csv ${atv(2)?.id_atividade ?? "ATV02"}`, atv(2)?.descricao);
  add("referencia_anterior", ENT, fEnt("alternativas"), ent("alternativas"));

  add("mecanismo_hipotese", "evidencias/metodo.md", "evidencias/metodo.md#2", sec(2));
  add("mecanismo_hipotese", "atividades.csv", `atividades.csv ${atv(3)?.id_atividade ?? "ATV03"}`, atv(3)?.descricao);
  add("mecanismo_hipotese", ENT, fEnt("mecanismo"), ent("mecanismo"));

  add("protocolo_escopo", "evidencias/metodo.md", "evidencias/metodo.md#3", sec(3));
  add("protocolo_escopo", "evidencias/configuracao.json", "evidencias/configuracao.json (escopo)", e.configuracao?.escopo);
  add("protocolo_escopo", "atividades.csv", `atividades.csv ${atv(4)?.id_atividade ?? "ATV04"}`, atv(4)?.descricao);
  add("protocolo_escopo", DOS, "o dossiê (Trabalho documentado)", e.dossie["Trabalho documentado"]);
  add("protocolo_escopo", ENT, fEnt("verificacao"), ent("verificacao"));

  for (const o of e.observacoes) {
    add("ocorrencia_observada", "evidencias/observacoes.csv", `evidencias/observacoes.csv ${o.observacao_id}`, o.saida_ou_situacao);
  }
  add("ocorrencia_observada", "atividades.csv", `atividades.csv ${atv(6)?.id_atividade ?? "ATV06"} (saída)`, atv(6)?.resultado_ou_saida);
  add("ocorrencia_observada", ENT, fEnt("ocorrencia"), ent("ocorrencia"));

  add("limite_conclusao", "evidencias/metodo.md", "evidencias/metodo.md#6", sec(6));
  add("limite_conclusao", DOS, "o dossiê (Limite da conclusão)", e.dossie["Limite da conclusão"]);
  add("limite_conclusao", "atividades.csv", `atividades.csv ${atv(8)?.id_atividade ?? "ATV08"}`, atv(8)?.descricao);
  add("limite_conclusao", "evidencias/revisao_tecnica.md", "evidencias/revisao_tecnica.md (Limites e pendências técnicas)",
    e.revisao["Limites e pendências técnicas"]);
  add("limite_conclusao", ENT, fEnt("continuidade"), ent("continuidade"));

  add("proxima_acao", "evidencias/metodo.md", "evidencias/metodo.md#7", sec(7));
  add("proxima_acao", "evidencias/revisao_tecnica.md", "evidencias/revisao_tecnica.md (Próxima ação da equipe)",
    e.revisao["Próxima ação da equipe"]);

  return campos;
}

// ---------------------------------------------------------------------------
// Confronto literal
// ---------------------------------------------------------------------------

function criarConfronto(
  id: string,
  campoLogico: string,
  a: OcorrenciaCampo,
  b: OcorrenciaCampo,
  textoA: string,
  textoB: string,
  razao: string,
  textoFormatado: string
): Confronto {
  return {
    id,
    campoLogico,
    afirmacaoA: { fonte: a.fonte, evidenciaId: a.evidenciaId, texto: textoA, forca: a.forca },
    afirmacaoB: { fonte: b.fonte, evidenciaId: b.evidenciaId, ensaioId: b.ensaioId ?? null, texto: textoB, forca: b.forca },
    prevalenciaSugerida: "B",
    prevalencia: "NAO_RESOLVIDO",
    razaoDaPrevalencia: razao,
    textoFormatado,
    resolvidoPor: null,
    resolvidoEm: null
  };
}

function confrontosLiterais(campos: Record<string, OcorrenciaCampo[]>, novoId: () => string): Confronto[] {
  const confrontos: Confronto[] = [];
  for (const [campo, ocorrencias] of Object.entries(campos)) {
    // Em ocorrência, cada linha de observacoes.csv é uma referência válida; a cópia concorda com qualquer uma.
    const referencias = campo === "ocorrencia_observada"
      ? ocorrencias.filter((o) => o.fonte.startsWith("evidencias/observacoes.csv"))
      : ocorrencias.slice(0, 1);
    if (!referencias.length) continue;
    const copias = ocorrencias.filter((o) => !referencias.includes(o));

    for (const copia of copias) {
      if (copia.forca === "DECLARATORIA" && REMISSAO.test(normalizarTexto(copia.texto))) continue;
      if (referencias.some((r) => concordam(r.texto, copia.texto))) continue;

      const ref = referencias[0];
      const [fraca, forte] = RANK[copia.forca] > RANK[ref.forca] ? [ref, copia] : [copia, ref];
      const razao = razaoPorForca(forte, fraca);
      confrontos.push(criarConfronto(novoId(), campo, fraca, forte, fraca.texto, forte.texto, razao,
        `${capitalizar(rotuloFonte(fraca))} afirma “${fraca.texto}”; ${rotuloFonte(forte)} mostra “${forte.texto}”; prevalece ${forte.fonte}, ${razao}.`));
    }
  }
  return confrontos;
}

function capitalizar(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// ---------------------------------------------------------------------------
// Versões: cronologia × configuracao.versoes_registradas × metodo#4 × medicoes
// ---------------------------------------------------------------------------

function confrontoVersoes(e: EntradaRedundancia, novoId: () => string): { confrontos: Confronto[]; fontes: string[] } {
  const ehVersao = (v: string) => /-v\d+$/.test(v.trim());
  const conjuntos: Array<{ fonte: string; arquivo: string; versoes: string[] }> = [];
  const linhaVersoes = e.metodo[4]?.conteudo.match(/Versões localizadas:\s*([^\n]+?)\.\s/)?.[1];
  if (linhaVersoes) conjuntos.push({ fonte: "evidencias/metodo.md#4", arquivo: "evidencias/metodo.md", versoes: linhaVersoes.split(",").map((v) => v.trim()) });
  if (e.configuracao?.versoes_registradas?.length) {
    conjuntos.push({ fonte: "evidencias/configuracao.json (versoes_registradas)", arquivo: "evidencias/configuracao.json", versoes: e.configuracao.versoes_registradas });
  }
  const crono = e.cronologia.map((c) => c.versao).filter(ehVersao);
  if (crono.length) conjuntos.push({ fonte: "evidencias/cronologia.csv", arquivo: "evidencias/cronologia.csv", versoes: crono });
  if (e.versoesMedidas.length) conjuntos.push({ fonte: "evidencias/medicoes.csv", arquivo: "evidencias/medicoes.csv", versoes: e.versoesMedidas });

  const fontes = conjuntos.map((c) => c.fonte);
  if (conjuntos.length < 2) return { confrontos: [], fontes };

  const chave = (vs: string[]) => [...new Set(vs.map((v) => v.trim()))].sort().join(", ");
  const ref = conjuntos.find((c) => c.arquivo === "evidencias/medicoes.csv") ?? conjuntos[0];
  const confrontos: Confronto[] = [];
  for (const c of conjuntos) {
    if (c === ref || chave(c.versoes) === chave(ref.versoes)) continue;
    const ocorrencia = (x: typeof c): OcorrenciaCampo | null => {
      const item = e.inventario.porArquivo(x.arquivo);
      return item ? { fonte: x.fonte, evidenciaId: item.id, texto: chave(x.versoes), forca: item.forca } : null;
    };
    const a = ocorrencia(c);
    const b = ocorrencia(ref);
    if (!a || !b) continue;
    const [fraca, forte] = RANK[a.forca] > RANK[b.forca] ? [b, a] : [a, b];
    const razao = razaoPorForca(forte, fraca);
    confrontos.push(criarConfronto(novoId(), "versoes", fraca, forte, fraca.texto, forte.texto, razao,
      `${capitalizar(rotuloFonte(fraca))} lista as versões ${fraca.texto}; ${rotuloFonte(forte)} registra ${forte.texto}; prevalece ${forte.fonte}, ${razao}.`));
  }
  return { confrontos, fontes };
}

// ---------------------------------------------------------------------------
// Afirmações numéricas × ensaios (§7.1, passo 4)
// ---------------------------------------------------------------------------

const STOP = new Set(["para", "entre", "apos", "como", "com", "sem", "pelo", "pela", "este", "esta", "desse", "dessa", "ainda"]);

/** Radicais de 5 letras das palavras com 4+ letras — tolera plural e flexão ("replays"/"replay", "aceitou"/"aceitos"). */
function radicais(texto: string): Set<string> {
  return new Set(
    normalizarTexto(texto)
      .split(/[^a-z]+/)
      .filter((p) => p.length >= 4 && !STOP.has(p))
      .map((p) => p.slice(0, 5))
  );
}

const EXTENSO: Record<string, number> = {
  zero: 0, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10,
  onze: 11, doze: 12, treze: 13, quatorze: 14, catorze: 14, quinze: 15, dezesseis: 16, dezessete: 17,
  dezoito: 18, dezenove: 19, vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60,
  setenta: 70, oitenta: 80, noventa: 90, cem: 100
};

export interface Quantidades {
  numeros: number[];       // contagens ou valores
  percentuais: number[];
  totalidade: boolean;     // "todas", "todos"
}

/** Extrai quantidades de uma frase em português ("1.100 pares", "2,8%", "78 dos 80", "um dos vinte", "nenhuma"). */
export function extrairQuantidades(frase: string): Quantidades {
  const q: Quantidades = { numeros: [], percentuais: [], totalidade: false };
  const texto = frase.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  // Remove identificadores de versão ("restrito-v4") para que o número da versão não conte como quantidade.
  const semVersoes = texto.replace(/[a-z0-9]+-v\d+/g, " ");
  for (const m of semVersoes.matchAll(/(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?\s*(%)?/g)) {
    const valor = Number(m[1].replace(/\./g, "") + (m[2] ? `.${m[2]}` : ""));
    (m[3] ? q.percentuais : q.numeros).push(valor);
  }
  for (const palavra of semVersoes.split(/[^a-z]+/)) {
    if (palavra in EXTENSO) q.numeros.push(EXTENSO[palavra]);
    if (palavra === "nenhum" || palavra === "nenhuma") q.numeros.push(0);
    if (palavra === "todas" || palavra === "todos") q.totalidade = true;
  }
  if (/\bum[a]? d[oa]s\b/.test(semVersoes)) q.numeros.push(1);
  return q;
}

function temQuantidade(q: Quantidades): boolean {
  return q.numeros.length > 0 || q.percentuais.length > 0 || q.totalidade;
}

function quantidadesConferem(q: Quantidades, ensaio: Ensaio): boolean {
  const valores = [ensaio.valor, ensaio.baseDeCalculo];
  if (!q.numeros.every((n) => valores.some((v) => v !== null && Math.abs(v - n) < 1e-9))) return false;
  if (q.percentuais.length && ensaio.taxaPercentual === null) return false;
  if (!q.percentuais.every((p) => Math.abs((ensaio.taxaPercentual ?? NaN) - p) <= 0.05)) return false;
  if (q.totalidade && ensaio.valor !== ensaio.baseDeCalculo) return false;
  return true;
}

function numeroVersao(versao: string): number {
  return Number(versao.match(/-v(\d+)$/)?.[1] ?? 0);
}

function fmtNumero(n: number | null): string {
  if (n === null) return "vazio";
  return n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export function descreverEnsaio(e: Ensaio): string {
  if (e.operacao === "contagem") {
    const taxa = e.taxaPercentual !== null ? ` (${fmtNumero(Number(e.taxaPercentual.toFixed(1)))}%)` : "";
    return `${fmtNumero(e.valor)}/${fmtNumero(e.baseDeCalculo)}${taxa} em ${e.versao}`;
  }
  return `${fmtNumero(e.valor)} ${e.unidade} (${e.operacao}) em ${e.versao}`;
}

/**
 * Escolhe o ensaio a que a afirmação se refere: maior sobreposição com o nome da métrica;
 * entre empatados, a versão nomeada na frase; persistindo o empate, a versão final (maior vN).
 * Ensaios de natureza "entrega" ficam fora: contam material disponibilizado, não desempenho (§6.5).
 */
export function ensaioDaAfirmacao(afirmacao: string, ensaios: Ensaio[]): Ensaio | null {
  const rad = radicais(afirmacao);
  let melhores: Ensaio[] = [];
  let melhor = { n: 0, fracao: 0 };
  for (const e of ensaios) {
    if (e.natureza === "entrega") continue;
    const radMetrica = [...radicais(e.metrica)];
    const n = radMetrica.filter((r) => rad.has(r)).length;
    const fracao = radMetrica.length ? n / radMetrica.length : 0;
    if (n === 0) continue;
    if (n > melhor.n || (n === melhor.n && fracao > melhor.fracao)) {
      melhor = { n, fracao };
      melhores = [e];
    } else if (n === melhor.n && fracao === melhor.fracao) {
      melhores.push(e);
    }
  }
  if (!melhores.length) return null;

  const nomeados = melhores.filter((e) =>
    [...radicais(e.versao.replace(/-v\d+$/, ""))].some((r) => rad.has(r))
  );
  const candidatos = nomeados.length ? nomeados : melhores;
  return candidatos.reduce((a, b) => (numeroVersao(b.versao) > numeroVersao(a.versao) ? b : a));
}

function cruzarConclusaoDaEntrevista(
  e: EntradaRedundancia,
  novoId: () => string
): { confrontos: Confronto[]; lacunas: string[] } {
  const afirmacao = e.entrevista.conclusao?.trim();
  const itemEnt = e.inventario.porArquivo("transcricao_entrevista_tecnica.pdf");
  const itemMed = e.inventario.porArquivo("evidencias/medicoes.csv");
  if (!afirmacao || !itemEnt || !itemMed) return { confrontos: [], lacunas: [] };

  const norm = normalizarTexto(afirmacao);
  if (REMISSAO.test(norm) || ADMISSAO.test(norm)) return { confrontos: [], lacunas: [] };

  const pergunta = PERGUNTAS_ENTREVISTA.conclusao;
  const quantidades = extrairQuantidades(afirmacao);
  const ensaio = ensaioDaAfirmacao(afirmacao, e.ensaios);
  if (!temQuantidade(quantidades) || !ensaio) {
    return {
      confrontos: [],
      lacunas: [`A entrevista (${itemEnt.id}, “${pergunta}”) afirma “${afirmacao}”, mas o motor não identificou ${
        ensaio ? "quantidade" : "ensaio correspondente"} para cruzar com os registros. Conferir manualmente.`]
    };
  }
  if (quantidadesConferem(quantidades, ensaio)) return { confrontos: [], lacunas: [] };

  const outra = e.ensaios.find(
    (x) => x !== ensaio && x.metrica === ensaio.metrica && x.natureza !== "entrega" && quantidadesConferem(quantidades, x)
  );
  const linha = (v: string) => v.replace(/-v\d+$/, "");
  const relacao = !outra
    ? ""
    : linha(outra.versao) !== linha(ensaio.versao)
      ? "outra alternativa ensaiada"
      : numeroVersao(outra.versao) < numeroVersao(ensaio.versao) ? "versão anterior" : "versão posterior";
  const nota = outra ? ` O valor citado coincide com ${outra.id}: ${descreverEnsaio(outra)}, ${relacao}.` : "";
  const aviso = ensaio.conferido ? "" : ` Atenção: a conferência aritmética de ${ensaio.id} divergiu (${ensaio.divergenciaRecalculo}).`;

  const a: OcorrenciaCampo = { fonte: `a entrevista (“${pergunta}”)`, evidenciaId: itemEnt.id, texto: afirmacao, forca: itemEnt.forca };
  const b: OcorrenciaCampo = {
    fonte: "evidencias/medicoes.csv e resultados.csv",
    evidenciaId: itemMed.id,
    ensaioId: ensaio.id,
    texto: `${descreverEnsaio(ensaio)} (${ensaio.metrica})`,
    forca: itemMed.forca
  };
  const razao = "por ser primário, identificado por versão e recalculável a partir das medições";
  const texto = `A entrevista (${itemEnt.id}, “${pergunta}”) afirma “${afirmacao}”; ${b.fonte}, ensaio ${ensaio.id}, mostram ${
    descreverEnsaio(ensaio)} (${ensaio.metrica}); prevalece o registro, ${razao}.${nota}${aviso}`;

  return { confrontos: [criarConfronto(novoId(), "resultados", a, b, a.texto, b.texto, razao, texto)], lacunas: [] };
}

/** ATV07 (Conferência dos resultados) transcreve "versão: métrica=valor"; cada valor é cruzado com o ensaio. */
function cruzarAtividadeDeConferencia(e: EntradaRedundancia, novoId: () => string): Confronto[] {
  const atv = e.atividades.find((a) => a.id_atividade.endsWith("ATV07"));
  const itemAtv = e.inventario.porArquivo("atividades.csv");
  const itemMed = e.inventario.porArquivo("evidencias/medicoes.csv");
  if (!atv?.resultado_ou_saida || !itemAtv || !itemMed) return [];

  const confrontos: Confronto[] = [];
  for (const m of atv.resultado_ou_saida.matchAll(/([\w.-]+-v\d+):\s*([^=;]+?)=\s*([\d.,]+)/g)) {
    const [trecho, versao, metrica, bruto] = m;
    const ensaio = e.ensaios.find((x) => x.versao === versao && normalizarTexto(x.metrica) === normalizarTexto(metrica));
    const valor = extrairQuantidades(bruto).numeros[0];
    if (!ensaio || ensaio.valor === null || valor === undefined || Math.abs(ensaio.valor - valor) < 1e-9) continue;

    const a: OcorrenciaCampo = { fonte: `atividades.csv ${atv.id_atividade} (saída)`, evidenciaId: itemAtv.id, texto: trecho.trim(), forca: itemAtv.forca };
    const b: OcorrenciaCampo = { fonte: "evidencias/medicoes.csv e resultados.csv", evidenciaId: itemMed.id, ensaioId: ensaio.id, texto: descreverEnsaio(ensaio), forca: itemMed.forca };
    const razao = razaoPorForca(b, a);
    confrontos.push(criarConfronto(novoId(), "resultados", a, b, a.texto, b.texto, razao,
      `${capitalizar(rotuloFonte(a))} registra “${a.texto}”; ${b.fonte}, ensaio ${ensaio.id}, mostram ${b.texto}; prevalece o registro, ${razao}.`));
  }
  return confrontos;
}

// ---------------------------------------------------------------------------
// Orquestração
// ---------------------------------------------------------------------------

export function analisarRedundancia(e: EntradaRedundancia): ResultadoRedundancia {
  let seq = 0;
  const novoId = () => `${e.casoId}-CONF${String(++seq).padStart(2, "0")}`;

  const campos = coletarCampos(e);
  const camposEspelhados: Record<string, string[]> = {};
  for (const [campo, ocorrencias] of Object.entries(campos)) camposEspelhados[campo] = ocorrencias.map((o) => o.fonte);

  const versoes = confrontoVersoes(e, novoId);
  if (versoes.fontes.length) camposEspelhados.versoes = versoes.fontes;

  const conclusao = cruzarConclusaoDaEntrevista(e, novoId);
  camposEspelhados.resultados = ["evidencias/medicoes.csv", "evidencias/resultados.csv"];

  return {
    confrontos: [
      ...confrontosLiterais(campos, novoId),
      ...versoes.confrontos,
      ...conclusao.confrontos,
      ...cruzarAtividadeDeConferencia(e, novoId)
    ],
    camposEspelhados,
    lacunas: conclusao.lacunas
  };
}
