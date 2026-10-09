import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sugerirEstadoCriterio5,
  sugerirEstadosCriterios1e2,
  sugerirEstadoCriterio3,
  sugerirEstadoCriterio4
} from "./estados";
import { analisarPacote } from "./index";

const SEM_MARCADOR = "O projeto foi executado pela equipe ao longo de oito semanas.";

test("sem marcador, nenhum critério recebe estado — muito menos positivo", () => {
  const { c1, c2 } = sugerirEstadosCriterios1e2(SEM_MARCADOR, SEM_MARCADOR);
  const c3 = sugerirEstadoCriterio3(SEM_MARCADOR, c1.estadoSugerido);
  const c4 = sugerirEstadoCriterio4(SEM_MARCADOR, c3.estadoSugerido, 0);
  const c5 = sugerirEstadoCriterio5(SEM_MARCADOR);

  for (const s of [c1, c2, c3, c4, c5]) {
    assert.equal(s.estadoSugerido, null, `critério ${s.criterioId}`);
    assert.equal(s.confianca, "BAIXA");
    assert.match(s.justificativaSugerida, /lacuna/);
  }
});

test("pacote sem metodo.md vira INCOMPLETO com lacunas, não Elegível", () => {
  const { parecer } = analisarPacote("PRJ99", "Teste", {});
  assert.equal(parecer.classeProposta, "INCOMPLETO");
  for (let c = 1; c <= 5; c++) assert.equal(parecer.pontos[c].estadoProposto, null);
  assert.equal(parecer.lacunas.filter((l) => l.startsWith("Critério")).length, 5);
});

test("marcadores toleram nome de produto entre artigo e verbo", () => {
  const { c1 } = sugerirEstadosCriterios1e2("O catálogo fictício VIS-3 já fornece junção por identificador.", "");
  assert.equal(c1.estadoSugerido, "NÃO DEMONSTRADA");
});

test("termo de configuração só conta em frase negada", () => {
  assert.equal(sugerirEstadoCriterio5("Não se investigou técnica nova de inferência.").estadoSugerido, "DOCUMENTADA PARA A CONFIGURAÇÃO");
  assert.equal(sugerirEstadoCriterio5("A técnica nova foi ensaiada. Conclusão limitada aos perfis L1/L2.").estadoSugerido, "DOCUMENTADA NO ESCOPO");
});

test("c5 sem marcador deriva só de c1 negativo ou indeterminado; c1 positivo não deriva", () => {
  const ambiguo = "A terminologia comercial não descreve o mecanismo implementado.";
  assert.equal(sugerirEstadoCriterio5(ambiguo).estadoSugerido, null);
  const neg = sugerirEstadoCriterio5(ambiguo, "NÃO DEMONSTRADA");
  assert.equal(neg.estadoSugerido, "DOCUMENTADA PARA A CONFIGURAÇÃO");
  assert.equal(neg.confianca, "MEDIA");
  assert.equal(neg.derivadoDe, 1);
  assert.equal(sugerirEstadoCriterio5(ambiguo, "INDETERMINADA").estadoSugerido, "INSUFICIENTE PARA O NÚCLEO ALEGADO");
  assert.equal(sugerirEstadoCriterio5(ambiguo, "DEMONSTRADA NO RECORTE").estadoSugerido, null);
  // marcador próprio prevalece sobre a derivação
  assert.equal(sugerirEstadoCriterio5("Conclusão limitada ao recorte.", "NÃO DEMONSTRADA").estadoSugerido, "DOCUMENTADA NO ESCOPO");
});
