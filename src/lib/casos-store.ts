"use client";

import { Caso, Parecer, PontoDoParecer, EstadoCriterio, Classe, EventoAuditoria } from "@/types";
import { comporClasse } from "@/motor/classificacao";
import { HISTORICOS_REFERENCIA } from "./referencia-data";

const CHAVE_CASOS = "lastro_casos_armazenados";
const CHAVE_PARECERES = "lastro_pareceres_armazenados";
const CHAVE_AUDITORIA = "lastro_auditoria_armazenada";

// Inicialização com dados realistas de demonstração (PRJ21 a PRJ28)
function gerarCasosIniciais(): { casos: Caso[]; pareceres: Record<string, Parecer> } {
  const casos: Caso[] = [
    {
      id: "PRJ27",
      titulo: "Assistente para dúvidas sobre cobrança e boletos",
      equipe: "Atendimento de Cobrança",
      duracaoSemanas: 8,
      origem: "ANALISE",
      situacao: "EM_REVISAO",
      pacote: {
        arquivosEsperados: 14,
        arquivosPresentes: 14,
        arquivosAusentes: [],
        sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        ingeridoEm: "2026-10-07T14:20:00.000Z",
        ingeridoPor: "Ana Ribeiro"
      },
      leitura: {
        camposEspelhados: {
          limite_conclusao: ["metodo.md#6", "dossie_projeto.pdf", "revisao_tecnica.md"]
        },
        ensaiosConferidos: 6,
        ensaiosDivergentes: [],
        executadaEm: "2026-10-07T14:20:38.000Z",
        duracaoMs: 38000
      },
      parecerAtualId: "PAR-PRJ27-V1"
    },
    {
      id: "PRJ22",
      titulo: "Otimização de fila de crédito com priorização dinâmica",
      equipe: "Crédito Digital",
      duracaoSemanas: 12,
      origem: "ANALISE",
      situacao: "EM_REVISAO",
      pacote: {
        arquivosEsperados: 14,
        arquivosPresentes: 14,
        arquivosAusentes: [],
        sha256: "7d793037a0760186574b0282f2f435e7",
        ingeridoEm: "2026-10-06T10:00:00.000Z",
        ingeridoPor: "Ana Ribeiro"
      },
      leitura: {
        camposEspelhados: {},
        ensaiosConferidos: 4,
        ensaiosDivergentes: [],
        executadaEm: "2026-10-06T10:00:42.000Z",
        duracaoMs: 42000
      },
      parecerAtualId: "PAR-PRJ22-V1"
    },
    {
      id: "PRJ23",
      titulo: "Conversão de layout de arquivos para novo formato SPED",
      equipe: "Sistemas Contábeis",
      duracaoSemanas: 6,
      origem: "ANALISE",
      situacao: "HOMOLOGADO",
      pacote: {
        arquivosEsperados: 14,
        arquivosPresentes: 14,
        arquivosAusentes: [],
        sha256: "a1b2c3d4e5f60718293a4b5c6d7e8f90",
        ingeridoEm: "2026-10-05T16:00:00.000Z",
        ingeridoPor: "Carlos Mendes"
      },
      leitura: {
        camposEspelhados: {},
        ensaiosConferidos: 5,
        ensaiosDivergentes: [],
        executadaEm: "2026-10-05T16:00:30.000Z",
        duracaoMs: 30000
      },
      parecerAtualId: "PAR-PRJ23-V1"
    },
    {
      id: "PRJ24",
      titulo: "Classificador de risco agropecuário por sensoriamento remoto",
      equipe: "Agronegócio",
      duracaoSemanas: 16,
      origem: "ANALISE",
      situacao: "HOMOLOGADO",
      pacote: {
        arquivosEsperados: 14,
        arquivosPresentes: 14,
        arquivosAusentes: [],
        sha256: "b9c8d7e6f5a43210123456789abcdef0",
        ingeridoEm: "2026-10-04T11:00:00.000Z",
        ingeridoPor: "Carlos Mendes"
      },
      leitura: {
        camposEspelhados: {},
        ensaiosConferidos: 8,
        ensaiosDivergentes: [],
        executadaEm: "2026-10-04T11:00:45.000Z",
        duracaoMs: 45000
      },
      parecerAtualId: "PAR-PRJ24-V1"
    },
    {
      id: "PRJ25",
      titulo: "Integração de canal WhatsApp para consulta de saldo",
      equipe: "Canais Digitais",
      duracaoSemanas: 4,
      origem: "ANALISE",
      situacao: "INGERIDO",
      pacote: {
        arquivosEsperados: 14,
        arquivosPresentes: 12,
        arquivosAusentes: ["evidencias/entradas.csv", "evidencias/observacoes.csv"],
        sha256: "f4e3d2c1b0a9876543210fedcba98765",
        ingeridoEm: "2026-10-07T18:00:00.000Z",
        ingeridoPor: "Ana Ribeiro"
      },
      leitura: {
        camposEspelhados: {},
        ensaiosConferidos: 2,
        ensaiosDivergentes: [],
        executadaEm: "2026-10-07T18:00:25.000Z",
        duracaoMs: 25000
      },
      parecerAtualId: "PAR-PRJ25-V1"
    }
  ];

  const parecerPRJ27: Parecer = {
    id: "PAR-PRJ27-V1",
    casoId: "PRJ27",
    versao: 1,
    versaoAnteriorId: null,
    situacao: "EM_REVISAO",
    classeProposta: "COM_RESSALVAS",
    classeFinal: null,
    analistaDivergiuDaProposta: false,
    motivoDaDivergencia: null,
    pontos: {
      1: {
        criterioId: 1,
        nomeCriterio: "Novidade",
        estadoProposto: "DEMONSTRADA NO RECORTE",
        porqueProposto: "A extração semântica e pareamento contextual sob linguagem coloquial regional foram investigados frente a catálogo de busca por palavras-chave.",
        citacoesPropostas: [
          {
            id: "CIT-PRJ27-1",
            criterioId: 1,
            evidenciaId: "PRJ27-EV06",
            seletor: "#1",
            trecho: "Modelos comerciais de FAQ operam por correspondência de intenções pré-mapeadas; a hipótese investigada aborda ambiguidade em termos regionais nordestinos de renegociação.",
            offsetInicio: 120,
            offsetFim: 275,
            forcaProbatoria: "PRIMARIA",
            sentido: "FAVORAVEL",
            origem: "MOTOR"
          }
        ],
        normasAplicadas: ["IN1187-ART2-II-C", "FRASCATI-P84"],
        confianca: "ALTA",
        acaoDoAnalista: null,
        estadoFinal: null,
        porqueFinal: null,
        motivoDaMudanca: null,
        aceiteEmBloco: false,
        decididoPor: null,
        decididoEm: null
      },
      2: {
        criterioId: 2,
        nomeCriterio: "Criatividade técnica",
        estadoProposto: "DEMONSTRADA NO RECORTE",
        porqueProposto: "Formulação de mecanismo de desambiguação em dois estágios com limiar de abstenção adaptativo antes do roteamento.",
        citacoesPropostas: [
          {
            id: "CIT-PRJ27-2",
            criterioId: 2,
            evidenciaId: "PRJ27-EV06",
            seletor: "#2",
            trecho: "Mecanismo combina grafo léxico regional e classificador supervisionado de confiança com abstenção automática quando a margem decisória é inferior a 0,18.",
            offsetInicio: 85,
            offsetFim: 240,
            forcaProbatoria: "PRIMARIA",
            sentido: "FAVORAVEL",
            origem: "MOTOR"
          }
        ],
        normasAplicadas: ["IN1187-ART2-II-C", "FRASCATI-P84"],
        confianca: "ALTA",
        acaoDoAnalista: null,
        estadoFinal: null,
        porqueFinal: null,
        motivoDaMudanca: null,
        aceiteEmBloco: false,
        decididoPor: null,
        decididoEm: null
      },
      3: {
        criterioId: 3,
        nomeCriterio: "Incerteza tecnológica",
        estadoProposto: "INVESTIGADA",
        porqueProposto: "Incerteza de acurácia e taxa de abstenção investigadas com grupos de controle e hipóteses operacionais falsificáveis.",
        citacoesPropostas: [
          {
            id: "CIT-PRJ27-3",
            criterioId: 3,
            evidenciaId: "PRJ27-EV06",
            seletor: "#2",
            trecho: "A incerteza residia em manter a taxa de acerto acima de 92% sem aumentar a abstenção para mais de 10% nas variações dialetais testadas.",
            offsetInicio: 245,
            offsetFim: 380,
            forcaProbatoria: "PRIMARIA",
            sentido: "FAVORAVEL",
            origem: "MOTOR"
          }
        ],
        normasAplicadas: ["FRASCATI-P84"],
        confianca: "ALTA",
        acaoDoAnalista: null,
        estadoFinal: null,
        porqueFinal: null,
        motivoDaMudanca: null,
        aceiteEmBloco: false,
        decididoPor: null,
        decididoEm: null
      },
      4: {
        criterioId: 4,
        nomeCriterio: "Sistematicidade",
        estadoProposto: "DOCUMENTADA",
        porqueProposto: "Protocolo de testes com 1.200 interações divididas em três perfis dialetais com limites definidos antes das rodadas.",
        citacoesPropostas: [
          {
            id: "CIT-PRJ27-4",
            criterioId: 4,
            evidenciaId: "PRJ27-EV08",
            seletor: "#3",
            trecho: "1.200 diálogos sintéticos avaliados em 4 rodadas com mesma matriz de entrada e critérios prévios de tolerância.",
            offsetInicio: 40,
            offsetFim: 160,
            forcaProbatoria: "PRIMARIA",
            sentido: "FAVORAVEL",
            origem: "MOTOR"
          }
        ],
        normasAplicadas: ["IN1187-ART2-II-C"],
        confianca: "ALTA",
        acaoDoAnalista: null,
        estadoFinal: null,
        porqueFinal: null,
        motivoDaMudanca: null,
        aceiteEmBloco: false,
        decididoPor: null,
        decididoEm: null
      },
      5: {
        criterioId: 5,
        nomeCriterio: "Transferência e reprodução",
        estadoProposto: "DOCUMENTADA COM LIMITE",
        porqueProposto: "A evidência sustenta a investigação dentro do recorte de boletos e cobrança simples, mas a alegação de generalização para renegociação complexa permanece sem validação.",
        citacoesPropostas: [
          {
            id: "CIT-PRJ27-5",
            criterioId: 5,
            evidenciaId: "PRJ27-EV06",
            seletor: "#6",
            trecho: "A conclusão é válida para emissão e esclarecimento de boletos simples; a alegação de aplicação a contratos de renegociação judicial ainda não foi validada.",
            offsetInicio: 50,
            offsetFim: 210,
            forcaProbatoria: "PRIMARIA",
            sentido: "CONTRARIA",
            origem: "MOTOR"
          }
        ],
        normasAplicadas: ["FRASCATI-P138"],
        confianca: "ALTA",
        acaoDoAnalista: null,
        estadoFinal: null,
        porqueFinal: null,
        motivoDaMudanca: null,
        aceiteEmBloco: false,
        decididoPor: null,
        decididoEm: null
      }
    },
    recorteSustentado: "Cobrança de boletos simples em canais digitais",
    limitacaoEspecifica: "A alegação de aplicação a contratos de renegociação judicial ainda não foi validada.",
    evidenciaNecessaria: "Ensaios de campo com contratos de crédito renegociados.",
    eloAusente: null,
    evidenciasASolicitar: null,
    mecanismoDocumentado: null,
    citacoesContrarias: [],
    confrontos: [
      {
        id: "CONF-PRJ27-01",
        campoLogico: "limite_conclusao",
        afirmacaoA: {
          fonte: "transcricao_entrevista_tecnica.pdf · Pergunta 7",
          evidenciaId: "PRJ27-EV11",
          texto: "O assistente atende qualquer tipo de dúvida de cobrança e renegociação de dívidas.",
          forca: "DECLARATORIA"
        },
        afirmacaoB: {
          fonte: "evidencias/metodo.md #6 · Limite da conclusão",
          evidenciaId: "PRJ27-EV06",
          ensaioId: "PRJ27-S04",
          texto: "A conclusão é restrita a boletos simples; contratos de renegociação complexa não foram validados.",
          forca: "PRIMARIA"
        },
        prevalenciaSugerida: "B",
        prevalencia: "B",
        razaoDaPrevalencia: "por ser primário e identificado por versão e ensaio",
        textoFormatado: "A entrevista afirma que o assistente atende qualquer tipo de renegociação; o registro metodo.md #6 mostra restrição a boletos simples. Prevalece o registro, por ser primário e identificado por versão.",
        resolvidoPor: null,
        resolvidoEm: null
      }
    ],
    lacunas: ["Arquivo evidencias/entradas.csv com amostragem parcial"],
    geradoEm: "2026-10-07T14:21:00.000Z",
    geradoPor: "LASTRO Motor v1.0",
    homologadoEm: null,
    homologadoPor: null,
    versaoCorpusNormativo: "2026.1",
    sha256Pacote: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    hashConteudo: "hash-prj27-v1"
  };

  return {
    casos,
    pareceres: {
      "PAR-PRJ27-V1": parecerPRJ27
    }
  };
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

export function adicionarCasoComParecer(caso: Caso, parecer: Parecer): void {
  const casos = obterCasos();
  const existentes = casos.filter((c) => c.id !== caso.id);
  salvarCasos([caso, ...existentes]);
  salvarParecer(parecer);
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
