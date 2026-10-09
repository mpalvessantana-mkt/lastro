import { test } from "node:test";
import assert from "node:assert/strict";
import { citarMarcadores, citarPorDerivacao, citarRestricoesDoLimite, citarConfrontos, sentidoDoEstado, FonteCitavel } from "./citacoes";
import { analisarPacote } from "./index";
import { Confronto, Evidencia } from "../types";

function evidencia(texto: string, id = "PRJ99-EV06"): Evidencia {
  return {
    id, tipo: "Método", arquivo: "evidencias/metodo.md", caminhoNoPacote: "evidencias/metodo.md",
    conteudoEsperado: "", observacaoInventario: "especificação", forcaProbatoria: "PRIMARIA",
    statusInventario: "Localizada", presente: true, textoExtraido: texto
  };
}
const inteira = (ev: Evidencia): FonteCitavel => ({ evidencia: ev, seletor: "#1", inicio: 0, fim: ev.textoExtraido!.length });

test("a citação é a frase literal do marcador, com offsets no arquivo", () => {
  const texto = "## 1. Referência anterior\r\nPrimeira frase. O comparador X perde 3% dos casos.\r\nOutra linha.";
  const ev = evidencia(texto);
  const [c] = citarMarcadores("PRJ99", 1, "DEMONSTRADA NO RECORTE", ["comparador"], [inteira(ev)]);
  assert.equal(c.trecho, "O comparador X perde 3% dos casos.");
  assert.equal(texto.slice(c.offsetInicio!, c.offsetFim!), c.trecho);
  assert.equal(c.evidenciaId, "PRJ99-EV06");
  assert.equal(c.forcaProbatoria, "PRIMARIA");
  assert.equal(c.sentido, "FAVORAVEL");
});

test("marcador curto casa palavra inteira: “mas” não é “mesmas”", () => {
  const ev = evidencia("As mesmas entradas foram usadas. O replay reproduz, mas inverte a ordem.");
  const [c] = citarMarcadores("PRJ99", 1, "DEMONSTRADA NO RECORTE", ["mas"], [inteira(ev)]);
  assert.equal(c.trecho, "O replay reproduz, mas inverte a ordem.");
});

test("marcador não localizado não gera citação aproximada", () => {
  const ev = evidencia("Texto sem o marcador procurado.");
  assert.deepEqual(citarMarcadores("PRJ99", 1, "NÃO DEMONSTRADA", ["receita do fornecedor"], [inteira(ev)]), []);
});

test("derivação herda a passagem com o sentido do novo estado", () => {
  const ev = evidencia("O manual já fornece o recurso.");
  const origem = citarMarcadores("PRJ99", 1, "NÃO DEMONSTRADA", ["manual"], [inteira(ev)]);
  const [d] = citarPorDerivacao("PRJ99", 3, "NÃO CARACTERIZADA", origem);
  assert.equal(d.criterioId, 3);
  assert.equal(d.trecho, origem[0].trecho);
  assert.notEqual(d.id, origem[0].id);
  assert.equal(d.sentido, "CONTRARIA");
});

test("sentido: positivos favoráveis; negativos, indeterminação e limite contrários", () => {
  assert.equal(sentidoDoEstado("DOCUMENTADA NO ESCOPO"), "FAVORAVEL");
  assert.equal(sentidoDoEstado("DOCUMENTADA COM LIMITE"), "CONTRARIA");
  assert.equal(sentidoDoEstado("PARCIAL"), "CONTRARIA");
  assert.equal(sentidoDoEstado("NÃO DEMONSTRADA"), "CONTRARIA");
});

test("marcador achado mas sem frase citável: estado não é proposto e vira lacuna", () => {
  // "não se reivindica" quebrado entre linhas: o detector acha (espaços colapsados), a frase não existe
  const metodo = "## 6. Limite da conclusão\nNão se\nreivindica nada além do ensaiado\n";
  const { parecer } = analisarPacote("PRJ99", "Teste", { "evidencias/metodo.md": metodo });
  assert.equal(parecer.pontos[5].estadoProposto, null);
  assert.deepEqual(parecer.pontos[5].citacoesPropostas, []);
  assert.ok(parecer.lacunas.some((l) => l.includes("nenhum trecho literal que o sustente")));
});

test("regra 9: frases do limite que restringem o alcance viram contrárias do critério 5", () => {
  const texto = "## 6. Limite da conclusão\nA documentação reconstrói as contagens. Não se reivindica validade externa.\n";
  const ev = evidencia(texto);
  const cs = citarRestricoesDoLimite("PRJ99", [inteira(ev)]);
  assert.deepEqual(cs.map((c) => c.trecho), ["Não se reivindica validade externa."]);
  assert.equal(cs[0].sentido, "CONTRARIA");
  assert.equal(cs[0].criterioId, 5);
  assert.equal(texto.slice(cs[0].offsetInicio!, cs[0].offsetFim!), cs[0].trecho);
});

test("regra 9: a afirmação perdedora do confronto vira CONTRADITÓRIA, só se for literal", () => {
  const texto = "4. Como ficou a conclusão da rodada?\nNo fechamento registrei 1.100 pares\ncorretos para o grafo.\n";
  const ev = { ...evidencia(texto, "PRJ99-EV10"), forcaProbatoria: "DECLARATORIA" as const };
  const confronto = (textoA: string): Confronto => ({
    id: "CF1", campoLogico: "resultados",
    afirmacaoA: { fonte: "entrevista", evidenciaId: "PRJ99-EV10", texto: textoA, forca: "DECLARATORIA" },
    afirmacaoB: { fonte: "medicoes", evidenciaId: "PRJ99-EV08", ensaioId: "PRJ99-S01", texto: "1.000/1.200", forca: "PRIMARIA" },
    prevalenciaSugerida: "B", prevalencia: "NAO_RESOLVIDO", razaoDaPrevalencia: "", textoFormatado: "",
    resolvidoPor: null, resolvidoEm: null
  });
  // Quebra de linha do PDF dentro da afirmação: o trecho é o recorte literal do arquivo
  const [c] = citarConfrontos("PRJ99", [confronto("No fechamento registrei 1.100 pares corretos para o grafo.")], [ev]);
  assert.equal(c.sentido, "CONTRADITORIA");
  assert.equal(c.criterioId, 4);
  assert.equal(c.forcaProbatoria, "DECLARATORIA");
  assert.equal(c.trecho, texto.slice(c.offsetInicio!, c.offsetFim!));
  assert.match(c.trecho, /^No fechamento registrei 1\.100 pares\ncorretos para o grafo\.$/);
  assert.deepEqual(citarConfrontos("PRJ99", [confronto("Frase que não está no depoimento.")], [ev]), []);
});
