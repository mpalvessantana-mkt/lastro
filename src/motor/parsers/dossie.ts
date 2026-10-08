import { HISTORICOS_REFERENCIA } from "@/lib/referencia-data";
import { extrairTextoCompletoPDF } from "@/lib/pdf-parser";

export interface ResumoDossie {
  contexto?: string;
  objetivo?: string;
  referenciaAnterior?: string;
  trabalhoDocumentado?: string;
  limiteConclusao?: string;
  localizacaoProva?: string;
}

export interface DadosDossie {
  titulo: string;
  equipe: string;
  duracaoSemanas: number;
  resumo?: ResumoDossie;
}

/**
 * Normaliza caracteres e espaços quebrados preservando acentos
 */
function limparTexto(txt: string): string {
  return txt
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Analisa o dossiê do projeto (PDF, Markdown ou TXT) e extrai
 * Título real, Equipe, Semanas e Resumo Executivo das seções.
 */
export function extrairDadosDossie(
  casoId: string,
  arquivos: Record<string, string>
): DadosDossie {
  // 1. Procurar arquivo do dossiê no pacote
  const dossiePath = Object.keys(arquivos).find(
    (k) =>
      k.toLowerCase().includes("dossie_projeto") ||
      k.toLowerCase().includes("dossie") ||
      k.toLowerCase().endsWith("dossier.pdf")
  );

  let textoDossie = "";

  if (dossiePath && arquivos[dossiePath]) {
    const conteudo = arquivos[dossiePath];
    if (conteudo.includes("%PDF") || dossiePath.endsWith(".pdf")) {
      textoDossie = extrairTextoCompletoPDF(conteudo);
    } else {
      textoDossie = conteudo;
    }
  }

  let tituloExtraido = "";
  let equipeExtraida = "";
  let semanasExtraidas = 0;
  const resumo: ResumoDossie = {};

  if (textoDossie) {
    // a) Extrair Título: padrão "PRJxx | Título do Projeto" ou "Título: ..." ou "# Título"
    const matchTitulo =
      textoDossie.match(/(?:PRJ\d+|Projeto)\s*\|\s*([^\|\n\r]+?)(?=(?:Equipe|Recorte|Contexto|\n|\r|$))/i) ||
      textoDossie.match(/T[ií]tulo(?:\s*do\s*Projeto)?\s*:\s*([^\n\r]+)/i) ||
      textoDossie.match(/^#\s*(?:PRJ\d+\s*[-—]\s*)?([^\n\r]+)/m);

    if (matchTitulo && matchTitulo[1]?.trim()) {
      tituloExtraido = limparTexto(matchTitulo[1]);
    }

    // b) Extrair Equipe
    const matchEquipe =
      textoDossie.match(/Equipe:\s*([^\|\n\r]+?)(?=\||Recorte|\n|\r|$)/i) ||
      textoDossie.match(/Equipe\s*respons[aá]vel\s*:\s*([^\n\r]+)/i);
    if (matchEquipe && matchEquipe[1]?.trim()) {
      equipeExtraida = limparTexto(matchEquipe[1]);
    }

    // c) Extrair Semanas
    const matchSemanas = textoDossie.match(/Recorte de\s*(\d+)\s*semanas/i) || textoDossie.match(/(\d+)\s*semanas/i);
    if (matchSemanas && matchSemanas[1]) {
      semanasExtraidas = parseInt(matchSemanas[1], 10);
    }

    // d) Extrair Seções de Resumo Executivo
    const matchContexto = textoDossie.match(/Contexto\s+([\s\S]*?)(?=(?:Pergunta registrada|Refer[eê]ncia anterior|Trabalho documentado|$))/i);
    if (matchContexto && matchContexto[1]?.trim()) {
      resumo.contexto = limparTexto(matchContexto[1]);
    }

    const matchObjetivo = textoDossie.match(/Pergunta registrada\s+([\s\S]*?)(?=(?:Refer[eê]ncia anterior|Trabalho documentado|Limite|$))/i);
    if (matchObjetivo && matchObjetivo[1]?.trim()) {
      resumo.objetivo = limparTexto(matchObjetivo[1]);
    }

    const matchRefAnterior = textoDossie.match(/Refer[eê]ncia anterior\s+([\s\S]*?)(?=(?:Trabalho documentado|Limite da conclus[aã]o|$))/i);
    if (matchRefAnterior && matchRefAnterior[1]?.trim()) {
      resumo.referenciaAnterior = limparTexto(matchRefAnterior[1]);
    }

    const matchTrabalho = textoDossie.match(/Trabalho documentado\s+([\s\S]*?)(?=(?:Limite da conclus[aã]o|Localiza[cç][aã]o da prova|$))/i);
    if (matchTrabalho && matchTrabalho[1]?.trim()) {
      resumo.trabalhoDocumentado = limparTexto(matchTrabalho[1]);
    }

    const matchLimite = textoDossie.match(/Limite da conclus[aã]o\s+([\s\S]*?)(?=(?:Localiza[cç][aã]o da prova|$))/i);
    if (matchLimite && matchLimite[1]?.trim()) {
      resumo.limiteConclusao = limparTexto(matchLimite[1]);
    }
  }

  // 2. Se o título não foi encontrado no dossiê, verificar metodo.md
  if (!tituloExtraido) {
    const metodoPath = Object.keys(arquivos).find((k) => k.endsWith("metodo.md"));
    if (metodoPath && arquivos[metodoPath]) {
      const primeiraLinha = arquivos[metodoPath].split("\n")[0] || "";
      const matchMetodo = primeiraLinha.match(/^#\s*(?:PRJ\d+\s*[-—]\s*)?([^\n\r]+)/);
      if (matchMetodo && matchMetodo[1]?.trim()) {
        const t = matchMetodo[1].trim();
        if (!t.toLowerCase().includes("método e referência") && !t.toLowerCase().includes("metodo e referencia")) {
          tituloExtraido = t;
        }
      }
    }
  }

  // 3. Fallback nos 20 históricos catalogados de referência
  const historicoRef = HISTORICOS_REFERENCIA.find(
    (h) => h.id.toUpperCase() === casoId.toUpperCase()
  );

  if (!tituloExtraido && historicoRef) {
    tituloExtraido = historicoRef.titulo;
  }

  // 4. Fallback final padrão
  if (!tituloExtraido) {
    tituloExtraido = `Projeto ${casoId}`;
  }

  return {
    titulo: tituloExtraido,
    equipe: equipeExtraida || "Equipe P&D",
    duracaoSemanas: semanasExtraidas || 8,
    resumo: Object.keys(resumo).length > 0 ? resumo : undefined
  };
}
