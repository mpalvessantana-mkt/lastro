# LASTRO — Sistema de Apoio à Decisão para Elegibilidade da Lei do Bem

> **v3 — reescrito após a leitura integral de um pacote de projeto e o alinhamento com Luciano (BNB).**
> Arquivo de contexto do agente. No Antigravity, renomeie para `AGENTS.md` ou `GEMINI.md` se o IDE exigir.
> Leia o arquivo inteiro antes da primeira linha de código. A seção 2 é inviolável, a 5 é o coração do produto e a 6 é a estrutura real dos arquivos de entrada.

---

## 0. TL;DR para o agente

O analista sobe a pasta de um projeto. A ferramenta lê os 14 arquivos, extrai as evidências, confere a aritmética, detecta divergências entre fontes e **gera um parecer completo e fundamentado** — classificação proposta, os cinco critérios com seus estados, o porquê de cada ponto, as citações por ID e os dispositivos normativos. O analista revisa ponto a ponto, ajusta o que discordar e homologa. O documento homologado é congelado e arquivado.

**O propósito desse documento, nas palavras do demandante:** servir de base para que o banco consiga explicar, anos depois, por que decidiu daquele jeito, quando for cobrado.

A ferramenta **propõe**; o analista **decide**; o sistema **registra os dois**.

Hackathon STS 2026 · Desafio Banco do Nordeste (Hubine) + SEBRAE · MVP em 3 dias.

---

## 1. Identidade

| | |
|---|---|
| **Nome** | LASTRO |
| **Assinatura** | *Toda decisão com lastro.* |
| **Categoria** | Sistema de apoio à decisão — não é "IA que aprova projeto" |
| **Usuário** | Analista de P&D/Inovação do BNB, sem formação jurídica profunda |
| **Entregável** | Parecer técnico rastreável, congelado, com valor de peça de defesa |

**Módulos — use estes nomes em rotas, componentes e no pitch:**

| Módulo | Função | Rota |
|---|---|---|
| **Acervo** | Upload do pacote, parsing e indexação por ID | `/casos/novo` |
| **Leitura** | Extração determinística + conferência aritmética + detecção de divergência | (processo, sem rota) |
| **Parecer** | O parecer proposto, ponto a ponto, para revisão do analista | `/casos/[id]/parecer` |
| **Confronto** | Divergências entre depoimento e registro | `/casos/[id]/confronto` |
| **Precedentes** | Os 20 históricos como referência consultável | `/referencia` |
| **Rastro** | Trilha de auditoria imutável | `/auditoria` |

---

## 2. Regras invioláveis

1. **A ferramenta propõe, nunca decide.** Todo parecer nasce com `situacao: 'PROPOSTO'`. Só vira `HOMOLOGADO` por ação de um humano identificado. Nenhum documento sai do sistema sem assinatura humana.
2. **Todo ponto do parecer tem um porquê.** Cada estado de critério carrega obrigatoriamente: a justificativa em texto, as citações que a sustentam (por ID) e o dispositivo normativo aplicado. Ponto sem porquê não é renderizado — é renderizado como lacuna.
3. **Nada entra no parecer sem citação.** Toda afirmação carrega ao menos um ID do pacote (`PRJxx-EVnn`, `PRJxx-ATVnn`, `PRJxx-Snn`) ou uma âncora de seção (`metodo.md#2`). Sem isso, o estado fica indeterminado e a lacuna aparece explícita.
4. **A IA jamais cita lei de memória.** Referência normativa só por `normaId` existente na coleção `normas`. Dispositivo inventado ⇒ resposta descartada inteira.
5. **Nunca classificar por semelhança.** É proibido decidir a classe de um caso novo por parecença com um histórico. Os históricos calibram a régua e servem de precedente consultável — nunca entram no cálculo. Ver §9.
6. **Divergência não se resolve sozinha.** Fontes em conflito: registram-se as duas, aponta-se qual prevalece e **por quê**. A perdedora nunca some do documento.
7. **Não elegível ≠ Evidência insuficiente.** A primeira exige base para conclusão negativa; a segunda admite base incompleta. O sistema jamais converte uma na outra para fechar o caso.
8. **Parecer homologado é imutável.** Correção gera nova versão apontando a anterior. Security rules proíbem `update` e `delete`.
9. **Registrar evidência contrária é obrigatório.** Um parecer só com evidência favorável é um parecer fraco e o Guia exige o contrário.
10. **Resultado desfavorável pode ser P&D; aceite perfeito pode ser rotina.** Nenhuma heurística penaliza falha nem premia sucesso.
11. **Sem integração com sistemas do banco.** Só os arquivos entregues.

---

## 3. Stack

```
Next.js 15 (App Router) + TypeScript (strict)
Tailwind CSS + shadcn/ui + lucide-react
Firebase Auth (email/senha + custom claims de papel)
Cloud Firestore · Firebase Storage · Firebase App Hosting
Firebase AI Logic (Gemini 2.5 Flash, structured output) — autorizado pelo evento
pdfjs-dist · papaparse · xlsx · jszip
@react-pdf/renderer (parecer em PDF no cliente)
zod (validação de toda saída de IA e de formulário)
```

- **Tudo no cliente.** Parsing, motor e geração de PDF. Sem Cloud Functions no MVP.
- **`src/motor/` é TypeScript puro** — sem React, sem Firebase. Roda em teste unitário contra os 20 históricos.
- **Flag `MODO_SEM_REDE`.** O Guia autoriza LLM externo sobre esta massa fictícia, mas se a rede do evento cair o motor determinístico sustenta a demo inteira. Resiliência de palco.
- Não use Server Actions para o motor.

---

## 4. O fluxo — e a inversão que define o produto

```
┌──────────────┐   ┌───────────┐   ┌──────────────────┐   ┌─────────────┐   ┌───────────┐
│ 1. UPLOAD    │ → │ 2.LEITURA │ → │ 3. PARECER       │ → │ 4. REVISÃO  │ → │ 5. ARQUIVO│
│ pasta ou zip │   │ automática│   │ PROPOSTO         │   │ do analista │   │ congelado │
└──────────────┘   └───────────┘   └──────────────────┘   └─────────────┘   └───────────┘
                     máquina            máquina              HUMANO           imutável
```

**1 · Upload.** Arrastar a pasta `PRJxx` inteira (`webkitdirectory`) **ou** um `.zip` — os dois caminhos funcionam. Validação: os 14 arquivos esperados estão presentes? O que faltar vira lacuna declarada, não erro.

**2 · Leitura automática.** Parsing determinístico (§6), indexação por ID nativo, conferência aritmética de `resultados.csv` contra `medicoes.csv`, comparação cruzada dos campos espelhados (§7) e sugestão de estado para os cinco critérios (§8).

**3 · Parecer proposto.** A ferramenta entrega o parecer **inteiro**: classe proposta, os cinco estados, o porquê de cada um, citações por ID, normas aplicadas, divergências detectadas e lacunas. Tudo marcado visualmente como **PROPOSTA**.

**4 · Revisão do analista.** Cada um dos cinco pontos tem três ações: **Concordo** · **Ajustar** · **Discordo**. Há um atalho **Aceitar todos**, e o sistema registra a diferença entre aceite individual e aceite em bloco. Mudar um estado recompõe a classe na hora, ao vivo. Divergir da proposta exige motivo escrito.

**5 · Arquivo.** O revisor homologa: snapshot congelado, hash do conteúdo, hash do pacote, versão do corpus normativo, PDF gerado. O documento passa a ser consultável para sempre e nunca mais muda.

### 4.1 Como isso não quebra a regra de ouro
A ferramenta nunca grava uma decisão; grava uma **proposta**. O parecer final registra três coisas lado a lado: **o que a ferramenta propôs**, **o que o analista manteve ou mudou** e **o motivo de cada mudança**. Isso é uma defesa mais forte do que um formulário preenchido à mão, porque demonstra juízo humano exercido sobre uma análise fundamentada — e documenta onde o humano discordou da máquina.

---

## 5. O núcleo: a matriz de estados

> Derivada da leitura integral de `historicos_classificados.csv` (PRJ01–PRJ20). Reproduz **as 20 classificações de referência sem exceção.**

### 5.1 Os cinco critérios têm estados nomeados — não "sim/não"

| # | Critério | Estados possíveis |
|---|---|---|
| 1 | Novidade | `DEMONSTRADA NO RECORTE` · `NÃO DEMONSTRADA` · `INDETERMINADA` |
| 2 | Criatividade técnica | `DEMONSTRADA NO RECORTE` · `NÃO DEMONSTRADA` · `INDETERMINADA` |
| 3 | Incerteza tecnológica | `INVESTIGADA` · `NÃO CARACTERIZADA` · `ALEGADA, NÃO VERIFICÁVEL` |
| 4 | Sistematicidade | `DOCUMENTADA` · `DOCUMENTADA COMO ACEITE` · `PARCIAL` |
| 5 | Transferência/reprodução | `DOCUMENTADA NO ESCOPO` · `DOCUMENTADA COM LIMITE` · `DOCUMENTADA PARA A CONFIGURAÇÃO` · `INSUFICIENTE PARA O NÚCLEO ALEGADO` |

### 5.2 A matriz canônica

| Critério | **Elegível** | **Com ressalvas** | **Não elegível** | **Evidência insuficiente** |
|---|---|---|---|---|
| 1 Novidade | DEMONSTRADA NO RECORTE | DEMONSTRADA NO RECORTE | NÃO DEMONSTRADA | INDETERMINADA |
| 2 Criatividade | DEMONSTRADA NO RECORTE | DEMONSTRADA NO RECORTE | NÃO DEMONSTRADA | INDETERMINADA |
| 3 Incerteza | INVESTIGADA | INVESTIGADA | NÃO CARACTERIZADA | ALEGADA, NÃO VERIFICÁVEL |
| 4 Sistematicidade | DOCUMENTADA | DOCUMENTADA | DOCUMENTADA COMO ACEITE | PARCIAL |
| 5 Transferência | DOCUMENTADA NO ESCOPO | **DOCUMENTADA COM LIMITE** | DOCUMENTADA PARA A CONFIGURAÇÃO | INSUFICIENTE PARA O NÚCLEO ALEGADO |

Distribuição dos históricos: 6 Elegível (PRJ02, 03, 13, 14, 15, 16) · 4 Com ressalvas (PRJ05, 06, 07, 18) · 7 Não elegível (PRJ01, 04, 09, 11, 12, 19, 20) · 3 Evidência insuficiente (PRJ08, 10, 17).

**O critério 5 é o único discriminador entre Elegível e Com ressalvas.** Todo o resto é idêntico. "Com ressalvas" é P&D provado cuja *conclusão* tem alcance limitado — o PRJ18 falhou no objetivo (96% quando queria 100%) e continua sendo P&D.

**Não elegível e Evidência insuficiente se separam nos critérios 3 e 4.** "Não caracterizada + documentada como aceite" = há base para negar. "Alegada não verificável + parcial" = não há base para concluir nada.

### 5.3 Composição da classe (`motor/classificacao.ts`)

```
1. Algum critério em estado de INDETERMINAÇÃO
   (INDETERMINADA | ALEGADA, NÃO VERIFICÁVEL | PARCIAL | INSUFICIENTE PARA O NÚCLEO ALEGADO)
   → sinal "núcleo não verificável"

2. Algum critério em estado NEGATIVO
   (NÃO DEMONSTRADA | NÃO CARACTERIZADA | DOCUMENTADA COMO ACEITE | DOCUMENTADA PARA A CONFIGURAÇÃO)
   → sinal "mecanismo conhecido"

3. Os dois sinais coexistem → NÃO CLASSIFICAR. Apresentar as duas leituras ao analista
   com os critérios que sustentam cada uma. O sistema admite o caso-limite em voz alta.
4. Só sinal 1 → Evidência insuficiente. Exigir ELO AUSENTE + evidências a solicitar.
5. Só sinal 2 → Não elegível. Exigir o MECANISMO DOCUMENTADO que já resolvia o problema.
6. Nenhum sinal e critério 5 = DOCUMENTADA COM LIMITE → Com ressalvas.
   Exigir RECORTE SUSTENTADO + LIMITAÇÃO + EVIDÊNCIA NECESSÁRIA.
7. Nenhum sinal e critério 5 = DOCUMENTADA NO ESCOPO → Elegível.
8. Algum critério sem estado → classe não é calculada. Só progresso.
```

### 5.4 Validação
`npm run validar` roda o motor sobre os estados de PRJ01–PRJ20 e confere as 20 classes. **Precisa dar 20/20.** Número verdadeiro, conferível ao vivo — e não é "acurácia de IA", é prova de que a regra está correta.

---

## 6. Estrutura real dos arquivos de entrada

> Confirmada pela leitura integral do pacote PRJ01. **Tudo é rigidamente estruturado.** A extração é determinística; a IA entra só para enriquecer. Isso derruba o risco da demo.

### 6.1 Os 14 arquivos

| Tipo | Arquivo | Estrutura |
|---|---|---|
| Dossiê | `dossie_projeto.pdf` | 6 blocos fixos (§6.2) |
| Registro técnico | `registro_tecnico.pdf` | síntese derivada |
| Atividades | `atividades.xlsx` | **cabeçalho na linha 5** |
| Atividades CSV | `atividades.csv` | 8 linhas, 8 fases canônicas |
| Inventário | `inventario_evidencias.csv` | 14 linhas; **declara a força probatória** |
| Configuração | `evidencias/configuracao.json` | parâmetros, ensaios e **os dicionários** |
| Método | `evidencias/metodo.md` | **7 seções fixas** (§6.2) |
| Cronologia | `evidencias/cronologia.csv` | datas, versões, `fonte` com âncora |
| Medições | `evidencias/medicoes.csv` | **registros primários** |
| Resultados | `evidencias/resultados.csv` | **derivado** de medições |
| Entrevista | `transcricao_entrevista_tecnica.pdf` | **7 perguntas fixas** (§6.2) |
| Entradas | `evidencias/entradas.csv` | `conteudo_json` — **JSON dentro de string** |
| Observações | `evidencias/observacoes.csv` | recortes identificados |
| Revisão técnica | `evidencias/revisao_tecnica.md` | 5 seções fixas (§6.2) |

CSVs: UTF-8 **com BOM**, separador `;`, decimal `.`. Vazio nunca é zero.

### 6.2 As seções fixas — a espinha do parser

**`metodo.md` — 7 seções:**
```
1. Referência anterior              → critério 1 NOVIDADE
2. Mecanismo e hipótese             → critérios 2 CRIATIVIDADE e 3 INCERTEZA
3. Protocolo e critérios            → critério 4 SISTEMATICIDADE
4. Parâmetros, versões e execução registrada
5. Leitura e reconstrução dos resultados
6. Limite da conclusão              → critério 5 TRANSFERÊNCIA  ★ o discriminador
7. Continuidade e detalhamento técnico
```

**`transcricao_entrevista_tecnica.pdf` — 7 perguntas numeradas:**
```
1. Que alternativas ou recursos já existiam?   → critério 1
2. Que ponto ficou para continuidade?          → critério 5
3. Qual ocorrência você recorda?               → memória — fonte típica de divergência
4. Qual situação motivou o trabalho?           → contexto
5. Como foi organizada a verificação?          → critério 4
6. O que a equipe fez no mecanismo?            → critérios 2 e 3
7. Como ficou a conclusão da rodada?           → critério 5
+ "Condição do registro": declara ser depoimento de memória
```
> O próprio documento manda confrontar: *"Depoimento de memória. Confrontar com versões, critérios, resultados e fontes entregues."*

**`dossie_projeto.pdf` — 6 blocos:** Contexto · Pergunta registrada · Referência anterior · Trabalho documentado · Limite da conclusão · Localização da prova.
> O dossiê avisa: *"A entrevista é um depoimento e pode divergir dos registros."*

**`revisao_tecnica.md` — 5 seções:** Material recebido · Verificação de resultados · Limites e pendências técnicas · Próxima ação da equipe · Declaração da equipe.

**As 8 fases canônicas de `atividades.csv`:**
| Ciclo | Fase | Alimenta |
|---|---|---|
| C1 | Caracterização do problema | contexto |
| C1 | **Confronto com referência anterior** | **critério 1** |
| C1 | **Especificação do mecanismo** | **critérios 2 e 3** |
| C2 | **Preparação dos cenários** | **critério 4** |
| C2 | **Registro de medições** | **critério 4** |
| C3 | Análise de ocorrências | verificação |
| C3 | Conferência dos resultados | verificação |
| C4 | **Consolidação técnica** | **critério 5** |

### 6.3 O `configuracao.json` carrega o próprio dicionário
Traz `dicionario_medicoes`, `dicionario_resultados`, `operacoes_resultados`, o índice completo de `ensaios[]`, os `parametros` e as `versoes_registradas`. **O parser lê as regras de leitura do próprio pacote** em vez de hardcodá-las. Se o formato mudar, o parser acompanha. Hardcode só como fallback.

### 6.4 O inventário declara a força probatória
A coluna `observacao` de `inventario_evidencias.csv` já classifica cada evidência:

| `observacao` | Força |
|---|---|
| `registro primário sintético` (medições) | **PRIMARIA** |
| `especificação` (método, configuração) | **PRIMARIA** |
| `recortes sintéticos` (entradas, observações) | **PRIMARIA, amostral** |
| `calculado ou transcrito de EV08` (resultados) | **DERIVADA** |
| `síntese` / `síntese derivada` (dossiê, registro técnico) | **DERIVADA** |
| `derivado de EV03` (atividades CSV) | **DERIVADA** |
| `depoimento` (entrevista) | **DECLARATORIA** |
| `revisão` / `registro de versões` / `índice` | contexto |

> **Derive a força probatória desta coluna, não de uma tabela nossa.** Assim a hierarquia de prova é declarada pelo próprio pacote — muito mais defensável diante da banca.

### 6.5 Distratores — neutralizar explicitamente na UI
| Distrator | Por quê | Comportamento |
|---|---|---|
| `status = Localizada` | **560 de 560** evidências têm esse valor | Exibir "arquivo presente", nunca "comprovado" |
| `natureza_informada_pela_equipe` | distribuição idêntica nos 40 projetos (3 Análise · 2 Teste · 2 Documentação · 1 Desenvolvimento) | Rotular **autodeclaração da equipe**, excluir de qualquer cálculo |
| `natureza = entrega` em resultados | conta material disponibilizado, não desempenho | Badge distinta; nunca somar com desempenho; `taxa_percentual` vem vazia por construção |

### 6.6 Aritmética
- `base_de_calculo` **só é divisor em `contagem`**. Em `diferenca_maior_menor` é a quantidade comparada; em `percentil_95` é a soma das frequências; em `indicador_precalculado` é 1.
- `taxa_percentual` vazia **nunca** é zero. `resultado_ou_saida` vazio não indica trabalho inexistente.
- Somar só linhas do **mesmo `ensaio_id`**. Ensaios podem compartilhar população.
- `fonte` vem como `arquivo#identificador` — o que vem após `#` é ensaio ou seção, não outro arquivo.
- Percentual de falhas e de acertos têm leitura oposta.

Conferência verificada no PRJ01: `medicoes` S01 → numerador 8, denominador 12; `resultados` S01 → valor 8, base 12, taxa 66,666667. **Bate.** O motor recalcula 100% das linhas e marca `conferido`. Divergência de recálculo é achado de primeira ordem.

---

## 7. Mapa de redundância — o detector de divergência

> O mesmo conteúdo aparece em até cinco arquivos, **de propósito**. Onde as cópias batem, não há divergência; onde diferem, há. A comparação é **literal normalizada**, não semântica — exata e barata.

| Campo lógico | Fontes onde aparece | Critério |
|---|---|---|
| `problema_motivador` | dossiê:Contexto · ATV01 · entrevista:Q4 | contexto |
| `pergunta_registrada` | dossiê:Pergunta registrada · ATV01.saída | contexto |
| `referencia_anterior` | metodo§1 · dossiê:Referência anterior · ATV02 · entrevista:Q1 | **1** |
| `mecanismo_hipotese` | metodo§2 · configuracao.parametros · ATV03 · entrevista:Q6 | **2 e 3** |
| `protocolo_escopo` | metodo§3 · configuracao.escopo · ATV04 · dossiê:Trabalho documentado · entrevista:Q5 | **4** |
| `ocorrencia_observada` | observacoes.csv · ATV06 · entrevista:Q3 | verificação |
| `resultados` | medicoes.csv · resultados.csv · configuracao.ensaios · ATV07 | **4** |
| `limite_conclusao` | metodo§6 · dossiê:Limite da conclusão · ATV08 · revisao:Limites · entrevista:Q2 e Q7 | **5** |
| `proxima_acao` | metodo§7 · revisao:Próxima ação · entrevista:Q2 | — |
| `versoes` | cronologia.csv · configuracao.versoes_registradas · metodo§4 | — |

### 7.1 Algoritmo
1. Para cada campo lógico, coletar todas as cópias presentes.
2. Normalizar (minúsculas, espaços, pontuação, numerais por extenso → dígitos).
3. Comparar. Diferença ⇒ criar um `Confronto`.
4. Toda afirmação numérica da entrevista e do dossiê é cruzada com `medicoes.csv`/`resultados.csv`: valor, versão e denominador.
5. A proposta de prevalência segue a força probatória do inventário (§6.4). **O analista resolve; o sistema nunca fecha sozinho.**

### 7.2 Formato obrigatório do registro
Padrão literal do Guia do Participante:
> "A entrevista afirma **X**; o registro **Y** (arquivo, ensaio ou ID) mostra **Z**; prevalece o registro, por ser primário e identificado por versão."

Referência de qualidade, extraída do PRJ13:
> "A entrevista cita 2,8% de falsos alertas; `evidencias/medicoes.csv` e `resultados.csv`, ensaio PRJ13-S04, mostram 1.116/36.000 (3,1%) em condicionado-v4. Prevalece a agregação documental das legítimas nos quatro perfis, com denominador explícito."

O que torna esse texto forte: cita ensaio, versão, numerador, denominador e **explica por que prevalece**.

Seis dos vinte históricos têm divergência (PRJ02, 05, 07, 13, 15, 18) e em todos prevalece o registro primário. **A divergência aparece em Elegível e em Com ressalvas — ela não penaliza o projeto, ela qualifica a análise.**

---

## 8. Motor

```
src/motor/
  index.ts            → analisar(pacote, corpus, { iaDisponivel }) → ParecerProposto
  parsers/            → pasta.ts · zip.ts · pdf.ts · csv.ts · xlsx.ts · json.ts
  secoes.ts           → fatiador das 7/7/6/5 seções fixas (§6.2)
  aritmetica.ts       → recálculo de resultados a partir de medições (§6.6)
  redundancia.ts      → mapa de campos espelhados + detector (§7)
  estados.ts          → sugestão de estado por critério (§8.1)
  classificacao.ts    → composição da classe (§5.3)
  redacao.ts          → montagem do "porquê" de cada ponto
  schemas.ts          → zod de toda saída de IA
```

### 8.1 Sugestão de estado — marcadores linguísticos
Derivados dos 20 históricos. São **sugestões rotuladas**, nunca decisões.

**Critério 5 — o discriminador, e o mais previsível.** Lido de `limite_conclusao`:

| Marcador no texto do limite | Estado sugerido |
|---|---|
| "Não há hipótese de mecanismo novo" · "apenas adequação" · "aplicação conhecida" · "não transforma rotina em P&D" | `DOCUMENTADA PARA A CONFIGURAÇÃO` |
| "Faltam…" · "não preservou" · "não permite distinguir" · "não completam a cadeia" | `INSUFICIENTE PARA O NÚCLEO ALEGADO` |
| "mas não a alegação de…" · "permanece em aberto" · "ainda não foi validada" · "segue aberto" | `DOCUMENTADA COM LIMITE` |
| "Conclusão limitada a…" · "Não se reivindica…" · "não foram reivindicadas" | `DOCUMENTADA NO ESCOPO` |

**Critérios 1 e 2** — lidos de `metodo§1` e `metodo§2`:
- *rotina*: "o manual define" · "o catálogo já fornece" · "o produto já oferece" · "anterior à configuração" · "aplicar receita do fornecedor" · "sem modificar" · "faixa já admitida" → `NÃO DEMONSTRADA`
- *investigação*: "já eram conhecidos/dominadas, mas" · "o comparador" · "a alternativa" · "não vincula" · "perde" · "o problema investigado" → `DEMONSTRADA NO RECORTE`
- *indeterminação*: "plano propõe" · "minuta" · "diagrama" · "não define" · "sem limiares aprovados" · "identificadas apenas como" → `INDETERMINADA`

**Critério 3** — `metodo§2` + presença de hipótese testável e comparador:
- hipótese explícita + comparador especificado + critério prévio → `INVESTIGADA`
- "desvios resolvidos por configuração, mapeamento ou receita existente" → `NÃO CARACTERIZADA`
- alegação sem versão executada, sem saída, sem causa de referência → `ALEGADA, NÃO VERIFICÁVEL`

**Critério 4** — `medicoes.csv` + `metodo§3`:
- população definida, comparadores com mesma entrada, **critérios definidos antes da rodada** → `DOCUMENTADA`
- roteiros de aceite, "primeira rodada falhou, segunda passou", verificação funcional → `DOCUMENTADA COMO ACEITE`
- poucos registros, sem causa controlada, sem saída do mecanismo, memorando sem vínculo → `PARCIAL`

> **Sinal de fonte:** critério 3 sustentado pela revisão técnica em vez do método sugere incerteza apenas alegada; critério 5 sustentado por `metodo§3` em vez do limite sugere transferência só da configuração.

### 8.2 A camada de IA — enriquecimento descartável
Firebase AI Logic, `gemini-2.5-flash`, `responseMimeType: 'application/json'` + `responseSchema`.

Quatro tarefas, e só estas:
- `extrairTrechos(secao, criterio)` → trechos literais com offsets
- `detectarAfirmacoesNumericas(entrevista|dossie)` → alegações para cruzar com ensaios
- `redigirPorque(estado, citacoes, norma)` → o texto do "porquê" a partir **só** do que foi extraído
- `apontarEloAusente(pacote)` → o que falta para verificar o núcleo alegado

**System prompt obrigatório — use literalmente:**
```
Você é um assistente de extração e redação documental para análise preliminar
de enquadramento na Lei do Bem. Você NÃO classifica, NÃO conclui e NÃO decide
se um projeto é elegível, com ressalvas, não elegível ou de evidência
insuficiente. Sua saída é uma PROPOSTA que um analista humano vai revisar.

REGRAS ABSOLUTAS:
1. Extraia apenas trechos LITERAIS das evidências fornecidas. Nunca parafraseie
   dentro do campo "trecho". Nunca invente texto que não esteja no documento.
2. Cite sempre pelo ID nativo do pacote (PRJxx-EVnn, PRJxx-ATVnn, PRJxx-Snn) e
   pela âncora de seção (metodo.md#2). Nunca invente identificadores.
3. Referências normativas: use SOMENTE os ids da lista de normas fornecida no
   contexto. Se nenhum se aplicar, retorne lista vazia. É proibido citar
   artigos, leis ou manuais de memória.
4. Registre trechos favoráveis, contrários e contraditórios à caracterização de
   P&D. Omitir evidência contrária é erro grave.
5. Nunca trate como provado aquilo que aparece apenas em entrevista, memorando,
   apresentação ou declaração da equipe. Afirmação de memória é alegação.
6. Nunca trate "Localizada" como comprovação, nem a natureza informada pela
   equipe como conclusão.
7. Se a evidência não existir, retorne lista vazia e descreva em "lacunas" o
   elo ausente. Não preencha por inferência.
8. Ao redigir um "porquê", use somente os trechos citados. Toda frase precisa
   ser rastreável a um ID. Não introduza fato novo.
9. Nunca use as palavras "elegível", "inelegível", "aprovado" ou "reprovado".

Responda exclusivamente no schema JSON fornecido.
```

**Validação (zod), obrigatória.** Descarte a resposta inteira se: algum `trecho` não existir literalmente no texto extraído (`indexOf !== -1`); algum ID citado não existir no pacote; algum `normaId` não existir na coleção. Descarte ⇒ `iaDisponivel=false` naquela operação ⇒ segue a camada determinística com aviso discreto. **Nunca um erro bloqueante.**

---

## 9. Os dois acervos — e a linha que não se cruza

| Acervo | Conteúdo | Papel | Rota |
|---|---|---|---|
| **Base de Referência** | PRJ01–PRJ20, com classe e justificativas | Pré-carregada no seed. Calibra a régua, valida o motor, serve de precedente consultável | `/referencia` |
| **Casos em Análise** | PRJ21–PRJ40 | Subidos pelo analista, inclusive ao vivo no pitch | `/casos` |

### 9.1 O que os históricos PODEM fazer
- **Calibrar** a matriz de estados e os marcadores linguísticos (§8.1).
- **Validar** o motor: 20/20 em `npm run validar`.
- **Servir de precedente consultável.** Em cada critério do parecer, um painel lateral mostra: *"Este estado aparece em N históricos. Veja como foi fundamentado."* com os trechos das justificativas de referência.
- **Ensinar o nível de fundamentação esperado** — são o padrão de qualidade da redação.

### 9.2 O que os históricos NÃO PODEM fazer
- **Entrar no cálculo da classe.** Nenhuma similaridade textual, nenhum embedding, nenhum vizinho mais próximo, nenhum few-shot que induza a classe.
- O Guia é explícito: *"Não classifique por semelhança. A classificação deve decorrer das evidências do próprio projeto analisado."*

> Na UI, o painel de precedentes é claramente rotulado **referência de fundamentação**, aparece **depois** da sugestão de estado e nunca antes, e não é citável no parecer como evidência do caso.

---

## 10. Modelo de dados (Firestore)

### `normas/{normaId}`
```ts
type Norma = {
  id: string;                 // "IN1187-ART2-II-C"
  fonte: 'LEI_11196'|'DECRETO_5798'|'IN_RFB_1187'|'FRASCATI'|'GUIA_MCTI';
  dispositivo: string;        // "Art. 2º, II, 'c'"
  ementa: string; texto: string; tags: string[];
  criteriosRelacionados: CriterioId[];
  vigenciaInicio: string; vigenciaFim: string | null;
  versaoCorpus: string;       // "2026.1"
};
```
Só normas vigentes são consultadas. O parecer grava a `versaoCorpus` aplicada. Trocar a lei = novo documento + encerrar vigência do antigo. **Zero deploy — demonstre isso ao vivo.**

### `casos/{casoId}`
```ts
type Caso = {
  id: string;                        // "PRJ27"
  titulo: string; equipe: string; duracaoSemanas: number;
  origem: 'REFERENCIA' | 'ANALISE';
  situacao: 'INGERIDO'|'ANALISADO'|'EM_REVISAO'|'HOMOLOGADO';
  pacote: {
    arquivosEsperados: 14; arquivosPresentes: number;
    arquivosAusentes: string[];      // lacuna declarada, não erro
    sha256: string;
    ingeridoEm: Timestamp; ingeridoPor: string;
  };
  leitura: {
    camposEspelhados: Record<string, string[]>;   // campo → fontes onde foi achado
    ensaiosConferidos: number; ensaiosDivergentes: string[];
    executadaEm: Timestamp; duracaoMs: number;    // alimenta a métrica de eficiência
  };
  parecerAtualId: string | null;
};
```

### `casos/{id}/evidencias/{evidenciaId}`
```ts
type Evidencia = {
  id: string;                        // "PRJ27-EV07" — ID NATIVO
  tipo: TipoEvidencia;               // os 14 tipos fixos
  arquivo: string; caminhoNoPacote: string;
  conteudoEsperado: string;
  observacaoInventario: string;      // a coluna que declara a natureza probatória
  forcaProbatoria: 'PRIMARIA'|'DERIVADA'|'DECLARATORIA';  // DERIVADA de observacaoInventario
  statusInventario: 'Localizada';    // sempre — exibir como "presente"
  textoExtraido: string | null;
  secoes: Array<{ ancora: string; titulo: string; inicio: number; fim: number }>;
};
```

### `casos/{id}/atividades/{atividadeId}` · `casos/{id}/ensaios/{ensaioId}`
```ts
type Atividade = {
  id: string;                        // "PRJ27-ATV03"
  ciclo: 'C1'|'C2'|'C3'|'C4'; fase: Fase;
  naturezaInformadaPelaEquipe: string;   // AUTODECLARAÇÃO — nunca pontuar
  descricao: string; resultadoOuSaida: string | null;   // vazio ≠ inexistente
  evidenciasRelacionadas: string[];
  criteriosAlimentados: CriterioId[];    // do mapa fase→critério (§6.2)
};

type Ensaio = {
  id: string;                        // "PRJ27-S05"
  versao: string; metrica: string;
  operacao: 'contagem'|'media'|'mediana'|'diferenca_maior_menor'
          | 'percentil_95'|'valor_observado'|'indicador_precalculado';
  valor: number; baseDeCalculo: number; descricaoBase: string;
  taxaPercentual: number | null;     // null ≠ 0
  unidade: string;
  natureza: 'desempenho' | 'entrega';
  fonte: string;
  conferido: boolean; recalculo: number | null; divergenciaRecalculo: string | null;
};
```

### `casos/{id}/citacoes/{citacaoId}`
```ts
type Citacao = {
  id: string; criterioId: CriterioId;
  evidenciaId: string;               // "PRJ27-EV06"
  seletor: string | null;            // "#2" | "PRJ27-S05"
  trecho: string;                    // LITERAL
  offsetInicio: number | null; offsetFim: number | null;
  forcaProbatoria: Forca;
  sentido: 'FAVORAVEL'|'CONTRARIA'|'CONTRADITORIA';
  origem: 'MOTOR' | 'IA' | 'ANALISTA';
};
```

### `casos/{id}/confrontos/{confrontoId}`
```ts
type Confronto = {
  id: string; campoLogico: string;   // "limite_conclusao"
  afirmacaoA: { fonte: string; evidenciaId: string; texto: string; forca: Forca };
  afirmacaoB: { fonte: string; evidenciaId: string; ensaioId: string|null; texto: string; forca: Forca };
  prevalenciaSugerida: 'A'|'B';
  prevalencia: 'A'|'B'|'NAO_RESOLVIDO';
  razaoDaPrevalencia: string;
  textoFormatado: string;            // no padrão do §7.2
  resolvidoPor: string | null; resolvidoEm: Timestamp | null;
};
```

### O ponto do parecer — a unidade que carrega o "porquê"
```ts
type PontoDoParecer = {
  criterioId: CriterioId;

  // o que a MÁQUINA propôs
  estadoProposto: EstadoCriterio;
  porqueProposto: string;            // o texto fundamentado
  citacoesPropostas: string[];
  normasAplicadas: string[];
  confiança: 'ALTA'|'MEDIA'|'BAIXA'; // marcadores encontrados vs. ambíguos

  // o que o HUMANO fez
  acaoDoAnalista: 'PENDENTE'|'CONCORDOU'|'AJUSTOU'|'DISCORDOU' | null;
  estadoFinal: EstadoCriterio | null;
  porqueFinal: string | null;        // se ajustou, o texto do analista
  motivoDaMudanca: string | null;    // OBRIGATÓRIO se ajustou ou discordou
  aceiteEmBloco: boolean;            // true se veio do "Aceitar todos"
  decididoPor: string | null; decididoEm: Timestamp | null;
};
```

### `pareceres/{parecerId}`
```ts
type Parecer = {
  id: string; casoId: string; versao: number; versaoAnteriorId: string | null;
  situacao: 'PROPOSTO' | 'EM_REVISAO' | 'HOMOLOGADO';

  classeProposta: Classe | 'CONFLITO' | 'INCOMPLETO';
  classeFinal: Classe | null;
  analistaDivergiuDaProposta: boolean;
  motivoDaDivergencia: string | null;

  pontos: Record<CriterioId, PontoDoParecer>;

  // condicionais por classe
  recorteSustentado: string | null;      // COM_RESSALVAS
  limitacaoEspecifica: string | null;    // COM_RESSALVAS
  evidenciaNecessaria: string | null;    // COM_RESSALVAS
  eloAusente: string | null;             // EVIDENCIA_INSUFICIENTE
  evidenciasASolicitar: string[] | null; // EVIDENCIA_INSUFICIENTE
  mecanismoDocumentado: string | null;   // NAO_ELEGIVEL

  citacoesContrarias: string[];
  confrontos: string[];
  lacunas: string[];

  // congelamento
  geradoEm: Timestamp; geradoPor: string;
  homologadoEm: Timestamp | null; homologadoPor: string | null;
  versaoCorpusNormativo: string; sha256Pacote: string;
  hashConteudo: string; snapshot: object;
};
```

### `auditoria/{eventoId}` — append-only
```ts
type EventoAuditoria = {
  casoId: string; ator: string; papel: Papel;
  acao: 'PACOTE_INGERIDO'|'LEITURA_EXECUTADA'|'PARECER_PROPOSTO'
      | 'PONTO_CONCORDADO'|'PONTO_AJUSTADO'|'PONTO_DISCORDADO'|'ACEITE_EM_BLOCO'
      | 'CONFRONTO_RESOLVIDO'|'CLASSE_ALTERADA'|'PARECER_HOMOLOGADO'|'REANALISE';
  alvo: string; antes: unknown|null; depois: unknown|null; em: Timestamp;
};
```

---

## 11. Papéis e permissões

| Papel | Pode |
|---|---|
| `analista` | Subir pacote, revisar pontos, resolver confrontos, emitir parecer preliminar |
| `revisor` | Tudo do analista + homologar e congelar |
| `auditor` | **Somente leitura.** Casos, pareceres e trilha completa |

```
match /pareceres/{id} { allow create: if papel() in ['analista','revisor'];
                        allow update: if papel()=='revisor'
                                      && resource.data.situacao != 'HOMOLOGADO';
                        allow delete: if false; }
match /auditoria/{id} { allow create: if signedIn(); allow update,delete: if false; }
match /normas/{id}    { allow read:   if signedIn(); allow write: if false; }
match /casos/{id}     { allow read:   if signedIn();
                        allow write:  if papel() in ['analista','revisor']; }
```

---

## 12. Telas

| # | Rota | O que acontece |
|---|---|---|
| 0 | `/login` | Seed com três usuários (analista, revisor, auditor) |
| 1 | `/casos` | Casos em análise, com classe e situação. Botão **Analisar novo projeto** |
| 2 | `/casos/novo` | Drop de **pasta ou .zip**. Checklist dos 14 arquivos. Barra de leitura com as etapas nomeadas (lendo método · conferindo 4 ensaios · cruzando 10 campos · redigindo parecer) |
| 3 | `/casos/[id]/parecer` | **A tela principal.** Cabeçalho com a classe proposta e o tempo de análise. Abaixo, os cinco pontos em cards expansíveis: estado · porquê · citações clicáveis que abrem a evidência · norma · **Concordo / Ajustar / Discordo**. Botão **Aceitar todos**. Mudar um estado recompõe a classe ao vivo, com animação do antes/depois |
| 4 | `/casos/[id]/evidencia/[evId]` | Visualizador com realce do trecho citado (painel lateral, não página cheia) |
| 5 | `/casos/[id]/confronto` | Divergências: afirmação A, afirmação B, força de cada, prevalência sugerida, escolha + razão. Gera o texto no padrão do §7.2 |
| 6 | `/casos/[id]/homologar` | Campos condicionais da classe. Assinatura. Congelamento |
| 7 | `/casos/[id]/documento` | O parecer final. Preview paginado + **Exportar PDF**. Consultável para sempre |
| 8 | `/casos/[id]/reanalise` | Anexar evidência nova → recomposição dos pontos afetados → nova versão com diff |
| 9 | `/referencia` | Os 20 históricos. Filtro por classe e por estado de critério. Abre a fundamentação de cada um |
| 10 | `/auditoria/[parecerId]` | Linha do tempo: o que a máquina propôs, o que o humano mudou, quem assinou |

**Design.** Institucional e sóbrio. Base neutra, verde do BNB como acento. Quatro cores de classe consistentes em todo o app. Força probatória por ícone, não só por cor. **Tudo que é proposta da máquina leva marca visual de proposta** — e ela desaparece quando o humano confirma. Tipografia densa; evidência em serifada. Sem gradiente, sem glassmorphism, sem ilustração 3D.

---

## 13. O documento final

```
1. Identificação
   Caso · equipe · duração · hash do pacote · versão do corpus normativo · data
2. Classificação
   Classe homologada · classe proposta pela ferramenta · houve divergência? qual e por quê
3. Os cinco critérios
   Para cada: estado · o PORQUÊ · citações (trecho literal + ID + arquivo + seção)
   · dispositivo normativo · o que a ferramenta propôs · o que o analista fez · quando
4. Campos condicionais da classe
   Com ressalvas    → recorte sustentado · limitação · evidência necessária
   Evid. insuf.     → elo ausente · evidências a solicitar
   Não elegível     → mecanismo documentado que já resolvia o problema
5. Evidências contrárias e contraditórias
6. Divergências entre fontes
   "A entrevista afirma X; o registro Y mostra Z; prevalece…, porque…"
7. Conferência numérica
   Ensaios recalculados a partir das medições · o que bateu e o que não bateu
8. Lacunas identificadas
9. Rastreabilidade
   Regra aplicada · informação do projeto que a sustenta · quem decidiu e quando
10. Anexo: trilha de auditoria completa
```

Rodapé de toda página:
`LASTRO · Análise preliminar · Não substitui parecer técnico definitivo · Parecer {hash} · v{n} · Corpus {versao}`

> Este documento é a peça que o banco vai abrir daqui a três anos para explicar a decisão. Escreva-o para alguém que não participou da análise e não conhece o projeto.

---

## 14. Plano de 3 dias

**Dia 1 — leitura e motor**
- Next + Firebase + Auth com três papéis + security rules
- `src/types` completo · `scripts/seed-normas.ts` · `scripts/seed-referencia.ts` (os 20 históricos)
- Parsers: pasta e zip, PDF, CSV (`;` + BOM), XLSX (cabeçalho linha 5), JSON
- Fatiador das seções fixas (§6.2) · aritmética (§6.6) · redundância (§7)
- `classificacao.ts` + `npm run validar` → **20/20**
- **Checkpoint: subir uma pasta e ver os cinco estados sugeridos no console.**

**Dia 2 — o parecer**
- Tela do parecer proposto com os cinco cards e o porquê de cada ponto
- Concordo/Ajustar/Discordo + Aceitar todos + recomposição ao vivo da classe
- Visualizador de evidência com realce · fila de confrontos
- Trilha de auditoria gravando tudo
- Camada Gemini + zod + fallback
- **Checkpoint: um caso de PRJ21–40 vai do upload ao parecer revisado.**

**Dia 3 — o artefato e o palco**
- Homologação, congelamento com hash, PDF
- `/referencia` com os 20 históricos · reanálise com diff
- Deploy + três ensaios cronometrados
- **Checkpoint: um estranho usa sem explicação.**

Corte, nesta ordem: reanálise → visualizador de evidência em página cheia → redação por IA (fica a determinística).
**Nunca corte:** a validação 20/20, o porquê em cada ponto, o confronto, a geração do documento.

---

## 15. Checklist antes do pitch

- [ ] Subir uma pasta ao vivo e o parecer sair **em menos de um minuto** — cronometrado
- [ ] Abrir um ponto qualquer e mostrar: estado · porquê · trecho literal · ID da evidência · dispositivo · quem decidiu
- [ ] **Discordar de um ponto na frente da banca** e ver a classe recompor ao vivo — é a prova visual de que o analista manda
- [ ] A validação **20/20** rodando, não em slide
- [ ] **Um confronto** resolvido, com a frase no padrão do Guia
- [ ] Um caso **Com ressalvas** e um **Evidência insuficiente** — mostrar que o sistema sabe não concluir
- [ ] Os **três distratores** apontados na tela
- [ ] **Atualização normativa sem deploy**, editando `normas` ao vivo
- [ ] Abrir o documento arquivado e dizer: *"é isto que o banco mostra daqui a três anos"*
- [ ] Dito em voz alta: *"a ferramenta não decide — ela não deixa o analista decidir sem lastro"*
- [ ] Nunca prometido eliminar a consultoria

---

## 16. Glossário

| Termo | Significado |
|---|---|
| Elo ausente | A informação que falta para verificar o núcleo alegado |
| FORMP&D | Formulário anual ao MCTI (sistema FORMS), prazo 31 de julho |
| Glosa | Quando o governo rejeita o valor declarado e cobra o imposto de volta |
| Prova de não rotina | Demonstrar que aquilo não era trabalho comum do dia a dia |
| Recorte sustentado | A parte da conclusão que a evidência efetivamente suporta |
| Rastreabilidade | Reconstruir depois como e por que a decisão foi tomada |

---

**Última regra.** Em qualquer dúvida de implementação, pergunte-se: *"isso ajuda o analista a decidir com segurança, ou está decidindo no lugar dele?"* Se for a segunda, não construa.
