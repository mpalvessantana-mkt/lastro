import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { extrairQuantidades, ensaioDaAfirmacao } from "./redundancia";
import { fatiarEntrevista } from "./secoes";
import { extrairTextoPDF } from "./parsers/pdf";
import { analisarPacote, PacoteArquivos } from "./index";
import { Ensaio } from "../types";

test("extrairQuantidades lê número, percentual, extenso e quantificadores", () => {
  assert.deepEqual(extrairQuantidades("registrei 1.100 pares corretos").numeros, [1100]);
  assert.deepEqual(extrairQuantidades("ficou em 2,8%").percentuais, [2.8]);
  assert.deepEqual(extrairQuantidades("78 dos 80 rastros").numeros, [78, 80]);
  assert.deepEqual(extrairQuantidades("aceitou um dos vinte replays").numeros.sort((a, b) => a - b), [1, 20]);
  assert.deepEqual(extrairQuantidades("não registramos nenhuma leitura indevida").numeros, [0]);
  assert.equal(extrairQuantidades("explicar todas as decisões").totalidade, true);
  assert.deepEqual(extrairQuantidades("em restrito-v4").numeros, [], "número de versão não é quantidade");
});

const ensaio = (id: string, versao: string, metrica: string, valor: number, base: number, natureza: Ensaio["natureza"] = "desempenho"): Ensaio => ({
  id, versao, metrica, operacao: "contagem", valor, baseDeCalculo: base, descricaoBase: "", taxaPercentual: (valor / base) * 100,
  unidade: "casos", natureza, fonte: "", conferido: true, recalculo: valor, divergenciaRecalculo: null
});

test("ensaioDaAfirmacao: métrica, depois versão nomeada, depois versão final; ignora entrega", () => {
  const ensaios = [
    ensaio("X-S01", "texto-v1", "pares corretos", 852, 1200),
    ensaio("X-S02", "restrito-v4", "pares corretos", 1152, 1200),
    ensaio("X-S03", "restrito-v4", "pares ambíguos corretos", 132, 180),
    ensaio("X-S04", "entrega-v9", "pares corretos", 1200, 1200, "entrega")
  ];
  assert.equal(ensaioDaAfirmacao("1.100 pares corretos no grafo restrito", ensaios)?.id, "X-S02");
  assert.equal(ensaioDaAfirmacao("no fim tínhamos 1.100 pares corretos", ensaios)?.id, "X-S02", "sem versão nomeada → a final");
  assert.equal(ensaioDaAfirmacao("a latência caiu", ensaios), null);
});

test("fatiarEntrevista acha as perguntas pelo texto, em qualquer ordem; texto ilegível → vazio", () => {
  const texto = "2. Como ficou a conclusão da rodada?\nFicou em 2,8%.\n1. Qual ocorrência você recorda?\nnenhuma\nCondição do registro\nDepoimento de memória.";
  assert.deepEqual(fatiarEntrevista(texto), { conclusao: "Ficou em 2,8%.", ocorrencia: "nenhuma" });
  assert.deepEqual(fatiarEntrevista("%PDF-1.4 \u0000 binário"), {});
});

async function lerPRJ02(): Promise<PacoteArquivos> {
  const raiz = path.resolve(process.cwd(), "Arquivos/PRJ02");
  const arquivos: PacoteArquivos = {};
  const nomes = ["inventario_evidencias.csv", "atividades.csv", "evidencias/metodo.md", "evidencias/revisao_tecnica.md",
    "evidencias/configuracao.json", "evidencias/observacoes.csv", "evidencias/cronologia.csv",
    "evidencias/medicoes.csv", "evidencias/resultados.csv"];
  for (const n of nomes) arquivos[n] = fs.readFileSync(path.join(raiz, n), "utf-8");
  for (const n of ["transcricao_entrevista_tecnica.pdf", "dossie_projeto.pdf"]) {
    arquivos[n] = await extrairTextoPDF(fs.readFileSync(path.join(raiz, n)));
  }
  return arquivos;
}

test("PRJ02: depoimento × PRJ02-S05, prevalência sugerida e nunca resolvida pelo motor", async () => {
  const { parecer } = analisarPacote("PRJ02", "", await lerPRJ02());
  assert.equal(parecer.confrontos.length, 1);
  const c = parecer.confrontos[0];
  assert.equal(c.afirmacaoA.evidenciaId, "PRJ02-EV10");
  assert.equal(c.afirmacaoA.forca, "DECLARATORIA");
  assert.equal(c.afirmacaoB.ensaioId, "PRJ02-S05");
  assert.equal(c.afirmacaoB.forca, "PRIMARIA");
  assert.equal(c.prevalenciaSugerida, "B");
  assert.equal(c.prevalencia, "NAO_RESOLVIDO");
  assert.equal(c.resolvidoPor, null);
  assert.match(c.textoFormatado, /1\.100 pares.*PRJ02-S05.*1\.152\/1\.200 \(96%\) em restrito-v4.*prevalece o registro/);
});

test("cópia espelhada alterada vira confronto literal; a perdedora continua no documento", async () => {
  const arquivos = await lerPRJ02();
  arquivos["evidencias/revisao_tecnica.md"] = arquivos["evidencias/revisao_tecnica.md"].replace(
    "aos três deslocamentos ensaiados", "a qualquer deslocamento de relógio"
  );
  const { parecer } = analisarPacote("PRJ02", "", arquivos);
  const limite = parecer.confrontos.filter((c) => c.campoLogico === "limite_conclusao");
  assert.equal(limite.length, 1);
  assert.equal(limite[0].afirmacaoA.evidenciaId, "PRJ02-EV13");   // revisão (contexto) perde para o método
  assert.equal(limite[0].afirmacaoB.evidenciaId, "PRJ02-EV06");
  assert.match(limite[0].afirmacaoA.texto, /qualquer deslocamento/);
  assert.equal(limite[0].prevalencia, "NAO_RESOLVIDO");
});
