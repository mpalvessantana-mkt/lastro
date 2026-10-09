import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { validarRespostaIA, jsonSchemaExtracao, type ExtracaoTrechoOutput } from "@/motor/schemas";

// Camada de IA (§8.2): enriquecimento descartável. Só roda no servidor — a chave
// nunca vai para o navegador. Qualquer falha devolve usouIA: false e o motor
// determinístico segue sozinho; nunca é erro bloqueante.

export { ExtracaoTrechoSchema, type ExtracaoTrechoOutput } from "@/motor/schemas";

export const MODELO_IA = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const TIMEOUT_MS = 30_000;

/**
 * Raciocínio interno do modelo. A tarefa é extração literal + redação curta: com LOW a chamada cai
 * de ~17 s para ~3,5 s (medido no PRJ13) e a saída continua passando na validação. GEMINI_THINKING
 * troca o nível sem deploy de código; "PADRAO" devolve ao padrão do modelo.
 */
export function configuracaoRaciocinio(): { thinkingConfig?: { thinkingLevel: ThinkingLevel } } {
  const nivel = (process.env.GEMINI_THINKING || "LOW").toUpperCase();
  if (nivel === "PADRAO" || !(nivel in ThinkingLevel)) return {};
  return { thinkingConfig: { thinkingLevel: nivel as ThinkingLevel } };
}

const SYSTEM_PROMPT = `Você é um assistente de extração e redação documental para análise preliminar de enquadramento na Lei do Bem. Você NÃO classifica, NÃO conclui e NÃO decide se um projeto é elegível, com ressalvas, não elegível ou de evidência insuficiente. Sua saída é uma PROPOSTA que um analista humano vai revisar.

REGRAS ABSOLUTAS:
1. Extraia apenas trechos LITERAIS das evidências fornecidas. Nunca parafraseie dentro do campo "trecho". Nunca invente texto que não esteja no documento.
2. Cite sempre pelo ID nativo do pacote (PRJxx-EVnn, PRJxx-ATVnn, PRJxx-Snn) e pela âncora de seção (metodo.md#2). Nunca invente identificadores.
3. Referências normativas: use SOMENTE os ids da lista de normas fornecida no contexto. Se nenhum se aplicar, retorne lista vazia. É proibido citar artigos, leis ou manuais de memória.
4. Registre trechos favoráveis, contrários e contraditórios à caracterização de P&D. Omitir evidência contrária é erro grave.
5. Nunca trate como provado aquilo que aparece apenas em entrevista, memorando, apresentação ou declaração da equipe. Afirmação de memória é alegação.
6. Nunca trate "Localizada" como comprovação, nem a natureza informada pela equipe como conclusão.
7. Se a evidência não existir, retorne lista vazia e descreva em "lacunas" o elo ausente. Não preencha por inferência.
8. Ao redigir um "porquê", use somente os trechos citados. Toda frase precisa ser rastreável a um ID. Não introduza fato novo.
9. Nunca use as palavras "elegível", "inelegível", "aprovado" ou "reprovado".

Responda exclusivamente no schema JSON fornecido.`;

export type ResultadoIA = { output: ExtracaoTrechoOutput | null; usouIA: boolean; motivo: string | null };

function semIA(motivo: string): ResultadoIA {
  return { output: null, usouIA: false, motivo };
}

/** Texto enviado à IA: cada evidência rotulada pelo seu ID nativo. */
export function rotularEvidencias(textosPorId: Record<string, string>): string {
  return Object.entries(textosPorId).map(([id, texto]) => `[${id}]\n${texto}`).join("\n\n");
}

export function modoSemRede(): boolean {
  return process.env.MODO_SEM_REDE === "true" || process.env.NEXT_PUBLIC_MODO_SEM_REDE === "true";
}

/**
 * Enriquece a fundamentação de um critério. A resposta só é aproveitada se passar
 * inteira por `validarRespostaIA` (schema, literalidade, IDs do pacote, corpus).
 * Com `textosPorId`, cada trecho precisa estar na evidência que ele cita.
 */
export async function enriquecerComIA(
  criterioId: number,
  estadoSugerido: string,
  textoEvidencias: string,
  idsValidos: string[],
  textosPorId?: Record<string, string>
): Promise<ResultadoIA> {
  if (modoSemRede()) return semIA("MODO_SEM_REDE ativo");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return semIA("GEMINI_API_KEY não configurada");

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Contexto do Projeto:
Critério ID: ${criterioId}
Estado Proposto pelo Motor: ${estadoSugerido}
Texto das Evidências Disponíveis:
"""
${textoEvidencias}
"""

IDs Válidos no Pacote: ${idsValidos.join(", ")}

Extraia trechos LITERAIS que fundamentam este estado e redija o "porquê" no padrão formal.`;

    const response = await ai.models.generateContent({
      model: MODELO_IA,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: jsonSchemaExtracao(),
        ...configuracaoRaciocinio(),
        abortSignal: AbortSignal.timeout(TIMEOUT_MS)
      }
    });

    const texto = response.text?.trim();
    if (!texto) return semIA("resposta vazia");

    let bruta: unknown;
    try {
      bruta = JSON.parse(texto);
    } catch {
      return semIA("resposta não é JSON");
    }

    const validacao = validarRespostaIA(bruta, { textoEvidencias, idsValidos, textosPorId });
    if (!validacao.ok) {
      console.warn(`Resposta da IA descartada (${validacao.motivo}); segue o motor determinístico.`);
      return semIA(`descartada: ${validacao.motivo}`);
    }
    return { output: validacao.output, usouIA: true, motivo: null };
  } catch (err) {
    console.warn("Falha na chamada do Gemini; segue o motor determinístico:", err);
    return semIA("falha na chamada");
  }
}
