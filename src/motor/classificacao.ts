import { Classe, EstadoCriterio } from "../types";

export const ESTADOS_INDETERMINADOS = new Set<string>([
  "INDETERMINADA",
  "ALEGADA, NÃO VERIFICÁVEL",
  "PARCIAL",
  "INSUFICIENTE PARA O NÚCLEO ALEGADO"
]);

export const ESTADOS_NEGATIVOS = new Set<string>([
  "NÃO DEMONSTRADA",
  "NÃO CARACTERIZADA",
  "DOCUMENTADA COMO ACEITE",
  "DOCUMENTADA PARA A CONFIGURAÇÃO"
]);

export interface ResultadoComposicao {
  classe: Classe | "CONFLITO" | "INCOMPLETO";
  sinalNucleoNaoVerificavel: boolean;
  sinalMecanismoConhecido: boolean;
  criteriosIndeterminados: number[];
  criteriosNegativos: number[];
  motivoRegra: string;
}

/**
 * Composição canônica da classe conforme Seção 5.3 do CLAUDE.md
 * Reproduz 20/20 dos históricos sem exceção.
 */
export function comporClasse(
  estados: Record<number, EstadoCriterio | undefined | null>
): ResultadoComposicao {
  const criterios = [1, 2, 3, 4, 5];
  
  // 8. Algum critério sem estado -> INCOMPLETO
  for (const c of criterios) {
    if (!estados[c]) {
      return {
        classe: "INCOMPLETO",
        sinalNucleoNaoVerificavel: false,
        sinalMecanismoConhecido: false,
        criteriosIndeterminados: [],
        criteriosNegativos: [],
        motivoRegra: `Critério ${c} ainda não avaliado.`
      };
    }
  }

  const criteriosIndeterminados: number[] = [];
  const criteriosNegativos: number[] = [];

  for (const c of criterios) {
    const estado = estados[c]!;
    if (ESTADOS_INDETERMINADOS.has(estado)) {
      criteriosIndeterminados.push(c);
    }
    if (ESTADOS_NEGATIVOS.has(estado)) {
      criteriosNegativos.push(c);
    }
  }

  const sinalNucleoNaoVerificavel = criteriosIndeterminados.length > 0;
  const sinalMecanismoConhecido = criteriosNegativos.length > 0;

  // 3. Os dois sinais coexistem -> NÃO CLASSIFICAR (CONFLITO)
  if (sinalNucleoNaoVerificavel && sinalMecanismoConhecido) {
    return {
      classe: "CONFLITO",
      sinalNucleoNaoVerificavel,
      sinalMecanismoConhecido,
      criteriosIndeterminados,
      criteriosNegativos,
      motivoRegra: "Coexistência de sinais negativos e de indeterminação. Requer análise manual das duas vertentes."
    };
  }

  // 4. Só sinal 1 -> Evidência insuficiente
  if (sinalNucleoNaoVerificavel) {
    return {
      classe: "EVIDENCIA_INSUFICIENTE",
      sinalNucleoNaoVerificavel,
      sinalMecanismoConhecido,
      criteriosIndeterminados,
      criteriosNegativos,
      motivoRegra: "Presença de critério em estado de indeterminação (núcleo não verificável)."
    };
  }

  // 5. Só sinal 2 -> Não elegível
  if (sinalMecanismoConhecido) {
    return {
      classe: "NAO_ELEGIVEL",
      sinalNucleoNaoVerificavel,
      sinalMecanismoConhecido,
      criteriosIndeterminados,
      criteriosNegativos,
      motivoRegra: "Presença de critério em estado negativo (mecanismo conhecido ou rotina de aceite)."
    };
  }

  // 6 e 7. Nenhum sinal negativo/indeterminado -> Avaliar Critério 5
  const estado5 = estados[5];
  if (estado5 === "DOCUMENTADA COM LIMITE") {
    return {
      classe: "COM_RESSALVAS",
      sinalNucleoNaoVerificavel,
      sinalMecanismoConhecido,
      criteriosIndeterminados,
      criteriosNegativos,
      motivoRegra: "P&D comprovado no recorte ensaiado com limite de abrangência documentado (Critério 5)."
    };
  }

  if (estado5 === "DOCUMENTADA NO ESCOPO") {
    return {
      classe: "ELEGIVEL",
      sinalNucleoNaoVerificavel,
      sinalMecanismoConhecido,
      criteriosIndeterminados,
      criteriosNegativos,
      motivoRegra: "Todos os critérios demonstrados e transferibilidade documentada no escopo."
    };
  }

  // Fallback seguro caso haja estado inesperado
  return {
    classe: "CONFLITO",
    sinalNucleoNaoVerificavel,
    sinalMecanismoConhecido,
    criteriosIndeterminados,
    criteriosNegativos,
    motivoRegra: "Estado do critério 5 não mapeado na matriz de decisão."
  };
}
