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

export const AvaliacaoProjetoSchema = z.object({
  criterios: z.object({
    c1_novidade: z.object({
      estado: z.enum(["DEMONSTRADA NO RECORTE", "NÃO DEMONSTRADA", "INDETERMINADA"]),
      justificativa: z.string(),
      trechoCitado: z.string().nullable().optional()
    }),
    c2_criatividade: z.object({
      estado: z.enum(["DEMONSTRADA NO RECORTE", "NÃO DEMONSTRADA", "INDETERMINADA"]),
      justificativa: z.string(),
      trechoCitado: z.string().nullable().optional()
    }),
    c3_incerteza: z.object({
      estado: z.enum(["INVESTIGADA", "NÃO CARACTERIZADA", "ALEGADA, NÃO VERIFICÁVEL"]),
      justificativa: z.string(),
      trechoCitado: z.string().nullable().optional()
    }),
    c4_sistematicidade: z.object({
      estado: z.enum(["DOCUMENTADA", "DOCUMENTADA COMO ACEITE", "PARCIAL"]),
      justificativa: z.string(),
      trechoCitado: z.string().nullable().optional()
    }),
    c5_transferibilidade: z.object({
      estado: z.enum([
        "DOCUMENTADA NO ESCOPO",
        "DOCUMENTADA COM LIMITE",
        "DOCUMENTADA PARA A CONFIGURAÇÃO",
        "INSUFICIENTE PARA O NÚCLEO ALEGADO"
      ]),
      justificativa: z.string(),
      trechoCitado: z.string().nullable().optional()
    })
  }),
  atividadesDeRotinaIdentificadas: z.array(z.string()).optional().default([]),
  barreiraTecnologicaSuperada: z.string().nullable().optional(),
  recomendacaoGeral: z.string().optional().default(""),
  lacunasDeEvidencia: z.array(z.string()).optional().default([])
});

export type AvaliacaoProjetoOutput = z.infer<typeof AvaliacaoProjetoSchema>;

const AVALIADOR_SYSTEM_PROMPT = `Você é o Avaliador Sênior de P&D e Inovação Tecnológica do Sistema LASTRO do Banco do Nordeste, especialista em auditoria técnica segundo o Manual de Frascati (OCDE), a Lei do Bem (Lei 11.196/2005, art. 17) e a Instrução Normativa RFB nº 1.187/2011.

Sua missão é fornecer uma avaliação preliminar técnica, prudente e rastreável sobre o enquadramento de projetos pleiteando incentivos fiscais.

PRINCÍPIOS DO MANUAL DE FRASCATI E LEI DO BEM:
1. TESTE DO ESPECIALISTA (Frascati § 84): Para ser P&D, a solução NÃO pode ser óbvia para um especialista que domina as técnicas comumente utilizadas no setor. A atividade deve superar o estado da técnica.
2. VEDAÇÕES EXPRESSAS DE SOFTWARE (Frascati § 141 e Glosas MCTI):
   NÃO SÃO P&D:
   - Desenvolvimento de aplicações corporativas usando métodos e ferramentas conhecidas (CRUD, telas, relatórios gerenciais);
   - Parametrização, configuração ou adaptação de software/ERP de terceiros;
   - Suporte a sistemas, depuração de erros de rotina (bug fixing) e elaboração de manuais de usuário;
   - Migração ou conversão para nova linguagem ou versão de banco de dados;
   - Integração convencional via APIs padrão sem avanço algorítmico.
   -> Se o projeto consistir predominantemente nisso: Critérios 1 e 2 são NÃO DEMONSTRADA, Critério 3 é NÃO CARACTERIZADA, Critério 4 é DOCUMENTADA COMO ACEITE e Critério 5 é DOCUMENTADA PARA A CONFIGURAÇÃO (Classe: Não Elegível).
3. INSUCESSO TÉCNICO É P&D (Frascati § 138): Se houve método e teste real de hipótese que não atingiu a meta planejada, o Critério 5 é DOCUMENTADA COM LIMITE (Classe: Com Ressalvas).
4. PRINCÍPIO DA PRUDÊNCIA FISCAL (ÔNUS DA PROVA): Se os documentos forem genéricos, sem hipótese clara, sem comparador ou sem dados dos ensaios, a classificação é EVIDÊNCIA INSUFICIENTE (Critérios em INDETERMINADA / ALEGADA NÃO VERIFICÁVEL / PARCIAL / INSUFICIENTE PARA O NÚCLEO ALEGADO). NUNCA aprove projetos sem base documental.

Responda rigorosamente no schema JSON definido.`;

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

/**
 * Avalia o projeto de forma profunda e crítica usando Gemini 3.8 Flash,
 * julgando os 5 critérios concorrentes de Frascati e as vedações de software da Lei do Bem.
 */
export async function avaliarProjetoComIA(dados: {
  casoId: string;
  titulo: string;
  textoCompleto: string;
}): Promise<{ avaliacao: AvaliacaoProjetoOutput | null; usouIA: boolean }> {
  const ai = obterInstanciaGenAI();
  if (!ai) {
    return { avaliacao: null, usouIA: false };
  }

  try {
    const prompt = `Avalie o seguinte projeto para fins de incentivos da Lei do Bem e Manual de Frascati:

ID do Caso: ${dados.casoId}
Título do Projeto: ${dados.titulo}

Evidências / Documentação Técnica do Projeto:
"""
${dados.textoCompleto.slice(0, 20000)}
"""

Retorne OBRIGATORIAMENTE um objeto JSON estrito com esta estrutura exata:
{
  "criterios": {
    "c1_novidade": {
      "estado": "DEMONSTRADA NO RECORTE",
      "justificativa": "Fundamentação de novidade técnica frente ao estado da técnica",
      "trechoCitado": null
    },
    "c2_criatividade": {
      "estado": "DEMONSTRADA NO RECORTE",
      "justificativa": "Fundamentação da criatividade técnica e hipótese não óbvia",
      "trechoCitado": null
    },
    "c3_incerteza": {
      "estado": "INVESTIGADA",
      "justificativa": "Fundamentação da incerteza tecnológica investigada",
      "trechoCitado": null
    },
    "c4_sistematicidade": {
      "estado": "DOCUMENTADA",
      "justificativa": "Fundamentação da sistematicidade e ensaios estruturados",
      "trechoCitado": null
    },
    "c5_transferibilidade": {
      "estado": "DOCUMENTADA NO ESCOPO",
      "justificativa": "Fundamentação de transferibilidade e limites da conclusão",
      "trechoCitado": null
    }
  },
  "atividadesDeRotinaIdentificadas": [],
  "barreiraTecnologicaSuperada": "Descrição resumida da barreira ou null",
  "recomendacaoGeral": "Síntese do enquadramento",
  "lacunasDeEvidencia": []
}

Estados permitidos:
- c1_novidade e c2_criatividade: "DEMONSTRADA NO RECORTE" | "NÃO DEMONSTRADA" | "INDETERMINADA"
- c3_incerteza: "INVESTIGADA" | "NÃO CARACTERIZADA" | "ALEGADA, NÃO VERIFICÁVEL"
- c4_sistematicidade: "DOCUMENTADA" | "DOCUMENTADA COMO ACEITE" | "PARCIAL"
- c5_transferibilidade: "DOCUMENTADA NO ESCOPO" | "DOCUMENTADA COM LIMITE" | "DOCUMENTADA PARA A CONFIGURAÇÃO" | "INSUFICIENTE PARA O NÚCLEO ALEGADO"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: AVALIADOR_SYSTEM_PROMPT,
        responseMimeType: "application/json"
      }
    });

    const textoResposta = response.text?.trim() || "";
    if (!textoResposta) {
      return { avaliacao: null, usouIA: false };
    }

    const parsed = JSON.parse(textoResposta);
    const validado = AvaliacaoProjetoSchema.safeParse(parsed);

    if (!validado.success) {
      console.warn("Avaliação da IA falhou no schema Zod:", validado.error);
      return { avaliacao: null, usouIA: false };
    }

    return { avaliacao: validado.data, usouIA: true };
  } catch (err) {
    console.warn("Erro ao executar avaliarProjetoComIA com Gemini Flash:", err);
    return { avaliacao: null, usouIA: false };
  }
}

