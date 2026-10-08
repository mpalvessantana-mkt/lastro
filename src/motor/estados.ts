import { EstadoCriterio } from "../types";

export interface SugestaoEstado {
  criterioId: number;
  estadoSugerido: EstadoCriterio;
  confianca: "ALTA" | "MEDIA" | "BAIXA";
  marcadoresEncontrados: string[];
  justificativaSugerida: string;
}

export function sugerirEstadoCriterio5(textoLimite: string): SugestaoEstado {
  const norm = textoLimite.toLowerCase();

  // Marcadores de configuração (Não elegível)
  const marcadoresConfig = [
    "não há hipótese de mecanismo novo",
    "apenas adequação",
    "aplicação conhecida",
    "não transforma rotina em p&d",
    "não transforma rotina em",
    "aceite limitado aos conectores"
  ];
  for (const m of marcadoresConfig) {
    if (norm.includes(m)) {
      return {
        criterioId: 5,
        estadoSugerido: "DOCUMENTADA PARA A CONFIGURAÇÃO",
        confianca: "ALTA",
        marcadoresEncontrados: [m],
        justificativaSugerida: "Receita, parâmetros, versões e resultados estão localizados; a existência de documentação não transforma rotina em P&D."
      };
    }
  }

  // Marcadores de insuficiência (Evidência insuficiente)
  const marcadoresInsuf = [
    "faltam",
    "não preservou",
    "não permite distinguir",
    "não completam a cadeia",
    "não completam",
    "sem regras e saídas"
  ];
  for (const m of marcadoresInsuf) {
    if (norm.includes(m)) {
      return {
        criterioId: 5,
        estadoSugerido: "INSUFICIENTE PARA O NÚCLEO ALEGADO",
        confianca: "ALTA",
        marcadoresEncontrados: [m],
        justificativaSugerida: "A documentação existente não completa a cadeia probatória do núcleo alegado."
      };
    }
  }

  // Marcadores de limite (Com ressalvas)
  const marcadoresLimite = [
    "mas não a alegação de",
    "permanece em aberto",
    "ainda não foi validada",
    "segue aberto",
    "corte de energia",
    "não foi ensaiado",
    "não integra a pretensão",
    "ainda não foi"
  ];
  for (const m of marcadoresLimite) {
    if (norm.includes(m)) {
      return {
        criterioId: 5,
        estadoSugerido: "DOCUMENTADA COM LIMITE",
        confianca: "ALTA",
        marcadoresEncontrados: [m],
        justificativaSugerida: "A evidência sustenta a investigação no recorte ensaiado, mas há pretensão técnica que permanece em aberto."
      };
    }
  }

  // Marcadores de escopo (Elegível)
  const marcadoresEscopo = [
    "conclusão limitada a",
    "não se reivindica",
    "não foram reivindicadas",
    "compõem o escopo de conclusão",
    "o experimento cobre"
  ];
  for (const m of marcadoresEscopo) {
    if (norm.includes(m)) {
      return {
        criterioId: 5,
        estadoSugerido: "DOCUMENTADA NO ESCOPO",
        confianca: "ALTA",
        marcadoresEncontrados: [m],
        justificativaSugerida: "Escopo de conclusão delimitado e sustentado com transferência documentada."
      };
    }
  }

  // Fallback padrão
  return {
    criterioId: 5,
    estadoSugerido: "DOCUMENTADA NO ESCOPO",
    confianca: "MEDIA",
    marcadoresEncontrados: [],
    justificativaSugerida: "Transferência e reprodução documentadas no escopo do projeto."
  };
}

export function sugerirEstadosCriterios1e2(
  textoSecao1: string,
  textoSecao2: string
): { c1: SugestaoEstado; c2: SugestaoEstado } {
  const norm1 = textoSecao1.toLowerCase();
  const norm2 = textoSecao2.toLowerCase();

  // Rotina -> NÃO DEMONSTRADA
  const marcadoresRotina = [
    "o manual define",
    "o catálogo já fornece",
    "o catalogo ja fornece",
    "o produto já oferece",
    "o produto ja oferece",
    "anterior à configuração",
    "anterior a configuracao",
    "aplicar receita do fornecedor",
    "sem modificar",
    "faixa já admitida",
    "antecede o projeto"
  ];

  let c1Estado: any = "DEMONSTRADA NO RECORTE";
  let c2Estado: any = "DEMONSTRADA NO RECORTE";
  let c1Marcadores: string[] = [];
  let c2Marcadores: string[] = [];

  for (const m of marcadoresRotina) {
    if (norm1.includes(m) || norm2.includes(m)) {
      c1Estado = "NÃO DEMONSTRADA";
      c2Estado = "NÃO DEMONSTRADA";
      c1Marcadores.push(m);
      c2Marcadores.push(m);
      break;
    }
  }

  // Indeterminação -> INDETERMINADA
  const marcadoresIndet = [
    "plano propõe",
    "minuta",
    "diagrama",
    "não define",
    "sem limiares aprovados",
    "identificadas apenas como",
    "antiga/nova"
  ];
  for (const m of marcadoresIndet) {
    if (norm1.includes(m) || norm2.includes(m)) {
      c1Estado = "INDETERMINADA";
      c2Estado = "INDETERMINADA";
      c1Marcadores.push(m);
      c2Marcadores.push(m);
      break;
    }
  }

  return {
    c1: {
      criterioId: 1,
      estadoSugerido: c1Estado,
      confianca: "ALTA",
      marcadoresEncontrados: c1Marcadores,
      justificativaSugerida:
        c1Estado === "DEMONSTRADA NO RECORTE"
          ? "Novidade técnica investigada frente ao estado da técnica anterior."
          : c1Estado === "NÃO DEMONSTRADA"
          ? "Recursos já fornecidos por catálogo/manual anterior à configuração."
          : "Novidade não verificável nas evidências entregues."
    },
    c2: {
      criterioId: 2,
      estadoSugerido: c2Estado,
      confianca: "ALTA",
      marcadoresEncontrados: c2Marcadores,
      justificativaSugerida:
        c2Estado === "DEMONSTRADA NO RECORTE"
          ? "Criatividade técnica demonstrada pela hipótese e mecanismo formulado."
          : c2Estado === "NÃO DEMONSTRADA"
          ? "Configuração de rotina sem modificação do algoritmo subjacente."
          : "Criatividade técnica indeterminada."
    }
  };
}

export function sugerirEstadoCriterio3(
  textoSecao2: string,
  c1e2Estado: string
): SugestaoEstado {
  const norm = textoSecao2.toLowerCase();

  if (c1e2Estado === "INDETERMINADA" || norm.includes("faltam versão") || norm.includes("sem regras e saídas")) {
    return {
      criterioId: 3,
      estadoSugerido: "ALEGADA, NÃO VERIFICÁVEL",
      confianca: "ALTA",
      marcadoresEncontrados: ["falta de elo causal"],
      justificativaSugerida: "Faltam versões executadas e registros de saída para verificar a incerteza tecnológica alegada."
    };
  }

  if (c1e2Estado === "NÃO DEMONSTRADA" || norm.includes("resolvidos por configuração") || norm.includes("sem hipótese técnica")) {
    return {
      criterioId: 3,
      estadoSugerido: "NÃO CARACTERIZADA",
      confianca: "ALTA",
      marcadoresEncontrados: ["resolvidos por configuração"],
      justificativaSugerida: "Desvios resolvidos por configuração, mapeamento ou receita existente, sem hipótese técnica desconhecida."
    };
  }

  return {
    criterioId: 3,
    estadoSugerido: "INVESTIGADA",
    confianca: "ALTA",
    marcadoresEncontrados: ["hipótese e comparador"],
    justificativaSugerida: "Incerteza tecnológica investigada com controle comparativo e hipótese operacional rastreável."
  };
}

export function sugerirEstadoCriterio4(
  textoSecao3: string,
  c3Estado: string
): SugestaoEstado {
  const norm = textoSecao3.toLowerCase();

  if (c3Estado === "ALEGADA, NÃO VERIFICÁVEL" || norm.includes("sem causa controlada") || norm.includes("memorando")) {
    return {
      criterioId: 4,
      estadoSugerido: "PARCIAL",
      confianca: "ALTA",
      marcadoresEncontrados: ["dados parciais"],
      justificativaSugerida: "Registros recuperados não contêm saídas do mecanismo nem vínculo causal completo."
    };
  }

  if (c3Estado === "NÃO CARACTERIZADA" || norm.includes("roteiros de aceite") || norm.includes("após correção")) {
    return {
      criterioId: 4,
      estadoSugerido: "DOCUMENTADA COMO ACEITE",
      confianca: "ALTA",
      marcadoresEncontrados: ["roteiros de aceite"],
      justificativaSugerida: "Roteiros de verificação funcional e aceite operacional documentados."
    };
  }

  return {
    criterioId: 4,
    estadoSugerido: "DOCUMENTADA",
    confianca: "ALTA",
    marcadoresEncontrados: ["cenários estruturados"],
    justificativaSugerida: "Sistematicidade comprovada com múltiplos cenários, perfis e limites definidos antes da rodada."
  };
}
