import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { analisarPacote } from "./index";
import { lerPacote } from "./parsers/pacote";
import { resolverConfronto } from "./resolucao";

function lerBrutos(dir: string, prefixo = ""): Array<{ caminho: string; bytes: Uint8Array }> {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? lerBrutos(path.join(dir, e.name), `${prefixo}${e.name}/`)
      : [{ caminho: `${prefixo}${e.name}`, bytes: new Uint8Array(fs.readFileSync(path.join(dir, e.name))) }]
  );
}

// PRJ02 tem um confronto: entrevista (A, declaratória) × medições/resultados (B, primária).
async function prj02() {
  const { arquivos, naoLidos } = await lerPacote(lerBrutos(path.resolve(process.cwd(), "Arquivos", "PRJ02")));
  return analisarPacote("PRJ02", "", arquivos, { naoLidos });
}
const quem = { por: "Analista Demo", em: "2026-10-09T12:00:00.000Z" };

test("aceitar a sugestão mantém o texto do motor e a contraditória na afirmação A", async () => {
  const { parecer, evidencias } = await prj02();
  const conf = parecer.confrontos[0];
  const r = resolverConfronto(parecer, evidencias, conf.id, conf.prevalenciaSugerida, quem);
  assert.ok(r.ok);
  const c = r.parecer.confrontos[0];
  assert.equal(c.prevalencia, "B");
  assert.equal(c.textoFormatado, conf.textoFormatado);
  assert.equal(c.resolvidoPor, "Analista Demo");
  const [x] = r.parecer.citacoesContrarias.filter((k) => k.sentido === "CONTRADITORIA");
  assert.equal(x.evidenciaId, conf.afirmacaoA.evidenciaId);
});

test("divergir da sugestão exige razão", async () => {
  const { parecer, evidencias } = await prj02();
  const r = resolverConfronto(parecer, evidencias, parecer.confrontos[0].id, "A", { ...quem, razao: "  " });
  assert.equal(r.ok, false);
});

test("a favor de A: texto diz quem prevaleceu e por quê; contraditória passa para B; as duas afirmações seguem no texto", async () => {
  const { parecer, evidencias } = await prj02();
  const conf = parecer.confrontos[0];
  const r = resolverConfronto(parecer, evidencias, conf.id, "A", { ...quem, razao: "o ensaio S05 usou a base errada, conforme ata posterior." });
  assert.ok(r.ok);
  const c = r.parecer.confrontos[0];
  assert.match(c.textoFormatado, /prevalece .*contra a sugestão do sistema, segundo o analista: o ensaio S05 usou a base errada, conforme ata posterior\.$/);
  assert.ok(!/por ser registro primário/.test(c.textoFormatado), "não afirma primariedade da fonte vencida");
  assert.ok(c.textoFormatado.includes(conf.afirmacaoA.texto.slice(0, 30)));
  assert.equal(c.razaoSugerida, conf.razaoDaPrevalencia);

  const contraditorias = r.parecer.citacoesContrarias.filter((k) => k.sentido === "CONTRADITORIA");
  assert.equal(contraditorias.length, 1);
  // O registro vencido é citado pela linha literal do ensaio em resultados.csv
  const resultados = evidencias.find((e) => e.arquivo.endsWith("resultados.csv"))!;
  assert.equal(contraditorias[0].evidenciaId, resultados.id);
  assert.ok(contraditorias[0].trecho.startsWith(`${conf.afirmacaoB.ensaioId};`));
  const ev = evidencias.find((e) => e.id === contraditorias[0].evidenciaId)!;
  assert.equal(ev.textoExtraido!.slice(contraditorias[0].offsetInicio!, contraditorias[0].offsetFim!), contraditorias[0].trecho);
  // as contrárias que não são de confronto não mudam
  assert.equal(
    r.parecer.citacoesContrarias.filter((k) => k.sentido !== "CONTRADITORIA").length,
    parecer.citacoesContrarias.filter((k) => k.sentido !== "CONTRADITORIA").length
  );
});

test("voltar para a sugestão restaura o texto original do motor", async () => {
  const { parecer, evidencias } = await prj02();
  const conf = parecer.confrontos[0];
  const a = resolverConfronto(parecer, evidencias, conf.id, "A", { ...quem, razao: "motivo X" });
  assert.ok(a.ok);
  const b = resolverConfronto(a.parecer, evidencias, conf.id, "B", quem);
  assert.ok(b.ok);
  assert.equal(b.parecer.confrontos[0].textoFormatado, conf.textoFormatado);
  assert.equal(b.parecer.confrontos[0].razaoDaPrevalencia, conf.razaoDaPrevalencia);
});
