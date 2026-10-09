import {
  Caso,
  Evidencia,
  Parecer,
  PontoDoParecer,
  EstadoCriterio,
  Citacao,
  Confronto
} from "../types";
import { comporClasse } from "./classificacao";
import { fatiarMetodoMD, fatiarRevisaoTecnica, fatiarEntrevista, fatiarDossie, lerCabecalhoDossie } from "./secoes";
import { conferirAritmetica, LinhaMedicao, LinhaResultado } from "./aritmetica";
import { parseCSV } from "./parsers/csv";
import {
  sugerirEstadoCriterio5,
  sugerirEstadosCriterios1e2,
  sugerirEstadoCriterio3,
  sugerirEstadoCriterio4
} from "./estados";
import { listarNormasPorCriterio, versaoCorpus } from "./corpus";
import { lerInventario } from "./inventario";
import { montarEvidencias } from "./evidencias";
import {
  citarMarcadores,
  citarPorDerivacao,
  citarVersoesMedidas,
  citarRestricoesDoLimite,
  citarConfrontos,
  FonteCitavel
} from "./citacoes";
import {
  analisarRedundancia,
  LinhaAtividade,
  LinhaCronologia,
  LinhaObservacao
} from "./redundancia";
import { extrairDadosDossie } from "./parsers/dossie";
import { redigirCondicionais } from "./redacao";

/**
 * caminho -> conteúdo textual. Os PDFs (dossiê, registro técnico, entrevista) entram com o texto
 * já extraído por parsers/pdf.ts; texto ilegível é tratado como arquivo não lido (lacuna).
 */
export interface PacoteArquivos {
  [caminho: string]: string;
}

export interface ResultadoAnalise {
  caso: Caso;
  parecer: Parecer;
  evidencias: Evidencia[];
}

export interface OpcoesAnalise {
  /** SHA-256 dos bytes originais do pacote (hash.ts → hashPacote), calculado por quem lê os arquivos. */
  sha256Pacote?: string;
  /** Arquivos presentes que não puderam ser lidos (parsers/pacote.ts → lerPacote). */
  naoLidos?: Array<{ caminho: string; motivo: string }>;
}

export function analisarPacote(
  casoId: string,
  titulo: string,
  arquivos: PacoteArquivos,
  opcoes: OpcoesAnalise = {}
): ResultadoAnalise {
  const inicioMs = Date.now();
  const nomesArquivos = Object.keys(arquivos);

  // 1. Extração do metodo.md
  const metodoPath = Object.keys(arquivos).find((k) => k.endsWith("metodo.md")) || "";
  const metodoTxt = arquivos[metodoPath] || "";
  const secoesMetodo = fatiarMetodoMD(metodoTxt);

  // 2. Extração da revisao_tecnica.md
  const revPath = Object.keys(arquivos).find((k) => k.endsWith("revisao_tecnica.md")) || "";
  const revTxt = arquivos[revPath] || "";
  const secoesRev = fatiarRevisaoTecnica(revTxt);

  // 3. Texto do Limite da Conclusão (Método Seção 6 ou Revisão Limites)
  const textoLimite = secoesMetodo[6]?.conteudo || secoesRev["Limites e pendências técnicas"] || "";

  // 4. Texto Seção 1 (Referência anterior) e Seção 2 (Mecanismo e hipótese)
  const textoS1 = secoesMetodo[1]?.conteudo || "";
  const textoS2 = secoesMetodo[2]?.conteudo || "";
  const textoS3 = secoesMetodo[3]?.conteudo || "";

  // Medições primárias: também informam quantas versões foram de fato executadas (critério 4)
  const medPath = Object.keys(arquivos).find((k) => k.endsWith("medicoes.csv")) || "";
  const resPath = Object.keys(arquivos).find((k) => k.endsWith("resultados.csv")) || "";
  const medicoesLinhas = medPath ? parseCSV<LinhaMedicao>(arquivos[medPath]) : [];
  const resultadosLinhas = resPath ? parseCSV<LinhaResultado>(arquivos[resPath]) : [];
  const versoesMedidasLista = [...new Set(medicoesLinhas.map((m) => m.versao).filter(Boolean))];
  const versoesMedidas = versoesMedidasLista.length;

  // 5. Sugestão de Estados determinística (sem marcador → null, nunca positivo)
  const { c1: s1, c2: s2 } = sugerirEstadosCriterios1e2(textoS1, textoS2);
  const s5 = sugerirEstadoCriterio5(textoLimite, s1.estadoSugerido);
  const s3 = sugerirEstadoCriterio3(textoS2, s1.estadoSugerido, `${textoS1}\n${textoS3}`);
  const s4 = sugerirEstadoCriterio4(textoS3, s3.estadoSugerido, versoesMedidas);

  // 7. Aritmética: medicoes.csv e resultados.csv
  const ensaiosConferidos = conferirAritmetica(resultadosLinhas, medicoesLinhas);

  const ensaiosDivergentes = ensaiosConferidos
    .filter((e) => !e.conferido)
    .map((e) => e.id);

  // 7b. Redundância: campos espelhados entre arquivos e afirmações da entrevista × ensaios (§7)
  const ler = (nome: string) => {
    const caminho = nomesArquivos.find((k) => k === nome || k.endsWith(`/${nome}`));
    return caminho ? arquivos[caminho] : undefined;
  };
  const lerCSV = <T,>(nome: string): T[] => {
    const texto = ler(nome);
    return texto ? parseCSV<T>(texto) : [];
  };
  let configuracao: { escopo?: string; versoes_registradas?: string[] } | null = null;
  try {
    const textoConfig = ler("configuracao.json");
    configuracao = textoConfig ? JSON.parse(textoConfig) : null;
  } catch {
    configuracao = null;
  }
  const entrevista = fatiarEntrevista(ler("transcricao_entrevista_tecnica.pdf") || "");
  const dossie = fatiarDossie(ler("dossie_projeto.pdf") || "");
  const cabecalho = lerCabecalhoDossie(ler("dossie_projeto.pdf") || "");
  const inventario = lerInventario(casoId, ler("inventario_evidencias.csv"));

  // 7c. Evidências: inventário × arquivos presentes (ausente = lacuna declarada, não erro)
  const { evidencias, ausentes, foraDoInventario } = montarEvidencias(
    inventario,
    arquivos,
    (opcoes.naoLidos ?? []).map((n) => n.caminho)
  );

  const redundancia = analisarRedundancia({
    casoId,
    inventario,
    metodo: secoesMetodo,
    revisao: secoesRev,
    // atividades.csv é derivado do XLSX (EV14 ← EV03); sem o CSV, a planilha já convertida serve de fonte
    atividades: ler("atividades.csv") ? lerCSV<LinhaAtividade>("atividades.csv") : lerCSV<LinhaAtividade>("atividades.xlsx"),
    configuracao,
    observacoes: lerCSV<LinhaObservacao>("observacoes.csv"),
    cronologia: lerCSV<LinhaCronologia>("cronologia.csv"),
    entrevista,
    dossie,
    versoesMedidas: versoesMedidasLista,
    ensaios: ensaiosConferidos
  });

  const lacunasDeLeitura: string[] = (opcoes.naoLidos ?? []).map(
    (n) => `O arquivo ${n.caminho} está no pacote mas não pôde ser lido (${n.motivo}); seu conteúdo não foi considerado.`
  );
  if (ler("transcricao_entrevista_tecnica.pdf") !== undefined && Object.keys(entrevista).length === 0) {
    lacunasDeLeitura.push("A entrevista técnica não pôde ser lida (texto do PDF não extraído); depoimento não confrontado com os registros.");
  }
  if (ler("dossie_projeto.pdf") !== undefined && Object.keys(dossie).length === 0) {
    lacunasDeLeitura.push("O dossiê não pôde ser lido (texto do PDF não extraído); seus blocos não foram confrontados.");
  }

  // 8. Montagem dos 5 Pontos do Parecer
  const nomesCriterios: Record<number, string> = {
    1: "Novidade",
    2: "Criatividade técnica",
    3: "Incerteza tecnológica",
    4: "Sistematicidade",
    5: "Transferência e reprodução"
  };

  // 8a. Citações literais (§2 regra 3): a frase do marcador que levou ao estado, com ID e força do inventário
  const evidencia = (arquivo: string) => evidencias.find((e) => e.presente && e.arquivo.endsWith(arquivo));
  const evMetodo = evidencia("metodo.md");
  const evRevisao = evidencia("revisao_tecnica.md");
  const secaoMetodo = (n: number): FonteCitavel[] => {
    const sec = evMetodo?.secoes?.find((x) => x.ancora === `#${n}`);
    return evMetodo && sec ? [{ evidencia: evMetodo, seletor: sec.ancora, inicio: sec.inicio, fim: sec.fim }] : [];
  };
  const secaoLimitesRevisao: FonteCitavel[] = (() => {
    const sec = evRevisao?.secoes?.find((x) => x.titulo === "Limites e pendências técnicas");
    return evRevisao && sec ? [{ evidencia: evRevisao, seletor: sec.ancora, inicio: sec.inicio, fim: sec.fim }] : [];
  })();
  const fontesPorCriterio: Record<number, FonteCitavel[]> = {
    1: [...secaoMetodo(1), ...secaoMetodo(2)],
    2: [...secaoMetodo(2), ...secaoMetodo(1)],
    3: [...secaoMetodo(2), ...secaoMetodo(1), ...secaoMetodo(3)],
    4: secaoMetodo(3),
    5: secoesMetodo[6]?.conteudo ? secaoMetodo(6) : secaoLimitesRevisao
  };

  const sugestoes = [s1, s2, s3, s4, s5];
  const citacoesPorCriterio: Record<number, Citacao[]> = {};
  for (let i = 1; i <= 5; i++) {
    const sug = sugestoes[i - 1];
    const estado = sug.estadoSugerido;
    if (!estado) {
      citacoesPorCriterio[i] = [];
    } else if (sug.derivadoDe === "medicoes") {
      const evMed = evidencia("medicoes.csv");
      citacoesPorCriterio[i] = evMed ? citarVersoesMedidas(casoId, i, estado, evMed, versoesMedidasLista) : [];
    } else if (sug.derivadoDe) {
      citacoesPorCriterio[i] = citarPorDerivacao(casoId, i, estado, citacoesPorCriterio[sug.derivadoDe] ?? []);
    } else {
      citacoesPorCriterio[i] = citarMarcadores(casoId, i, estado, sug.marcadoresEncontrados, fontesPorCriterio[i]);
    }
    // Estado sem trecho localizável não é proposto: vira lacuna (§2 regra 3)
    if (estado && citacoesPorCriterio[i].length === 0) {
      sugestoes[i - 1] = {
        ...sug,
        estadoSugerido: null,
        confianca: "BAIXA",
        justificativaSugerida: `O marcador sugeria ${estado}, mas nenhum trecho literal que o sustente foi localizado nas evidências. Estado não proposto: lacuna a ser determinada pelo analista.`
      };
    }
  }

  // 6. Composição da Classe (depois das citações: só estados com trecho entram)
  const estados: Record<number, EstadoCriterio | null> = {};
  for (let i = 1; i <= 5; i++) estados[i] = sugestoes[i - 1].estadoSugerido;
  const comp = comporClasse(estados);

  const pontos: Record<number, PontoDoParecer> = {};

  for (let i = 1; i <= 5; i++) {
    const sug = sugestoes[i - 1];
    const normas = listarNormasPorCriterio(i).map((n) => n.id);
    const citacoes = citacoesPorCriterio[i];

    pontos[i] = {
      criterioId: i,
      nomeCriterio: nomesCriterios[i],
      estadoProposto: sug.estadoSugerido,
      porqueProposto: sug.justificativaSugerida,
      citacoesPropostas: citacoes,
      normasAplicadas: normas.slice(0, 3), // primeiras normas vigentes relacionadas
      confianca: sug.confianca,
      acaoDoAnalista: null,
      estadoFinal: null,
      porqueFinal: null,
      motivoDaMudanca: null,
      aceiteEmBloco: false,
      decididoPor: null,
      decididoEm: null
    };
  }

  const confrontos: Confronto[] = redundancia.confrontos;

  // §2 regra 9: contrárias dos pontos + restrições de alcance do limite + afirmações perdedoras dos
  // confrontos (CONTRADITÓRIA). Uma vez por trecho: estados derivados repetem a passagem de origem.
  const citacoesContrarias = [
    ...Object.values(citacoesPorCriterio).flat().filter((c) => c.sentido === "CONTRARIA"),
    ...citarRestricoesDoLimite(casoId, fontesPorCriterio[5]),
    ...citarConfrontos(casoId, confrontos, evidencias)
  ].filter((c, i, todas) => todas.findIndex((x) => x.evidenciaId === c.evidenciaId && x.offsetInicio === c.offsetInicio) === i);
  if (citacoesContrarias.length === 0) {
    lacunasDeLeitura.push("Nenhuma evidência contrária ou contraditória localizada: confira se o limite da conclusão e as divergências foram de fato documentados.");
  }

  // Campos condicionais da classe, extraídos literalmente do pacote (redacao.ts)
  const evPorArquivo = (nome: string) => evidencias.find((e) => e.presente && (e.caminhoNoPacote.endsWith(nome) || e.arquivo.endsWith(nome)));
  const condicionais = redigirCondicionais(comp, evPorArquivo("metodo.md"), evPorArquivo("revisao_tecnica.md"));

  const parecerId = `PAR-${casoId}-V1`;
  const duracaoMs = Date.now() - inicioMs;

  const dadosDossie = extrairDadosDossie(casoId, arquivos);

  const caso: Caso = {
    id: casoId,
    // Identificação declarada no dossiê prevalece; o título do chamador é só fallback
    titulo: cabecalho.titulo || titulo || `Projeto ${casoId}`,
    equipe: cabecalho.equipe ?? "",
    duracaoSemanas: cabecalho.duracaoSemanas,
    resumo: dadosDossie.resumo,
    origem: casoId.startsWith("PRJ") && parseInt(casoId.replace("PRJ", ""), 10) <= 20 ? "REFERENCIA" : "ANALISE",
    situacao: "ANALISADO",
    pacote: {
      arquivosEsperados: inventario.itens.length,
      arquivosPresentes: evidencias.filter((e) => e.presente).length,
      arquivosAusentes: ausentes.map((a) => a.arquivo),
      sha256: opcoes.sha256Pacote ?? "",
      ingeridoEm: new Date().toISOString(),
      ingeridoPor: "sistema"
    },
    leitura: {
      camposEspelhados: redundancia.camposEspelhados,
      ensaiosConferidos: ensaiosConferidos.length,
      ensaiosDivergentes,
      executadaEm: new Date().toISOString(),
      duracaoMs
    },
    parecerAtualId: parecerId
  };

  const parecer: Parecer = {
    id: parecerId,
    casoId,
    versao: 1,
    versaoAnteriorId: null,
    situacao: "PROPOSTO",
    classeProposta: comp.classe,
    classeFinal: null,
    analistaDivergiuDaProposta: false,
    motivoDaDivergencia: null,
    pontos,
    recorteSustentado: condicionais.recorteSustentado,
    limitacaoEspecifica: condicionais.limitacaoEspecifica,
    evidenciaNecessaria: condicionais.evidenciaNecessaria,
    eloAusente: condicionais.eloAusente,
    evidenciasASolicitar: condicionais.evidenciasASolicitar,
    mecanismoDocumentado: condicionais.mecanismoDocumentado,
    citacoesContrarias,
    confrontos,
    lacunas: [
      ...(opcoes.sha256Pacote ? [] : ["Hash do pacote não calculado: a integridade dos arquivos recebidos não pode ser conferida."]),
      ...(inventario.declarado ? [] : ["Inventário de evidências ausente: IDs e força probatória atribuídos pela ordem canônica dos 14 arquivos."]),
      ...ausentes.map((a) => `${a.id} (${a.arquivo}) ausente do pacote: ${a.tipo.toLowerCase()} não pôde ser considerado.`),
      ...foraDoInventario.map((c) => `O arquivo ${c} está no pacote mas não consta do inventário de evidências.`),
      ...(ler("dossie_projeto.pdf") && !cabecalho.equipe ? ["Equipe não identificada no dossiê."] : []),
      ...(ler("dossie_projeto.pdf") && cabecalho.duracaoSemanas === null ? ["Duração do recorte não identificada no dossiê."] : []),
      ...sugestoes
        .filter((s) => s.estadoSugerido === null)
        .map((s) => `Critério ${s.criterioId} (${nomesCriterios[s.criterioId]}): ${s.justificativaSugerida}`),
      ...lacunasDeLeitura,
      ...redundancia.lacunas,
      ...condicionais.lacunas
    ],
    geradoEm: new Date().toISOString(),
    geradoPor: "LASTRO Motor v1.0",
    homologadoEm: null,
    homologadoPor: null,
    versaoCorpusNormativo: versaoCorpus,
    sha256Pacote: caso.pacote.sha256,
    hashConteudo: "" // calculado só na homologação (hash.ts → hashConteudoParecer)
  };

  return {
    caso,
    parecer,
    evidencias
  };
}
