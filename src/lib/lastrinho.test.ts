import { test } from "node:test";
import assert from "node:assert/strict";
import { auditarReferencias, selecionarNormas, notaNaoVerificadas } from "./lastrinho";
import { corpusNormativo } from "../motor/corpus";

test("ID do corpus citado entra em normasCitadas e cobre a menção ao artigo", () => {
  const r = auditarReferencias("O Art. 17, § 1º trata do benefício [LEI11196-ART17].", corpusNormativo);
  assert.deepEqual(r.normasCitadas, ["LEI11196-ART17"]);
  assert.deepEqual(r.naoVerificadas, []);
});

test("artigo citado de memória, sem normaId, é não verificado", () => {
  const r = auditarReferencias("Segundo o Art. 17 da Lei 11.196/2005, há dedução.", corpusNormativo);
  assert.deepEqual(r.normasCitadas, []);
  assert.deepEqual(r.naoVerificadas, ["Art. 17"]);
});

test("nome da lei do corpus não é dispositivo; lei de fora é não verificada", () => {
  const r = auditarReferencias("A Lei nº 11.196/2005 e a IN RFB 1.187 regem o tema; ver também Lei 13.243/2016.", corpusNormativo);
  assert.deepEqual(r.naoVerificadas, ["Lei 13.243/2016"]);
});

test("parágrafo do Frascati coberto pelo ID; acórdão é não verificado", () => {
  const r = auditarReferencias("O § 138 [FRASCATI-P138] define incerteza. O Acórdão 1402-003.123 do CARF diverge.", corpusNormativo);
  assert.deepEqual(r.normasCitadas, ["FRASCATI-P138"]);
  assert.deepEqual(r.naoVerificadas, ["Acórdão 1402-003.123"]);
});

test("artigo com número diferente do citado é não verificado", () => {
  const r = auditarReferencias("Ver [LEI11196-ART17] e o Art. 20.", corpusNormativo);
  assert.deepEqual(r.naoVerificadas, ["Art. 20"]);
});

test("seleção por sobreposição de palavras e por ID na pergunta", () => {
  const porId = selecionarNormas("o que diz FRASCATI-P138?", corpusNormativo);
  assert.equal(porId[0].id, "FRASCATI-P138");
  const porTermo = selecionarNormas("incerteza tecnológica", corpusNormativo);
  assert.ok(porTermo.length > 0 && porTermo.length <= 6);
  assert.deepEqual(selecionarNormas("oi", corpusNormativo), []);
});

test("nota só aparece quando há menção não verificada", () => {
  assert.equal(notaNaoVerificadas([]), "");
  assert.match(notaNaoVerificadas(["Art. 20"]), /não verificada/);
});

test("§ é comparado pelo número exato, não por prefixo", () => {
  // "§ 1" não pode ser coberto por "§ 135" do Frascati
  const r = auditarReferencias("Ver o § 1 [FRASCATI-P135].", corpusNormativo);
  assert.deepEqual(r.naoVerificadas, ["§ 1"]);
});

test("§ que existe no texto de uma norma citada é coberto", () => {
  const r = auditarReferencias("* [LEI11196-ART17]: rol dos incentivos.\n  * O conceito de inovação (§ 1º).", corpusNormativo);
  assert.deepEqual(r.naoVerificadas, []);
});
