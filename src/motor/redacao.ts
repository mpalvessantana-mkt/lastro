import { Evidencia } from "../types";
import { ResultadoComposicao } from "./classificacao";

// Campos condicionais da classe (§5.3, §13 item 4), redigidos por extração: cada campo é
// um trecho literal do pacote com ID e âncora. O que não for localizado vira lacuna
// declarada — nunca texto genérico (§2 regras 2 e 3).

export interface CamposCondicionais {
  recorteSustentado: string | null;      // COM_RESSALVAS
  limitacaoEspecifica: string | null;    // COM_RESSALVAS
  evidenciaNecessaria: string | null;    // COM_RESSALVAS
  eloAusente: string | null;             // EVIDENCIA_INSUFICIENTE
  evidenciasASolicitar: string[] | null; // EVIDENCIA_INSUFICIENTE
  mecanismoDocumentado: string | null;   // NAO_ELEGIVEL
  lacunas: string[];
}

interface Fonte {
  ev: Evidencia;
  ancora: string;
  texto: string;
}

function semAcento(t: string): string {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Corpo literal de uma seção (sem a linha do título), localizada por âncora ou por título. */
function secao(ev: Evidencia | undefined, chave: { ancora?: string; titulo?: string }): Fonte | null {
  if (!ev?.textoExtraido || !ev.secoes) return null;
  const s = ev.secoes.find((x) => (chave.ancora && x.ancora === chave.ancora) || (chave.titulo && x.titulo.startsWith(chave.titulo)));
  if (!s) return null;
  const bruto = ev.textoExtraido.slice(s.inicio, s.fim);
  const corpo = bruto.replace(/^#+[^\n]*\n/, "").trim();
  return corpo ? { ev, ancora: s.ancora, texto: corpo } : null;
}

/** Primeiro parágrafo: o restante das seções 1 e 7 é a ressalva padrão do exercício sintético. */
function primeiroParagrafo(f: Fonte | null): Fonte | null {
  const p = f?.texto.split(/\r?\n/).map((l) => l.trim()).find(Boolean);
  return f && p ? { ...f, texto: p } : null;
}

function nomeArquivo(ev: Evidencia): string {
  return ev.arquivo.split("/").pop() ?? ev.arquivo;
}

function citar(trecho: string, f: Fonte): string {
  return `“${trecho}” (${f.ev.id}, ${nomeArquivo(f.ev)}${f.ancora})`;
}

const RESTRITIVA = /\b(nao|sem|faltam?|nenhum|nenhuma)\b|\bem aberto\b|\bsegue aberto\b/;
const SUSTENTA = /\b(sustenta|conclusao|limitad[ao]|delimitad[ao]|restrit[ao])\b/;

/** Orações literais do texto: frases quebradas em "; " e antes de ", mas". */
function oracoes(texto: string): string[] {
  return texto
    .split(/(?<=[.!?])\s+/)
    .flatMap((frase) => frase.split(/;\s+|,\s+(?=mas\b)/))
    .map((o) => o.trim().replace(/^mas\s+/, ""))
    .filter(Boolean);
}

/** "Faltam A, B e C." e "Sem A e B não …" → itens literais. */
function itensFaltantes(texto: string): string[] {
  const itens: string[] = [];
  for (const m of texto.matchAll(/\bFaltam\s+([^.;]+)/g)) itens.push(...m[1].split(/,\s+|\s+e\s+/));
  for (const m of texto.matchAll(/\bSem\s+(.+?)\s+não\b/g)) itens.push(...m[1].split(/,\s+|\s+e\s+/));
  return itens.map((i) => i.trim()).filter(Boolean);
}

export function redigirCondicionais(
  comp: Pick<ResultadoComposicao, "classe">,
  metodo: Evidencia | undefined,
  revisao: Evidencia | undefined
): CamposCondicionais {
  const campos: CamposCondicionais = {
    recorteSustentado: null, limitacaoEspecifica: null, evidenciaNecessaria: null,
    eloAusente: null, evidenciasASolicitar: null, mecanismoDocumentado: null, lacunas: []
  };
  const classe = comp.classe;
  const comRessalvas = classe === "COM_RESSALVAS";
  const insuficiente = classe === "EVIDENCIA_INSUFICIENTE" || classe === "CONFLITO";
  const naoElegivel = classe === "NAO_ELEGIVEL" || classe === "CONFLITO";
  if (!comRessalvas && !insuficiente && !naoElegivel) return campos;

  const limite = secao(metodo, { ancora: "#6" }) ?? secao(revisao, { titulo: "Limites e pendências técnicas" });
  const continuidade = primeiroParagrafo(secao(metodo, { ancora: "#7" }) ?? secao(revisao, { titulo: "Próxima ação da equipe" }));
  const partes = limite ? oracoes(limite.texto) : [];
  const restritivas = partes.filter((o) => RESTRITIVA.test(semAcento(o)));
  const livres = partes.filter((o) => !restritivas.includes(o));

  if (comRessalvas) {
    const recorte = livres.filter((o) => SUSTENTA.test(semAcento(o)));
    const escolhidas = recorte.length ? recorte : livres;
    if (limite && escolhidas.length) campos.recorteSustentado = escolhidas.map((o) => citar(o, limite)).join(" ");
    else campos.lacunas.push("Recorte sustentado não localizado literalmente no limite da conclusão; redigir na homologação.");

    if (limite && restritivas.length) campos.limitacaoEspecifica = restritivas.map((o) => citar(o, limite)).join(" ");
    else campos.lacunas.push("Limitação específica não localizada no limite da conclusão; redigir na homologação.");

    if (continuidade) campos.evidenciaNecessaria = citar(continuidade.texto, continuidade);
    else campos.lacunas.push("Evidência necessária não localizada em metodo.md#7 nem na próxima ação da revisão; redigir na homologação.");

    // A fronteira Com ressalvas × Evidência insuficiente não é textual: depende de o que ficou sem
    // validação ser parte da conclusão ou o próprio núcleo do mecanismo. O sistema não decide isso.
    campos.lacunas.push(
      "Ponto de decisão do analista: Com ressalvas pressupõe que o que ficou sem validação é parte da conclusão pretendida. " +
      "Se for o próprio núcleo do mecanismo alegado, a leitura é Evidência insuficiente — a classe Com ressalvas não deve preencher ausência essencial de prova (LEIA_ME do pacote)."
    );
  }

  if (insuficiente) {
    if (limite && restritivas.length) campos.eloAusente = restritivas.map((o) => citar(o, limite)).join(" ");
    else campos.lacunas.push("Elo ausente não localizado no limite da conclusão; redigir na homologação.");

    const itens = limite ? itensFaltantes(limite.texto).map((i) => citar(i, limite)) : [];
    if (continuidade) itens.push(citar(continuidade.texto, continuidade));
    if (itens.length) campos.evidenciasASolicitar = itens;
    else campos.lacunas.push("Evidências a solicitar não localizadas no pacote; listar na homologação.");
  }

  if (naoElegivel) {
    const referencia = primeiroParagrafo(secao(metodo, { ancora: "#1" }));
    if (referencia) campos.mecanismoDocumentado = citar(referencia.texto, referencia);
    else campos.lacunas.push("Mecanismo documentado que já resolvia o problema não localizado em metodo.md#1; redigir na homologação.");
  }

  return campos;
}
