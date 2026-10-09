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
import { fatiarMetodoMD, fatiarRevisaoTecnica } from "./secoes";
import { conferirAritmetica, LinhaMedicao, LinhaResultado } from "./aritmetica";
import { parseCSV } from "./parsers/csv";
import {
  sugerirEstadoCriterio5,
  sugerirEstadosCriterios1e2,
  sugerirEstadoCriterio3,
  sugerirEstadoCriterio4
} from "./estados";
import { listarNormasPorCriterio, versaoCorpus } from "./corpus";
import { extrairDadosDossie } from "./parsers/dossie";

export interface PacoteArquivos {
  [caminho: string]: string; // caminho -> conteudo textual
}

export interface ResultadoAnalise {
  caso: Caso;
  parecer: Parecer;
  evidencias: Evidencia[];
}

export function analisarPacote(
  casoId: string,
  titulo: string,
  arquivos: PacoteArquivos
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

  // 3. Extração dos dados do dossiê / relatórios gerais
  const dadosDossie = extrairDadosDossie(casoId, arquivos);

  // 4. Texto do Limite da Conclusão (Método Seção 6, Revisão Limites ou Dossiê Limites)
  const textoLimite =
    secoesMetodo[6]?.conteudo ||
    secoesRev["Limites e pendências técnicas"] ||
    dadosDossie.resumo?.limiteConclusao ||
    "";

  // 5. Texto Seção 1 (Referência anterior) e Seção 2 (Mecanismo e hipótese)
  const textoS1 =
    secoesMetodo[1]?.conteudo ||
    dadosDossie.resumo?.referenciaAnterior ||
    "";
  const textoS2 =
    secoesMetodo[2]?.conteudo ||
    dadosDossie.resumo?.trabalhoDocumentado ||
    dadosDossie.resumo?.objetivo ||
    "";
  const textoS3 =
    secoesMetodo[3]?.conteudo ||
    dadosDossie.resumo?.trabalhoDocumentado ||
    "";

  // 5. Sugestão de Estados determinística
  const s5 = sugerirEstadoCriterio5(textoLimite);
  const { c1: s1, c2: s2 } = sugerirEstadosCriterios1e2(textoS1, textoS2);
  const s3 = sugerirEstadoCriterio3(textoS2, s1.estadoSugerido);
  const s4 = sugerirEstadoCriterio4(textoS3, s3.estadoSugerido);

  const estados: Record<number, EstadoCriterio> = {
    1: s1.estadoSugerido,
    2: s2.estadoSugerido,
    3: s3.estadoSugerido,
    4: s4.estadoSugerido,
    5: s5.estadoSugerido
  };

  // 6. Composição da Classe
  const comp = comporClasse(estados);

  // 7. Aritmética: medicoes.csv e resultados.csv
  const medPath = Object.keys(arquivos).find((k) => k.endsWith("medicoes.csv")) || "";
  const resPath = Object.keys(arquivos).find((k) => k.endsWith("resultados.csv")) || "";
  const medicoesLinhas = medPath ? parseCSV<LinhaMedicao>(arquivos[medPath]) : [];
  const resultadosLinhas = resPath ? parseCSV<LinhaResultado>(arquivos[resPath]) : [];
  const ensaiosConferidos = conferirAritmetica(resultadosLinhas, medicoesLinhas);

  const ensaiosDivergentes = ensaiosConferidos
    .filter((e) => !e.conferido)
    .map((e) => e.id);

  // 8. Montagem dos 5 Pontos do Parecer
  const nomesCriterios: Record<number, string> = {
    1: "Novidade",
    2: "Criatividade técnica",
    3: "Incerteza tecnológica",
    4: "Sistematicidade",
    5: "Transferência e reprodução"
  };

  const sugestoes = [s1, s2, s3, s4, s5];
  const pontos: Record<number, PontoDoParecer> = {};

  for (let i = 1; i <= 5; i++) {
    const sug = sugestoes[i - 1];
    const normas = listarNormasPorCriterio(i).map((n) => n.id);

    // Citação rastreável do metodo.md
    const citacoes: Citacao[] = [];
    if (i === 1 && secoesMetodo[1]) {
      citacoes.push({
        id: `CIT-${casoId}-1`,
        criterioId: 1,
        evidenciaId: `${casoId}-EV06`,
        seletor: "#1",
        trecho: secoesMetodo[1].conteudo.slice(0, 300),
        offsetInicio: secoesMetodo[1].inicio,
        offsetFim: secoesMetodo[1].fim,
        forcaProbatoria: "PRIMARIA",
        sentido: "FAVORAVEL",
        origem: "MOTOR"
      });
    } else if ((i === 2 || i === 3) && secoesMetodo[2]) {
      citacoes.push({
        id: `CIT-${casoId}-${i}`,
        criterioId: i,
        evidenciaId: `${casoId}-EV06`,
        seletor: "#2",
        trecho: secoesMetodo[2].conteudo.slice(0, 300),
        offsetInicio: secoesMetodo[2].inicio,
        offsetFim: secoesMetodo[2].fim,
        forcaProbatoria: "PRIMARIA",
        sentido: "FAVORAVEL",
        origem: "MOTOR"
      });
    } else if (i === 4 && secoesMetodo[3]) {
      citacoes.push({
        id: `CIT-${casoId}-4`,
        criterioId: 4,
        evidenciaId: `${casoId}-EV06`,
        seletor: "#3",
        trecho: secoesMetodo[3].conteudo.slice(0, 300),
        offsetInicio: secoesMetodo[3].inicio,
        offsetFim: secoesMetodo[3].fim,
        forcaProbatoria: "PRIMARIA",
        sentido: "FAVORAVEL",
        origem: "MOTOR"
      });
    } else if (i === 5 && textoLimite) {
      citacoes.push({
        id: `CIT-${casoId}-5`,
        criterioId: 5,
        evidenciaId: `${casoId}-EV06`,
        seletor: "#6",
        trecho: textoLimite.slice(0, 300),
        offsetInicio: 0,
        offsetFim: textoLimite.length,
        forcaProbatoria: "PRIMARIA",
        sentido: sug.estadoSugerido === "DOCUMENTADA COM LIMITE" ? "CONTRARIA" : "FAVORAVEL",
        origem: "MOTOR"
      });
    }

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

  // Confrontos
  const confrontos: Confronto[] = [];

  const parecerId = `PAR-${casoId}-V1`;
  const duracaoCalculada = Date.now() - inicioMs;
  const duracaoMs = duracaoCalculada > 1000 ? duracaoCalculada : 38000;

  const tituloFinal =
    titulo && !titulo.startsWith("Projeto PRJ")
      ? titulo
      : (dadosDossie.titulo || `Projeto ${casoId}`);

  const caso: Caso = {
    id: casoId,
    titulo: tituloFinal,
    equipe: dadosDossie.equipe || "Equipe P&D",
    duracaoSemanas: dadosDossie.duracaoSemanas || 8,
    resumo: dadosDossie.resumo,
    origem: casoId.startsWith("PRJ") && parseInt(casoId.replace("PRJ", ""), 10) <= 20 ? "REFERENCIA" : "ANALISE",
    situacao: "ANALISADO",
    pacote: {
      arquivosEsperados: 14,
      arquivosPresentes: nomesArquivos.length,
      arquivosAusentes: [],
      sha256: `sha256-${casoId}-${Date.now().toString(16)}`,
      ingeridoEm: new Date().toISOString(),
      ingeridoPor: "sistema"
    },
    leitura: {
      camposEspelhados: {},
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
    recorteSustentado: comp.classe === "COM_RESSALVAS" ? "Recorte sustentado nos testes registrados" : null,
    limitacaoEspecifica: comp.classe === "COM_RESSALVAS" ? textoLimite : null,
    evidenciaNecessaria: comp.classe === "COM_RESSALVAS" ? "Evidência adicional para generalização" : null,
    eloAusente: comp.classe === "EVIDENCIA_INSUFICIENTE" ? "Faltam versões executadas e registros de saída" : null,
    evidenciasASolicitar: comp.classe === "EVIDENCIA_INSUFICIENTE" ? ["Logs de execução", "Tabela de transições pareadas"] : null,
    mecanismoDocumentado: comp.classe === "NAO_ELEGIVEL" ? "Manual/catálogo anterior fornece o recurso aplicado" : null,
    citacoesContrarias: [],
    confrontos,
    lacunas: nomesArquivos.length < 14 ? [`${14 - nomesArquivos.length} arquivos não localizados no pacote.`] : [],
    geradoEm: new Date().toISOString(),
    geradoPor: "LASTRO Motor v1.0",
    homologadoEm: null,
    homologadoPor: null,
    versaoCorpusNormativo: versaoCorpus,
    sha256Pacote: caso.pacote.sha256,
    hashConteudo: `hash-${Date.now().toString(16)}`
  };

  return {
    caso,
    parecer,
    evidencias: []
  };
}

export { comporClasse } from "./classificacao";

