export interface SecaoFatiada {
  ancora: string;
  numero?: number;
  titulo: string;
  conteudo: string;
  inicio: number;
  fim: number;
}

/**
 * Fatiador canônico do metodo.md em 7 seções fixas:
 * 1. Referência anterior
 * 2. Mecanismo e hipótese
 * 3. Protocolo e critérios
 * 4. Parâmetros, versões e execução registrada
 * 5. Leitura e reconstrução dos resultados
 * 6. Limite da conclusão
 * 7. Continuidade e detalhamento técnico
 */
export function fatiarMetodoMD(texto: string): Record<number, SecaoFatiada> {
  const secoes: Record<number, SecaoFatiada> = {};
  // Divide só em "\n" para que o offset conte também o "\r" dos arquivos CRLF do pacote.
  const linhas = texto.split("\n");
  let secaoAtual: { numero: number; titulo: string; conteudo: string[]; inicio: number } | null = null;
  let charOffset = 0;

  for (let i = 0; i < linhas.length; i++) {
    const bruta = linhas[i];
    const linha = bruta.replace(/\r$/, "");
    const match = linha.match(/^##\s*(\d)\.\s*(.+)$/);

    if (match) {
      if (secaoAtual) {
        const conteudo = secaoAtual.conteudo.join("\n").trim();
        secoes[secaoAtual.numero] = {
          ancora: `#${secaoAtual.numero}`,
          numero: secaoAtual.numero,
          titulo: secaoAtual.titulo,
          conteudo,
          inicio: secaoAtual.inicio,
          fim: charOffset
        };
      }
      secaoAtual = {
        numero: parseInt(match[1], 10),
        titulo: match[2].trim(),
        conteudo: [],
        inicio: charOffset
      };
    } else if (secaoAtual) {
      secaoAtual.conteudo.push(linha);
    }

    charOffset += bruta.length + 1;
  }
  charOffset = Math.min(charOffset, texto.length); // a última linha não tem "\n" depois

  if (secaoAtual) {
    const conteudo = secaoAtual.conteudo.join("\n").trim();
    secoes[secaoAtual.numero] = {
      ancora: `#${secaoAtual.numero}`,
      numero: secaoAtual.numero,
      titulo: secaoAtual.titulo,
      conteudo,
      inicio: secaoAtual.inicio,
      fim: charOffset
    };
  }

  return secoes;
}

/**
 * Fatiador canônico do revisao_tecnica.md em 5 seções fixas:
 * 1. Material recebido
 * 2. Verificação de resultados
 * 3. Limites e pendências técnicas
 * 4. Próxima ação da equipe
 * 5. Declaração da equipe
 */
export function fatiarRevisaoTecnica(texto: string): Record<string, string> {
  const secoes: Record<string, string> = {};
  const partes = texto.split(/\r?\n(?=##\s+)/);

  for (const parte of partes) {
    const match = parte.match(/^##\s+([^\r\n]+)\r?\n([\s\S]*)$/);
    if (match) {
      const titulo = match[1].trim();
      const conteudo = match[2].trim();
      secoes[titulo] = conteudo;
    }
  }

  return secoes;
}

/** As 7 perguntas fixas da entrevista técnica (§6.2). A ordem varia entre pacotes; o texto não. */
export const PERGUNTAS_ENTREVISTA = {
  alternativas: "Que alternativas ou recursos já existiam?",
  continuidade: "Que ponto ficou para continuidade?",
  ocorrencia: "Qual ocorrência você recorda?",
  situacao: "Qual situação motivou o trabalho?",
  verificacao: "Como foi organizada a verificação?",
  mecanismo: "O que a equipe fez no mecanismo?",
  conclusao: "Como ficou a conclusão da rodada?"
} as const;
export type PerguntaEntrevista = keyof typeof PERGUNTAS_ENTREVISTA;

/** Os 6 blocos fixos do dossiê (§6.2). */
export const BLOCOS_DOSSIE = [
  "Contexto",
  "Pergunta registrada",
  "Referência anterior",
  "Trabalho documentado",
  "Limite da conclusão",
  "Localização da prova"
] as const;

/**
 * Fatia texto extraído de PDF em blocos encabeçados por linhas fixas.
 * Linhas de rodapé ("Massa inteiramente fictícia…") e blocos de encerramento não entram no conteúdo.
 */
function fatiarPorCabecalhos(texto: string, cabecalhos: readonly string[], encerramento: RegExp): Record<string, string> {
  const blocos: Record<string, string> = {};
  let atual: string | null = null;
  for (const bruta of texto.split(/\r?\n/)) {
    const linha = bruta.trim();
    const cabecalho = cabecalhos.find((c) => linha === c || linha.replace(/^\d+\.\s*/, "") === c);
    if (cabecalho) {
      atual = cabecalho;
      blocos[atual] = "";
      continue;
    }
    if (encerramento.test(linha)) {
      atual = null;
      continue;
    }
    if (atual && linha) blocos[atual] = blocos[atual] ? `${blocos[atual]} ${linha}` : linha;
  }
  return blocos;
}

/**
 * Fatiador da transcrição da entrevista (texto já extraído do PDF).
 * Retorna só as perguntas encontradas; texto ilegível (PDF não extraído) retorna {}.
 */
export function fatiarEntrevista(texto: string): Partial<Record<PerguntaEntrevista, string>> {
  const porTexto = fatiarPorCabecalhos(texto, Object.values(PERGUNTAS_ENTREVISTA), /^(Condição do registro|Massa inteiramente fictícia)/);
  const resultado: Partial<Record<PerguntaEntrevista, string>> = {};
  for (const [chave, pergunta] of Object.entries(PERGUNTAS_ENTREVISTA) as [PerguntaEntrevista, string][]) {
    if (porTexto[pergunta] !== undefined) resultado[chave] = porTexto[pergunta];
  }
  return resultado;
}

/** Fatiador do dossiê (texto já extraído do PDF). Texto ilegível retorna {}. */
export function fatiarDossie(texto: string): Partial<Record<(typeof BLOCOS_DOSSIE)[number], string>> {
  return fatiarPorCabecalhos(texto, BLOCOS_DOSSIE, /^Massa inteiramente fictícia/);
}

export interface CabecalhoDossie {
  titulo: string | null;
  equipe: string | null;
  duracaoSemanas: number | null;
  corte: string | null;           // data de corte do recorte, "2025-04-07"
}

/**
 * Identificação declarada no topo do dossiê:
 *   "PRJ01 | Reprocessamento seguro de mensagens [quebra] duplicadas"
 *   "Equipe: Engenharia de Mensageria | Recorte de 13 semanas | Corte: 2025-04-07"
 * O título pode quebrar em várias linhas no PDF; vai até a linha da equipe. O que não for
 * encontrado volta null — nunca um valor padrão.
 */
export function lerCabecalhoDossie(texto: string): CabecalhoDossie {
  const linhas = texto.split(/\r?\n/).map((l) => l.trim());
  const iEquipe = linhas.findIndex((l) => /^Equipe:/i.test(l));
  const iTitulo = linhas.findIndex((l) => /^PRJ\d+\s*\|/.test(l));

  let titulo: string | null = null;
  if (iTitulo !== -1) {
    const fim = iEquipe > iTitulo ? iEquipe : iTitulo + 1;
    titulo = linhas.slice(iTitulo, fim).join(" ").replace(/^PRJ\d+\s*\|\s*/, "").replace(/\s+/g, " ").trim() || null;
  }

  const linhaEquipe = iEquipe !== -1 ? linhas[iEquipe] : "";
  const equipe = linhaEquipe.match(/^Equipe:\s*([^|]+?)\s*(\||$)/i)?.[1] ?? null;
  const semanas = linhaEquipe.match(/Recorte de (\d+) semanas?/i)?.[1];
  const corte = linhaEquipe.match(/Corte:\s*(\d{4}-\d{2}-\d{2})/i)?.[1] ?? null;

  return { titulo, equipe, duracaoSemanas: semanas ? Number(semanas) : null, corte };
}
