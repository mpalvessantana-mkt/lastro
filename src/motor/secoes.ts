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
  const linhas = texto.split(/\r?\n/);
  let secaoAtual: { numero: number; titulo: string; conteudo: string[]; inicio: number } | null = null;
  let charOffset = 0;

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
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

    charOffset += linha.length + 1;
  }

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
