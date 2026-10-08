export interface ProjetoHistorico {
  id: string;
  titulo: string;
  classificacao: string;
  justificativa: string;
  limite: string;
  divergenciaDepoimento: string;
  estados: Record<number, string>;
  justificativas: Record<number, string>;
  fontes: Record<number, string>;
}

export const HISTORICOS_REFERENCIA: ProjetoHistorico[] = [
  {
    "id": "PRJ01",
    "titulo": "Reprocessamento seguro de mensagens duplicadas",
    "classificacao": "Não elegível",
    "justificativa": "O manual antecede o projeto e descreve exatamente o recurso aplicado. O defeito inicial decorre da janela de retenção; corrigir parâmetro e homologar não caracteriza investigação tecnológica.",
    "limite": "Aceite limitado aos conectores e à janela configurada. Não há hipótese de mecanismo novo, apenas adequação da configuração ao contrato.",
    "divergenciaDepoimento": "",
    "estados": {
      "1": "NÃO DEMONSTRADA",
      "2": "NÃO DEMONSTRADA",
      "3": "NÃO CARACTERIZADA",
      "4": "DOCUMENTADA COMO ACEITE",
      "5": "DOCUMENTADA PARA A CONFIGURAÇÃO"
    },
    "justificativas": {
      "1": "O manual fictício BARR-2, seção 4, anterior à configuração, fornece chave composta por operação e versão, retenção de duplicatas e distinção entre reenvio e nova operação.",
      "2": "Configurar deduplicação por (operação, versão). Uma retransmissão mantém a chave; uma operação legítima nova recebe outra. Alterar retenção de 30 para 120 segundos, conforme faixa de 10–300 segundos já admitida pelo produto. Nenhum algoritmo do barramento foi modificado.",
      "3": "Os desvios registrados são resolvidos por configuração, mapeamento ou receita existente, sem hipótese técnica desconhecida.",
      "4": "Sessenta roteiros: 40 envios únicos, 12 retransmissões da mesma chave e oito operações novas após interrupção. A rodada deduplicacao-v1 reteve oito duplicatas; deduplicacao-v2 reteve as 12. As oito operações novas foram liberadas em ambas.",
      "5": "Receita, parâmetros, versões e resultados estão localizados; a existência de documentação não transforma rotina em P&D."
    },
    "fontes": {
      "1": "evidencias/metodo.md#1",
      "2": "evidencias/metodo.md#2",
      "3": "evidencias/metodo.md#2",
      "4": "evidencias/medicoes.csv",
      "5": "evidencias/metodo.md#3"
    }
  },
  {
    "id": "PRJ02",
    "titulo": "Detecção de divergências entre razão e extrato",
    "classificacao": "Elegível",
    "justificativa": "Método, alternativas, critérios prévios e contagens por perfil tornam verificável a investigação sobre ambiguidade sob desvio de relógios. O ganho não é apenas adoção de um grafo genérico: há regra de restrição e abstenção testada contra esse comparador. A entrevista informa 1.100 pares corretos; evidencias/medicoes.csv e resultados.csv, ensaio PRJ02-S05, registram 1.152/1.200 (96%) em restrito-v4. Prevalecem esses registros identificados por versão e perfil, recalculáveis, sobre o depoimento de memória.",
    "limite": "Conclusão limitada à associação com sequência confiável e aos três deslocamentos ensaiados. Sem inferência sobre transações reais ou ausência de ordem de origem.",
    "divergenciaDepoimento": "A entrevista informa 1.100 pares corretos; evidencias/medicoes.csv e resultados.csv, ensaio PRJ02-S05, registram 1.152/1.200 (96%) em restrito-v4. Prevalecem esses registros identificados por versão e perfil, recalculáveis, sobre o depoimento de memória.",
    "estados": {
      "1": "DEMONSTRADA NO RECORTE",
      "2": "DEMONSTRADA NO RECORTE",
      "3": "INVESTIGADA",
      "4": "DOCUMENTADA",
      "5": "DOCUMENTADA NO ESCOPO"
    },
    "justificativas": {
      "1": "Igualdade textual, faixa de valor/tempo e atribuição bipartida de custo mínimo já eram dominadas. A última força pareamento em componentes ambíguos quando dois relógios divergem; não representa causalidade relativa nem abstenção por margem.",
      "2": "Grafo de candidatos com arestas apenas para mesmo valor e janela corrigida de 120 s. Estimar deslocamento pela mediana dos pares-âncora inequívocos. Custo de aresta: 0,6×|diferença temporal corrigida|/120 + 0,4×(1-Jaccard dos tokens da descrição em minúsculas). Impor ordem relativa somente dentro de cadeia com sequência confiável, nunca entre contas independentes. Resolver custo mínimo; abster se a margem entre as duas melhores atribuições for menor que 0,15. Bipartido usa o mesmo custo, sem restrição de ordem ou abstenção.",
      "3": "Grafo de candidatos com arestas apenas para mesmo valor e janela corrigida de 120 s. Estimar deslocamento pela mediana dos pares-âncora inequívocos. Custo de aresta: 0,6×|diferença temporal corrigida|/120 + 0,4×(1-Jaccard dos tokens da descrição em minúsculas). Impor ordem relativa somente dentro de cadeia com sequência confiável, nunca entre contas independentes. Resolver custo mínimo; abster se a margem entre as duas melhores atribuições for menor que 0,15. Bipartido usa o mesmo custo, sem restrição de ordem ou abstenção.",
      "4": "1.200 pares, 400 em cada deslocamento de relógio de 0, +90 e -90 segundos; 60 ambíguos por perfil, total 180. Mesma referência lacrada para quatro alternativas. Limites definidos antes da rodada: pelo menos 95% de acerto e no máximo 1% de vínculos falsos. Os 48 pares recusados pelo grafo pertencem ao estrato ambíguo.",
      "5": "Conclusão limitada à associação com sequência confiável e aos três deslocamentos ensaiados. Sem inferência sobre transações reais ou ausência de ordem de origem."
    },
    "fontes": {
      "1": "evidencias/metodo.md#1",
      "2": "evidencias/metodo.md#2",
      "3": "evidencias/metodo.md#2",
      "4": "evidencias/medicoes.csv",
      "5": "evidencias/revisao_tecnica.md"
    }
  },
  {
    "id": "PRJ03",
    "titulo": "Reexecução controlada após falhas intermitentes",
    "classificacao": "Elegível",
    "justificativa": "A incerteza de estabilidade foi investigada com controle comparativo, hipótese operacional e métricas rastreáveis. O escopo e a documentação sustentam a investigação tecnológica registrada.",
    "limite": "Duas falhas e latência nos perfis L1/L2 compõem o escopo de conclusão. Sequências mais longas não foram reivindicadas.",
    "divergenciaDepoimento": "",
    "estados": {
      "1": "DEMONSTRADA NO RECORTE",
      "2": "DEMONSTRADA NO RECORTE",
      "3": "INVESTIGADA",
      "4": "DOCUMENTADA",
      "5": "DOCUMENTADA NO ESCOPO"
    },
    "justificativas": {
      "1": "Lote fixo e controle reativo pela latência eram conhecidos. Após duas falhas sucessivas, atraso da fila e latência do serviço davam sinais incompatíveis: o reativo acelerava ao ver fila envelhecida e recriava sobrecarga.",
      "2": "A cada segundo medir p95 da latência em janela de 10 s e derivada do atraso da fila. Limitar lote a [50,1000]. Se p95>400 ms reduzir lote em 25%; se p95≤ 400 ms e atraso cresce, aumentar no máximo 5%; só voltar a acelerar após três janelas estáveis. O acoplamento com histerese, e não um novo nome para retry, foi confrontado com o controlador de latência isolado.",
      "3": "A cada segundo medir p95 da latência em janela de 10 s e derivada do atraso da fila. Limitar lote a [50,1000]. Se p95>400 ms reduzir lote em 25%; se p95≤ 400 ms e atraso cresce, aumentar no máximo 5%; só voltar a acelerar após três janelas estáveis. O acoplamento com histerese, e não um novo nome para retry, foi confrontado com o controlador de latência isolado.",
      "4": "Seis cenários: filas de 5, 20 e 50 mil eventos × dois perfis de latência. Falhas nos instantes 30 s e 90 s, indisponibilidade de 10 s cada. Mesmas entradas e calendário nas três estratégias. A redução de 34% refere-se à fila de 50 mil no perfil L2: 1.000 s para 660 s.",
      "5": "Duas falhas e latência nos perfis L1/L2 compõem o escopo de conclusão. Sequências mais longas não foram reivindicadas."
    },
    "fontes": {
      "1": "evidencias/metodo.md#1",
      "2": "evidencias/metodo.md#2",
      "3": "evidencias/metodo.md#2",
      "4": "evidencias/medicoes.csv",
      "5": "evidencias/revisao_tecnica.md"
    }
  },
  {
    "id": "PRJ04",
    "titulo": "Painel de rastreabilidade da conciliação",
    "classificacao": "Não elegível",
    "justificativa": "Há prova suficiente da configuração de funções já contratadas. O resultado é uma melhoria operacional obtida por aplicação conhecida, não P&D.",
    "limite": "Verificação funcional de acesso e visualização. Não se investigou técnica nova de inferência ou reconstrução de trilha.",
    "divergenciaDepoimento": "",
    "estados": {
      "1": "NÃO DEMONSTRADA",
      "2": "NÃO DEMONSTRADA",
      "3": "NÃO CARACTERIZADA",
      "4": "DOCUMENTADA COMO ACEITE",
      "5": "DOCUMENTADA PARA A CONFIGURAÇÃO"
    },
    "justificativas": {
      "1": "O catálogo fictício VIS-3 já fornece junção por correlation_id, mascaramento por perfil e filtros. Os três sistemas de origem emitem esse identificador.",
      "2": "Configurar consulta por correlation_id e máscara de campos conforme matriz de acesso. O perfil consulta recebe somente valor mascarado; o perfil conciliação recebe detalhe. Corrigir uma permissão excessiva no mapeamento do perfil.",
      "3": "Os desvios registrados são resolvidos por configuração, mapeamento ou receita existente, sem hipótese técnica desconhecida.",
      "4": "Doze roteiros sobre três sistemas e dois perfis. A primeira matriz permitiu detalhe em um roteiro indevido; a segunda cumpriu os 12 resultados esperados.",
      "5": "Receita, parâmetros, versões e resultados estão localizados; a existência de documentação não transforma rotina em P&D."
    },
    "fontes": {
      "1": "evidencias/metodo.md#1",
      "2": "evidencias/metodo.md#2",
      "3": "evidencias/metodo.md#2",
      "4": "evidencias/medicoes.csv",
      "5": "evidencias/metodo.md#3"
    }
  },
  {
    "id": "PRJ05",
    "titulo": "Aplicativo de proposta com trabalho offline",
    "classificacao": "Com ressalvas",
    "justificativa": "O método proposto e a comparação documentam P&D no recorte ensaiado. A lacuna é técnica e específica: persistência da revogação sob corte de energia. A cobertura de segurança permanece limitada aos tipos de interrupção ensaiados. A entrevista afirma ausência de leitura indevida no banco local; evidencias/medicoes.csv e resultados.csv registram 2/8 em banco-v1 (PRJ05-S02) e 0/8 em epoca-v2 (PRJ05-S04). Prevalece a distinção documental entre as versões; a fala não sustenta ausência de falhas no comparador.",
    "limite": "O protocolo inclui uma hipótese sobre interrupção abrupta entre gravação do marcador e eliminação da chave. Corte de energia nessa janela não foi ensaiado. A evidência sustenta a investigação e a solução para quedas de rede, mas não a alegação de revogação em qualquer encerramento.",
    "divergenciaDepoimento": "A entrevista afirma ausência de leitura indevida no banco local; evidencias/medicoes.csv e resultados.csv registram 2/8 em banco-v1 (PRJ05-S02) e 0/8 em epoca-v2 (PRJ05-S04). Prevalece a distinção documental entre as versões; a fala não sustenta ausência de falhas no comparador.",
    "estados": {
      "1": "DEMONSTRADA NO RECORTE",
      "2": "DEMONSTRADA NO RECORTE",
      "3": "INVESTIGADA",
      "4": "DOCUMENTADA",
      "5": "DOCUMENTADA COM LIMITE"
    },
    "justificativas": {
      "1": "Banco local cifrado e chave por sessão eram conhecidos. O comparador BASE-OFF-1 usa uma chave persistente por perfil; a alternativa chave efêmera por formulário já conhecida perde recuperação após suspensão. O problema investigado é recuperar blocos após queda de rede e suspender acesso após troca de usuário, com transições concorrentes do processo.",
      "2": "Protótipo mantém blocos cifrados associados a época de sessão. Antes de trocar usuário, grava marcador de revogação e incrementa época; na retomada, aceita bloco apenas se época do cabeçalho coincide com a sessão e o marcador não o revoga. A hipótese combina recuperação de gravação parcial e invalidação lógica antes da remoção física da chave. Não envolve inventar cifra ou apresentar dados reais.",
      "3": "Protótipo mantém blocos cifrados associados a época de sessão. Antes de trocar usuário, grava marcador de revogação e incrementa época; na retomada, aceita bloco apenas se época do cabeçalho coincide com a sessão e o marcador não o revoga. A hipótese combina recuperação de gravação parcial e invalidação lógica antes da remoção física da chave. Não envolve inventar cifra ou apresentar dados reais.",
      "4": "24 roteiros em três pontos de queda de rede e duas trocas de sessão. Banco local recuperou 24, mas deixou dois roteiros de troca acessíveis ao usuário seguinte. Blocos por época recuperaram 24 e bloquearam leitura indevida nas oito trocas. Há oito testes de retomada por alternativa efêmera, dos quais seis perderam o formulário.",
      "5": "O protocolo inclui uma hipótese sobre interrupção abrupta entre gravação do marcador e eliminação da chave. Corte de energia nessa janela não foi ensaiado. A evidência sustenta a investigação e a solução para quedas de rede, mas não a alegação de revogação em qualquer encerramento."
    },
    "fontes": {
      "1": "evidencias/metodo.md#1",
      "2": "evidencias/metodo.md#2",
      "3": "evidencias/metodo.md#2",
      "4": "evidencias/medicoes.csv",
      "5": "evidencias/revisao_tecnica.md"
    }
  },
  {
    "id": "PRJ06",
    "titulo": "Sincronização de propostas após reconexão",
    "classificacao": "Com ressalvas",
    "justificativa": "Há método e evidência de comparação suficiente para identificar investigação. A ressalva incide sobre exclusão concorrente referenciada, não sobre ausência abstrata de reprodução por outra equipe.",
    "limite": "As listas ensaiadas contêm inserção e edição, mas não exclusão concorrente de item já referenciado por anexo. A hipótese de preservação dessa dependência permanece em aberto e integra a pretensão original.",
    "divergenciaDepoimento": "",
    "estados": {
      "1": "DEMONSTRADA NO RECORTE",
      "2": "DEMONSTRADA NO RECORTE",
      "3": "INVESTIGADA",
      "4": "DOCUMENTADA",
      "5": "DOCUMENTADA COM LIMITE"
    },
    "justificativas": {
      "1": "Última gravação vence ignora intenção; mesclagem de três vias preserva campos independentes, mas não a relação entre valor e anexo quando edições offline mudam ambos. Esses dois comparadores estão especificados e medidos.",
      "2": "Representar edição como (campo, versão-base, intenção, dependência). Mesclar operações de campos independentes; para valor e anexo, aceitar automaticamente somente se a versão-base do documento confirma o mesmo valor. Em conflito dependente, produzir duas alternativas preservadas para escolha humana. A incerteza era obter automação sem apagar a dependência semântica.",
      "3": "Representar edição como (campo, versão-base, intenção, dependência). Mesclar operações de campos independentes; para valor e anexo, aceitar automaticamente somente se a versão-base do documento confirma o mesmo valor. Em conflito dependente, produzir duas alternativas preservadas para escolha humana. A incerteza era obter automação sem apagar a dependência semântica.",
      "4": "90 conflitos: 30 campos simples, 30 anexos e 30 listas. Mesmas versões iniciais e edições em todas as estratégias. O conjunto contém 16 conflitos dependentes que exigem decisão humana. Última gravação perde conteúdo em 11; mesclagem proposta resolve 74 e encaminha 16 sem perda silenciosa.",
      "5": "As listas ensaiadas contêm inserção e edição, mas não exclusão concorrente de item já referenciado por anexo. A hipótese de preservação dessa dependência permanece em aberto e integra a pretensão original."
    },
    "fontes": {
      "1": "evidencias/metodo.md#1",
      "2": "evidencias/metodo.md#2",
      "3": "evidencias/metodo.md#2",
      "4": "evidencias/medicoes.csv",
      "5": "evidencias/revisao_tecnica.md"
    }
  },
  {
    "id": "PRJ07",
    "titulo": "Autenticação em aparelhos simples",
    "classificacao": "Com ressalvas",
    "justificativa": "Comparadores, transições, orçamento de memória e registros sustentam o núcleo de investigação. A ressalva é a falta do ataque de adulteração local previsto, sem converter vinte replays em prova de segurança geral. A entrevista menciona um replay aceito na versão em etapas; evidencias/medicoes.csv e resultados.csv, PRJ07-S05, registram 0/20 em etapas-v3. Prevalece o contador identificado dessa versão, sem ampliar o resultado para resistência geral à adulteração.",
    "limite": "Não há teste de substituição do conteúdo entre captura e assinatura em processo comprometido. A conclusão anti-replay tem amostra delimitada; a pretensão de resistência a adulteração local ainda não foi validada.",
    "divergenciaDepoimento": "A entrevista menciona um replay aceito na versão em etapas; evidencias/medicoes.csv e resultados.csv, PRJ07-S05, registram 0/20 em etapas-v3. Prevalece o contador identificado dessa versão, sem ampliar o resultado para resistência geral à adulteração.",
    "estados": {
      "1": "DEMONSTRADA NO RECORTE",
      "2": "DEMONSTRADA NO RECORTE",
      "3": "INVESTIGADA",
      "4": "DOCUMENTADA",
      "5": "DOCUMENTADA COM LIMITE"
    },
    "justificativas": {
      "1": "Biblioteca completa e versão leve de quadro único já estavam disponíveis. A completa usa 82 MB no pico; a leve cabe no limite de 32 MB, mas não vincula retomada ao desafio anterior quando a rede cai.",
      "2": "Dividir captura, assinatura do transcript e envio. Cada etapa consome a anterior por nonce de uso único; assinatura cobre hash do transcript, época de sessão e contador da etapa. Retomar somente após confirmar consumo do último nonce; liberar buffers de imagem antes da assinatura. O problema era preservar vínculo entre etapas sob memória limitada e interrupção, não criar um algoritmo criptográfico.",
      "3": "Dividir captura, assinatura do transcript e envio. Cada etapa consome a anterior por nonce de uso único; assinatura cobre hash do transcript, época de sessão e contador da etapa. Retomar somente após confirmar consumo do último nonce; liberar buffers de imagem antes da assinatura. O problema era preservar vínculo entre etapas sob memória limitada e interrupção, não criar um algoritmo criptográfico.",
      "4": "300 sessões legítimas: três perfis de aparelho × quatro níveis de sinal × 25 sessões. Vinte replays em conjunto separado. Completa conclui 183/300, leve 255/300 e etapas 276/300; a leve aceita três replays e etapas nenhum dos 20.",
      "5": "Não há teste de substituição do conteúdo entre captura e assinatura em processo comprometido. A conclusão anti-replay tem amostra delimitada; a pretensão de resistência a adulteração local ainda não foi validada."
    },
    "fontes": {
      "1": "evidencias/metodo.md#1",
      "2": "evidencias/metodo.md#2",
      "3": "evidencias/metodo.md#2",
      "4": "evidencias/medicoes.csv",
      "5": "evidencias/revisao_tecnica.md"
    }
  },
  {
    "id": "PRJ08",
    "titulo": "Monitoramento de canais em agências remotas",
    "classificacao": "Evidência insuficiente",
    "justificativa": "A entrega permite verificar preparação e coleta parcial. Não permite distinguir se houve investigação técnica ou apenas integração de sondas, nem auditar a alegação de separação de causas.",
    "limite": "Faltam versão do classificador, causas de referência e decisões por evento. Os registros sintéticos documentam a coleta, mas não o resultado alegado de classificação.",
    "divergenciaDepoimento": "",
    "estados": {
      "1": "INDETERMINADA",
      "2": "INDETERMINADA",
      "3": "ALEGADA, NÃO VERIFICÁVEL",
      "4": "PARCIAL",
      "5": "INSUFICIENTE PARA O NÚCLEO ALEGADO"
    },
    "justificativas": {
      "1": "Há um extrato de catálogo de sondas TCP/HTTP e uma topologia de três pontos. A equipe propôs distinguir enlace, aplicação e equipamento, mas não preservou uma regra de decisão executada.",
      "2": "Plano propõe comparar latência local, disponibilidade do endpoint e heartbeat. Documento de desenho contém tabela de combinações possíveis, sem limiares aprovados nem associação das medições a causas injetadas.",
      "3": "Faltam versão do classificador, causas de referência e decisões por evento. Os registros sintéticos documentam a coleta, mas não o resultado alegado de classificação.",
      "4": "Seis medições de disponibilidade foram recuperadas com timestamps e origem. Nenhuma tem causa controlada ou saída do classificador. Um memorando de demonstração afirma três causas separadas, sem vincular o número a esses seis registros.",
      "5": "Faltam versão do classificador, causas de referência e decisões por evento. Os registros sintéticos documentam a coleta, mas não o resultado alegado de classificação."
    },
    "fontes": {
      "1": "evidencias/metodo.md#1",
      "2": "evidencias/metodo.md#2",
      "3": "evidencias/revisao_tecnica.md",
      "4": "evidencias/medicoes.csv",
      "5": "evidencias/revisao_tecnica.md"
    }
  },
  {
    "id": "PRJ09",
    "titulo": "Gateway adaptativo para versões de API",
    "classificacao": "Não elegível",
    "justificativa": "Os contratos e a configuração evidenciam aplicação de mecanismo existente. Testes de regressão e correção de permissão não introduzem P&D.",
    "limite": "O termo adaptativo no título comercial se refere à escolha de rota por versão. Não há inferência ou técnica nova de adaptação.",
    "divergenciaDepoimento": "",
    "estados": {
      "1": "NÃO DEMONSTRADA",
      "2": "NÃO DEMONSTRADA",
      "3": "NÃO CARACTERIZADA",
      "4": "DOCUMENTADA COMO ACEITE",
      "5": "DOCUMENTADA PARA A CONFIGURAÇÃO"
    },
    "justificativas": {
      "1": "O manual fictício GATE-4 define roteamento por cabeçalho api_version, transformação de campos e validação por contratos. A receita de coexistência é anterior à equipe.",
      "2": "Cadastrar rotas v1/v2 e mapear campo total_centavos para total_decimal dividindo por 100; preservar campos obrigatórios. Ajustar escopo de permissão do conector, sem modificar motor de roteamento.",
      "3": "Os desvios registrados são resolvidos por configuração, mapeamento ou receita existente, sem hipótese técnica desconhecida.",
      "4": "Vinte contratos por versão, 40 ao todo. Uma permissão incorreta na primeira rodada bloqueou dois contratos; todos passaram após correção.",
      "5": "Receita, parâmetros, versões e resultados estão localizados; a existência de documentação não transforma rotina em P&D."
    },
    "fontes": {
      "1": "evidencias/metodo.md#1",
      "2": "evidencias/metodo.md#2",
      "3": "evidencias/metodo.md#2",
      "4": "evidencias/medicoes.csv",
      "5": "evidencias/metodo.md#3"
    }
  },
  {
    "id": "PRJ10",
    "titulo": "Gestão de consentimentos em múltiplos canais",
    "classificacao": "Evidência insuficiente",
    "justificativa": "Há documentação de intenção e eventos parciais, mas não o elo entre transições, versão e resultado. Não é possível concluir P&D nem confirmar que todo o escopo era rotina.",
    "limite": "Faltam versão executada, ordem causal confiável e saídas de estado. O diagrama por si só não prova execução do mecanismo proposto.",
    "divergenciaDepoimento": "",
    "estados": {
      "1": "INDETERMINADA",
      "2": "INDETERMINADA",
      "3": "ALEGADA, NÃO VERIFICÁVEL",
      "4": "PARCIAL",
      "5": "INSUFICIENTE PARA O NÚCLEO ALEGADO"
    },
    "justificativas": {
      "1": "O fluxo de consentimento prevê iniciar no aplicativo e cancelar no portal. Existe diagrama com autorização, revogação e expiração, mas nenhuma tabela de precedência de eventos concorrentes aprovada.",
      "2": "Minuta da máquina de estados lista iniciar→pendente→autorizado e revogar→revogado. Não define empate entre confirmação e revogação, relógio de referência ou política de idempotência.",
      "3": "Faltam versão executada, ordem causal confiável e saídas de estado. O diagrama por si só não prova execução do mecanismo proposto.",
      "4": "Foram entregues oito eventos sintéticos de navegação e o diagrama. Quatro eventos têm um identificador de sessão e quatro não; nenhum contém a decisão de estado retornada pelo serviço. O memorando afirma redução de divergências sem preservar o antes/depois.",
      "5": "Faltam versão executada, ordem causal confiável e saídas de estado. O diagrama por si só não prova execução do mecanismo proposto."
    },
    "fontes": {
      "1": "evidencias/metodo.md#1",
      "2": "evidencias/metodo.md#2",
      "3": "evidencias/revisao_tecnica.md",
      "4": "evidencias/medicoes.csv",
      "5": "evidencias/revisao_tecnica.md"
    }
  },
  {
    "id": "PRJ11",
    "titulo": "Normalização de dados de contas",
    "classificacao": "Não elegível",
    "justificativa": "Transformações determinísticas já definidas, cadastro e aceite estão demonstrados. A automação de um trabalho útil não basta para caracterizar P&D.",
    "limite": "O escopo é conformidade com dicionário aprovado. Nenhum novo método de normalização foi proposto ou testado.",
    "divergenciaDepoimento": "",
    "estados": {
      "1": "NÃO DEMONSTRADA",
      "2": "NÃO DEMONSTRADA",
      "3": "NÃO CARACTERIZADA",
      "4": "DOCUMENTADA COMO ACEITE",
      "5": "DOCUMENTADA PARA A CONFIGURAÇÃO"
    },
    "justificativas": {
      "1": "O dicionário fictício DIC-11/v3 antecede o projeto: tipo CC→corrente, PP→poupança; data ISO; valor ausente permanece nulo; origem desconhecida é rejeitada.",
      "2": "Aplicar mapeamento por origem e validar tipo, domínio e ausência. Não inferir categorias nem estimar valores. Corrigir três cadastros de origem e repetir a mesma carga.",
      "3": "Os desvios registrados são resolvidos por configuração, mapeamento ou receita existente, sem hipótese técnica desconhecida.",
      "4": "Cem registros sintéticos de duas origens; três rejeições por código fora do dicionário na primeira passagem. Após correção cadastral, 100 conformes.",
      "5": "Receita, parâmetros, versões e resultados estão localizados; a existência de documentação não transforma rotina em P&D."
    },
    "fontes": {
      "1": "evidencias/metodo.md#1",
      "2": "evidencias/metodo.md#2",
      "3": "evidencias/metodo.md#2",
      "4": "evidencias/medicoes.csv",
      "5": "evidencias/metodo.md#3"
    }
  },
  {
    "id": "PRJ12",
    "titulo": "Cofre de chaves para integrações externas",
    "classificacao": "Não elegível",
    "justificativa": "Evidências suficientes mostram integração e parametrização da funcionalidade contratada. O problema encontrado é resolvido diretamente pela instrução do manual.",
    "limite": "Não há criação de primitiva criptográfica, protocolo de rotação ou investigação de problema sem solução conhecida.",
    "divergenciaDepoimento": "",
    "estados": {
      "1": "NÃO DEMONSTRADA",
      "2": "NÃO DEMONSTRADA",
      "3": "NÃO CARACTERIZADA",
      "4": "DOCUMENTADA COMO ACEITE",
      "5": "DOCUMENTADA PARA A CONFIGURAÇÃO"
    },
    "justificativas": {
      "1": "O cofre fictício COF-2 permite referência simbólica à versão, chave ativa e anterior, e coexistência durante rotação. O manual recomenda janela maior que o atraso máximo dos conectores.",
      "2": "Configurar referências KEY-SINT-V1/V2, sem conteúdo de chave. Ampliar janela de coexistência de 30 para 120 segundos diante de atraso de 70 segundos no conector. Aplicar receita do fornecedor.",
      "3": "Os desvios registrados são resolvidos por configuração, mapeamento ou receita existente, sem hipótese técnica desconhecida.",
      "4": "Dezoito roteiros de cifração, decifração e rotação em três conectores. Duas falhas com janela curta e 18 aprovações depois do ajuste.",
      "5": "Receita, parâmetros, versões e resultados estão localizados; a existência de documentação não transforma rotina em P&D."
    },
    "fontes": {
      "1": "evidencias/metodo.md#1",
      "2": "evidencias/metodo.md#2",
      "3": "evidencias/metodo.md#2",
      "4": "evidencias/medicoes.csv",
      "5": "evidencias/metodo.md#3"
    }
  },
  {
    "id": "PRJ13",
    "titulo": "Modelo de comportamento transacional",
    "classificacao": "Elegível",
    "justificativa": "A quarentena e a abertura condicionada de faixa são explicitadas e confrontadas com métodos conhecidos. Contagens de legítimas e fraudes separadas demonstram critério e resultado, sem confundir percentual de falso alerta com prevalência de fraude. A entrevista cita 2,8% de falsos alertas; evidencias/medicoes.csv e resultados.csv, PRJ13-S04, mostram 1.116/36.000 (3,1%) em condicionado-v4. Prevalece a agregação documental das legítimas nos quatro perfis, com denominador explícito.",
    "limite": "A documentação permite reconstruir as contagens nos quatro deslocamentos sintéticos. Não se reivindica validade para distribuições externas.",
    "divergenciaDepoimento": "A entrevista cita 2,8% de falsos alertas; evidencias/medicoes.csv e resultados.csv, PRJ13-S04, mostram 1.116/36.000 (3,1%) em condicionado-v4. Prevalece a agregação documental das legítimas nos quatro perfis, com denominador explícito.",
    "estados": {
      "1": "DEMONSTRADA NO RECORTE",
      "2": "DEMONSTRADA NO RECORTE",
      "3": "INVESTIGADA",
      "4": "DOCUMENTADA",
      "5": "DOCUMENTADA NO ESCOPO"
    },
    "justificativas": {
      "1": "Limite fixo, perfil mensal e atualização exponencial contínua são conhecidos. Na sequência estudada, a atualização contínua incorpora eventos ainda não revisados e desloca o perfil em direção a ataques persistentes.",
      "2": "Manter centro e dispersão robustos por segmento. Eventos alertados entram em quarentena; só atualizar o perfil após confirmação de legitimidade. Abrir nova faixa sazonal quando a mudança persiste por três janelas sem aumento de rótulos fraudulentos. Usar faixa de confiança de 2,5 desvios nos segmentos frequentes e 3,0 nos dois segmentos escassos, definidos na preparação. A hipótese é distinguir mudança legítima e contaminação sem perder sensibilidade.",
      "3": "Manter centro e dispersão robustos por segmento. Eventos alertados entram em quarentena; só atualizar o perfil após confirmação de legitimidade. Abrir nova faixa sazonal quando a mudança persiste por três janelas sem aumento de rótulos fraudulentos. Usar faixa de confiança de 2,5 desvios nos segmentos frequentes e 3,0 nos dois segmentos escassos, definidos na preparação. A hipótese é distinguir mudança legítima e contaminação sem perder sensibilidade.",
      "4": "40 mil transações: 36 mil legítimas e quatro mil fraudes, distribuídas igualmente em quatro deslocamentos sazonais. Comparar limite fixo, perfil mensal, atualização contínua e atualização condicionada. Todos usam mesma ordem, rótulos e corte temporal; rótulo só é disponibilizado ao atualizador após atraso de 20 eventos. Critérios prévios: falso alerta ≤ 4% nas legítimas e sensibilidade>90% em cada deslocamento.",
      "5": "A documentação permite reconstruir as contagens nos quatro deslocamentos sintéticos. Não se reivindica validade para distribuições externas."
    },
    "fontes": {
      "1": "evidencias/metodo.md#1",
      "2": "evidencias/metodo.md#2",
      "3": "evidencias/metodo.md#2",
      "4": "evidencias/medicoes.csv",
      "5": "evidencias/revisao_tecnica.md"
    }
  },
  {
    "id": "PRJ14",
    "titulo": "Detecção de novos padrões de golpe",
    "classificacao": "Elegível",
    "justificativa": "Há diferença técnica definida no ciclo de vida de arestas, hipóteses, comparador temporal e resultados por campanha. Método e carga de revisão sustentam o enquadramento no recorte comprovado.",
    "limite": "Capacidade de revisão prevista é 25 alertas adicionais por lote. O experimento cobre 14 campanhas, não todo tipo de golpe.",
    "divergenciaDepoimento": "",
    "estados": {
      "1": "DEMONSTRADA NO RECORTE",
      "2": "DEMONSTRADA NO RECORTE",
      "3": "INVESTIGADA",
      "4": "DOCUMENTADA",
      "5": "DOCUMENTADA NO ESCOPO"
    },
    "justificativas": {
      "1": "Pontuação individual e grafo temporal com expiração fixa foram especificados como comparadores. O primeiro ignora vínculos; o segundo apaga a cadeia quando contas alternam destinos perto do fim da janela.",
      "2": "Representar aresta por evento e predecessores causais. Manter aresta enquanto houver descendente confirmado dentro do horizonte de 15 minutos, com teto absoluto de 45 minutos. Fechar componente ao perder continuidade causal. Pontuar recorrência de caminho e redistribuição de destinos, sem usar nome da conta como rótulo. Testar se esse ciclo de vida recupera campanhas perdidas pela expiração fixa, sem ultrapassar 25 alertas adicionais por lote.",
      "3": "Representar aresta por evento e predecessores causais. Manter aresta enquanto houver descendente confirmado dentro do horizonte de 15 minutos, com teto absoluto de 45 minutos. Fechar componente ao perder continuidade causal. Pontuar recorrência de caminho e redistribuição de destinos, sem usar nome da conta como rótulo. Testar se esse ciclo de vida recupera campanhas perdidas pela expiração fixa, sem ultrapassar 25 alertas adicionais por lote.",
      "4": "14 campanhas em 120 mil eventos normais. Três alternativas na mesma sequência; verdade de referência antes da comparação. Pontuação individual detecta seis campanhas, temporal nove e causal treze. Os 22 alertas adicionais do causal frente ao individual incluem sete verdadeiros de campanhas distintas recuperadas e 15 falsos.",
      "5": "Capacidade de revisão prevista é 25 alertas adicionais por lote. O experimento cobre 14 campanhas, não todo tipo de golpe."
    },
    "fontes": {
      "1": "evidencias/metodo.md#1",
      "2": "evidencias/metodo.md#2",
      "3": "evidencias/metodo.md#2",
      "4": "evidencias/medicoes.csv",
      "5": "evidencias/revisao_tecnica.md"
    }
  },
  {
    "id": "PRJ15",
    "titulo": "Explicação de alertas para revisão humana",
    "classificacao": "Elegível",
    "justificativa": "A hipótese sobre snapshot e dependência está operacionalizada e o defeito é verificável em dois casos. Os registros de leitura, versões e replay sustentam sistematicidade e transferência. A entrevista atribui 78/80 rastros fiéis ao encerramento; evidencias/medicoes.csv e resultados.csv registram 78/80 em rastro-v1 (PRJ15-S01) e 80/80 em rastro-v2 (PRJ15-S02). Prevalece o resultado documental da versão final rastro-v2; 78/80 pertence à versão anterior.",
    "limite": "O resultado mede fidelidade ao cálculo e tempo de revisão, não qualidade do juízo de crédito ou consenso entre analistas reais.",
    "divergenciaDepoimento": "A entrevista atribui 78/80 rastros fiéis ao encerramento; evidencias/medicoes.csv e resultados.csv registram 78/80 em rastro-v1 (PRJ15-S01) e 80/80 em rastro-v2 (PRJ15-S02). Prevalece o resultado documental da versão final rastro-v2; 78/80 pertence à versão anterior.",
    "estados": {
      "1": "DEMONSTRADA NO RECORTE",
      "2": "DEMONSTRADA NO RECORTE",
      "3": "INVESTIGADA",
      "4": "DOCUMENTADA",
      "5": "DOCUMENTADA NO ESCOPO"
    },
    "justificativas": {
      "1": "Texto padrão e lista dos maiores fatores explicavam valores presentes ao final da análise, que podiam diferir dos usados na decisão após enriquecimento tardio.",
      "2": "Capturar snapshot de versão e fatos efetivamente consumidos em cada regra. Construir explicação apenas das dependências que contribuíram ao caminho escolhido, com referência ao snapshot, nunca ao cadastro mais recente. Ao reavaliar, abrir nova trilha com parent_id da anterior. Confrontar cada explicação com replay da mesma versão do motor.",
      "3": "Capturar snapshot de versão e fatos efetivamente consumidos em cada regra. Construir explicação apenas das dependências que contribuíram ao caminho escolhido, com referência ao snapshot, nunca ao cadastro mais recente. Ao reavaliar, abrir nova trilha com parent_id da anterior. Confrontar cada explicação com replay da mesma versão do motor.",
      "4": "80 alertas; versões rastro-v1 e rastro-v2 confrontadas com replay. Dois enriquecimentos tardios divergiram em rastro-v1; em rastro-v2 os 80 correspondem. Vinte analistas sintéticos A01–A20: cada um lê quatro alertas por método; permutação de ordem contrabalançada consta na configuração e nos registros de leitura. Medianas de 80 tempos por método: 6,4 e 4,1 minutos.",
      "5": "O resultado mede fidelidade ao cálculo e tempo de revisão, não qualidade do juízo de crédito ou consenso entre analistas reais."
    },
    "fontes": {
      "1": "evidencias/metodo.md#1",
      "2": "evidencias/metodo.md#2",
      "3": "evidencias/metodo.md#2",
      "4": "evidencias/medicoes.csv",
      "5": "evidencias/revisao_tecnica.md"
    }
  },
  {
    "id": "PRJ16",
    "titulo": "Simulador de ataques ao fluxo de pagamento",
    "classificacao": "Elegível",
    "justificativa": "A técnica de liberação causal e desempate é documentada nas próprias evidências. Comparadores e repetições distinguem investigação de mera execução de testes.",
    "limite": "O pacote contém grafo de exemplo, regra de ordenação, configuração e registros por cenário. Não inclui ambiente de integração; a transferência é da especificação e dos resultados sintéticos.",
    "divergenciaDepoimento": "",
    "estados": {
      "1": "DEMONSTRADA NO RECORTE",
      "2": "DEMONSTRADA NO RECORTE",
      "3": "INVESTIGADA",
      "4": "DOCUMENTADA",
      "5": "DOCUMENTADA NO ESCOPO"
    },
    "justificativas": {
      "1": "Roteiro manual e replay por tempo de captura reproduzem requisições, mas podem inverter precedência quando a troca de dispositivo altera o atraso de processamento.",
      "2": "Grafo acíclico com eventos e dependências; fila de prontos ordenada por (tempo lógico, sequência da origem, ID do evento). Um relógio virtual de injeção controla atrasos, sem substituir o relógio interno do serviço. Só liberar evento depois dos predecessores confirmados. Empates são resolvidos por sequência/ID, correção documentada em causal-v3.",
      "3": "Grafo acíclico com eventos e dependências; fila de prontos ordenada por (tempo lógico, sequência da origem, ID do evento). Um relógio virtual de injeção controla atrasos, sem substituir o relógio interno do serviço. Só liberar evento depois dos predecessores confirmados. Empates são resolvidos por sequência/ID, correção documentada em causal-v3.",
      "4": "32 ataques com cinco repetições cada, total 160. Manual, replay e gerador causal com mesma matriz de entrada. Critério: ordem parcial válida e estado terminal equivalente. Duas falhas intermitentes são identificadas por cenário e reproduzidas nas cinco repetições; não significam duas falhas em cada execução.",
      "5": "O pacote contém grafo de exemplo, regra de ordenação, configuração e registros por cenário. Não inclui ambiente de integração; a transferência é da especificação e dos resultados sintéticos."
    },
    "fontes": {
      "1": "evidencias/metodo.md#1",
      "2": "evidencias/metodo.md#2",
      "3": "evidencias/metodo.md#2",
      "4": "evidencias/medicoes.csv",
      "5": "evidencias/revisao_tecnica.md"
    }
  },
  {
    "id": "PRJ17",
    "titulo": "Simulação de políticas de crédito",
    "classificacao": "Evidência insuficiente",
    "justificativa": "A documentação é insuficiente para distinguir comparação rotineira de políticas de uma investigação nova. A lacuna afeta o próprio objeto e resultado, não apenas a amplitude de validação.",
    "limite": "Sem regras e saídas não se avalia diferença técnica ou o número alegado. Os arquivos de entrada existentes não completam a cadeia.",
    "divergenciaDepoimento": "",
    "estados": {
      "1": "INDETERMINADA",
      "2": "INDETERMINADA",
      "3": "ALEGADA, NÃO VERIFICÁVEL",
      "4": "PARCIAL",
      "5": "INSUFICIENTE PARA O NÚCLEO ALEGADO"
    },
    "justificativas": {
      "1": "O plano contrapõe política vigente e política candidata, mas as regras são identificadas apenas como antiga/nova. Não há tabelas de limiares nem versão assinada para nenhuma.",
      "2": "Diagrama propõe duplicar uma proposta, executar duas políticas sem emitir contrato e comparar aprovação. Não define se o motor foi alterado ou se eram parâmetros do simulador comercial.",
      "3": "Sem regras e saídas não se avalia diferença técnica ou o número alegado. Os arquivos de entrada existentes não completam a cadeia.",
      "4": "Há seis propostas sintéticas com renda e comprometimento e um memorando de demonstração que afirma impacto diferente. Não há decisões pareadas nem versão das políticas; as seis propostas não têm vínculo com a demonstração.",
      "5": "Sem regras e saídas não se avalia diferença técnica ou o número alegado. Os arquivos de entrada existentes não completam a cadeia."
    },
    "fontes": {
      "1": "evidencias/metodo.md#1",
      "2": "evidencias/metodo.md#2",
      "3": "evidencias/revisao_tecnica.md",
      "4": "evidencias/medicoes.csv",
      "5": "evidencias/revisao_tecnica.md"
    }
  },
  {
    "id": "PRJ18",
    "titulo": "Motor de regras auditável",
    "classificacao": "Com ressalvas",
    "justificativa": "Há P&D demonstrado pela hipótese de registro por mudança e comparação. Com ressalvas porque uma limitação técnica conhecida impede estender a afirmação de auditabilidade a todas as decisões. Falhar no objetivo não elimina o caráter de pesquisa. A entrevista afirma que todas as decisões foram explicadas pela trilha seletiva; evidencias/medicoes.csv e resultados.csv, PRJ18-S03, registram 96% em seletivo-v3. Prevalece o registro dessa versão; a cobertura incompleta é coerente com a pendência de callback tardio.",
    "limite": "O tratamento de callback tardio segue aberto; o protótipo não satisfaz a exigência de explicação integral. A cronologia identifica as versões e o critério da rodada.",
    "divergenciaDepoimento": "A entrevista afirma que todas as decisões foram explicadas pela trilha seletiva; evidencias/medicoes.csv e resultados.csv, PRJ18-S03, registram 96% em seletivo-v3. Prevalece o registro dessa versão; a cobertura incompleta é coerente com a pendência de callback tardio.",
    "estados": {
      "1": "DEMONSTRADA NO RECORTE",
      "2": "DEMONSTRADA NO RECORTE",
      "3": "INVESTIGADA",
      "4": "DOCUMENTADA",
      "5": "DOCUMENTADA COM LIMITE"
    },
    "justificativas": {
      "1": "Log integral preserva fatos mas amplia latência; amostragem periódica perde mudanças de estado entre pontos. Ambos foram comparados na mesma carga, com o mesmo motor e regra de explicação.",
      "2": "Emitir registro quando muda o estado lógico de regra, incluindo snapshot de fatos e ponteiro para predecessor; coalescer leituras sem mudança. A hipótese é conservar dependências decisórias com menos escrita. A versão seletiva ainda perde o predecessor quando um callback tardio chega após a coalescência.",
      "3": "Emitir registro quando muda o estado lógico de regra, incluindo snapshot de fatos e ponteiro para predecessor; coalescer leituras sem mudança. A hipótese é conservar dependências decisórias com menos escrita. A versão seletiva ainda perde o predecessor quando um callback tardio chega após a coalescência.",
      "4": "50 mil decisões, quatro perfis. Log integral explica 100% com acréscimo de 24% na latência média; amostragem explica 82% com 3%; seletivo explica 96% com 7%. Critério prévio pretendia explicação de 100% e aumento de latência ≤ 10%. Os 2.000 casos sem trilha completa permanecem identificados por perfil.",
      "5": "O tratamento de callback tardio segue aberto; o protótipo não satisfaz a exigência de explicação integral. A cronologia identifica as versões e o critério da rodada."
    },
    "fontes": {
      "1": "evidencias/metodo.md#1",
      "2": "evidencias/metodo.md#2",
      "3": "evidencias/metodo.md#2",
      "4": "evidencias/medicoes.csv",
      "5": "evidencias/revisao_tecnica.md"
    }
  },
  {
    "id": "PRJ19",
    "titulo": "Leitura de documentos de produtores",
    "classificacao": "Não elegível",
    "justificativa": "Os registros sustentam implementação de recurso comercial já disponível. O uso de OCR e a complexidade dos documentos não mudam a natureza rotineira do projeto.",
    "limite": "As verificações são de aceite do produto e de sua fila de exceções. Não demonstram desenvolvimento de outro método de leitura.",
    "divergenciaDepoimento": "",
    "estados": {
      "1": "NÃO DEMONSTRADA",
      "2": "NÃO DEMONSTRADA",
      "3": "NÃO CARACTERIZADA",
      "4": "DOCUMENTADA COMO ACEITE",
      "5": "DOCUMENTADA PARA A CONFIGURAÇÃO"
    },
    "justificativas": {
      "1": "O produto fictício OCR-5 já oferece correção de inclinação, extração de campos e fila humana abaixo do limiar de confiança. O manual define uso desse limiar.",
      "2": "Aplicar OCR contratado, mapear campos previstos e fixar limiar 0,85. Imagens cortadas ou abaixo desse valor vão à revisão humana. Não treinar modelo nem alterar pré-processador.",
      "3": "Os desvios registrados são resolvidos por configuração, mapeamento ou receita existente, sem hipótese técnica desconhecida.",
      "4": "Trinta imagens sintéticas: 20 legíveis, cinco com corte e cinco com sombra forte. Extrair campos das 20 legíveis e enviar as dez restantes à fila.",
      "5": "Receita, parâmetros, versões e resultados estão localizados; a existência de documentação não transforma rotina em P&D."
    },
    "fontes": {
      "1": "evidencias/metodo.md#1",
      "2": "evidencias/metodo.md#2",
      "3": "evidencias/metodo.md#2",
      "4": "evidencias/medicoes.csv",
      "5": "evidencias/metodo.md#3"
    }
  },
  {
    "id": "PRJ20",
    "titulo": "Coexistência entre motor antigo e novo",
    "classificacao": "Não elegível",
    "justificativa": "O escopo e as evidências demonstram uso integral de modo sombra conhecido, sem contribuição investigativa adicional. Diferenças de decisão são diferenças de política, não falha científica a resolver.",
    "limite": "Resultados não demonstram avanço tecnológico. Executar novamente pode ampliar confiança operacional, mas não transforma a configuração documentada em pesquisa.",
    "divergenciaDepoimento": "",
    "estados": {
      "1": "NÃO DEMONSTRADA",
      "2": "NÃO DEMONSTRADA",
      "3": "NÃO CARACTERIZADA",
      "4": "DOCUMENTADA COMO ACEITE",
      "5": "DOCUMENTADA PARA A CONFIGURAÇÃO"
    },
    "justificativas": {
      "1": "A plataforma fictícia SIM-4 oferece modo sombra, duplicação da solicitação, supressão de efeitos e comparação de saídas. O manual anterior prevê especificamente que apenas o motor principal emita contratos.",
      "2": "Ativar shadow=true, write_side_effects=false e comparar campos decisao e motivo. Selecionar divergências para revisão de negócio. As regras e o mecanismo de isolamento foram fornecidos pela plataforma; não houve alteração do comparador ou hipótese sobre mecanismo novo.",
      "3": "Os desvios registrados são resolvidos por configuração, mapeamento ou receita existente, sem hipótese técnica desconhecida.",
      "4": "18 mil propostas idênticas enviadas aos dois motores. 430 divergências correspondem às diferenças de política cadastradas; zero contratos emitidos pelo motor sombra. O roteiro verifica configuração e equivalência de entradas.",
      "5": "Receita, parâmetros, versões e resultados estão localizados; a existência de documentação não transforma rotina em P&D."
    },
    "fontes": {
      "1": "evidencias/metodo.md#1",
      "2": "evidencias/metodo.md#2",
      "3": "evidencias/metodo.md#2",
      "4": "evidencias/medicoes.csv",
      "5": "evidencias/metodo.md#3"
    }
  }
];
