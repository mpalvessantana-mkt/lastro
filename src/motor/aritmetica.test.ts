import { test } from "node:test";
import assert from "node:assert/strict";
import { conferirAritmetica, LinhaMedicao, LinhaResultado } from "./aritmetica";

let seq = 0;
function med(ensaio: string, campos: Partial<LinhaMedicao>): LinhaMedicao {
  return { registro_id: `${ensaio}-M${++seq}`, ensaio_id: ensaio, versao: "v1", cenario: "C", tipo: "medicao", metrica: "m", unidade: "", ...campos };
}
function res(ensaio: string, operacao: string, valor: string, base: string, extra: Partial<LinhaResultado> = {}): LinhaResultado {
  return { ensaio_id: ensaio, versao: "v1", metrica: "m", operacao, valor, base_de_calculo: base, descricao_base: "", taxa_percentual: "", unidade: "", fonte: "", natureza: "desempenho", ...extra };
}
const um = (r: LinhaResultado, m: LinhaMedicao[]) => conferirAritmetica([r], m)[0];

test("contagem: soma numeradores e denominadores do mesmo ensaio; taxa com a precisão declarada", () => {
  const m = [med("S1", { tipo: "contador", numerador: "5", denominador: "8" }), med("S1", { tipo: "contador", numerador: "3", denominador: "4" }), med("S2", { numerador: "99", denominador: "99" })];
  const e = um(res("S1", "contagem", "8", "12", { taxa_percentual: "66.666667" }), m);
  assert.equal(e.conferido, true, e.divergenciaRecalculo ?? "");
  assert.equal(e.recalculo, 8);
  assert.equal(um(res("S1", "contagem", "8", "12", { taxa_percentual: "66.7" }), m).conferido, true);
  assert.equal(um(res("S1", "contagem", "8", "12", { taxa_percentual: "66.6" }), m).conferido, false);
  assert.equal(um(res("S1", "contagem", "9", "12"), m).conferido, false);
});

test("contagem de entrega não admite taxa", () => {
  const m = [med("S1", { numerador: "3", denominador: "3" })];
  assert.equal(um(res("S1", "contagem", "3", "3", { natureza: "entrega" }), m).conferido, true);
  const e = um(res("S1", "contagem", "3", "3", { natureza: "entrega", taxa_percentual: "100.0" }), m);
  assert.equal(e.conferido, false);
  assert.match(e.divergenciaRecalculo!, /não admite taxa/);
});

test("média, mediana e diferença: base é a quantidade de valores, não divisor", () => {
  const m = [4, 1, 3, 2].map((v) => med("S1", { valor: String(v) }));
  assert.equal(um(res("S1", "media", "2.5", "4"), m).conferido, true);
  assert.equal(um(res("S1", "mediana", "2.5", "4"), m).conferido, true);
  assert.equal(um(res("S1", "diferenca_maior_menor", "3", "4"), m).conferido, true);
  assert.equal(um(res("S1", "mediana", "2.5", "5"), m).conferido, false, "base errada");
  const impar = [5, 1, 3].map((v) => med("S2", { valor: String(v) }));
  assert.equal(um(res("S2", "mediana", "3", "3"), impar).recalculo, 3);
});

test("percentil 95: acumula frequências até o posto teto(0,95 × total)", () => {
  // 100 observações: 90 em 10 ms, 5 em 20 ms, 5 em 50 ms → posto 95 → 20 ms
  const m = [med("S1", { tipo: "histograma", valor: "50", peso: "5" }), med("S1", { tipo: "histograma", valor: "10", peso: "90" }), med("S1", { tipo: "histograma", valor: "20", peso: "5" })];
  const e = um(res("S1", "percentil_95", "20", "100"), m);
  assert.equal(e.conferido, true, e.divergenciaRecalculo ?? "");
  assert.equal(um(res("S1", "percentil_95", "50", "100"), m).conferido, false);
});

test("valor observado e indicador transcrito: uma única medição, base 1", () => {
  const m = [med("S1", { valor: "660" })];
  assert.equal(um(res("S1", "valor_observado", "660", "1"), m).conferido, true);
  assert.equal(um(res("S1", "indicador_precalculado", "660", "1"), m).conferido, true);
  assert.equal(um(res("S1", "valor_observado", "661", "1"), m).conferido, false);
  const duas = [med("S2", { valor: "1" }), med("S2", { valor: "1" })];
  assert.match(um(res("S2", "valor_observado", "1", "1"), duas).divergenciaRecalculo!, /única medição/);
});

test("vazio não é zero; sem medição não é conferido; operação desconhecida diverge", () => {
  const m = [med("S1", { numerador: "0", denominador: "4" })];
  const vazio = um(res("S1", "contagem", "", "4"), m);
  assert.equal(vazio.valor, null);
  assert.equal(vazio.conferido, false);
  assert.match(vazio.divergenciaRecalculo!, /vazio não é zero/);
  assert.equal(um(res("S1", "contagem", "0", "4"), m).conferido, true);

  assert.match(um(res("S9", "contagem", "1", "1"), m).divergenciaRecalculo!, /nenhuma medição/);
  assert.match(um(res("S1", "moda", "1", "1"), m).divergenciaRecalculo!, /operação desconhecida/);
});
