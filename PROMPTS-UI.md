# LASTRO — Prompts de geração de telas (Gemini)

Para o desenvolvedor front-end gerar referências visuais antes de codar.

**Como usar:** cole o **BLOCO BASE** e logo em seguida o prompt da tela, no mesmo campo. O bloco base é o que faz as oito imagens parecerem o mesmo produto — nunca gere uma tela sem ele.

**Ordem recomendada:** 1 → 3 → 2 → 5 → 6 → 4 → 7 → 8. A tela 1 é a mais importante; acerte ela primeiro e as outras herdam a linguagem.

**Expectativa realista:** modelo de imagem erra texto pequeno e inventa palavra. Trate o resultado como **direção de layout, densidade e hierarquia**, não como copy final. O texto certo está no `CLAUDE.md`.

---

## BLOCO BASE — colar antes de todo prompt

```
Mockup de interface web de alta fidelidade. Captura de tela de desktop 1440x900,
design plano e profissional, vista frontal perfeita, sem perspectiva, sem moldura
de navegador, sem mãos, sem pessoas, sem fotografia, sem maquete em notebook.

Produto: LASTRO — sistema interno de apoio à decisão de um banco público brasileiro,
para análise de elegibilidade de projetos na Lei do Bem. Usuário: analista técnico.
Tom institucional, sóbrio e denso de informação. É uma ferramenta de trabalho de
quem passa o dia nela, não uma landing page.

PALETA:
- Fundo da página #F7F7F4 (off-white levemente quente)
- Cards e superfícies #FFFFFF, borda 1px #E3E2DD, cantos arredondados de 8px
- Texto principal #1A1A18, texto secundário #6B6A65, divisórias #EDECE7
- Verde institucional #0F5132 para marca e ação primária
- Cores de classificação: Elegível #0F5132 · Com ressalvas #9A6700 ·
  Não elegível #44403C · Evidência insuficiente #2C4F7C
- Vermelho #B42318 APENAS em alertas. Nunca para classificação.

TIPOGRAFIA: Inter na interface, pesos 400/500/600. Trechos de evidência citada em
fonte serifada. Tamanhos pequenos e densos. Hierarquia por peso e cor, nunca por
texto gigante. Rótulos de seção em caixa alta, 11px, espaçamento entre letras.

REGRAS VISUAIS: sem gradiente, sem glassmorphism, sem sombra forte, sem ilustração
3D, sem emoji, sem ícone colorido genérico. Ícones de linha fina monocromáticos.
Layout compacto com respiro interno generoso nos cards. Todo o texto em português
do Brasil, nítido e legível.
```

---

## TELA 1 — Parecer proposto *(a principal)*

```
Tela: o parecer gerado automaticamente, aguardando revisão do analista.

Barra superior fina: à esquerda a marca "LASTRO" em verde #0F5132; ao centro os
itens de menu "Casos · Referência · Auditoria"; à direita um avatar circular
monocromático com o texto "Ana Ribeiro · Analista".

Abaixo, um cabeçalho de caso: "PRJ27 — Assistente para dúvidas sobre cobrança e
boletos", e em linha menor e cinza "Atendimento de Cobrança · 8 semanas · 14 de 14
arquivos lidos · análise concluída em 38 segundos".

À direita desse cabeçalho, um bloco de destaque com borda esquerda grossa na cor
âmbar #9A6700: rótulo pequeno "CLASSIFICAÇÃO PROPOSTA", abaixo em texto grande
"Com ressalvas", e abaixo uma etiqueta discreta de contorno tracejado escrito
"PROPOSTA — aguarda decisão do analista".

Corpo principal em duas colunas, 70% e 30%.

Coluna esquerda: cinco cards empilhados, um por critério, todos recolhidos, cada um
em uma linha com: número do critério em círculo de contorno, nome do critério,
o estado em etiqueta colorida, e à direita três botões pequenos lado a lado
"Concordo", "Ajustar", "Discordo".
1. Novidade — etiqueta verde "DEMONSTRADA NO RECORTE"
2. Criatividade técnica — etiqueta verde "DEMONSTRADA NO RECORTE"
3. Incerteza tecnológica — etiqueta verde "INVESTIGADA"
4. Sistematicidade — etiqueta verde "DOCUMENTADA"
5. Transferência e reprodução — etiqueta âmbar "DOCUMENTADA COM LIMITE"
O card 5 aparece levemente destacado, com fundo creme muito claro.

Acima dos cards, uma barra discreta: "0 de 5 pontos revisados" com um botão de
contorno escrito "Aceitar todos".

Coluna direita: três blocos pequenos empilhados.
- "Divergências entre fontes — 2 pendentes", com duas linhas de lista
- "Conferência numérica — 6 de 6 ensaios recalculados e conferidos"
- "Lacunas — 1 identificada"
```

---

## TELA 2 — Critério expandido *(a prova de rastreabilidade)*

```
Mesma tela do parecer, agora com o quinto card expandido e os outros quatro
recolhidos acima dele.

O card expandido, "5. Transferência e reprodução", ocupa a maior parte da tela e
contém, de cima para baixo:

Linha de topo: o número 5 em círculo, o nome do critério, e a etiqueta âmbar
"DOCUMENTADA COM LIMITE".

Bloco "POR QUE ESTE ESTADO" — rótulo em caixa alta pequena, seguido de um parágrafo
de texto corrido explicando que a evidência sustenta a investigação dentro do recorte
ensaiado, mas há uma pretensão que permanece sem validação.

Bloco "EVIDÊNCIAS CITADAS" — três citações empilhadas, cada uma num retângulo de
fundo #FBFBF8 com barra lateral esquerda fina. Cada citação tem o trecho em fonte
serifada entre aspas, e abaixo, em cinza pequeno, a origem: "PRJ27-EV06 ·
evidencias/metodo.md #6" e uma etiqueta minúscula de contorno escrito "PRIMÁRIA".
Uma terceira citação traz a etiqueta "CONTRÁRIA" em contorno âmbar.

Bloco "FUNDAMENTO NORMATIVO" — um card estreito com ícone de documento em linha,
o texto "Manual de Frascati — critério de transferibilidade" e abaixo, menor,
a transcrição do dispositivo em duas linhas.

Rodapé do card: três botões lado a lado, "Concordo" preenchido em verde #0F5132,
"Ajustar" e "Discordo" em contorno cinza.

Painel lateral direito estreito, rotulado "REFERÊNCIA DE FUNDAMENTAÇÃO": texto
"Este estado aparece em 4 projetos históricos" e uma lista com PRJ05, PRJ06,
PRJ07 e PRJ18, cada um com uma linha de resumo em cinza.
```

---

## TELA 3 — Upload e leitura em andamento

```
Tela de entrada de um novo caso, com o processamento acontecendo.

Centro da tela, uma área retangular grande de borda tracejada #D6D5CF, cantos de
12px, fundo branco. Dentro dela, um ícone de pasta em linha fina e o texto
"Arraste a pasta do projeto ou um arquivo .zip", com uma linha menor em cinza
"PRJ21 a PRJ40 · 14 arquivos por projeto".

Abaixo dessa área, um painel de progresso em andamento, com título "Lendo PRJ27"
e uma lista vertical de etapas. As etapas concluídas têm um traço de confirmação
fino em verde; a etapa atual tem um indicador de carregamento circular; as futuras
estão em cinza claro:
  concluído — "14 arquivos localizados e indexados"
  concluído — "Método fatiado em 7 seções"
  concluído — "6 ensaios recalculados a partir das medições"
  em andamento — "Cruzando 10 campos espelhados entre as fontes"
  pendente — "Redigindo o parecer"

À direita, uma coluna estreita listando os arquivos lidos, em fonte monoespaçada
pequena, com um traço de confirmação ao lado de cada: dossie_projeto.pdf,
registro_tecnico.pdf, atividades.xlsx, inventario_evidencias.csv,
evidencias/metodo.md, evidencias/medicoes.csv, evidencias/resultados.csv,
transcricao_entrevista_tecnica.pdf, evidencias/revisao_tecnica.md.
```

---

## TELA 4 — A discordância recompondo a classe *(o momento do pitch)*

```
Mesma tela do parecer, no instante em que o analista discorda de um ponto.

O card do critério 1, "Novidade", está aberto em modo de edição. Mostra um seletor
com três opções em formato de botão de rádio em lista:
  "DEMONSTRADA NO RECORTE" — com uma etiqueta cinza minúscula escrito "proposto"
  "NÃO DEMONSTRADA" — selecionado, com anel de foco verde
  "INDETERMINADA"
Abaixo, um campo de texto aberto, obrigatório, com o rótulo "Por que você discorda
da proposta?" e um cursor piscando numa frase já iniciada.

No topo da tela, o bloco da classificação mostra a transição: à esquerda, em cinza
claro e riscado, "Com ressalvas"; uma seta curta; à direita, em destaque com borda
esquerda grossa cinza-ardósia #44403C, "Não elegível". Acima deles, um rótulo
pequeno escrito "RECOMPOSTA AGORA".

Uma faixa discreta de aviso em fundo creme atravessa abaixo do cabeçalho:
"A alteração deste ponto mudou a classificação. O motivo será registrado no parecer."

Os outros quatro cards seguem recolhidos e visíveis abaixo.
```

---

## TELA 5 — Confronto entre fontes

```
Tela dedicada às divergências encontradas entre o depoimento e os registros.

Título "Divergências entre fontes" e abaixo, em cinza, "2 pendentes · 1 resolvida".

Lista de cards largos. O primeiro card está aberto e dividido em duas metades por
uma linha vertical central:

Metade esquerda, fundo branco: rótulo "O QUE A ENTREVISTA AFIRMA", abaixo o trecho
em fonte serifada entre aspas, e no rodapé a origem "PRJ27-EV10 ·
transcricao_entrevista_tecnica.pdf · pergunta 3" com uma etiqueta de contorno
escrito "DECLARATÓRIA".

Metade direita, fundo #FBFBF8: rótulo "O QUE O REGISTRO MOSTRA", o trecho em
serifada, e a origem "PRJ27-EV08 · evidencias/medicoes.csv · ensaio PRJ27-S04"
com etiqueta de contorno verde escrito "PRIMÁRIA".

Abaixo das duas metades, uma faixa de decisão: rótulo "PREVALECE" e dois botões
grandes lado a lado, "A entrevista" e "O registro" — o segundo selecionado com
anel verde. Ao lado, um campo de texto preenchido com uma linha explicando que o
registro prevalece por ser primário e identificado por versão e ensaio.

No pé do card, um bloco de fundo cinza-claro com o rótulo "COMO ENTRARÁ NO PARECER"
e o texto final formatado em uma frase corrida.

Abaixo, um segundo card recolhido, apenas com o título da divergência e um aviso
âmbar "pendente".
```

---

## TELA 6 — O documento final arquivado

```
Tela de visualização do parecer homologado e congelado.

Barra de ação no topo, fina, com fundo branco: à esquerda o texto "Parecer PRJ27 ·
versão 1 · homologado em 07/10/2026"; ao centro uma etiqueta sólida verde escuro
#0F5132 com texto branco "HOMOLOGADO — IMUTÁVEL"; à direita dois botões,
"Exportar PDF" preenchido em verde e "Ver trilha de auditoria" em contorno.

Abaixo, a prévia do documento em formato de página A4 branca centralizada sobre o
fundo off-white, com sombra sutil, ocupando a maior parte da tela, levemente cortada
na base para sugerir continuação.

Dentro da página: cabeçalho institucional com o nome LASTRO em pequeno, o título
"Parecer de enquadramento preliminar — Lei do Bem", e uma tabela de identificação de
quatro linhas com rótulo à esquerda e valor à direita, incluindo uma linha
"Hash do pacote" com um código hexadecimal truncado em fonte monoespaçada.

Em seguida, uma seção numerada "2. Classificação" com três linhas em destaque:
"Classe homologada: Não elegível", "Classe proposta pela ferramenta: Com ressalvas",
"Houve divergência do analista: sim — motivo registrado no ponto 1".

Abaixo, o início da seção "3. Os cinco critérios", com o primeiro critério já
visível, mostrando o estado, um parágrafo de justificativa e uma citação recuada
em fonte serifada com a referência em cinza.

À esquerda da página, uma coluna estreita de navegação com os dez títulos de seção
do documento, o segundo marcado como ativo.
```

---

## TELA 7 — Lista de casos

```
Tela inicial de trabalho, com os casos em análise.

Título "Casos em análise" e, à direita, um botão preenchido verde #0F5132 com o
texto "Analisar novo projeto".

Abaixo, quatro blocos pequenos de contagem lado a lado, cada um com um número grande
e um rótulo pequeno, com um filete colorido no topo na cor da classe:
"3 Elegível" verde · "2 Com ressalvas" âmbar · "4 Não elegível" cinza-ardósia ·
"1 Evidência insuficiente" azul-ardósia. Um quinto bloco neutro: "2 Em revisão".

Abaixo, uma tabela densa de linhas finas com as colunas: Caso · Título · Equipe ·
Classe · Situação · Pontos revisados · Atualizado em.
Oito linhas de dados, com identificadores PRJ21 a PRJ28. A coluna Classe traz a
etiqueta colorida; a coluna Situação traz palavras como "Proposto", "Em revisão",
"Homologado"; a coluna Pontos revisados traz indicadores como "5/5", "2/5", "0/5".
Uma das linhas, ainda sem classe, mostra em vez da etiqueta um texto cinza
"lendo arquivos…" com um indicador de progresso fino.

Barra de filtros acima da tabela, discreta: campo de busca com ícone de lupa e três
seletores em contorno, "Classe", "Situação" e "Equipe".
```

---

## TELA 8 — Base de referência *(os 20 históricos)*

```
Tela de consulta aos projetos históricos já classificados.

Título "Base de referência" e abaixo, em cinza, a linha
"20 projetos classificados · usados para calibrar a régua e consultar precedente.
Nunca entram no cálculo de um caso novo."

À esquerda, uma coluna de filtros estreita com dois grupos de caixas de seleção:
"Classe" com as quatro opções, e "Estado do critério" com uma lista mais longa de
estados em texto pequeno.

À direita, uma grade de cards pequenos, quatro por linha, cinco linhas. Cada card tem:
borda superior grossa na cor da classe, o identificador PRJ01 a PRJ20 em fonte
monoespaçada, o título do projeto em duas linhas, e no rodapé cinco quadradinhos
minúsculos lado a lado representando os cinco critérios, cada um preenchido na cor
do seu estado — formando uma assinatura visual distinta para cada projeto.

Um dos cards, o PRJ18, está em estado de foco com anel verde, e ao seu lado abre-se
um painel lateral com o título "PRJ18 — Motor de regras auditável", a etiqueta âmbar
"Com ressalvas", e abaixo os cinco critérios listados com seus estados e as duas
primeiras linhas da justificativa de cada um.
```

---

## Prompts de refinamento

Depois de gerar, não refaça do zero. Peça alteração pontual:

```
Mantenha exatamente este layout, esta paleta e esta tipografia.
Altere apenas: [a mudança].
```

Variações que valem gerar na tela 1:

```
…gere uma variante em que os cinco cards aparecem como uma lista de linhas finas
sem card individual, separadas por divisórias, mais densa e tabular.
```

```
…gere uma variante com a coluna de resumo à esquerda em vez de à direita, e os
cards do critério ocupando toda a largura restante.
```

```
…gere a mesma tela no tema escuro: fundo #16161A, superfícies #1E1E22,
texto #ECECE8, mantendo as mesmas cores de classificação com saturação ajustada.
```

---

## Bônus — marca

```
Símbolo de marca para "LASTRO", software institucional de um banco brasileiro.
Monograma geométrico abstrato, apenas contorno, traço de espessura constante,
inspirado na ideia de âncora e de camadas que se sustentam — sem desenhar uma
âncora literal. Uma cor sólida, verde #0F5132, sobre fundo branco. Vetorial,
plano, simétrico, legível a 24 pixels. Sem texto, sem sombra, sem gradiente,
sem mascote.
```

```
Lockup horizontal: o símbolo à esquerda e a palavra "LASTRO" à direita em
tipografia sem serifa, peso médio, espaçamento entre letras levemente ampliado,
na mesma cor verde #0F5132. Fundo branco, alinhamento óptico centralizado.
```

---

## Três coisas para não deixar o modelo estragar

**A marca de proposta.** Tudo que a máquina sugeriu precisa parecer sugestão até o humano confirmar. Se o modelo gerar os estados com aparência de fato consumado, insista: "as etiquetas de estado devem ter contorno tracejado enquanto não revisadas, e contorno sólido depois".

**Não elegível não é vermelho.** É uma conclusão técnica legítima, não um erro. Se o modelo pintar de vermelho, corrija — o vermelho fica reservado para alerta de verdade.

**Densidade.** Modelo de imagem tende a inflar espaçamento e aumentar fonte, deixando a tela com cara de site de marketing. Se vier arejado demais, peça: "aumente a densidade de informação, reduza os tamanhos de fonte e o espaçamento vertical, aproxime da densidade de um painel financeiro profissional".
