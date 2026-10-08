import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { validarNormaId } from "@/motor/corpus";

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

export const ExtracaoTrechoSchema = z.object({
  trechos: z.array(
    z.object({
      evidenciaId: z.string(),
      seletor: z.string().nullable(),
      trecho: z.string(),
      sentido: z.enum(["FAVORAVEL", "CONTRARIA", "CONTRADITORIA"]),
      normaId: z.string().nullable()
    })
  ),
  porqueRedigido: z.string(),
  lacunaIdentificada: z.string().nullable()
});

export type ExtracaoTrechoOutput = z.infer<typeof ExtracaoTrechoSchema>;

function obterInstanciaGenAI(): GoogleGenAI | null {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    "";
  if (!apiKey || process.env.NEXT_PUBLIC_MODO_SEM_REDE === "true") {
    return null;
  }
  try {
    return new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn("Não foi possível inicializar SDK do Gemini, usando fallback determinístico:", err);
    return null;
  }
}

/**
 * Enriquece a fundamentação de um critério usando Gemini 2.5 Flash
 * Se falhar na validação Zod ou literalidade, descarta e usa fallback determinístico.
 */
export async function enriquecerComIA(
  criterioId: number,
  estadoSugerido: string,
  textoEvidencias: string,
  idsValidos: string[]
): Promise<{ output: ExtracaoTrechoOutput | null; usouIA: boolean }> {
  const ai = obterInstanciaGenAI();
  if (!ai) {
    return { output: null, usouIA: false };
  }

  try {
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
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json"
      }
    });

    const textoResposta = response.text?.trim() || "";
    if (!textoResposta) {
      return { output: null, usouIA: false };
    }

    const parsedJson = JSON.parse(textoResposta);
    const validado = ExtracaoTrechoSchema.safeParse(parsedJson);

    if (!validado.success) {
      console.warn("Resposta da IA falhou no schema Zod, descartando:", validado.error);
      return { output: null, usouIA: false };
    }

    // Regra 1: Validação de Literalidade (indexOf !== -1)
    for (const item of validado.data.trechos) {
      if (textoEvidencias.indexOf(item.trecho) === -1) {
        console.warn(`Trecho da IA não é literal, descartando: "${item.trecho.slice(0, 40)}..."`);
        return { output: null, usouIA: false };
      }
      if (item.normaId && !validarNormaId(item.normaId)) {
        console.warn(`Norma ID inválida gerada pela IA, descartando: ${item.normaId}`);
        return { output: null, usouIA: false };
      }
    }

    return { output: validado.data, usouIA: true };
  } catch (err) {
    console.warn("Erro na chamada do Gemini AI, mantendo motor determinístico:", err);
    return { output: null, usouIA: false };
  }
}
