import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { lerPacote } from "./parsers/pacote";
import { analisarPacote, PacoteArquivos } from "./index";
import { fatiarMetodoMD, lerCabecalhoDossie } from "./secoes";
import { ArquivoBruto } from "./hash";

const PRJ01 = path.resolve(process.cwd(), "Arquivos", "PRJ01");

function lerBrutos(dir: string, prefixo = ""): ArquivoBruto[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? lerBrutos(path.join(dir, e.name), `${prefixo}${e.name}/`)
      : [{ caminho: `${prefixo}${e.name}`, bytes: new Uint8Array(fs.readFileSync(path.join(dir, e.name))) }]
  );
}

let cache: PacoteArquivos | null = null;
async function pacotePRJ01(): Promise<PacoteArquivos> {
  cache ??= (await lerPacote(lerBrutos(PRJ01))).arquivos;
  return { ...cache };
}

test("PRJ01 completo: 14 evidências presentes, força do inventário, identificação do dossiê", async () => {
  const { caso, evidencias, parecer } = analisarPacote("PRJ01", "", await pacotePRJ01());
  assert.equal(evidencias.length, 14);
  assert.equal(caso.pacote.arquivosPresentes, 14);
  assert.deepEqual(caso.pacote.arquivosAusentes, []);
  assert.equal(caso.titulo, "Reprocessamento seguro de mensagens duplicadas");
  assert.equal(caso.equipe, "Engenharia de Mensageria");
  assert.equal(caso.duracaoSemanas, 13);
  const forca = Object.fromEntries(evidencias.map((e) => [e.arquivo, e.forcaProbatoria]));
  assert.equal(forca["evidencias/medicoes.csv"], "PRIMARIA");
  assert.equal(forca["evidencias/resultados.csv"], "DERIVADA");
  assert.equal(forca["transcricao_entrevista_tecnica.pdf"], "DECLARATORIA");
  assert.equal(forca["evidencias/revisao_tecnica.md"], "CONTEXTO");
  assert.equal(forca["evidencias/cronologia.csv"], "CONTEXTO");
  assert.ok(evidencias.every((e) => e.statusInventario === "Localizada" && e.presente));
  assert.ok(!parecer.lacunas.some((l) => /ausente|inventário|dossiê/.test(l)));
});

test("arquivo ausente vira lacuna com o ID do inventário; pasta raiz do zip não atrapalha", async () => {
  const arquivos = Object.fromEntries(
    Object.entries(await pacotePRJ01())
      .filter(([c]) => c !== "evidencias/observacoes.csv")
      .map(([c, t]) => [`PRJ01/${c}`, t])
  );
  const { caso, evidencias, parecer } = analisarPacote("PRJ01", "", arquivos);
  assert.equal(caso.pacote.arquivosPresentes, 13);
  assert.deepEqual(caso.pacote.arquivosAusentes, ["evidencias/observacoes.csv"]);
  const obs = evidencias.find((e) => e.arquivo === "evidencias/observacoes.csv")!;
  assert.equal(obs.presente, false);
  assert.equal(obs.textoExtraido, null);
  assert.ok(parecer.lacunas.some((l) => l.startsWith(`${obs.id} (evidencias/observacoes.csv) ausente do pacote`)));
});

test("arquivo ilegível conta como presente, sem texto; arquivo extra é apontado", async () => {
  const arquivos = await pacotePRJ01();
  delete arquivos["dossie_projeto.pdf"];
  arquivos["anexo_extra.md"] = "# nota";
  const { caso, evidencias, parecer } = analisarPacote("PRJ01", "", arquivos, {
    naoLidos: [{ caminho: "dossie_projeto.pdf", motivo: "conteúdo não reconhecido como PDF" }]
  });
  const dossie = evidencias.find((e) => e.arquivo === "dossie_projeto.pdf")!;
  assert.equal(dossie.presente, true);
  assert.equal(dossie.textoExtraido, null);
  assert.equal(caso.pacote.arquivosPresentes, 14);
  assert.ok(parecer.lacunas.some((l) => l.includes("anexo_extra.md está no pacote mas não consta do inventário")));
  // Sem texto do dossiê não há identificação — e nada é inventado no lugar
  assert.equal(caso.equipe, "");
  assert.equal(caso.duracaoSemanas, null);
});

test("sem inventário, a ordem canônica atribui os IDs e a lacuna é declarada", async () => {
  const arquivos = await pacotePRJ01();
  delete arquivos["inventario_evidencias.csv"];
  const { caso, evidencias, parecer } = analisarPacote("PRJ01", "", arquivos);
  assert.equal(evidencias.find((e) => e.arquivo === "evidencias/medicoes.csv")!.id, "PRJ01-EV08");
  assert.deepEqual(caso.pacote.arquivosAusentes, ["inventario_evidencias.csv"]);
  assert.ok(parecer.lacunas.some((l) => l.startsWith("Inventário de evidências ausente")));
});

test("lerCabecalhoDossie junta título quebrado e não inventa o que falta", () => {
  const cab = lerCabecalhoDossie("Massa | V9\nPRJ03 | Reexecução controlada após falhas\nintermitentes\nEquipe: Plataforma de Pagamentos | Recorte de 23 semanas | Corte: 2025-06-16\nContexto");
  assert.deepEqual(cab, { titulo: "Reexecução controlada após falhas intermitentes", equipe: "Plataforma de Pagamentos", duracaoSemanas: 23, corte: "2025-06-16" });
  assert.deepEqual(lerCabecalhoDossie("texto sem cabeçalho"), { titulo: null, equipe: null, duracaoSemanas: null, corte: null });
});

test("fatiarMetodoMD: offsets exatos em arquivo CRLF", () => {
  const texto = "# T\r\n\r\n## 1. Referência anterior\r\nabc\r\n## 2. Mecanismo e hipótese\r\ndef\r\n";
  const s = fatiarMetodoMD(texto);
  assert.ok(texto.slice(s[1].inicio).startsWith("## 1. Referência anterior"));
  assert.ok(texto.slice(s[2].inicio).startsWith("## 2. Mecanismo e hipótese"));
  assert.equal(s[1].fim, s[2].inicio);
  assert.equal(s[2].fim, texto.length);
  assert.equal(s[1].conteudo, "abc");
});
