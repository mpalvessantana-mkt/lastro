import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { parseCSV, parseDecimal } from "./csv";
import { conferirAritmetica, LinhaMedicao, LinhaResultado } from "../aritmetica";

test("parseDecimal lê ponto como separador decimal", () => {
  assert.equal(parseDecimal("66.666667"), 66.666667);
  assert.equal(parseDecimal("100.0"), 100);
  assert.equal(parseDecimal("8"), 8);
  assert.equal(parseDecimal("-3.5"), -3.5);
  assert.equal(parseDecimal(" 12 "), 12);
});

test("parseDecimal: vazio nunca é zero", () => {
  assert.equal(parseDecimal(""), null);
  assert.equal(parseDecimal("   "), null);
  assert.equal(parseDecimal(null), null);
  assert.equal(parseDecimal(undefined), null);
});

test("parseDecimal rejeita formato fora do pacote", () => {
  assert.equal(parseDecimal("1,5"), null);
  assert.equal(parseDecimal("1.234.567"), null);
  assert.equal(parseDecimal("12abc"), null);
  assert.equal(parseDecimal("abc"), null);
});

test("conferência aritmética do PRJ01-S01 bate (CLAUDE.md §6.6)", () => {
  const dir = path.resolve(process.cwd(), "Arquivos/PRJ01/evidencias");
  const resultados = parseCSV<LinhaResultado>(fs.readFileSync(path.join(dir, "resultados.csv"), "utf-8"));
  const medicoes = parseCSV<LinhaMedicao>(fs.readFileSync(path.join(dir, "medicoes.csv"), "utf-8"));

  const s01 = conferirAritmetica(resultados, medicoes).find((e) => e.id === "PRJ01-S01");
  assert.ok(s01);
  assert.equal(s01.valor, 8);
  assert.equal(s01.baseDeCalculo, 12);
  assert.equal(s01.taxaPercentual, 66.666667);
  assert.equal(s01.conferido, true);
  assert.equal(s01.divergenciaRecalculo, null);
});
