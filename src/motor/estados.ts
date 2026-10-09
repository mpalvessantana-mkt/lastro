import { EstadoCriterio } from "../types";

export interface SugestaoEstado {
  criterioId: number;
  estadoSugerido: EstadoCriterio;
  confianca: "ALTA" | "MEDIA" | "BAIXA";
  marcadoresEncontrados: string[];
  justificativaSugerida: string;
}

export function sugerirEstadoCriterio5(textoLimite: string): SugestaoEstado {
  const norm = (textoLimite || "").toLowerCase().trim();

  // Caso vazio ou sem evidência documentada
  if (!norm || norm.length < 15) {
    return {
      criterioId: 5,
      estadoSugerido: "INSUFICIENTE PARA O NÚCLEO ALEGADO",
      confianca: "BAIXA",
      marcadoresEncontrados: ["ausência de texto de limites"],
      justificativaSugerida: "Não foram localizadas evidências textuais delimitando a conclusão ou demonstrando reprodutibilidade do núcleo de P&D."
    };
  }

  // Marcadores de configuração e rotina de TI (§ 141 Frascati / Não elegível)
  const marcadoresConfig = [
    "não há hipótese de mecanismo novo",
    "nao ha hipotese de mecanismo novo",
    "apenas adequação",
    "apenas adequacao",
    "aplicação conhecida",
    "aplicacao conhecida",
    "não transforma rotina em p&d",
    "não transforma rotina em",
    "nao transforma rotina em",
    "aceite limitado aos conectores",
    "aceite limitado",
    "customização de software",
    "customizacao de software",
    "parametrização de sistema",
    "parametrizacao de sistema",
    "integração de api padrão",
    "uso de ferramentas existentes"
  ];
  for (const m of marcadoresConfig) {
    if (norm.includes(m)) {
      return {
        criterioId: 5,
        estadoSugerido: "DOCUMENTADA PARA A CONFIGURAÇÃO",
        confianca: "ALTA",
        marcadoresEncontrados: [m],
        justificativaSugerida: "Receita, parâmetros, versões e resultados estão localizados; a existência de documentação não transforma rotina ou configuração em P&D (Manual de Frascati § 141)."
      };
    }
  }

  // Marcadores de insuficiência (Evidência insuficiente)
  const marcadoresInsuf = [
    "faltam",
    "não preservou",
    "nao preservou",
    "não permite distinguir",
    "nao permite distinguir",
    "não completam a cadeia",
    "não completam",
    "nao completam",
    "sem regras e saídas",
    "sem regras e saidas",
    "ausência de logs",
    "ausencia de logs",
    "dados parciais"
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
    "mas nao a alegacao de",
    "permanece em aberto",
    "ainda não foi validada",
    "ainda nao foi validada",
    "segue aberto",
    "corte de energia",
    "não foi ensaiado",
    "nao foi ensaiado",
    "não integra a pretensão",
    "nao integra a pretensao",
    "ainda não foi",
    "ainda nao foi",
    "limitação observada",
    "limitacao observada"
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
    "conclusao limitada a",
    "conclusão restrita",
    "conclusao restrita",
    "restrita às",
    "restrita as",
    "restrita aos",
    "não se reivindica",
    "nao se reivindica",
    "não se promete",
    "nao se promete",
    "não foram reivindicadas",
    "nao foram reivindicadas",
    "compõem o escopo de conclusão",
    "compoem o escopo de conclusao",
    "o experimento cobre",
    "validado no escopo experimental",
    "escopo delimitado",
    "acompanham o pacote",
    "restrito ao recorte",
    "restrito aos",
    "restrito às"
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

  // Fallback prudente (Manual de Frascati / Prudência Fiscal):
  // Se o texto não apresenta demonstração clara de escopo ou limite de transferência,
  // a classificação prudente é INSUFICIENTE PARA O NÚCLEO ALEGADO (não Elegível cego).
  return {
    criterioId: 5,
    estadoSugerido: "INSUFICIENTE PARA O NÚCLEO ALEGADO",
    confianca: "BAIXA",
    marcadoresEncontrados: [],
    justificativaSugerida: "A documentação apresentada não traz delimitação explícita do escopo nem comprova a reprodutibilidade do núcleo alegado."
  };
}

export function sugerirEstadosCriterios1e2(
  textoSecao1: string,
  textoSecao2: string
): { c1: SugestaoEstado; c2: SugestaoEstado } {
  const norm1 = (textoSecao1 || "").toLowerCase().trim();
  const norm2 = (textoSecao2 || "").toLowerCase().trim();
  const textoTotal = `${norm1} ${norm2}`.trim();

  // Caso vazio ou sem dados suficientes
  if (textoTotal.length < 15) {
    return {
      c1: {
        criterioId: 1,
        estadoSugerido: "INDETERMINADA",
        confianca: "BAIXA",
        marcadoresEncontrados: ["texto ausente"],
        justificativaSugerida: "Novidade não verificável; ausência de especificação técnica e de estado da técnica anterior."
      },
      c2: {
        criterioId: 2,
        estadoSugerido: "INDETERMINADA",
        confianca: "BAIXA",
        marcadoresEncontrados: ["texto ausente"],
        justificativaSugerida: "Criatividade técnica indeterminada por falta de documentação do mecanismo e hipótese."
      }
    };
  }

  // 1. Rotina / Vedações Frascati § 141 -> NÃO DEMONSTRADA
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
    "faixa ja admitida",
    "antecede o projeto",
    "customização de erp",
    "customizacao de erp",
    "integração via api",
    "integracao via api",
    "consumo de api",
    "tela de cadastro",
    "crud",
    "migração de versão",
    "migracao de versao",
    "atualização de biblioteca",
    "atualizacao de biblioteca",
    "suporte a usuários",
    "suporte a usuarios",
    "correção de bugs",
    "correcao de bugs",
    "métodos conhecidos e ferramentas",
    "sem avanço algorítmico",
    "sem avanco algoritmico"
  ];

  for (const m of marcadoresRotina) {
    if (textoTotal.includes(m)) {
      return {
        c1: {
          criterioId: 1,
          estadoSugerido: "NÃO DEMONSTRADA",
          confianca: "ALTA",
          marcadoresEncontrados: [m],
          justificativaSugerida: "Recursos já fornecidos por catálogo, manual ou tecnologias comerciais de mercado anteriores à configuração (Frascati § 141)."
        },
        c2: {
          criterioId: 2,
          estadoSugerido: "NÃO DEMONSTRADA",
          confianca: "ALTA",
          marcadoresEncontrados: [m],
          justificativaSugerida: "Atividade de rotina/configuração sem modificação do mecanismo subjacente nem criação de hipótese não óbvia."
        }
      };
    }
  }

  // 2. Indeterminação explícita (sem dados reais ou apenas planejamento futuro)
  const marcadoresIndet = [
    "plano propõe",
    "plano propoe",
    "minuta",
    "diagrama",
    "não define",
    "nao define",
    "sem limiares aprovados",
    "identificadas apenas como",
    "antiga/nova",
    "em fase de planejamento",
    "a definir"
  ];
  for (const m of marcadoresIndet) {
    if (textoTotal.includes(m) && !textoTotal.includes("ensaio") && !textoTotal.includes("medições") && !textoTotal.includes("medicoes") && !textoTotal.includes("sequências")) {
      return {
        c1: {
          criterioId: 1,
          estadoSugerido: "INDETERMINADA",
          confianca: "ALTA",
          marcadoresEncontrados: [m],
          justificativaSugerida: "Novidade não verificável nas evidências entregues (documentação preliminar ou incompleta)."
        },
        c2: {
          criterioId: 2,
          estadoSugerido: "INDETERMINADA",
          confianca: "ALTA",
          marcadoresEncontrados: [m],
          justificativaSugerida: "Criatividade técnica indeterminada por falta de parâmetros operacionais aprovados."
        }
      };
    }
  }

  // 3. Investigação genuína de P&D (Técnica anterior superada + formulação de hipótese/mecanismo)
  const marcadoresInvestigacao = [
    "já eram conhecidos",
    "ja eram conhecidos",
    "já eram dominadas",
    "ja eram dominadas",
    "o comparador",
    "a alternativa",
    "não vincula",
    "nao vincula",
    "perde",
    "o problema investigado",
    "hipótese",
    "hipotese",
    "grafo de candidatos",
    "grafo",
    "pseudocódigo",
    "pseudocodigo",
    "ensaio comparativo",
    "ensaio",
    "experimento",
    "modelo próprio",
    "modelo proprietário",
    "algoritmo inédito",
    "algoritmo",
    "não reproduziam",
    "nao reproduziam",
    "não atendiam",
    "nao atendiam",
    "eram utilizados",
    "eram utilizadas",
    "interleavings",
    "dependência causal",
    "dependencia causal",
    "permutação",
    "permutacao",
    "sem produto cartesiano",
    "sem congelar",
    "ordens parciais",
    "como reproduzir",
    "como viabilizar",
    "como resolver",
    "confronto com",
    "distribuição causal",
    "distribuicao causal",
    "sequências de",
    "sequencias de",
    "repetições",
    "repeticoes"
  ];
  for (const m of marcadoresInvestigacao) {
    if (textoTotal.includes(m)) {
      return {
        c1: {
          criterioId: 1,
          estadoSugerido: "DEMONSTRADA NO RECORTE",
          confianca: "ALTA",
          marcadoresEncontrados: [m],
          justificativaSugerida: "Novidade técnica investigada frente ao estado da técnica anterior com distinção de alternativas."
        },
        c2: {
          criterioId: 2,
          estadoSugerido: "DEMONSTRADA NO RECORTE",
          confianca: "ALTA",
          marcadoresEncontrados: [m],
          justificativaSugerida: "Criatividade técnica demonstrada pela hipótese e mecanismo formulado não trivial."
        }
      };
    }
  }

  // Fallback Prudência Fiscal: texto genérico sem comprovação de alternativa ou mecanismo
  return {
    c1: {
      criterioId: 1,
      estadoSugerido: "INDETERMINADA",
      confianca: "BAIXA",
      marcadoresEncontrados: [],
      justificativaSugerida: "Novidade técnica indeterminada; não foi demonstrado comparador formal com o estado da técnica anterior."
    },
    c2: {
      criterioId: 2,
      estadoSugerido: "INDETERMINADA",
      confianca: "BAIXA",
      marcadoresEncontrados: [],
      justificativaSugerida: "Criatividade técnica não verificável; faltam detalhes da hipótese operacional e do modelo subjacente."
    }
  };
}

export function sugerirEstadoCriterio3(
  textoSecao2: string,
  c1e2Estado: string
): SugestaoEstado {
  const norm = (textoSecao2 || "").toLowerCase().trim();

  if (
    c1e2Estado === "INDETERMINADA" ||
    norm.includes("faltam versão") ||
    norm.includes("sem regras e saídas") ||
    norm.length < 15
  ) {
    return {
      criterioId: 3,
      estadoSugerido: "ALEGADA, NÃO VERIFICÁVEL",
      confianca: "ALTA",
      marcadoresEncontrados: ["falta de elo causal"],
      justificativaSugerida: "Faltam versões executadas e registros de saída para verificar a incerteza tecnológica alegada."
    };
  }

  if (
    c1e2Estado === "NÃO DEMONSTRADA" ||
    norm.includes("resolvidos por configuração") ||
    norm.includes("sem hipótese técnica") ||
    norm.includes("customização") ||
    norm.includes("parametrização")
  ) {
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
  const norm = (textoSecao3 || "").toLowerCase().trim();

  if (
    c3Estado === "ALEGADA, NÃO VERIFICÁVEL" ||
    norm.includes("sem causa controlada") ||
    norm.includes("memorando") ||
    norm.length < 15
  ) {
    return {
      criterioId: 4,
      estadoSugerido: "PARCIAL",
      confianca: "ALTA",
      marcadoresEncontrados: ["dados parciais"],
      justificativaSugerida: "Registros recuperados não contêm saídas do mecanismo nem vínculo causal completo."
    };
  }

  if (
    c3Estado === "NÃO CARACTERIZADA" ||
    norm.includes("roteiros de aceite") ||
    norm.includes("após correção") ||
    norm.includes("teste funcional")
  ) {
    return {
      criterioId: 4,
      estadoSugerido: "DOCUMENTADA COMO ACEITE",
      confianca: "ALTA",
      marcadoresEncontrados: ["roteiros de aceite"],
      justificativaSugerida: "Roteiros de verificação funcional e aceite operacional documentados, caracterizando rotina de homologação e não P&D sistemático."
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
