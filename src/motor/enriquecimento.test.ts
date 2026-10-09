import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { analisarPacote } from "./index";
import { lerPacote } from "./parsers/pacote";
import { montarEntradasIA, incorporarEnriquecimento } from "./enriquecimento";
import { validarRespostaIA, ExtracaoTrechoOutput } from "./schemas";

const PRJ02 = path.resolve(process.cwd(), "Arquivos", "PRJ02");

function lerBrutos(dir: string, prefixo = ""): Array<{ caminho: string; bytes: Uint8Array }> {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? lerBrutos(path.join(dir, e.name), `${prefixo}${e.name}/`)
      : [{ caminho: `${prefixo}${e.name}`, bytes: new Uint8Array(fs.readFileSync(path.join(dir, e.name))) }]
  );
}

async function analisarPRJ02() {
  const { arquivos, naoLidos } = await lerPacote(lerBrutos(PRJ02));
  return analisarPacote("PRJ02", "", arquivos, { naoLidos });
}

// Trechos de uma resposta real do Gemini para o PRJ02, critério 1.
const SAIDA: ExtracaoTrechoOutput = {
  trechos: [
    {
      evidenciaId: "PRJ02-EV06",
      seletor: "metodo.md#3",
      trecho: "Mesma referência lacrada para quatro alternativas.",
      sentido: "FAVORAVEL",
      normaId: null
    },
    {
      evidenciaId: "PRJ02-EV06",
      seletor: "metodo.md#6",
      trecho: "Sem inferência sobre transações reais ou ausência de ordem de origem.",
      sentido: "CONTRARIA",
      normaId: null
    }
  ],
  porqueRedigido: "Em PRJ02-EV06 (metodo.md#1), as técnicas anteriores são descritas como já dominadas.",
  lacunaIdentificada: "Exemplo de lacuna apontada."
};

test("entradas: só pontos com estado, método e revisão rotulados pelo ID, IDs do pacote", async () => {
  const { parecer, evidencias } = await analisarPRJ02();
  const entradas = montarEntradasIA(parecer, evidencias);
  assert.equal(entradas.length, 5);
  const ids = Object.keys(entradas[0].textosPorId).sort();
  assert.deepEqual(ids, ids.filter((id) => /^PRJ02-EV\d+$/.test(id)));
  assert.equal(ids.length, 2);
  assert.ok(entradas[0].idsValidos.includes("PRJ02-EV06"));
  assert.ok(entradas[0].idsValidos.some((id) => /^PRJ02-S\d+$/.test(id)));
});

test("a saída real passa na validação por evidência", async () => {
  const { parecer, evidencias } = await analisarPRJ02();
  const [e] = montarEntradasIA(parecer, evidencias);
  const r = validarRespostaIA(SAIDA, { textoEvidencias: Object.values(e.textosPorId).join("\n"), idsValidos: e.idsValidos, textosPorId: e.textosPorId });
  assert.equal(r.ok, true);
});

test("incorporar: estado e classe intactos; porquê da IA com o do motor preservado; trechos com offset exato", async () => {
  const { parecer, evidencias } = await analisarPRJ02();
  const antes = parecer.pontos[1];
  const novo = incorporarEnriquecimento(parecer, evidencias, 1, SAIDA);

  assert.equal(novo.classeProposta, parecer.classeProposta);
  for (const c of [1, 2, 3, 4, 5]) assert.equal(novo.pontos[c].estadoProposto, parecer.pontos[c].estadoProposto);
  assert.equal(parecer.pontos[1], antes, "o parecer original não muda");

  const p = novo.pontos[1];
  assert.equal(p.porqueOrigem, "IA");
  assert.equal(p.porqueProposto, SAIDA.porqueRedigido);
  assert.equal(p.porqueMotor, antes.porqueProposto);

  const ev06 = evidencias.find((e) => e.id === "PRJ02-EV06")!;
  const daIA = p.citacoesPropostas.filter((c) => c.origem === "IA");
  assert.ok(daIA.length >= 1);
  for (const c of daIA) {
    assert.equal(ev06.textoExtraido!.slice(c.offsetInicio!, c.offsetFim!), c.trecho);
    assert.match(c.seletor ?? "", /^#\d$/);
    assert.equal(c.forcaProbatoria, ev06.forcaProbatoria);
  }
  assert.ok(novo.citacoesContrarias.length >= parecer.citacoesContrarias.length);
  assert.ok(novo.citacoesContrarias.every((c) => c.sentido !== "FAVORAVEL"));
  assert.deepEqual(novo.lacunas, parecer.lacunas, "lacuna da IA não entra no parecer");
});

test("trecho já citado pelo motor não é duplicado", async () => {
  const { parecer, evidencias } = await analisarPRJ02();
  const doMotor = parecer.pontos[1].citacoesPropostas[0];
  const saida: ExtracaoTrechoOutput = {
    trechos: [{ evidenciaId: doMotor.evidenciaId, seletor: null, trecho: doMotor.trecho, sentido: "FAVORAVEL", normaId: null }],
    porqueRedigido: "",
    lacunaIdentificada: null
  };
  const novo = incorporarEnriquecimento(parecer, evidencias, 1, saida);
  assert.equal(novo.pontos[1].citacoesPropostas.length, parecer.pontos[1].citacoesPropostas.length);
  assert.equal(novo.pontos[1].porqueOrigem, undefined, "porquê vazio mantém o do motor");
});
