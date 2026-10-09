import { test } from "node:test";
import assert from "node:assert/strict";
import { validarRespostaIA, jsonSchemaExtracao } from "./schemas";

const TEXTO = "## 1. Referência anterior\nO comparador perde a ordem dos eventos quando a fila reinicia.";
const IDS = ["PRJ21-EV06", "PRJ21-S03"];
const ctx = { textoEvidencias: TEXTO, idsValidos: IDS };

function resposta(sobrescrever: Record<string, unknown> = {}, trecho: Record<string, unknown> = {}) {
  return {
    trechos: [
      {
        evidenciaId: "PRJ21-EV06",
        seletor: "#1",
        trecho: "O comparador perde a ordem dos eventos",
        sentido: "FAVORAVEL",
        normaId: "LEI11196-ART17",
        ...trecho
      }
    ],
    porqueRedigido: "O método (PRJ21-EV06, metodo.md#1) registra que o comparador perde a ordem dos eventos.",
    lacunaIdentificada: null,
    ...sobrescrever
  };
}

test("resposta íntegra é aceita", () => {
  const r = validarRespostaIA(resposta(), ctx);
  assert.equal(r.ok, true);
});

test("fora do schema é descartada", () => {
  assert.equal(validarRespostaIA({ trechos: "x" }, ctx).ok, false);
  assert.equal(validarRespostaIA(resposta({}, { sentido: "NEUTRO" }), ctx).ok, false);
  assert.equal(validarRespostaIA(resposta({}, { trecho: "" }), ctx).ok, false);
});

test("trecho parafraseado é descartado", () => {
  const r = validarRespostaIA(resposta({}, { trecho: "O comparador perdia a ordem" }), ctx);
  assert.deepEqual(r, { ok: false, motivo: 'trecho não literal: "O comparador perdia a ordem"' });
});

test("evidenciaId inventado é descartado", () => {
  const r = validarRespostaIA(resposta({}, { evidenciaId: "PRJ21-EV99" }), ctx);
  assert.equal(r.ok, false);
});

test("ID inventado no seletor ou no texto redigido é descartado", () => {
  assert.equal(validarRespostaIA(resposta({}, { seletor: "PRJ21-S09" }), ctx).ok, false);
  assert.equal(validarRespostaIA(resposta({}, { seletor: "PRJ21-S03" }), ctx).ok, true);
  assert.equal(validarRespostaIA(resposta({ porqueRedigido: "Conforme PRJ21-ATV04." }), ctx).ok, false);
  assert.equal(validarRespostaIA(resposta({ lacunaIdentificada: "Falta PRJ21-EV15." }), ctx).ok, false);
});

test("normaId fora do corpus é descartado; null é aceito", () => {
  assert.equal(validarRespostaIA(resposta({}, { normaId: "LEI11196-ART99" }), ctx).ok, false);
  assert.equal(validarRespostaIA(resposta({}, { normaId: null }), ctx).ok, true);
});

test("palavra de conclusão no texto redigido é descartada", () => {
  for (const p of ["é elegível", "não elegíveis", "Inelegível", "foi aprovado", "reprovada"]) {
    assert.equal(validarRespostaIA(resposta({ porqueRedigido: `O projeto ${p}.` }), ctx).ok, false, p);
  }
  // "provado" não é palavra de conclusão (regra 5 usa o termo)
  assert.equal(validarRespostaIA(resposta({ porqueRedigido: "A entrevista não está provada no registro." }), ctx).ok, true);
});

test("trecho literal do pacote pode conter palavra proibida (ex.: 'sem limiares aprovados')", () => {
  const texto = "O plano segue sem limiares aprovados.";
  const r = validarRespostaIA(resposta({}, { trecho: "sem limiares aprovados" }), { textoEvidencias: texto, idsValidos: IDS });
  assert.equal(r.ok, true);
});

test("sem IDs válidos, nenhuma citação é aceita", () => {
  assert.equal(validarRespostaIA(resposta(), { textoEvidencias: TEXTO, idsValidos: [] }).ok, false);
  assert.equal(validarRespostaIA(resposta({ trechos: [], porqueRedigido: "" }), { textoEvidencias: TEXTO, idsValidos: [] }).ok, true);
});

test("JSON Schema do Gemini vem do mesmo zod", () => {
  const s = jsonSchemaExtracao();
  assert.equal(s.$schema, undefined);
  assert.equal(s.type, "object");
  assert.deepEqual((s.required as string[]).sort(), ["lacunaIdentificada", "porqueRedigido", "trechos"]);
});

test("com textosPorId, o trecho precisa estar na evidência que ele cita", () => {
  const textosPorId = { "PRJ21-EV06": TEXTO, "PRJ21-EV12": "Revisão sem o trecho." };
  const base = { textoEvidencias: `${TEXTO}\nRevisão sem o trecho.`, idsValidos: [...IDS, "PRJ21-EV12"], textosPorId };
  assert.equal(validarRespostaIA(resposta(), base).ok, true);
  assert.equal(validarRespostaIA(resposta({}, { evidenciaId: "PRJ21-EV12" }), base).ok, false);
});

test("palavra proibida dentro de citação literal do pacote não é conclusão da IA", () => {
  const texto = "O escopo é conformidade com dicionário aprovado. Nada mais.";
  const c = { textoEvidencias: texto, idsValidos: IDS };
  const base = resposta({}, { trecho: "O escopo é conformidade com dicionário aprovado." });
  for (const aspas of [["'", "'"], ['"', '"'], ["“", "”"]]) {
    const porque = `Conforme PRJ21-EV06, ${aspas[0]}O escopo é conformidade com dicionário aprovado.${aspas[1]}`;
    assert.equal(validarRespostaIA({ ...base, porqueRedigido: porque }, c).ok, true, aspas[0]);
  }
  // fora de aspas, ou com aspas em texto que não está no pacote, continua barrado
  assert.equal(validarRespostaIA({ ...base, porqueRedigido: "O dicionário foi aprovado." }, c).ok, false);
  assert.equal(validarRespostaIA({ ...base, porqueRedigido: "O projeto é 'elegível no recorte'." }, c).ok, false);
});
