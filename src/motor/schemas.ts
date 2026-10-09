import { z } from "zod";
import { validarNormaId } from "./corpus";

// Schemas zod de toda saída de IA (§8.2) e a validação que decide se a resposta
// é aproveitada ou descartada inteira. Puro: sem rede, testável em node:test.

export const ExtracaoTrechoSchema = z.object({
  trechos: z.array(
    z.object({
      evidenciaId: z.string().min(1),
      seletor: z.string().nullable(),
      trecho: z.string().min(1),
      sentido: z.enum(["FAVORAVEL", "CONTRARIA", "CONTRADITORIA"]),
      normaId: z.string().nullable()
    })
  ),
  porqueRedigido: z.string(),
  lacunaIdentificada: z.string().nullable()
});

export type ExtracaoTrechoOutput = z.infer<typeof ExtracaoTrechoSchema>;

/** JSON Schema do mesmo zod, para o `responseJsonSchema` do Gemini (um schema só). */
export function jsonSchemaExtracao(): Record<string, unknown> {
  const schema = z.toJSONSchema(ExtracaoTrechoSchema) as Record<string, unknown>;
  delete schema.$schema;
  return schema;
}

export type ValidacaoIA =
  | { ok: true; output: ExtracaoTrechoOutput }
  | { ok: false; motivo: string };

// IDs nativos do pacote: PRJxx-EVnn, PRJxx-ATVnn, PRJxx-Snn (§2 regra 3).
const ID_NATIVO = /\bPRJ\d+-(?:EV|ATV|S)\d+\b/g;

// §8.2 regra 9. Comparado sem acento; cobre plural e feminino.
const PALAVRA_PROIBIDA = /\b(?:in)?elegive(?:l|is)\b|\b(?:a|re)provad[oa]s?\b/;

function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Remove do texto redigido as citações entre aspas que existem literalmente nas evidências:
 * "dicionário aprovado" citado do pacote não é conclusão da IA. Fora de aspas, a palavra conta.
 */
function semCitacoesLiterais(redigido: string, textoEvidencias: string): string {
  return redigido.replace(/'([^']+)'|"([^"]+)"|“([^”]+)”|‘([^’]+)’/g, (inteiro, ...grupos: unknown[]) => {
    const citado = grupos.slice(0, 4).find((g): g is string => typeof g === "string") ?? "";
    return textoEvidencias.includes(citado) ? " " : inteiro;
  });
}

/**
 * Confere a resposta crua da IA. Qualquer violação descarta a resposta inteira (§8.2):
 * schema; trecho não literal; ID citado fora do pacote; normaId fora do corpus;
 * palavra proibida no texto redigido.
 */
export function validarRespostaIA(
  bruta: unknown,
  contexto: {
    textoEvidencias: string;
    idsValidos: string[];
    /** Quando presente, o trecho precisa estar no texto da própria evidência que cita. */
    textosPorId?: Record<string, string>;
    normaValida?: (id: string) => boolean;
  }
): ValidacaoIA {
  const parsed = ExtracaoTrechoSchema.safeParse(bruta);
  if (!parsed.success) return { ok: false, motivo: "resposta fora do schema" };

  const ids = new Set(contexto.idsValidos);
  const normaValida = contexto.normaValida ?? validarNormaId;
  const { trechos, porqueRedigido, lacunaIdentificada } = parsed.data;

  for (const t of trechos) {
    if (contexto.textoEvidencias.indexOf(t.trecho) === -1) {
      return { ok: false, motivo: `trecho não literal: "${t.trecho.slice(0, 40)}"` };
    }
    if (!ids.has(t.evidenciaId)) {
      return { ok: false, motivo: `evidenciaId fora do pacote: ${t.evidenciaId}` };
    }
    const textoDaEvidencia = contexto.textosPorId?.[t.evidenciaId];
    if (contexto.textosPorId && (textoDaEvidencia === undefined || textoDaEvidencia.indexOf(t.trecho) === -1)) {
      return { ok: false, motivo: `trecho não está em ${t.evidenciaId}: "${t.trecho.slice(0, 40)}"` };
    }
    for (const id of t.seletor?.match(ID_NATIVO) ?? []) {
      if (!ids.has(id)) return { ok: false, motivo: `seletor cita ID fora do pacote: ${id}` };
    }
    if (t.normaId !== null && !normaValida(t.normaId)) {
      return { ok: false, motivo: `normaId fora do corpus: ${t.normaId}` };
    }
  }

  const redigido = `${porqueRedigido}\n${lacunaIdentificada ?? ""}`;
  for (const id of redigido.match(ID_NATIVO) ?? []) {
    if (!ids.has(id)) return { ok: false, motivo: `texto redigido cita ID fora do pacote: ${id}` };
  }
  if (PALAVRA_PROIBIDA.test(semAcento(semCitacoesLiterais(redigido, contexto.textoEvidencias)))) {
    return { ok: false, motivo: "texto redigido usa palavra de conclusão proibida" };
  }

  return { ok: true, output: parsed.data };
}
