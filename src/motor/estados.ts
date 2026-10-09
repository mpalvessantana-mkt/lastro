import { EstadoCriterio } from "../types";

/**
 * Sugestão de estado por critério a partir de marcadores linguísticos (CLAUDE.md §8.1).
 *
 * Regra de neutralidade: sem marcador reconhecido, o estado NÃO é proposto
 * (estadoSugerido = null, confiança BAIXA). Isso vira lacuna explícita e a classe
 * fica INCOMPLETO (§5.3, item 8). Nunca há fallback para um estado positivo.
 */
export interface SugestaoEstado {
  criterioId: number;
  estadoSugerido: EstadoCriterio | null;
  confianca: "ALTA" | "MEDIA" | "BAIXA";
  marcadoresEncontrados: string[];
  justificativaSugerida: string;
  /** Estado sem marcador próprio, derivado de outro critério ou das versões medidas (citação herdada). */
  derivadoDe?: 1 | 3 | "medicoes";
}

type Marcador = string | RegExp;

/** Minúsculas, sem acentos e com espaços colapsados — marcadores são escritos nesta forma. */
export function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ");
}

function encontrar(textoNorm: string, marcadores: Marcador[]): string[] {
  const achados: string[] = [];
  for (const m of marcadores) {
    if (typeof m === "string") {
      if (textoNorm.includes(m)) achados.push(m);
    } else {
      const r = textoNorm.match(m);
      if (r) achados.push(r[0]);
    }
  }
  return achados;
}

/** Termos que só contam quando aparecem numa frase negada ("não há técnica nova"). */
function encontrarEmFraseNegada(textoNorm: string, termos: string[]): string[] {
  const achados: string[] = [];
  for (const frase of textoNorm.split(/[.;]\s/)) {
    if (!/\b(nao|nenhum|nenhuma|sem|nem)\b/.test(frase)) continue;
    for (const t of termos) {
      if (frase.includes(t)) achados.push(t);
    }
  }
  return achados;
}

function sugestao(
  criterioId: number,
  estado: EstadoCriterio,
  confianca: "ALTA" | "MEDIA",
  marcadores: string[],
  fonte: string,
  texto: string
): SugestaoEstado {
  const lista = marcadores.map((m) => `“${m}”`).join(", ");
  return {
    criterioId,
    estadoSugerido: estado,
    confianca,
    marcadoresEncontrados: marcadores,
    justificativaSugerida: `${texto} Marcador(es) em ${fonte}: ${lista}.`
  };
}

function semEstado(criterioId: number, fonte: string): SugestaoEstado {
  return {
    criterioId,
    estadoSugerido: null,
    confianca: "BAIXA",
    marcadoresEncontrados: [],
    justificativaSugerida: `Nenhum marcador reconhecido em ${fonte}. Estado não proposto: lacuna a ser determinada pelo analista.`
  };
}

// ---------------------------------------------------------------------------
// Critério 5 — Transferência/reprodução (lido do limite da conclusão)
// ---------------------------------------------------------------------------

const C5_CONFIGURACAO: Marcador[] = [
  "nao ha hipotese de mecanismo novo",
  "apenas adequacao",
  "aplicacao conhecida",
  /nao transforma [^.]{0,60}(p&d|pesquisa)/,
  "verificacao funcional",
  "o escopo e conformidade",
  /nao se propos [^.]{0,40}(alterar|mecanismo|metodo|tecnica)/,
  "comportamento contratado",
  /aplicacao d[oa]s? [^.]{0,40}existente/,
  "permanece a fornecida"
];
const C5_CONFIGURACAO_NEGADOS = [
  "tecnica nova",
  "novo metodo",
  "outro metodo",
  "mecanismo novo",
  "avanco tecnologico",
  "primitiva",
  "metodo novo",
  "obstaculo tecnologico"
];
const C5_INSUFICIENTE: Marcador[] = [
  "faltam",
  "nao preserv",
  "nao permite distinguir",
  "nao complet",
  "nao prova",
  "nao se avalia",
  /nao (foi|foram) recuperad/,
  /nao demonstra[m]? a tecnica/
];
const C5_LIMITE: Marcador[] = [
  "mas nao a alegacao",
  "permanece em aberto",
  "segue aberto",
  /ainda nao foi validad/,
  /nao foi ensaiad/,
  /(integra|incluid[ao] n)a pretensao/,
  "nao satisfaz",
  /(continua|segue|permanece) sem validacao/,
  /nao (foi|foram) validad/,
  "segue em teste",
  "nao constitui validacao completa",
  "nao se sustenta",
  "antes de ampliar a conclusao",
  /(objetivo|hipotese|pretensao) original [^.]{0,30}inclu/
];
const C5_ESCOPO: Marcador[] = [
  "conclusao limitada",
  "nao se reivindica",
  /nao foram reivindicad/,
  "escopo de conclusao",
  "o experimento cobre",
  "o resultado mede",
  "a transferencia e da",
  /conclusao (restrita|limitada)/,
  /escopo (pre-?definido|definido antes)/,
  /(foram|sao) excluid[ao]s antes/,
  /nao (se promete|e prometid)|nenhum [^.]{0,30} e prometid/
];

export function sugerirEstadoCriterio5(textoLimite: string, c1e2Estado: EstadoCriterio | null = null): SugestaoEstado {
  const fonte = "metodo.md#6";
  const norm = normalizarTexto(textoLimite);

  const config = [...encontrar(norm, C5_CONFIGURACAO), ...encontrarEmFraseNegada(norm, C5_CONFIGURACAO_NEGADOS)];
  if (config.length) {
    return sugestao(5, "DOCUMENTADA PARA A CONFIGURAÇÃO", "ALTA", config, fonte,
      "O limite declara verificação de configuração ou aceite, sem mecanismo novo; a existência de documentação não transforma rotina em P&D.");
  }

  const insuf = encontrar(norm, C5_INSUFICIENTE);
  if (insuf.length) {
    return sugestao(5, "INSUFICIENTE PARA O NÚCLEO ALEGADO", "ALTA", insuf, fonte,
      "O limite declara elos faltantes: a documentação existente não completa a cadeia probatória do núcleo alegado.");
  }

  const limite = encontrar(norm, C5_LIMITE);
  if (limite.length) {
    return sugestao(5, "DOCUMENTADA COM LIMITE", "ALTA", limite, fonte,
      "A evidência sustenta a investigação no recorte ensaiado, mas o limite declara pretensão técnica em aberto.");
  }

  const escopo = encontrar(norm, C5_ESCOPO);
  if (escopo.length) {
    return sugestao(5, "DOCUMENTADA NO ESCOPO", "ALTA", escopo, fonte,
      "O limite delimita o escopo da conclusão e não reivindica além do que foi ensaiado.");
  }

  // Derivação dos critérios 1 e 2, como em c3 e c4: sem marcador no limite, a referência anterior
  // decide. Só nos estados negativo e de indeterminação; c1 positivo não deriva c5, porque é o c5
  // que separa Elegível de Com ressalvas.
  if (c1e2Estado === "NÃO DEMONSTRADA") {
    return { ...sugestao(5, "DOCUMENTADA PARA A CONFIGURAÇÃO", "MEDIA", ["critérios 1 e 2 não demonstrados"], fonte,
      "Sem marcador próprio no limite: a referência anterior já resolvia o problema, então o que se transfere é a configuração."), derivadoDe: 1 };
  }
  if (c1e2Estado === "INDETERMINADA") {
    return { ...sugestao(5, "INSUFICIENTE PARA O NÚCLEO ALEGADO", "MEDIA", ["critérios 1 e 2 indeterminados"], fonte,
      "Sem marcador próprio no limite: sem mecanismo definido, a documentação não alcança o núcleo alegado."), derivadoDe: 1 };
  }

  return semEstado(5, fonte);
}

// ---------------------------------------------------------------------------
// Critérios 1 e 2 — Novidade e Criatividade (metodo.md#1 e #2)
// ---------------------------------------------------------------------------

const C12_INDETERMINACAO: Marcador[] = [
  "plano propoe",
  "minuta",
  "diagrama",
  "nao define",
  "sem limiares aprovados",
  "identificadas apenas como",
  "nao preservou",
  "rascunho",
  "o desenho propoe",
  "documento de arquitetura",
  "pretende validar",
  /nao (foi|foram) preservad/
];
const C12_ROTINA: Marcador[] = [
  /\b(manual|catalogo|produto|plataforma|cofre|dicionario|fornecedor|runbook|modulo|ferramenta|motor de destino)\b[^.]{0,60}?\b(fornece|oferece|define|permite|preve|recomenda|descreve|contem|disponibiliza)\b/,
  "anterior a configuracao",
  "anterior a equipe",
  "antecede o projeto",
  "receita do fornecedor",
  "sem modificar",
  "faixa ja admitida",
  "nenhum algoritmo",
  "fornecidos pela plataforma",
  "nao houve alteracao",
  "dentro das faixas documentadas",
  /ja estava aprovad[ao] antes/,
  "recebe o motor pronto",
  "nao alterar logica",
  "listadas no manual",
  "dependencia pronta"
];
const C12_INVESTIGACAO: Marcador[] = [
  /\b(eram|sao|estavam|foram) [^.]{0,15}(conhecid|dominad|disponive|especificad)/,
  "comparador",
  "a alternativa",
  "nao vincula",
  "perde",
  "o problema investigado",
  "o problema era",
  "a hipotese",
  "a incerteza",
  "confront",
  /\b(foi|foram) comparad/,
  /\bnao (fixa|fixam|preserva|preservam|distingue|distinguem|separa|separam|explicita|explicitam)\b/
];
// "X fazia Y, mas falha em Z" sem outro marcador: sinal fraco de investigação.
const C12_INVESTIGACAO_FRACA: Marcador[] = [/\bmas\b/];

export function sugerirEstadosCriterios1e2(
  textoSecao1: string,
  textoSecao2: string
): { c1: SugestaoEstado; c2: SugestaoEstado } {
  const fonte = "metodo.md#1 e metodo.md#2";
  const norm = normalizarTexto(`${textoSecao1}\n${textoSecao2}`);

  const montar = (estado: EstadoCriterio, confianca: "ALTA" | "MEDIA", marcadores: string[], t1: string, t2: string) => ({
    c1: sugestao(1, estado, confianca, marcadores, fonte, t1),
    c2: sugestao(2, estado, confianca, marcadores, fonte, t2)
  });

  const indet = encontrar(norm, C12_INDETERMINACAO);
  if (indet.length) {
    return montar("INDETERMINADA", "ALTA", indet,
      "A referência anterior e o mecanismo aparecem só como plano, minuta ou diagrama; a novidade não é verificável nas evidências entregues.",
      "O mecanismo não está definido a ponto de permitir avaliar a criatividade técnica.");
  }

  const rotina = encontrar(norm, C12_ROTINA);
  if (rotina.length) {
    return montar("NÃO DEMONSTRADA", "ALTA", rotina,
      "A referência anterior já fornecia o recurso aplicado.",
      "O trabalho descrito é configuração ou aplicação de receita existente, sem modificação do mecanismo.");
  }

  const investigacao = encontrar(norm, C12_INVESTIGACAO);
  if (investigacao.length) {
    return montar("DEMONSTRADA NO RECORTE", "ALTA", investigacao,
      "A referência anterior nomeia alternativas conhecidas e o ponto em que elas falham no problema investigado.",
      "O mecanismo proposto é especificado frente às alternativas conhecidas.");
  }

  const fraca = encontrar(norm, C12_INVESTIGACAO_FRACA);
  if (fraca.length) {
    return montar("DEMONSTRADA NO RECORTE", "MEDIA", fraca,
      "A referência anterior contrapõe o recurso existente a uma limitação, sem marcador explícito de comparador.",
      "O mecanismo é descrito frente a um recurso existente, sem marcador explícito de comparador.");
  }

  return { c1: semEstado(1, fonte), c2: semEstado(2, fonte) };
}

// ---------------------------------------------------------------------------
// Critério 3 — Incerteza tecnológica (metodo.md#2, com apoio de #1 e #3)
// ---------------------------------------------------------------------------

const C3_NAO_CARACTERIZADA: Marcador[] = [
  "resolvidos por configuracao",
  "sem hipotese",
  "nao houve alteracao"
];
const C3_ALEGADA: Marcador[] = ["faltam versao", "sem regras e saidas"];
const C3_INVESTIGADA: Marcador[] = [
  "hipotese",
  "incerteza",
  "o problema era",
  "testar se",
  "confront",
  "comparador",
  "alternativa",
  "comparar",
  "compartilhad",
  /\bmesm[ao]s? (entradas?|sequencia|carga|referencia|matriz|ordem|versoes|conjunto|populacao|distribuicao)\b/
];

export function sugerirEstadoCriterio3(
  textoSecao2: string,
  c1e2Estado: EstadoCriterio | null,
  textoApoio = ""
): SugestaoEstado {
  const fonte = "metodo.md#2";
  const norm = normalizarTexto(textoSecao2);

  const nao = encontrar(norm, C3_NAO_CARACTERIZADA);
  if (nao.length) {
    return sugestao(3, "NÃO CARACTERIZADA", "ALTA", nao, fonte,
      "Os desvios são resolvidos por configuração, mapeamento ou receita existente, sem hipótese técnica desconhecida.");
  }

  const alegada = encontrar(norm, C3_ALEGADA);
  if (alegada.length) {
    return sugestao(3, "ALEGADA, NÃO VERIFICÁVEL", "ALTA", alegada, fonte,
      "Faltam versões executadas e registros de saída para verificar a incerteza alegada.");
  }

  // Derivação dos critérios 1 e 2: o mesmo texto que os sustenta sustenta a leitura da incerteza.
  if (c1e2Estado === "INDETERMINADA") {
    return { ...sugestao(3, "ALEGADA, NÃO VERIFICÁVEL", "MEDIA", ["critérios 1 e 2 indeterminados"], fonte,
      "Sem mecanismo definido nem versão executada, a incerteza é apenas alegada."), derivadoDe: 1 };
  }
  if (c1e2Estado === "NÃO DEMONSTRADA") {
    return { ...sugestao(3, "NÃO CARACTERIZADA", "MEDIA", ["critérios 1 e 2 não demonstrados"], fonte,
      "A referência anterior já resolvia o problema; não há incerteza tecnológica caracterizada."), derivadoDe: 1 };
  }

  if (c1e2Estado === "DEMONSTRADA NO RECORTE") {
    const inv = encontrar(normalizarTexto(`${textoSecao2}\n${textoApoio}`), C3_INVESTIGADA);
    if (inv.length) {
      return sugestao(3, "INVESTIGADA", "ALTA", inv, `${fonte} (com apoio de #1 e #3)`,
        "Há hipótese ou comparador explícito frente às alternativas conhecidas.");
    }
  }

  return semEstado(3, fonte);
}

// ---------------------------------------------------------------------------
// Critério 4 — Sistematicidade (metodo.md#3 + versões em medicoes.csv)
// ---------------------------------------------------------------------------

const C4_PARCIAL: Marcador[] = [
  /\b(sem|nenhuma tem) causa controlada/,
  "memorando",
  "nao ha decisoes pareadas",
  "sem vincular",
  "nao tem vinculo",
  "sem preservar"
];
const C4_ACEITE: Marcador[] = [
  "roteiros de aceite",
  "apos correcao",
  "depois do ajuste",
  /\bprimeir[ao] (rodada|matriz|passagem)\b/,
  "o roteiro verifica"
];
const C4_DOCUMENTADA: Marcador[] = [
  /criterios? previos?/,
  "definidos antes",
  "antes da comparacao",
  "antes da rodada",
  /\bmesm[ao]s? (entradas?|sequencia|carga|referencia|matriz|ordem|versoes|conjunto|populacao|distribuicao)\b/,
  "contrabalancad",
  "criterio:",
  /\bcomparadores\b/,
  "compartilhad"
];

export function sugerirEstadoCriterio4(
  textoSecao3: string,
  c3Estado: EstadoCriterio | null,
  versoesMedidas = 0
): SugestaoEstado {
  const fonte = "metodo.md#3";
  const norm = normalizarTexto(textoSecao3);

  const parcial = encontrar(norm, C4_PARCIAL);
  if (parcial.length) {
    return sugestao(4, "PARCIAL", "ALTA", parcial, fonte,
      "Os registros recuperados não contêm causa controlada, saída do mecanismo ou vínculo com o resultado alegado.");
  }

  const aceite = encontrar(norm, C4_ACEITE);
  if (aceite.length) {
    return sugestao(4, "DOCUMENTADA COMO ACEITE", "ALTA", aceite, fonte,
      "O protocolo é verificação funcional: uma rodada falhou e a seguinte passou após ajuste.");
  }

  if (c3Estado === "ALEGADA, NÃO VERIFICÁVEL") {
    return { ...sugestao(4, "PARCIAL", "MEDIA", ["critério 3 alegado, não verificável"], fonte,
      "Sem versão executada do mecanismo, os registros não completam a verificação."), derivadoDe: 3 };
  }
  if (c3Estado === "NÃO CARACTERIZADA") {
    return { ...sugestao(4, "DOCUMENTADA COMO ACEITE", "MEDIA", ["critério 3 não caracterizado"], fonte,
      "Sem incerteza caracterizada, os roteiros registrados documentam aceite da configuração."), derivadoDe: 3 };
  }

  const documentada = encontrar(norm, C4_DOCUMENTADA);
  if (documentada.length) {
    return sugestao(4, "DOCUMENTADA", "ALTA", documentada, fonte,
      "População definida, comparadores sobre a mesma entrada e critérios fixados antes da rodada.");
  }
  if (c3Estado === "INVESTIGADA" && versoesMedidas >= 2) {
    return { ...sugestao(4, "DOCUMENTADA", "MEDIA", [`${versoesMedidas} versões medidas em medicoes.csv`], `${fonte} e medicoes.csv`,
      "As alternativas foram executadas e medidas por versão sobre a mesma população."), derivadoDe: "medicoes" };
  }

  return semEstado(4, fonte);
}
