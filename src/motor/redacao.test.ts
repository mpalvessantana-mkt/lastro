import { test } from "node:test";
import assert from "node:assert/strict";
import { redigirCondicionais } from "./redacao";
import { fatiarMetodoMD } from "./secoes";
import { Evidencia } from "../types";

function metodo(secoes: Record<number, string>): Evidencia {
  const titulos: Record<number, string> = {
    1: "Referência anterior", 2: "Mecanismo e hipótese", 3: "Protocolo e critérios", 4: "Parâmetros, versões e execução registrada",
    5: "Leitura e reconstrução dos resultados", 6: "Limite da conclusão", 7: "Continuidade e detalhamento técnico"
  };
  const texto = Object.entries(titulos).map(([n, t]) => `## ${n}. ${t}\r\n${secoes[Number(n)] ?? ""}\r\n`).join("\r\n");
  const fatias = Object.values(fatiarMetodoMD(texto)).map(({ ancora, titulo, inicio, fim }) => ({ ancora, titulo, inicio, fim }));
  return {
    id: "PRJ99-EV06", tipo: "Método", arquivo: "evidencias/metodo.md", caminhoNoPacote: "evidencias/metodo.md",
    conteudoEsperado: "", observacaoInventario: "especificação", forcaProbatoria: "PRIMARIA",
    statusInventario: "Localizada", presente: true, textoExtraido: texto, secoes: fatias
  };
}

const RESSALVA = "Os catálogos/manuais citados neste documento são extratos fictícios definidos acima.";

test("com ressalvas: recorte, limitação e evidência necessária literais e citados", () => {
  const ev = metodo({
    6: "O protocolo inclui uma hipótese X. Corte nessa janela não foi ensaiado. A evidência sustenta a solução para rede, mas não a alegação geral.",
    7: "Executar o corte na janela.\r\nAs especificações descrevem o recorte sintético."
  });
  const c = redigirCondicionais({ classe: "COM_RESSALVAS" }, ev, undefined);
  assert.equal(c.recorteSustentado, "“A evidência sustenta a solução para rede” (PRJ99-EV06, metodo.md#6)");
  assert.equal(c.limitacaoEspecifica, "“Corte nessa janela não foi ensaiado.” (PRJ99-EV06, metodo.md#6) “não a alegação geral.” (PRJ99-EV06, metodo.md#6)");
  assert.equal(c.evidenciaNecessaria, "“Executar o corte na janela.” (PRJ99-EV06, metodo.md#7)");
  assert.equal(c.eloAusente, null);
  assert.equal(c.mecanismoDocumentado, null);
  assert.equal(c.lacunas.length, 1);
  assert.match(c.lacunas[0], /^Ponto de decisão do analista: .*núcleo do mecanismo/);
});

test("evidência insuficiente: elo ausente e itens de 'Faltam…' e 'Sem… não'", () => {
  const ev = metodo({ 6: "Faltam versão executada, ordem causal e saídas. Sem regras e logs não se avalia o número.", 7: "Executar a vinculação." });
  const c = redigirCondicionais({ classe: "EVIDENCIA_INSUFICIENTE" }, ev, undefined);
  assert.match(c.eloAusente!, /^“Faltam versão executada, ordem causal e saídas\.”/);
  assert.deepEqual(c.evidenciasASolicitar!.map((i) => i.match(/“([^”]+)”/)![1]), [
    "versão executada", "ordem causal", "saídas", "regras", "logs", "Executar a vinculação."
  ]);
});

test("não elegível: mecanismo documentado é o 1º parágrafo do metodo#1, sem a ressalva padrão", () => {
  const ev = metodo({ 1: `O manual Y já fornece o recurso Z.\r\n${RESSALVA}` });
  const c = redigirCondicionais({ classe: "NAO_ELEGIVEL" }, ev, undefined);
  assert.equal(c.mecanismoDocumentado, "“O manual Y já fornece o recurso Z.” (PRJ99-EV06, metodo.md#1)");
});

test("conflito apresenta as duas leituras; elegível não tem campo condicional", () => {
  const ev = metodo({ 1: "O manual Y fornece Z.", 6: "Faltam saídas.", 7: "Executar." });
  const conflito = redigirCondicionais({ classe: "CONFLITO" }, ev, undefined);
  assert.ok(conflito.mecanismoDocumentado && conflito.eloAusente && conflito.evidenciasASolicitar);
  const elegivel = redigirCondicionais({ classe: "ELEGIVEL" }, ev, undefined);
  assert.deepEqual(Object.values(elegivel).filter((v) => v !== null && !(Array.isArray(v) && v.length === 0)), []);
});

test("sem trecho localizável o campo fica nulo e vira lacuna — nunca texto genérico", () => {
  const c = redigirCondicionais({ classe: "COM_RESSALVAS" }, undefined, undefined);
  assert.equal(c.recorteSustentado, null);
  assert.equal(c.limitacaoEspecifica, null);
  assert.equal(c.evidenciaNecessaria, null);
  assert.equal(c.lacunas.filter((l) => /homologação/.test(l)).length, 3);
});

test("sem metodo#6, usa os limites da revisão técnica", () => {
  const texto = "## Limites e pendências técnicas\nFaltam saídas.\n## Próxima ação da equipe\nExecutar o registro.\n";
  const revisao: Evidencia = {
    id: "PRJ99-EV13", tipo: "Revisão", arquivo: "evidencias/revisao_tecnica.md", caminhoNoPacote: "evidencias/revisao_tecnica.md",
    conteudoEsperado: "", observacaoInventario: "revisão", forcaProbatoria: "CONTEXTO", statusInventario: "Localizada", presente: true,
    textoExtraido: texto,
    secoes: [
      { ancora: "#1", titulo: "Limites e pendências técnicas", inicio: 0, fim: texto.indexOf("## Próxima") },
      { ancora: "#2", titulo: "Próxima ação da equipe", inicio: texto.indexOf("## Próxima"), fim: texto.length }
    ]
  };
  const c = redigirCondicionais({ classe: "EVIDENCIA_INSUFICIENTE" }, undefined, revisao);
  assert.equal(c.eloAusente, "“Faltam saídas.” (PRJ99-EV13, revisao_tecnica.md#1)");
  assert.equal(c.evidenciasASolicitar!.at(-1), "“Executar o registro.” (PRJ99-EV13, revisao_tecnica.md#2)");
});
