import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { sha256Hex, hashPacote, hashConteudoParecer, serializarCanonico, ArquivoBruto } from "./hash";
import { analisarPacote } from "./index";

const PRJ01 = path.resolve(process.cwd(), "Arquivos", "PRJ01");

function lerBrutos(dir: string, prefixo = ""): ArquivoBruto[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? lerBrutos(path.join(dir, e.name), `${prefixo}${e.name}/`)
      : [{ caminho: `${prefixo}${e.name}`, bytes: new Uint8Array(fs.readFileSync(path.join(dir, e.name))) }]
  );
}

test("sha256Hex bate com os vetores conhecidos", async () => {
  assert.equal(await sha256Hex(""), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  assert.equal(await sha256Hex("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});

test("hash do PRJ01 é o mesmo que o sha256sum do sistema produz", async (t) => {
  let esperado: string;
  try {
    esperado = execSync(
      "find . -type f | LC_ALL=C sort | sed 's|^\\./||' | xargs sha256sum | sha256sum",
      { cwd: PRJ01, encoding: "utf-8" }
    ).split(" ")[0];
  } catch {
    t.skip("sha256sum indisponível");
    return;
  }
  const { sha256, porArquivo } = await hashPacote(lerBrutos(PRJ01));
  assert.equal(Object.keys(porArquivo).length, 14);
  assert.equal(sha256, esperado);
});

test("hash do pacote não depende da ordem nem da pasta raiz do zip", async () => {
  const brutos = lerBrutos(PRJ01);
  const base = (await hashPacote(brutos)).sha256;
  const comRaiz = brutos.map((b) => ({ ...b, caminho: `PRJ01/${b.caminho}` }));
  const comLixo = [...comRaiz, { caminho: "__MACOSX/PRJ01/._metodo.md", bytes: new Uint8Array([1]) }];
  assert.equal((await hashPacote([...brutos].reverse())).sha256, base);
  assert.equal((await hashPacote(comLixo)).sha256, base);
});

test("um byte alterado muda o hash do pacote", async () => {
  const brutos = lerBrutos(PRJ01);
  const alvo = brutos.find((b) => b.caminho.endsWith("medicoes.csv"))!;
  const alterado = Uint8Array.from(alvo.bytes);
  alterado[alterado.length - 2] ^= 1;
  const adulterados = brutos.map((b) => (b === alvo ? { ...b, bytes: alterado } : b));
  assert.notEqual((await hashPacote(adulterados)).sha256, (await hashPacote(brutos)).sha256);
});

test("pasta evidencias/ sozinha não é tratada como raiz", async () => {
  const { porArquivo } = await hashPacote([{ caminho: "evidencias/metodo.md", bytes: new Uint8Array() }]);
  assert.deepEqual(Object.keys(porArquivo), ["evidencias/metodo.md"]);
});

test("serialização canônica ignora a ordem das chaves", () => {
  assert.equal(serializarCanonico({ b: 1, a: { d: [1, { y: 2, x: 1 }], c: null } }), '{"a":{"c":null,"d":[1,{"x":1,"y":2}]},"b":1}');
});

test("hash do parecer: estável, sensível à assinatura, ignora o próprio hash", async () => {
  const { parecer } = analisarPacote("PRJ99", "Teste", {}, { sha256Pacote: "a".repeat(64) });
  const assinado = { ...parecer, situacao: "HOMOLOGADO" as const, homologadoPor: "Revisor", homologadoEm: "2026-10-08T12:00:00.000Z" };
  const h = await hashConteudoParecer(assinado);
  assert.match(h, /^[0-9a-f]{64}$/);
  assert.equal(await hashConteudoParecer({ ...assinado, hashConteudo: h }), h);
  assert.notEqual(await hashConteudoParecer({ ...assinado, homologadoPor: "Outro" }), h);
});

test("sem hash do pacote, o parecer declara a lacuna em vez de inventar valor", () => {
  const sem = analisarPacote("PRJ99", "Teste", {});
  assert.equal(sem.caso.pacote.sha256, "");
  assert.equal(sem.parecer.hashConteudo, "");
  assert.ok(sem.parecer.lacunas.some((l) => l.startsWith("Hash do pacote não calculado")));
  const com = analisarPacote("PRJ99", "Teste", {}, { sha256Pacote: "f".repeat(64) });
  assert.equal(com.parecer.sha256Pacote, "f".repeat(64));
  assert.ok(!com.parecer.lacunas.some((l) => l.startsWith("Hash do pacote")));
});
