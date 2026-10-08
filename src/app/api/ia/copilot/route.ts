import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { corpusNormativo } from "@/motor/corpus";
import { HISTORICOS_REFERENCIA } from "@/lib/referencia-data";

interface Mensagem {
  role: "user" | "assistant" | "model";
  content: string;
}

interface CopilotPayload {
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

export async function POST(request: NextRequest) {
  try {
    const body: CopilotPayload = await request.json();
    const { messages, casoId, contextoCaso } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "Nenhuma mensagem fornecida" }, { status: 400 });
    }

    const ultimaMensagem = messages[messages.length - 1].content;

    // 1. RAG Local: Recuperar normas relevantes do corpus oficial
    const termosBusca = ultimaMensagem.toLowerCase();
    const normasRelevantes = corpusNormativo.filter((norma) => {
      const matchTexto = norma.texto.toLowerCase().includes(termosBusca);
      const matchEmenta = norma.ementa.toLowerCase().includes(termosBusca);
      const matchDispositivo = norma.dispositivo.toLowerCase().includes(termosBusca);
      const matchTags = norma.tags.some((t) => termosBusca.includes(t.toLowerCase()));
      return matchTexto || matchEmenta || matchDispositivo || matchTags;
    }).slice(0, 5);

    // Se nenhuma norma específica der match exato, injetar os pilares basilares
    const corpusInjetado = (normasRelevantes.length > 0 ? normasRelevantes : corpusNormativo.slice(0, 4)).map((n) => ({
      id: n.id,
      dispositivo: n.dispositivo,
      fonte: n.fonte,
      ementa: n.ementa,
      texto: n.texto.slice(0, 500)
    }));

    // 2. Precedentes Históricos: Localizar casos de referência semelhantes se aplicável
    const precedentes = HISTORICOS_REFERENCIA.filter((h) =>
      termosBusca.includes(h.id.toLowerCase()) ||
      termosBusca.includes(h.titulo.toLowerCase()) ||
      termosBusca.includes(h.classificacao.toLowerCase())
    ).slice(0, 3);

    // 3. Montar System Prompt do LASTRO Copilot
    const systemPrompt = `Você é o LASTRO Copilot, o assistente sênior especialista em Lei do Bem (Lei nº 11.196/2005, IN RFB nº 1.187/2011, Manual de Frascati da OCDE 2015 e Guias MCTI/ANPEI) integrado ao Sistema LASTRO do Banco do Nordeste.

MISSÃO E DIRETRIZES:
1. O sistema propõe; o analista decide. Você é um assistente consultivo e de apoio técnico de alto nível.
2. Seja claro, fundamentado, profissional e direto. Use formatação Markdown (tópicos, negrito, citações).
3. Fundamentação legal: cite sempre dispositivos oficiais (ex: "Art. 17, §1º da Lei 11.196/2005", "Manual de Frascati § 138", "IN RFB 1.187/2011 Art. 2º").
4. Análise de Casos: use o contexto do caso ativo abaixo para tirar dúvidas do analista sobre o enquadramento, novidade, incerteza técnica, sistematicidade e divergências.
5. Conexão à Internet: você tem ferramenta do Google Search ativada. Se a pergunta envolver notícias, decisões do CARF, acórdãos recentes, jurisprudências ou conceitos externos, pesquise na web em tempo real e cite as referências.

CONTEXTO DO CASO ATIVO NA TELA (se houver):
${contextoCaso ? JSON.stringify(contextoCaso, null, 2) : casoId ? `Caso: ${casoId}` : "Nenhum caso específico selecionado no momento."}

CORPUS NORMATIVO OFICIAL DA LEI DO BEM (Dispositivos Relevantes):
${JSON.stringify(corpusInjetado, null, 2)}

PRECEDENTES HISTÓRICOS CONSULTADOS (se relevante):
${JSON.stringify(precedentes.map((p) => ({ id: p.id, titulo: p.titulo, classe: p.classificacao, justificativa: p.justificativa })), null, 2)}
`;

    // 4. Inicializar Gemini
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      "";

    if (!apiKey || process.env.NEXT_PUBLIC_MODO_SEM_REDE === "true") {
      // Fallback sem rede local estruturado
      return NextResponse.json({
        resposta:
          `[Modo Offline Local]\n\nCom base no corpus normativo oficial da Lei do Bem:\n\n` +
          `• **Normas Disponíveis:** Lei 11.196/2005, IN RFB 1.187/2011 e Manual de Frascati.\n` +
          `• **Dispositivo mais próximo:** ${corpusInjetado[0]?.dispositivo} (${corpusInjetado[0]?.fonte}): ${corpusInjetado[0]?.ementa}\n\n` +
          `Para análise completa e pesquisa na internet, certifique-se de que a chave do Gemini está conectada.`,
        fontesWeb: [],
        normasCitadas: corpusInjetado.map((n) => n.id)
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Histórico de mensagens formatado
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    // Chamada com Search Grounding ativado
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ googleSearch: {} }]
      }
    });

    const respostaTexto = response.text || "Não foi possível gerar a resposta.";

    // Extrair fontes da web do groundingMetadata se houver
    const fontesWeb: Array<{ title: string; url: string }> = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && Array.isArray(groundingChunks)) {
      for (const chunk of groundingChunks) {
        if (chunk.web?.uri) {
          fontesWeb.push({
            title: chunk.web.title || "Referência da Web",
            url: chunk.web.uri
          });
        }
      }
    }

    // Identificar normas citadas
    const normasCitadas = corpusNormativo
      .filter((n) => respostaTexto.includes(n.id) || respostaTexto.includes(n.dispositivo))
      .map((n) => n.id);

    return NextResponse.json({
      resposta: respostaTexto,
      fontesWeb: fontesWeb.slice(0, 5),
      normasCitadas: normasCitadas.length > 0 ? normasCitadas : corpusInjetado.map((n) => n.id)
    });
  } catch (error: any) {
    console.error("Erro no LASTRO Copilot:", error);
    return NextResponse.json(
      {
        resposta:
          "Ocorreu uma instabilidade momentânea na conexão com o assistente. " +
          "O corpus normativo local da Lei do Bem (Lei 11.196/2005, IN RFB 1.187 e Manual de Frascati) continua ativo no sistema para sua conferência.",
        fontesWeb: [],
        normasCitadas: []
      },
      { status: 200 }
    );
  }
}
