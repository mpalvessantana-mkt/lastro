export type CriterioId = 1 | 2 | 3 | 4 | 5;

export type Papel = 'analista' | 'revisor' | 'auditor';

// CONTEXTO (§6.4): revisão, registro de versões, índice, registro de atividades — não prova o resultado.
export type Forca = 'PRIMARIA' | 'DERIVADA' | 'DECLARATORIA' | 'CONTEXTO';

export type SentidoCitacao = 'FAVORAVEL' | 'CONTRARIA' | 'CONTRADITORIA';

export type OrigemCitacao = 'MOTOR' | 'IA' | 'ANALISTA';

export type EstadoCriterio1 = 'DEMONSTRADA NO RECORTE' | 'NÃO DEMONSTRADA' | 'INDETERMINADA';
export type EstadoCriterio2 = 'DEMONSTRADA NO RECORTE' | 'NÃO DEMONSTRADA' | 'INDETERMINADA';
export type EstadoCriterio3 = 'INVESTIGADA' | 'NÃO CARACTERIZADA' | 'ALEGADA, NÃO VERIFICÁVEL';
export type EstadoCriterio4 = 'DOCUMENTADA' | 'DOCUMENTADA COMO ACEITE' | 'PARCIAL';
export type EstadoCriterio5 = 
  | 'DOCUMENTADA NO ESCOPO' 
  | 'DOCUMENTADA COM LIMITE' 
  | 'DOCUMENTADA PARA A CONFIGURAÇÃO' 
  | 'INSUFICIENTE PARA O NÚCLEO ALEGADO';

export type EstadoCriterio = 
  | EstadoCriterio1 
  | EstadoCriterio2 
  | EstadoCriterio3 
  | EstadoCriterio4 
  | EstadoCriterio5;

export type Classe = 
  | 'ELEGIVEL' 
  | 'COM_RESSALVAS' 
  | 'NAO_ELEGIVEL' 
  | 'EVIDENCIA_INSUFICIENTE';

export type SituacaoCaso = 'INGERIDO' | 'ANALISADO' | 'EM_REVISAO' | 'HOMOLOGADO';

export type SituacaoParecer = 'PROPOSTO' | 'EM_REVISAO' | 'HOMOLOGADO';

export interface Norma {
  id: string;
  fonte: 'LEI_11196' | 'DECRETO_5798' | 'IN_RFB_1187' | 'FRASCATI' | 'GUIA_MCTI' | 'GUIA_STS';
  dispositivo: string;
  ementa: string;
  texto: string;
  tags: string[];
  criteriosRelacionados: number[];
  categoriasRelacionadas?: string[];
  vigenciaInicio: string;
  vigenciaFim: string | null;
  versaoCorpus: string;
  nota?: string;
  procedencia?: {
    documento?: string;
    orgao?: string;
    arquivoOrigem?: string;
    extraidoLiteralmente?: boolean;
  };
}

export interface Evidencia {
  id: string;                        // "PRJ27-EV07"
  tipo: string;
  arquivo: string;
  caminhoNoPacote: string;
  conteudoEsperado: string;
  observacaoInventario: string;
  forcaProbatoria: Forca;
  statusInventario: string;          // "Localizada" -> exibir como "presente", nunca "comprovado" (§6.5)
  presente: boolean;                 // o arquivo está no pacote (ausente = lacuna declarada)
  textoExtraido: string | null;      // null = ausente ou ilegível
  secoes?: Array<{ ancora: string; titulo: string; inicio: number; fim: number }>;
}

export interface Atividade {
  id: string;
  ciclo: 'C1' | 'C2' | 'C3' | 'C4';
  fase: string;
  naturezaInformadaPelaEquipe: string; // Autodeclaração
  descricao: string;
  resultadoOuSaida: string | null;
  evidenciasRelacionadas: string[];
  criteriosAlimentados: number[];
}

export interface Ensaio {
  id: string;
  versao: string;
  metrica: string;
  operacao: 'contagem' | 'media' | 'mediana' | 'diferenca_maior_menor' | 'percentil_95' | 'valor_observado' | 'indicador_precalculado';
  valor: number | null;              // null = vazio no resultado (vazio ≠ 0)
  baseDeCalculo: number | null;
  descricaoBase: string;
  taxaPercentual: number | null;
  unidade: string;
  natureza: 'desempenho' | 'entrega';
  fonte: string;
  conferido: boolean;
  recalculo: number | null;
  divergenciaRecalculo: string | null;
}

export interface Citacao {
  id: string;
  criterioId: number;
  evidenciaId: string;
  seletor: string | null;
  trecho: string;
  offsetInicio: number | null;
  offsetFim: number | null;
  forcaProbatoria: Forca;
  sentido: SentidoCitacao;
  origem: OrigemCitacao;
}

export interface Confronto {
  id: string;
  campoLogico: string;
  afirmacaoA: {
    fonte: string;
    evidenciaId: string;
    texto: string;
    forca: Forca;
  };
  afirmacaoB: {
    fonte: string;
    evidenciaId: string;
    ensaioId: string | null;
    texto: string;
    forca: Forca;
  };
  prevalenciaSugerida: 'A' | 'B';
  prevalencia: 'A' | 'B' | 'NAO_RESOLVIDO';
  razaoDaPrevalencia: string;
  textoFormatado: string;
  /** Razão e texto que o motor sugeriu, preservados quando o analista resolve (resolucao.ts). */
  razaoSugerida?: string;
  textoSugerido?: string;
  resolvidoPor: string | null;
  resolvidoEm: string | null;
}

export interface PontoDoParecer {
  criterioId: number;
  nomeCriterio: string;
  estadoProposto: EstadoCriterio | null; // null = sem marcador reconhecido → lacuna
  porqueProposto: string;
  /** Quem redigiu o porquê proposto. Ausente = motor. */
  porqueOrigem?: 'MOTOR' | 'IA';
  /** O porquê determinístico, preservado quando a IA redige o proposto. */
  porqueMotor?: string;
  citacoesPropostas: Citacao[];
  normasAplicadas: string[];
  confianca: 'ALTA' | 'MEDIA' | 'BAIXA';

  // Revisão humana
  acaoDoAnalista: 'PENDENTE' | 'CONCORDOU' | 'AJUSTOU' | 'DISCORDOU' | null;
  estadoFinal: EstadoCriterio | null;
  porqueFinal: string | null;
  motivoDaMudanca: string | null;
  aceiteEmBloco: boolean;
  decididoPor: string | null;
  decididoEm: string | null;
}

export interface ResumoDossie {
  contexto?: string;
  objetivo?: string;
  referenciaAnterior?: string;
  trabalhoDocumentado?: string;
  limiteConclusao?: string;
  localizacaoProva?: string;
}

export interface Caso {
  id: string;
  titulo: string;
  equipe: string;
  duracaoSemanas: number | null;    // null = não declarada no pacote (lacuna), nunca um valor padrão
  origem: 'REFERENCIA' | 'ANALISE';
  situacao: SituacaoCaso;
  resumo?: ResumoDossie;
  pacote: {
    arquivosEsperados: number;
    arquivosPresentes: number;
    arquivosAusentes: string[];
    sha256: string;
    ingeridoEm: string;
    ingeridoPor: string;
  };
  leitura: {
    camposEspelhados: Record<string, string[]>;
    ensaiosConferidos: number;
    ensaiosDivergentes: string[];
    executadaEm: string;
    duracaoMs: number;
  };
  parecerAtualId: string | null;
}

export interface EnriquecimentoIA {
  modelo: string;
  em: string;
  criteriosEnriquecidos: number[];
  /** Critérios em que a IA não foi usada e por quê (descarte, rede, sem chave). */
  naoEnriquecidos: Array<{ criterioId: number; motivo: string }>;
  /** Lacunas apontadas pela IA. Ficam no registro, não entram em `lacunas` sem o analista. */
  lacunasSugeridas?: Array<{ criterioId: number; texto: string }>;
}

export interface Parecer {
  id: string;
  casoId: string;
  versao: number;
  versaoAnteriorId: string | null;
  situacao: SituacaoParecer;

  classeProposta: Classe | 'CONFLITO' | 'INCOMPLETO';
  classeFinal: Classe | null;
  analistaDivergiuDaProposta: boolean;
  motivoDaDivergencia: string | null;

  pontos: Record<number, PontoDoParecer>;

  // Campos condicionais
  recorteSustentado: string | null;      // COM_RESSALVAS
  limitacaoEspecifica: string | null;    // COM_RESSALVAS
  evidenciaNecessaria: string | null;    // COM_RESSALVAS
  eloAusente: string | null;             // EVIDENCIA_INSUFICIENTE
  evidenciasASolicitar: string[] | null; // EVIDENCIA_INSUFICIENTE
  mecanismoDocumentado: string | null;   // NAO_ELEGIVEL

  citacoesContrarias: Citacao[];
  confrontos: Confronto[];
  lacunas: string[];

  /** Registro do enriquecimento por IA (§8.2). Ausente = só motor determinístico. */
  enriquecimentoIA?: EnriquecimentoIA;

  // Metadados e congelamento
  geradoEm: string;
  geradoPor: string;
  homologadoEm: string | null;
  homologadoPor: string | null;
  versaoCorpusNormativo: string;
  sha256Pacote: string;
  hashConteudo: string;
  snapshot?: Record<string, unknown>;
}

export interface EventoAuditoria {
  id?: string;
  casoId: string;
  ator: string;
  papel: Papel;
  acao: 
    | 'PACOTE_INGERIDO'
    | 'LEITURA_EXECUTADA'
    | 'PARECER_PROPOSTO'
    | 'PONTO_CONCORDADO'
    | 'PONTO_AJUSTADO'
    | 'PONTO_DISCORDADO'
    | 'ACEITE_EM_BLOCO'
    | 'CONFRONTO_RESOLVIDO'
    | 'CLASSE_ALTERADA'
    | 'PARECER_HOMOLOGADO'
    | 'REANALISE';
  alvo: string;
  antes: unknown | null;
  depois: unknown | null;
  em: string;
}
