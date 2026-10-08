# LASTRO — Sistema de design

## LEIA ANTES DE QUALQUER COISA

**Precedência.** Este arquivo é a fonte de verdade visual do projeto. Onde ele divergir do `CLAUDE.md` — ou de qualquer outro arquivo, comentário ou código já existente — **vale este arquivo**. O `CLAUDE.md` contém uma paleta antiga, verde, que está obsoleta: ignore qualquer menção a `#0F5132`, `#F7F7F4`, `#1A1A18`, `#E3E2DD`, `Inter` ou "verde do BNB". Os valores corretos estão aqui.

**Escopo da mudança — o que você PODE alterar:**
- arquivos de estilo, tokens CSS, variáveis de tema
- `className`, estilos inline, classes do Tailwind
- marcação de apresentação: estrutura de layout, ordem visual, componentes de UI
- textos de rótulo e de botão, quando este documento especificar

**O que você NÃO PODE tocar, em nenhuma hipótese:**
- `src/motor/` inteiro — parsers, classificação, aritmética, redundância, estados
- tipos e interfaces em `src/types/`
- qualquer schema de dados, nome de coleção ou nome de campo do Firestore
- security rules
- a lógica de composição da classe, os estados dos critérios e os nomes deles
- scripts de seed e o corpus normativo
- qualquer regra de negócio do `CLAUDE.md`

Se uma mudança visual parecer exigir alteração de lógica, **pare e relate** em vez de alterar. Nenhum ajuste de design neste documento depende de mudar comportamento.

**Como aplicar:** substitua tokens e estilos. Não refatore. Não renomeie arquivos. Não reorganize pastas. Não "aproveite para melhorar" nada além do que está especificado aqui.

---

## 0. Procedência e contexto

O brand book entregue foi gerado pelo Pomelli (Google Labs) — é uma reconstrução automática, não o manual oficial do Banco do Nordeste. As primárias conferem com a marca real (o logo da carnaubeira em granada e laranja), então são tratadas como obrigatórias. Os secundários são aproximação: "Soft Lavender" para um cinza neutro é artefato de geração. Se conseguirem o manual oficial do banco, confiram tipografia de apoio e escala de cinzas.

**O que o brand book define e é obrigatório:**

| | |
|---|---|
| Granada | `#A6193C` |
| Laranja | `#FF8A22` |
| Branco | `#FFFFFF` |
| Cinza institucional | `#EAEAEA` |
| Tipografia primária | Heebo |
| Logo | carnaubeira estilizada + "Banco do Nordeste" |
| Área de respiro do logo | 50 px por lado |
| Tamanho mínimo do logo | 124 px de largura |
| Tom de voz | institucional, profissional, confiável, acolhedor |
| Valores | sustentabilidade, transparência, governança, justiça |

---

## 2. A hierarquia de marca: LASTRO é do banco

Decisão estrutural, e ela também comunica à banca que vocês entenderam de quem é a solução.

O LASTRO **não tem logo próprio**. É um sistema interno do Banco do Nordeste, e o edital já diz que a propriedade das soluções é do banco. Criar uma marca concorrente seria um erro de leitura.

Na barra superior: o logo do BNB à esquerda, um filete vertical de 1px em `#D8D6D2`, e o nome do sistema em Heebo 500, espaçamento de letra de 0.08em, na cor da tinta. O nome é palavra, não logotipo.

```
┌──────────────────────────────────────────────────────────────┐
│  [logo BNB]  │  LASTRO                        Ana Ribeiro ▾  │
└──────────────────────────────────────────────────────────────┘
```

Jogue fora os prompts de logo que estavam no `PROMPTS-UI.md`. Não há símbolo a desenhar.

---

## 3. O conceito: peça técnica, não painel

Um parecer de enquadramento é peça de processo administrativo. O repertório visual vem daí, não do kit de dashboard:

| Convenção de documento | Vira, na interface |
|---|---|
| Citação direta recuada com filete | Como a evidência é exibida — nunca um "card de citação" |
| Marginália (nota de margem) | A coluna onde a norma e o precedente aparecem |
| Numeração de dispositivo (art., §, inciso) | A numeração dos critérios e das citações — real, nunca decorativa |
| Carimbo de situação | PROPOSTA / HOMOLOGADO — o único lugar com caixa alta |
| Ficha de identificação rótulo/valor | O cabeçalho do caso — não uma linha de metadados separada por pontos |
| Controle de versão e assinatura | O rodapé do parecer |

A tela de parecer deve parecer **um documento de trabalho anotado**. Se parecer um painel de métricas, está errado.

---

## 4. Cor

Duas camadas que nunca se misturam. Essa separação é o que impede a marca de dizer "erro".

### 4.1 Camada de marca — do brand book

```css
--marca-granada:        #A6193C;  /* identidade, ação primária, carimbo de homologação */
--marca-granada-escuro: #7E122D;  /* estado pressionado */
--marca-laranja:        #FF8A22;  /* acento raro: foco, indicador ativo */
```

Granada aparece em **dose pequena**: logo, botão primário, filete de seção ativa, carimbo. Nunca banha uma área grande. Num sistema que a pessoa olha oito horas por dia, cor saturada em superfície extensa cansa e barateia.

### 4.2 Camada de superfície

```css
--papel:       #FFFFFF;  /* a superfície de trabalho: o documento */
--fundo:       #F3F3F1;  /* o que está atrás do documento */
--filete:      #E0DEDA;  /* divisórias e bordas */
--filete-forte:#C9C6C1;  /* separação estrutural */
--tinta:       #231F20;  /* preto de impressão — o preto do material gráfico institucional */
--tinta-media: #6B6762;  /* texto secundário */
--tinta-fraca: #96918A;  /* rótulos e metadados */
```

`#231F20` é o preto de quatro cores da impressão institucional. Não é um near-black escolhido no olho — tem procedência.

### 4.3 Camada semântica — as quatro classes

O brand book não cobre estado de dado. Esta escala é declaradamente derivada: dessaturada, escura, para conviver com granada sem competir.

```css
--classe-elegivel:      #2F6B4F;  /* verde-sertão */
--classe-ressalvas:     #B06C1E;  /* ocre — parente escurecido do laranja da marca */
--classe-nao-elegivel:  #52504E;  /* grafite */
--classe-insuficiente:  #3A5A78;  /* azul-ardósia */
```

Três decisões dentro disso:

**"Com ressalvas" é ocre porque descende do laranja da marca.** Cria parentesco visual com a identidade sem usar a cor institucional como estado.

**"Não elegível" é grafite, nunca vermelho.** É uma conclusão técnica tão legítima quanto "Elegível". Pintar de vermelho ensinaria o analista a ler aquilo como falha, e isso enviesa a decisão — que é exatamente o que o sistema existe para evitar.

**"Evidência insuficiente" é frio** porque é ausência de informação, não um juízo sobre o projeto.

### 4.4 Alerta

```css
--alerta:      #C2410C;  /* laranja queimado: distrator detectado, divergência não resolvida */
--alerta-fundo:#FDF4EC;
```

Distinto do ocre de "Com ressalvas" e do granada da marca. Alerta é raro: distrator, divergência pendente, recálculo que não bateu.

### 4.5 Contraste
Todas as cores de classe e a tinta passam em AA sobre `--papel`. Granada sobre branco dá 7.4:1. Classe nunca é comunicada só por cor: há sempre a palavra escrita e o filete.

---

## 5. Tipografia

```css
--fonte-ui:   "Heebo", system-ui, sans-serif;        /* do brand book */
--fonte-doc:  "Spectral", Georgia, serif;            /* evidência citada */
--fonte-id:   "IBM Plex Mono", ui-monospace, monospace; /* identificadores */
```

**Heebo** é a primária do brand book e carrega a interface inteira. Ative numerais tabulares em tudo que tenha número em coluna: `font-feature-settings: "tnum" 1;`

**Spectral** carrega a evidência citada. Desenhada para leitura longa em tela, tem a cor de página de documento técnico. O trecho citado precisa parecer que veio de outro lugar — porque veio.

**IBM Plex Mono** só para identificadores: `PRJ27-EV06`, `PRJ27-S04`, hashes, versões de ensaio. Tem função real — alinhamento e distinção de caracteres ambíguos. Nunca para rótulo de interface.

### Escala

Cinco tamanhos. Mais que isso vira ruído.

```css
--t-ficha:   11px / 1.45;  letter-spacing: .02em;  /* rótulo de ficha, metadado */
--t-base:    14px / 1.6;                           /* interface, tabela */
--t-leitura: 16px / 1.7;                           /* o "porquê", texto corrido */
--t-titulo:  20px / 1.35;  font-weight: 500;       /* título de caso, de seção */
--t-decisao: 28px / 1.2;   font-weight: 500;       /* a classe proposta */
```

Hierarquia por **peso e cor**, não por tamanho. Heebo 700 só no carimbo e na classificação. Linha de leitura abaixo de 72 caracteres.

---

## 6. Estrutura

Coluna de leitura à esquerda, marginália à direita. Não é sidebar de dashboard — é margem de documento.

```
┌────────────────────────────────────────────────────────────────────┐
│ [logo BNB] │ LASTRO                                   Ana Ribeiro ▾│
├──────┬─────────────────────────────────────────┬───────────────────┤
│      │  PRJ27  Assistente para dúvidas         │                   │
│ Casos│  sobre cobrança e boletos               │   ┌─ NORMA ────┐  │
│      │                                         │   │ Frascati   │  │
│ Refe-│  Equipe      Atendimento de Cobrança    │   │ § 84       │  │
│ rência  Duração     8 semanas                  │   │            │  │
│      │  Pacote      14 de 14 arquivos          │   │ "O critério│  │
│ Audi-│  Leitura     38 segundos                │   │ fundamental│  │
│ toria│                                         │   │ ..."       │  │
│      │  ─────────────────────────────────────  │   └────────────┘  │
│      │                                         │                   │
│      │  │ Com ressalvas      ⟨ P R O P O S T A ⟩                  │
│      │  │ classificação proposta               │   ┌─ PRECEDENTE ┐ │
│      │                                         │   │ 4 históricos│ │
│      │  1 ─ Novidade        demonstrada no     │   │ PRJ05 PRJ06 │ │
│      │                      recorte            │   │ PRJ07 PRJ18 │ │
│      │  2 ─ Criatividade    demonstrada no     │   └─────────────┘ │
│      │                      recorte            │                   │
│      │  3 ─ Incerteza       investigada        │                   │
│      │  4 ─ Sistematicidade documentada        │                   │
│      │  5 ─ Transferência   documentada com    │                   │
│      │      ▔▔▔▔▔▔▔▔▔▔▔▔    limite             │                   │
└──────┴─────────────────────────────────────────┴───────────────────┘
```

- Navegação à esquerda: 180px fixos, sem ícones coloridos, item ativo marcado por filete granada de 2px à esquerda.
- Coluna de leitura: máximo 720px, alinhada à esquerda. Nunca centralizada — texto técnico centralizado não existe em documento sério.
- Marginália: 300px, encostada no topo do bloco que anota.
- Ritmo vertical de 4px. Espaçamentos: 4, 8, 12, 16, 24, 32, 48.
- Raio de canto: **4px** em tudo. Um único valor. Botão, campo e bloco têm o mesmo raio — a hierarquia vem de peso e borda, não de arredondamento.
- Sombra: **nenhuma**, exceto um elevado real (menu suspenso, modal): `0 2px 8px rgba(35,31,32,.12)`.

---

## 7. Componentes com vernáculo próprio

### Ficha de identificação
Grade de duas colunas, rótulo em `--t-ficha` na cor `--tinta-fraca`, valor em `--t-base`. Alinhamento pela coluna de valor.

Não use linha de metadados separada por pontos médios. Uma ficha diz o que cada valor é; a linha com pontos obriga o leitor a adivinhar.

### Carimbo de situação
O único elemento em caixa alta do sistema. Espaçamento de letra 0.18em, 11px, peso 500, moldura de 1px, fundo transparente, 3px 10px de padding.

- `PROPOSTA` — moldura tracejada em `--tinta-fraca`
- `EM REVISÃO` — moldura sólida em `--tinta-media`
- `HOMOLOGADO` — moldura e texto em `--marca-granada`

Enquanto o parecer é proposta, a moldura é tracejada. Quando o humano assina, ela fecha. A transição do tracejado para o sólido é a metáfora central da interface, e custa uma linha de CSS.

### Citação de evidência
```
│ "A entrevista afirma que não houve leitura indevida no banco local."
│ 
│ PRJ27-EV10   transcricao_entrevista_tecnica.pdf   pergunta 3   declaratória
```
Filete esquerdo de 2px na cor da força probatória, recuo de 16px, texto em Spectral 16px, linha de procedência em `--t-ficha` com os IDs em IBM Plex Mono. Sem fundo, sem card, sem aspas decorativas grandes.

Força probatória pelo filete: primária `--tinta`, derivada `--tinta-media`, declaratória `--tinta-fraca` tracejado.

### Linha de critério
Número à esquerda em mono, filete, nome do critério, estado por extenso na cor da classe. O estado é **palavra**, não pill colorida. Se precisar de marcador, um filete de 3px antes da palavra.

### Botões
Primário: fundo granada, texto branco, 4px de raio, peso 500. Secundário: moldura `--filete-forte`, texto `--tinta`. Terciário: só texto sublinhado na espessura do filete.

Rótulo diz o que acontece: **Homologar parecer**, não "Confirmar". **Discordar deste ponto**, não "Rejeitar".

### Tabela
Linhas de 44px, divisória de 1px apenas entre linhas (nunca grade completa), cabeçalho em `--t-ficha` sem fundo cinza, números alinhados à direita com `tnum`. Zebra striping não — é ruído em tabela de 8 linhas.

---

## 8. O que não fazer

Esta lista existe porque você pediu que não parecesse feito por ferramenta de IA. São os tells:

- Gradiente em qualquer lugar. Nenhum. Nem em botão, nem em fundo, nem em texto.
- Glassmorphism, blur de fundo, transparência decorativa.
- Cantos de 12px ou mais. Card flutuando com sombra suave sob tudo.
- Emoji como ícone. Ícone colorido de biblioteca genérica. Ilustração 3D.
- Caixa alta espaçada como rótulo acima de cada seção. Só o carimbo.
- Linha de metadados grudada por pontos médios: `A · B · C`.
- Seta `→` colada no texto de botão e link.
- Tipografia gigante com peso 700 em título de seção.
- Badge colorida preenchida para cada atributo. Estado é palavra, não pílula.
- Animação de entrada com fade-and-slide em cada card ao rolar a página.
- Centralizar texto técnico.
- Dark mode roxo.
- Espaço em branco decorativo. Aqui o espaço é estrutural: separa blocos de informação, não "respira".

**Teste de mesa:** imprima a tela em preto e branco. Se continuar legível e hierarquizada, está certo. Se depender de cor para funcionar, está errado.

---

## 9. Movimento

Uma única transição no sistema inteiro, e ela carrega significado: **a recomposição da classe quando o analista discorda de um ponto**.

Dura 400ms. A classe anterior esmaece para `--tinta-fraca` com um risco horizontal, a nova entra na cor da classe. Nada mais se move na tela.

Fora isso: mudanças de estado em 120ms linear, e só onde respondem a uma ação da pessoa — abrir um critério, fechar um menu. Nenhuma animação disparada por rolagem. `prefers-reduced-motion` desliga tudo, inclusive a recomposição, que vira troca instantânea.

---

## 10. Tokens prontos

```css
:root {
  --marca-granada: #A6193C;
  --marca-granada-escuro: #7E122D;
  --marca-laranja: #FF8A22;

  --papel: #FFFFFF;
  --fundo: #F3F3F1;
  --filete: #E0DEDA;
  --filete-forte: #C9C6C1;
  --tinta: #231F20;
  --tinta-media: #6B6762;
  --tinta-fraca: #96918A;

  --classe-elegivel: #2F6B4F;
  --classe-ressalvas: #B06C1E;
  --classe-nao-elegivel: #52504E;
  --classe-insuficiente: #3A5A78;

  --alerta: #C2410C;
  --alerta-fundo: #FDF4EC;

  --fonte-ui: "Heebo", system-ui, sans-serif;
  --fonte-doc: "Spectral", Georgia, serif;
  --fonte-id: "IBM Plex Mono", ui-monospace, monospace;

  --raio: 4px;
  --e1: 4px;  --e2: 8px;  --e3: 12px;
  --e4: 16px; --e5: 24px; --e6: 32px; --e7: 48px;

  --elevado: 0 2px 8px rgba(35, 31, 32, .12);
}

body {
  background: var(--fundo);
  color: var(--tinta);
  font-family: var(--fonte-ui);
  font-size: 14px;
  line-height: 1.6;
  font-feature-settings: "tnum" 1;
  -webkit-font-smoothing: antialiased;
}
```

Fontes pelo Google Fonts: `Heebo:wght@400;500;700`, `Spectral:wght@400;500`, `IBM+Plex+Mono:wght@400;500`.

---

## 11. Acessibilidade

- Foco visível sempre: `outline: 2px solid var(--marca-laranja); outline-offset: 2px;` — o laranja é o único lugar onde ele aparece com força, e serve para algo.
- Classe nunca comunicada só por cor: há a palavra e o filete.
- Toda a interface navegável por teclado. A revisão ponto a ponto é fluxo de teclado: Tab entre critérios, Enter abre, 1/2/3 para concordar, ajustar ou discordar.
- Alvos de clique com no mínimo 32px de altura.
- Contraste mínimo AA em todo texto; AAA no corpo do parecer.
```
