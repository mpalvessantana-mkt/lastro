import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { lerPacote } from "./pacote";
import { parseCSV } from "./csv";
import { analisarPacote } from "../index";
import { ArquivoBruto } from "../hash";

const ARQUIVOS = path.resolve(process.cwd(), "Arquivos");

function lerBrutos(dir: string, prefixo = ""): ArquivoBruto[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? lerBrutos(path.join(dir, e.name), `${prefixo}${e.name}/`)
      : [{ caminho: `${prefixo}${e.name}`, bytes: new Uint8Array(fs.readFileSync(path.join(dir, e.name))) }]
  );
}

test("lerPacote lê os 14 arquivos do PRJ01 pelo tipo, sem nenhum não lido", async () => {
  const { arquivos, naoLidos } = await lerPacote(lerBrutos(path.join(ARQUIVOS, "PRJ01")));
  assert.deepEqual(naoLidos, []);
  assert.equal(Object.keys(arquivos).length, 14);
  assert.match(arquivos["transcricao_entrevista_tecnica.pdf"], /Que alternativas ou recursos já existiam\?/);
  assert.match(arquivos["dossie_projeto.pdf"], /Pergunta registrada/);
  assert.ok(!arquivos["dossie_projeto.pdf"].startsWith("%PDF"), "PDF não pode chegar como binário");
});

test("atividades.xlsx convertido tem as mesmas linhas do atividades.csv, nos 20 históricos", async () => {
  for (let n = 1; n <= 20; n++) {
    const dir = path.join(ARQUIVOS, `PRJ${String(n).padStart(2, "0")}`);
    const { arquivos } = await lerPacote(lerBrutos(dir).filter((b) => b.caminho.startsWith("atividades.")));
    assert.deepEqual(parseCSV(arquivos["atividades.xlsx"]), parseCSV(arquivos["atividades.csv"]), dir);
  }
});

test("arquivo corrompido ou de formato desconhecido vira não lido, nunca erro", async () => {
  const lixo = new TextEncoder().encode("isto não é um PDF");
  const { arquivos, naoLidos } = await lerPacote([
    { caminho: "dossie_projeto.pdf", bytes: lixo },
    { caminho: "foto.png", bytes: lixo },
    { caminho: "__MACOSX/._metodo.md", bytes: lixo }
  ]);
  assert.deepEqual(Object.keys(arquivos), []);
  assert.deepEqual(naoLidos.map((n) => n.caminho), ["dossie_projeto.pdf", "foto.png"]);
});

test("não lido aparece como lacuna no parecer", () => {
  const { parecer } = analisarPacote("PRJ99", "Teste", {}, { naoLidos: [{ caminho: "dossie_projeto.pdf", motivo: "PDF inválido" }] });
  assert.ok(parecer.lacunas.some((l) => l.includes("dossie_projeto.pdf está no pacote mas não pôde ser lido (PDF inválido)")));
});

test("sem atividades.csv, a planilha sustenta os mesmos campos espelhados", async () => {
  const { arquivos } = await lerPacote(lerBrutos(path.join(ARQUIVOS, "PRJ02")));
  const completo = analisarPacote("PRJ02", "", arquivos);
  const semCSV = { ...arquivos };
  delete semCSV["atividades.csv"];
  const soXLSX = analisarPacote("PRJ02", "", semCSV);
  assert.deepEqual(soXLSX.caso.leitura.camposEspelhados, completo.caso.leitura.camposEspelhados);
  assert.equal(soXLSX.parecer.confrontos.length, completo.parecer.confrontos.length);
});
