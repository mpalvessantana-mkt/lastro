import { Confronto, Forca } from "../types";

export interface OcorrenciaCampo {
  fonte: string;
  evidenciaId: string;
  ensaioId?: string | null;
  texto: string;
  forca: Forca;
}

export function normalizarTexto(t: string): string {
  return t
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Cria um objeto de Confronto no padrão oficial do Guia do STS:
 * "A entrevista afirma X; o registro Y mostra Z; prevalece [o registro/a entrevista], porque..."
 */
export function formatarTextoConfronto(
  afirmacaoA: OcorrenciaCampo,
  afirmacaoB: OcorrenciaCampo,
  prevalencia: "A" | "B",
  razao: string
): string {
  const vencedora = prevalencia === "A" ? afirmacaoA : afirmacaoB;
  return `${afirmacaoA.fonte} afirma "${afirmacaoA.texto}"; ${afirmacaoB.fonte} mostra "${afirmacaoB.texto}". Prevalece ${vencedora.fonte}, ${razao}.`;
}

/**
 * Detecta divergências entre pares de afirmações espelhadas
 */
export function detectarConfrontos(
  campoLogico: string,
  ocorrencias: OcorrenciaCampo[]
): Confronto[] {
  const confrontos: Confronto[] = [];

  // Se houver depoimento (DECLARATORIA) e registro (PRIMARIA), confrontá-los
  const declaratorias = ocorrencias.filter((o) => o.forca === "DECLARATORIA");
  const primarias = ocorrencias.filter((o) => o.forca === "PRIMARIA");

  for (const dec of declaratorias) {
    for (const prim of primarias) {
      const normDec = normalizarTexto(dec.texto);
      const normPrim = normalizarTexto(prim.texto);

      // Se textos forem distintos
      if (normDec !== normPrim && normDec.length > 0 && normPrim.length > 0) {
        const id = `CONF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const razao = "por ser primário e identificado por versão";
        const textoFormatado = `A entrevista afirma "${dec.texto}"; o registro ${prim.fonte} mostra "${prim.texto}". Prevalece o registro, ${razao}.`;

        confrontos.push({
          id,
          campoLogico,
          afirmacaoA: {
            fonte: dec.fonte,
            evidenciaId: dec.evidenciaId,
            texto: dec.texto,
            forca: dec.forca
          },
          afirmacaoB: {
            fonte: prim.fonte,
            evidenciaId: prim.evidenciaId,
            ensaioId: prim.ensaioId ?? null,
            texto: prim.texto,
            forca: prim.forca
          },
          prevalenciaSugerida: "B", // Prevalece primária
          prevalencia: "B",
          razaoDaPrevalencia: razao,
          textoFormatado,
          resolvidoPor: null,
          resolvidoEm: null
        });
      }
    }
  }

  return confrontos;
}
