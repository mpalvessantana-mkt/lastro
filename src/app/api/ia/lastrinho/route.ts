import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { corpusNormativo } from "@/motor/corpus";
import { HISTORICOS_REFERENCIA } from "@/lib/referencia-data";
import { MODELO_IA, modoSemRede, configuracaoRaciocinio } from "@/lib/gemini";
import { selecionarNormas, auditarReferencias, notaNaoVerificadas } from "@/lib/lastrinho";

// Contrato com Lastrinho.tsx: { messages, casoId?, contextoCaso? }
//   → { resposta, fontesWeb, normasCitadas }. Sempre 200 com texto, mesmo em falha.
// Regra 4: norma só por normaId do corpus; o resto é marcado "não verificado".

interface Mensagem {
  role: "user" | "assistant" | "model";
  content: string;
}

interface LastrinhoPayload {
  messages: Mensagem[];
  casoId?: string;
  contextoCaso?: {
    id?: string;
    titulo?: string;
    equipe?: string;
    classeProposta?: string;
    resumo?: {
      contexto?: string;
      objetivo?: string;
      trabalho?: string;
      limite?: string;
    };
    pontos?: Record<number, { nome: string; estado: string; porque: string }>;
  };
}

const TIMEOUT_MS = 30_000;

function montarSystemPrompt(payload: LastrinhoPayload, pergunta: string) {
  const { casoId, contextoCaso } = payload;

  // Índice do corpus inteiro (para citar por ID) + texto das normas mais próximas da pergunta.
  const indice = corpusNormativo.map((n) => `${n.id} — ${n.dispositivo} (${n.fonte}): ${n.ementa}`).join("\n");
  const relevantes = selecionarNormas(pergunta, corpusNormativo).map((n) => ({
    id: n.id,
    dispositivo: n.dispositivo,
    fonte: n.fonte,
    texto: n.texto.slice(0, 1500)
  }));

  const precedentes = HISTORICOS_REFERENCIA.filter((h) => {
    const t = pergunta.toLowerCase();
    return t.includes(h.id.toLowerCase()) || t.includes(h.titulo.toLowerCase());
  }).slice(0, 3);

  return `Você é o Lastrinho, assistente de consulta sobre a Lei do Bem integrado ao Sistema LASTRO do Banco do Nordeste. Você apoia o analista; você NÃO classifica projetos e NÃO decide. A classe que aparece no contexto foi proposta pelo motor do LASTRO e quem decide é o analista.

REGRAS ABSOLUTAS:
1. Referência normativa SOMENTE pelos ids do CORPUS NORMATIVO abaixo, no formato [ID] (ex.: [LEI11196-ART17]). É proibido citar artigos, parágrafos, leis, decretos ou manuais de memória. Se nenhuma norma do corpus se aplicar, diga isso.
2. Ao explicar o caso ativo, use só o contexto fornecido. Não invente fatos, números ou IDs do pacote.
3. Precedentes históricos são referência de fundamentação. Nunca sugira a classe de um caso por semelhança com um histórico.
4. Você tem busca na web. Conteúdo da web é FONTE EXTERNA: marque-o como "(fonte externa)", nunca o apresente como norma do corpus nem como evidência do caso, e lembre que não pode ser citado no parecer.
5. Afirmação de entrevista ou declaração da equipe é alegação, não prova.
6. Seja claro, direto e profissional. Use Markdown.

CONTEXTO DO CASO ATIVO NA TELA:
${contextoCaso ? JSON.stringify(contextoCaso, null, 2) : casoId ? `Caso: ${casoId}` : "Nenhum caso selecionado."}

CORPUS NORMATIVO (índice completo — cite apenas estes ids):
${indice}

TEXTO DAS NORMAS MAIS PRÓXIMAS DA PERGUNTA:
${relevantes.length > 0 ? JSON.stringify(relevantes, null, 2) : "Nenhuma norma com termos em comum com a pergunta."}

PRECEDENTES HISTÓRICOS MENCIONADOS NA PERGUNTA (referência de fundamentação):
${JSON.stringify(precedentes.map((p) => ({ id: p.id, titulo: p.titulo, classe: p.classificacao, justificativa: p.justificativa })), null, 2)}
`;
}

export async function POST(request: NextRequest) {
  try {
    const body: LastrinhoPayload = await request.json();
    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Nenhuma mensagem fornecida" }, { status: 400 });
    }

    const pergunta = messages[messages.length - 1].content ?? "";
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || modoSemRede()) {
      const proximas = selecionarNormas(pergunta, corpusNormativo, 3);
      const lista = proximas.length > 0
        ? proximas.map((n) => `• [${n.id}] ${n.dispositivo} (${n.fonte}): ${n.ementa}`).join("\n")
        : "• Nenhuma norma do corpus tem termos em comum com a pergunta.";
      return NextResponse.json({
        resposta:
          `[Modo sem rede]\n\nO assistente está desligado. Normas do corpus do LASTRO com termos em comum com a pergunta:\n\n${lista}`,
        fontesWeb: [],
        normasCitadas: proximas.map((n) => n.id)
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const contents = messages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: MODELO_IA,
      contents,
      config: {
        systemInstruction: montarSystemPrompt(body, pergunta),
        tools: [{ googleSearch: {} }],
        ...configuracaoRaciocinio(),
        abortSignal: AbortSignal.timeout(TIMEOUT_MS)
      }
    });

    const texto = response.text || "Não foi possível gerar a resposta.";

    const fontesWeb: Array<{ title: string; url: string }> = [];
    for (const chunk of response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []) {
      if (chunk.web?.uri) {
        fontesWeb.push({ title: chunk.web.title || "Referência da web", url: chunk.web.uri });
      }
    }

    // Só conta como norma citada o ID do corpus que aparece na resposta.
    const { normasCitadas, naoVerificadas } = auditarReferencias(texto, corpusNormativo);

    return NextResponse.json({
      resposta: texto + notaNaoVerificadas(naoVerificadas),
      fontesWeb: fontesWeb.slice(0, 5),
      normasCitadas
    });
  } catch (error) {
    console.error("Erro no Lastrinho:", error);
    return NextResponse.json(
      {
        resposta:
          "O assistente está indisponível no momento. O corpus normativo do LASTRO continua disponível para consulta na tela de referência.",
        fontesWeb: [],
        normasCitadas: []
      },
      { status: 200 }
    );
  }
}
