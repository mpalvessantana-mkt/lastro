# LASTRO — Toda Decisão com Lastro
## Documentação Completa do Sistema · Arquitetura, Regras, Telas e Pitch
**Desafio STS 2026 · Banco do Nordeste (Hubine) + SEBRAE**

---

## 1. Visão Executiva do Produto

O **LASTRO** é um **Sistema de Apoio à Decisão para Elegibilidade na Lei do Bem (Lei nº 11.196/2005)** desenvolvido especificamente para os analistas de P&D/Inovação do **Banco do Nordeste**.

### 1.1 O Princípio Central
> **A ferramenta propõe; o analista decide; o sistema registra os dois.**

O LASTRO **não** é uma "IA que aprova ou reprova projetos" de forma autônoma (uma caixa-preta inaceitável para auditoria pública). É uma plataforma de apoio fundamentado que:
1. Lê deterministicamente os 14 arquivos do pacote técnico de um projeto.
2. Extrai evidências por identificadores nativos (`PRJxx-EVnn`, `PRJxx-ATVnn`, `PRJxx-Snn`).
3. Confere a matemática e aritmética das medições contra os resultados.
4. Detecta contradições entre depoimentos verbais e registros primários.
5. Sugere uma minuta completa de parecer técnico com citações e artigos normativos.
6. Permite revisão humana ponto a ponto com recomposição da classe ao vivo.
7. Congela o documento final com hash criptográfico, conferindo **valor de peça de defesa** para o banco apresentar à Receita Federal / MCTI anos depois.

---

## 2. As Regras Invioláveis do LASTRO

1. **A ferramenta propõe, nunca decide:** Todo parecer nasce com situação `PROPOSTO`. Só se torna `HOMOLOGADO` por ação humana identificada.
2. **Todo ponto do parecer tem um porquê:** Cada estado de critério carrega obrigatoriamente a justificativa em texto, as citações por ID e o dispositivo normativo aplicado.
3. **Nada entra no parecer sem citação:** Toda afirmação carrega ao menos um ID nativo ou âncora de seção (`metodo.md#6`).
4. **A IA jamais cita leis de memória:** Referências legais utilizam exclusivamente identificadores válidos do corpus normativo oficial (`normaId`).
5. **Nunca classificar por semelhança:** É expressamente proibido decidir a classe de um caso novo por vizinhança ou similaridade com casos históricos. Os históricos calibram a régua e servem de precedentes consultáveis.
6. **Divergência não se resolve sozinha:** Fontes em conflito geram um `Confronto` explícito registrando a afirmação de memória e o registro primário, com indicação de prevalência documental.
7. **Não elegível ≠ Evidência insuficiente:** A primeira exige base fática para conclusão negativa; a segunda reflete base incompleta. O sistema nunca converte uma na outra artificialmente.
8. **Parecer homologado é imutável:** Homologações recebem hash criptográfico SHA-256 e são congeladas. Qualquer alteração subsequente gera uma nova versão com Diff (`v2`).
9. **Registrar evidência contrária é obrigatório:** Omitir evidências desfavoráveis é considerado vício de análise.
10. **Resultado desfavorável pode ser P&D:** Falha de metas ou limites técnicos não desqualificam a atividade de P&D (Manual de Frascati § 138).

---

## 3. Matriz Canônica de Estados & Composição da Classe

Derivada da leitura integral dos 20 casos históricos (`PRJ01` a `PRJ20`), reproduzindo **20/20 (100%)** dos históricos:

### 3.1 Os Cinco Critérios e seus Estados Possíveis
* **1. Novidade:** `DEMONSTRADA NO RECORTE` · `NÃO DEMONSTRADA` · `INDETERMINADA`
* **2. Criatividade técnica:** `DEMONSTRADA NO RECORTE` · `NÃO DEMONSTRADA` · `INDETERMINADA`
* **3. Incerteza tecnológica:** `INVESTIGADA` · `NÃO CARACTERIZADA` · `ALEGADA, NÃO VERIFICÁVEL`
* **4. Sistematicidade:** `DOCUMENTADA` · `DOCUMENTADA COMO ACEITE` · `PARCIAL`
* **5. Transferência e reprodução:** `DOCUMENTADA NO ESCOPO` · `DOCUMENTADA COM LIMITE` · `DOCUMENTADA PARA A CONFIGURAÇÃO` · `INSUFICIENTE PARA O NÚCLEO ALEGADO`

### 3.2 As Quatro Classes Finais
| Critério | Elegível | Com ressalvas | Não elegível | Evidência insuficiente |
|---|---|---|---|---|
| **1 Novidade** | DEMONSTRADA NO RECORTE | DEMONSTRADA NO RECORTE | NÃO DEMONSTRADA | INDETERMINADA |
| **2 Criatividade** | DEMONSTRADA NO RECORTE | DEMONSTRADA NO RECORTE | NÃO DEMONSTRADA | INDETERMINADA |
| **3 Incerteza** | INVESTIGADA | INVESTIGADA | NÃO CARACTERIZADA | ALEGADA, NÃO VERIFICÁVEL |
| **4 Sistematicidade** | DOCUMENTADA | DOCUMENTADA | DOCUMENTADA COMO ACEITE | PARCIAL |
| **5 Transferência** | DOCUMENTADA NO ESCOPO | **DOCUMENTADA COM LIMITE** | DOCUMENTADA PARA A CONFIGURAÇÃO | INSUFICIENTE PARA O NÚCLEO ALEGADO |

* **O Critério 5 é o discriminador entre Elegível e Com ressalvas.**
* **Não elegível e Evidência insuficiente se separam nos critérios 3 e 4.**

---

## 4. Estrutura dos Arquivos de Entrada (14 Arquivos por Projeto)

Cada pasta de projeto (`PRJxx`) contém rigorosamente 14 arquivos estruturados:
1. `dossie_projeto.pdf` — Síntese institucional em 6 blocos fixos.
2. `registro_tecnico.pdf` — Síntese técnica complementar.
3. `transcricao_entrevista_tecnica.pdf` — Entrevista com 7 perguntas fixas (fonte declaratória).
4. `atividades.csv` — 8 fases canônicas de trabalho (C1 a C4).
5. `atividades.xlsx` — Planilha de atividades com cabeçalho na linha 5.
6. `inventario_evidencias.csv` — Declaração da força probatória (`PRIMARIA`, `DERIVADA`, `DECLARATORIA`).
7. `evidencias/metodo.md` — 7 seções fixas (a espinha dorsal do parser e dos critérios).
8. `evidencias/configuracao.json` — Dicionários de dados, parâmetros e ensaios.
9. `evidencias/cronologia.csv` — Marcos temporais e versões registradas.
10. `evidencias/medicoes.csv` — Registros primários com numeradores, denominadores e contadores.
11. `evidencias/resultados.csv` — Dados derivados das medições com taxas calculadas.
12. `evidencias/entradas.csv` — Recortes de entradas com payloads JSON.
13. `evidencias/observacoes.csv` — Registros de ocorrências e exceções.
14. `evidencias/revisao_tecnica.md` — Revisão em 5 seções fixas com declaração de limites.

---

## 5. Arquitetura de Software

```
LASTRO/
├── Arquivos/                   # Base de teste e histórico calibrado (PRJ01 a PRJ20)
├── Logo/                       # Identidade visual oficial do Banco do Nordeste
├── manuais/                    # Corpus normativo (40 normas JSON fatiadas literalmente)
├── scripts/
│   ├── validar-motor.ts        # Teste canônico comprovando 20/20 de acerto
│   ├── seed-normas.ts          # Script de gravação no Cloud Firestore
│   └── gerar-referencia.ts     # Gerador de catálogo estático dos 20 precedentes
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout com AuthProvider e Navbar BNB
│   │   ├── globals.css         # Design System institucional BNB (#F7F7F4, #0F5132)
│   │   ├── page.tsx            # Redirecionador para /casos
│   │   ├── casos/
│   │   │   ├── page.tsx        # Dashboard (TELA 7) com contadores por classe e filtros
│   │   │   └── novo/page.tsx   # Upload de pasta/.zip (TELA 3) com leitura em 5 etapas
│   │   ├── casos/[id]/
│   │   │   ├── parecer/page.tsx # Tela Principal (TELA 1, 2 e 4) com recomposição ao vivo
│   │   │   ├── confronto/page.tsx # Módulo de divergências (TELA 5)
│   │   │   ├── homologar/page.tsx # Homologação e assinatura digital
│   │   │   ├── documento/page.tsx # Parecer A4 arquivado (TELA 6) com exportação em PDF
│   │   │   └── reanalise/page.tsx # Reanálise com Diff documental gerando versão 2
│   │   ├── referencia/page.tsx # Base dos 20 históricos com assinatura visual (TELA 8)
│   │   ├── auditoria/page.tsx  # Trilha de auditoria imutável (append-only)
│   │   └── api/
│   │       ├── ia/enriquecer/  # Endpoint de integração com Gemini 2.5 Flash
│   │       └── metodo-demo/    # Endpoint para servir método real em demos
│   ├── components/
│   │   ├── Navbar.tsx          # Barra superior institucional com seletor de papéis
│   │   └── EvidenciaDrawer.tsx # Drawer lateral retrátil com realce de evidência
│   ├── contexts/
│   │   └── AuthContext.tsx     # Gestão de sessão e papéis (Analista, Revisor, Auditor)
│   ├── lib/
│   │   ├── firebase.ts         # Inicialização do Firebase Client SDK
│   │   ├── gemini.ts           # Integração com Gemini AI Logic e Zod
│   │   ├── casos-store.ts      # Repositório de casos e eventos de auditoria
│   │   └── referencia-data.ts  # Catálogo indexado dos 20 históricos
│   ├── motor/                  # Motor determinístico puro (TypeScript puro)
│   │   ├── classificacao.ts    # Composição canônica de classes
│   │   ├── secoes.ts           # Fatiador de seções fixas
│   │   ├── aritmetica.ts       # Recálculo de contagens e taxas
│   │   ├── redundancia.ts      # Detector de confronto entre fontes
│   │   ├── estados.ts          # Marcadores linguísticos para os 5 critérios
│   │   ├── corpus.ts           # Consulta e validação de dispositivos legais
│   │   ├── index.ts            # Orquestrador da análise de projetos
│   │   └── parsers/            # Parsers de CSV com BOM, XLSX linha 5, JSON
│   └── types/
│       └── index.ts            # Tipagens canônicas completas do sistema
└── package.json
```

---

## 6. Mapa Completo de Telas e Rotas

### Rota `/casos` — Dashboard de Casos em Análise (TELA 7)
* 5 blocos de contadores com filetes coloridos superiores:
  * **Elegível:** `#0F5132` (Verde BNB)
  * **Com ressalvas:** `#9A6700` (Âmbar técnico)
  * **Não elegível:** `#44403C` (Ardósia escuro)
  * **Evidência insuficiente:** `#2C4F7C` (Azul clássico)
  * **Em revisão:** `#6B6A65`
* Barra de busca rápida por ID, título ou equipe.
* Tabela densa institucional com badges semânticas, indicador de pontos revisados (`0/5`, `5/5`) e link direto para o parecer.

### Rota `/casos/novo` — Acervo e Ingestão de Pacotes (TELA 3)
* Área pontilhada para arrastar pasta descompactada (`webkitdirectory`) ou arquivo `.zip`.
* Painel de leitura em tempo real com as 5 etapas canônicas:
  1. *Localizando e indexando os 14 arquivos*
  2. *Fatiando método em 7 seções canônicas*
  3. *Recalculando ensaios e conferindo aritmética*
  4. *Cruzando 10 campos espelhados entre as fontes*
  5. *Redigindo e fundamentando a proposta de parecer*
* Checklist lateral dos 14 arquivos verificados.
* Botões de atalho de demonstração para o pitch (`PRJ02`, `PRJ05`, `PRJ01`, `PRJ08`).

### Rota `/casos/[id]/parecer` — A Tela Principal (TELA 1, 2 e 4)
* **Cabeçalho:** Identificação completa, equipe, semanas e tempo de leitura.
* **Classificação Proposta:** Bloco em destaque com borda colorida e badge `PROPOSTA — aguarda decisão do analista`.
* **Os 5 Cards Expansíveis:**
  * Linha do topo: Número, nome do critério, badge colorida do estado e botões *Concordo*, *Ajustar*, *Discordo*.
  * Card expandido:
    * **Por que este estado:** Parágrafo fundamentado.
    * **Evidências citadas:** Trechos em fonte serifada com ID nativo, força probatória e sentido (`FAVORÁVEL`, `CONTRÁRIA`). Ao clicar, abre o **EvidenciaDrawer** com realce literal.
    * **Fundamento normativo:** Dispositivo legal oficial com citação da lei/manual.
    * **Referência de fundamentação:** Lista de históricos que tiveram o mesmo estado para consulta de precedentes.
* **O Momento do Pitch (Recomposição ao Vivo):** Ao discordar de um ponto e alterar o estado, a classificação no topo recompõe instantaneamente com animação "antes $\rightarrow$ depois" e aviso em destaque!

### Rota `/casos/[id]/confronto` — Divergências entre Fontes (TELA 5)
* Interface comparativa lado a lado:
  * **Esquerda (Entrevista):** Fonte declaratória de memória.
  * **Direita (Registro Primário):** Medições identificadas por versão e ensaio.
* Seletor de prevalência documental.
* Caixa com a redação oficial literal:
  > *"A entrevista afirma X; o registro Y mostra Z; prevalece o registro, por ser primário e identificado por versão."*

### Rota `/casos/[id]/homologar` — Homologação e Assinatura
* Exibição dos campos condicionais da classe:
  * *Com ressalvas:* Recorte sustentado, limitação específica e evidência necessária.
  * *Evidência insuficiente:* Elo ausente e evidências a solicitar.
  * *Não elegível:* Mecanismo documentado que já resolvia o problema.
* Termo formal de responsabilidade técnica.
* Assinatura digital do usuário ativo e geração do hash imutável SHA-256.

### Rota `/casos/[id]/documento` — O Documento Final Arquivado (TELA 6)
* Layout padronizado em página A4 com os 10 capítulos institucionais.
* Logotipo do Banco do Nordeste no cabeçalho.
* Tabela de rastreabilidade com hash do pacote e versão do corpus normativo.
* Botão **Exportar / Imprimir PDF** otimizado para impressão direta do navegador.

### Rota `/casos/[id]/reanalise` — Reanálise com Diff Documental
* Aditamento de nova evidência ao projeto.
* Recálculo automático dos pontos afetados gerando a **Versão 2 (`v2`)** e preservando a `v1` intacta.
* Visualizador de Diff comparativo lado a lado.

### Rota `/referencia` — Base de Precedentes (TELA 8)
* Grade com os 20 projetos históricos classificados (`PRJ01` a `PRJ20`).
* Cada card traz a **assinatura visual** (os 5 quadradinhos nas cores dos critérios).
* Painel lateral retrátil com a justificativa oficial e estados do histórico selecionado.

### Rota `/auditoria` — Rastro Imutável
* Linha do tempo cronológica em modelo append-only registrando todas as ingestões, aceites, discordâncias e homologações.

---

## 7. Roteiro Cronometrado para o Pitch (3 Minutos)

Para apresentar o LASTRO com impacto máximo diante da banca examinadora:

```
┌───────┬──────────────────────────┬──────────────────────────────────────────────────────────────┐
│ Tempo │ Tela                     │ Fala e Ação Prática                                          │
├───────┼──────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 0:00  │ /casos (Dashboard)       │ "O LASTRO não é uma IA que aprova projetos. É um sistema de  │
│       │                          │ apoio à decisão para a Lei do Bem, onde a máquina propõe,   │
│       │                          │ o analista do BNB decide e o sistema registra os dois."      │
├───────┼──────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 0:30  │ /casos/novo (Upload)     │ Clique no atalho PRJ02 ou PRJ05:                             │
│       │                          │ "O analista sobe os 14 arquivos. Em 30 segundos, o motor lë  │
│       │                          │ o método, recalcula a matemática e cruza redundâncias."      │
├───────┼──────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 1:00  │ /casos/PRJ27/parecer     │ "Aqui está a inversão do produto: o parecer nasce como       │
│       │ (O Parecer)              │ PROPOSTA. Cada ponto tem um porquê, citações literais por    │
│       │                          │ ID nativo e artigos da lei e do Manual de Frascati."         │
│       │                          │ [Clique em uma citação para abrir o drawer com o texto real] │
├───────┼──────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 1:45  │ /casos/PRJ27/parecer     │ O CLÍMAX DA APRESENTAÇÃO: Clique em 'Discordo' no Ponto 1 ou │
│       │ (A Discordância)         │ Ponto 5, altere o estado e mostre a CLASSE RECOMPOR AO VIVO: │
│       │                          │ 'A banca vê ao vivo: quem manda é o analista do banco.'      │
├───────┼──────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 2:15  │ /casos/PRJ27/confronto   │ "A entrevista diz uma coisa de memória; o registro primário  │
│       │ (Confronto)              │ mostra outra. O sistema confronta as duas e arbitra a regra."│
├───────┼──────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 2:40  │ /casos/PRJ27/documento   │ "O parecer é homologado, recebe hash SHA-256 e fica congelado│
│       │ (Documento A4)           │ para sempre. É esta peça de defesa que o BNB mostra em 2029."│
└───────┴──────────────────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 8. Comandos Úteis e Operação Local

```bash
# Iniciar o servidor de desenvolvimento
npm run dev

# Compilar a aplicação para produção
npm run build

# Executar a validação matemática/canônica contra os 20 históricos (Meta: 20/20)
npm run validar

# Executar o seed de normas no Cloud Firestore
npm run seed:normas
```

---
*LASTRO — Toda decisão com lastro.*
*Desenvolvido para o Banco do Nordeste (Hubine) · Hackathon STS 2026*
