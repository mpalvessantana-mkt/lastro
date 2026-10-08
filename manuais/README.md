# Corpus normativo do LASTRO — v2026.1

40 dispositivos extraídos **literalmente** dos PDFs oficiais, no schema `Norma` da seção 10 do `CLAUDE.md`. Alimenta a coleção `normas` do Firestore.

## Arquivos

| Arquivo | Conteúdo | Normas |
|---|---|---|
| `00-indice.json` | metadados dos 6 documentos-fonte | — |
| `01-lei-11196-2005.json` | Lei do Bem, Capítulo III, arts. 17 a 26 | 9 |
| `02-in-rfb-1187-2011.json` | IN RFB 1.187/2011 — as 5 categorias e as exclusões | 15 |
| `03-manual-frascati.json` | Frascati 2002 — critério fundamental e P&D em software | 10 |
| `04-guia-pratico-mcti.json` | Guia Prático MCTI — campos do FORMP&D e alerta de glosa | 3 |
| `05-guia-anpei.json` | encaixe vazio, com a razão registrada | 0 |
| `06-guia-desafio-sts.json` | regras do desafio em linguagem operacional | 3 |
| `corpus-completo.json` | tudo junto, pronto para o seed | 40 |

## Como foi gerado

Nenhum campo `texto` foi digitado. Cada dispositivo foi **fatiado por marcador** do texto extraído do PDF e validado por comparação normalizada contra o documento de origem. Zero falhas na validação.

Isso existe porque a regra 4 do projeto proíbe citar lei de memória: tudo que aparece num parecer precisa ser conferível no PDF oficial.

## Seed

```ts
import corpus from "../corpus-normativo/corpus-completo.json";

const lote = db.batch();
for (const n of corpus.normas) lote.set(db.collection("normas").doc(n.id), n);
await lote.commit();
```

As security rules do `CLAUDE.md` deixam `normas` como leitura para autenticados e escrita bloqueada — rode o seed pelo Admin SDK.

## Os cinco dispositivos que mais vão aparecer nos pareceres

| ID | Por quê |
|---|---|
| `FRASCATI-P84` | O critério fundamental: novidade não insignificante + dissipação de incerteza. Define o teste do especialista — a solução não pode parecer óbvia a quem domina as técnicas do setor. |
| `FRASCATI-P141` | A lista do que **não** é P&D em software: uso de métodos conhecidos, suporte, conversão, adaptação de software existente, depuração, documentação. Casa com os 7 projetos "Não elegível" da base de referência. |
| `IN1187-ART2-II-C` | Define desenvolvimento experimental — a categoria da maioria dos projetos de TI do banco. |
| `IN1187-ART2-PU` | As exclusões: coordenação administrativa e financeira e serviços indiretos não são PD&I, mesmo dentro de um projeto de PD&I. |
| `FRASCATI-P138` | A falha pode ser P&D. Fundamento literal para a regra 10 do projeto e para a classe "Com ressalvas". |

## Três coisas que você precisa saber

**O Frascati entregue é a edição 2002, não a 2015.** A enumeração nomeada dos cinco critérios — novo, criativo, incerto, sistemático, transferível — é da edição 2015, que não está neste PDF. Na edição 2002 o equivalente é o § 84, que combina novidade e incerteza num único critério fundamental. Por isso as cinco perguntas no corpus vêm do Guia do Desafio (`DESAFIO-5PERGUNTAS`), que as formula em português e é documento oficial do evento. Se a banca perguntar de onde saíram os cinco critérios, a resposta honesta é essa.

**O critério 5 tem só 2 normas associadas.** Transferibilidade é pouco tratada na legislação brasileira. Como ele é justamente o discriminador entre Elegível e Com ressalvas, a fundamentação dele vai se apoiar mais na evidência do projeto do que na norma. É esperado, não é lacuna do corpus.

**O guia ANPEI ficou de fora.** É diagramado em colunas e a extração embaralha a ordem de leitura. Uma citação corrompida não pode sustentar um parecer de defesa. O arquivo `05-guia-anpei.json` tem a estrutura pronta: se quiserem usar, transcrevam o trecho manualmente do PDF e acrescentem no mesmo schema. As seções mais úteis estão listadas lá dentro.

## Para acrescentar uma norma

```json
{
  "id": "DECRETO5798-ART2",
  "fonte": "DECRETO_5798",
  "dispositivo": "Art. 2º",
  "ementa": "uma linha legível por leigo",
  "texto": "transcrição literal do dispositivo",
  "tags": ["conceito"],
  "criteriosRelacionados": [1, 3],
  "categoriasRelacionadas": ["DE"],
  "vigenciaInicio": "2006-06-07",
  "vigenciaFim": null,
  "versaoCorpus": "2026.1",
  "nota": "",
  "procedencia": { "documento": "...", "orgao": "...", "arquivoOrigem": "...", "extraidoLiteralmente": true }
}
```

O Decreto 5.798/2006 é citado pela lei mas não estava entre os PDFs enviados. Vale acrescentar — ele regulamenta e conceitua tecnicamente as atividades.

**Para atualizar uma norma**, nunca edite o texto: crie o novo documento e preencha `vigenciaFim` no antigo. O parecer grava a `versaoCorpus` que usou, e é isso que permite reconstruir, anos depois, qual regra valia na data da decisão.
