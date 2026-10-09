import fs from "fs";
import path from "path";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { comporClasse } from "../src/motor/classificacao";
import { analisarPacote, ResultadoAnalise } from "../src/motor/index";
import { lerPacote } from "../src/motor/parsers/pacote";
import { hashPacote, ArquivoBruto } from "../src/motor/hash";
import { Classe, Confronto, EstadoCriterio } from "../src/types";

interface LinhaHistorico {
  projeto_id: string;
  titulo: string;
  divergencia_depoimento?: string;
  classificacao: string;
  estado_1: string;
  estado_2: string;
  estado_3: string;
  estado_4: string;
  estado_5: string;
}

function normalizarClasseEsperada(classeStr: string): Classe {
  const norm = classeStr.trim().toLowerCase();
  if (norm.includes("não elegível") || norm.includes("nao elegivel")) return "NAO_ELEGIVEL";
  if (norm.includes("com ressalvas")) return "COM_RESSALVAS";
  if (norm.includes("evidência insuficiente") || norm.includes("evidencia insuficiente")) return "EVIDENCIA_INSUFICIENTE";
  if (norm.includes("elegível") || norm.includes("elegivel")) return "ELEGIVEL";
  throw new Error(`Classe desconhecida: ${classeStr}`);
}

async function validar() {
  const csvPath = path.resolve(process.cwd(), "Arquivos/historicos_classificados.csv");
  console.log(`\n============================================================`);
  console.log(`LASTRO - Validação Canônica do Motor de Decisão (20 Históricos)`);
  console.log(`Arquivo: ${csvPath}`);
  console.log(`============================================================\n`);

  const fileContent = fs.readFileSync(csvPath, "utf-8");
  const parsed = Papa.parse<LinhaHistorico>(fileContent, {
    header: true,
    delimiter: ";",
    skipEmptyLines: true
  });

  let acertos = 0;
  const total = parsed.data.length;

  for (const row of parsed.data) {
    if (!row.projeto_id) continue;

    const esperada = normalizarClasseEsperada(row.classificacao);
    const estados: Record<number, EstadoCriterio> = {
      1: row.estado_1.trim() as EstadoCriterio,
      2: row.estado_2.trim() as EstadoCriterio,
      3: row.estado_3.trim() as EstadoCriterio,
      4: row.estado_4.trim() as EstadoCriterio,
      5: row.estado_5.trim() as EstadoCriterio
    };

    const resultado = comporClasse(estados);

    const match = resultado.classe === esperada;
    if (match) {
      acertos++;
      console.log(`  ✓ ${row.projeto_id.padEnd(6)} | ${row.titulo.slice(0, 35).padEnd(36)} | Calculado: ${resultado.classe.padEnd(23)} | Esperado: ${esperada.padEnd(23)}`);
    } else {
      console.error(`  ✗ ${row.projeto_id.padEnd(6)} | FALHA: Calculado ${resultado.classe} != Esperado ${esperada}`);
      console.error(`    Motivo: ${resultado.motivoRegra}`);
    }
  }

  console.log(`\n------------------------------------------------------------`);
  console.log(`Etapa 1 — Regra de composição (estados oficiais): ${acertos}/${total} (${((acertos / total) * 100).toFixed(0)}%)`);
  console.log(`------------------------------------------------------------\n`);

  const pipelineOk = await validarPipeline(parsed.data);
  await compararComGabarito();

  if (acertos === total && pipelineOk) {
    console.log(`STATUS: SUCESSO ABSOLUTO. A regra e o pipeline reproduzem os ${total} históricos sem exceção.\n`);
    process.exit(0);
  } else {
    console.error(`STATUS: FALHA NA CALIBRAÇÃO.\n`);
    process.exit(1);
  }
}

/** Bytes originais do pacote: lidos por parsers/pacote.ts (o mesmo caminho do upload) e hasheados. */
function lerBrutos(dir: string, prefixo = ""): ArquivoBruto[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? lerBrutos(path.join(dir, e.name), `${prefixo}${e.name}/`)
      : [{ caminho: `${prefixo}${e.name}`, bytes: new Uint8Array(fs.readFileSync(path.join(dir, e.name))) }]
  );
}

/**
 * Etapa 2 — Pipeline completo: lê o pacote real de cada histórico, sugere os cinco estados
 * pelos marcadores e compõe a classe. Confere estados e classe contra a referência.
 */
async function validarPipeline(linhas: LinhaHistorico[]): Promise<boolean> {
  console.log(`Etapa 2 — Pipeline completo (pacote → estados → classe)\n`);
  const acertosCriterio = [0, 0, 0, 0, 0];
  let acertosClasse = 0;
  let total = 0;
  const confrontosPorProjeto: Array<{ id: string; esperado: string; confrontos: Confronto[] }> = [];
  const resultados: Array<{ row: LinhaHistorico; resultado: ResultadoAnalise }> = [];

  for (const row of linhas) {
    if (!row.projeto_id) continue;
    total++;
    const id = row.projeto_id.trim();
    const esperada = normalizarClasseEsperada(row.classificacao);
    const dir = path.resolve(process.cwd(), "Arquivos", id);
    const brutos = lerBrutos(dir);
    const { sha256 } = await hashPacote(brutos);
    const { arquivos, naoLidos } = await lerPacote(brutos);
    if (naoLidos.length > 0) console.error(`  ! ${id}: não lidos ${naoLidos.map((n) => `${n.caminho} (${n.motivo})`).join(", ")}`);
    const resultado = analisarPacote(id, row.titulo, arquivos, { sha256Pacote: sha256, naoLidos });
    const { parecer } = resultado;
    resultados.push({ row, resultado });
    confrontosPorProjeto.push({ id, esperado: (row.divergencia_depoimento || "").trim(), confrontos: parecer.confrontos });

    const falhas: string[] = [];
    for (let c = 1; c <= 5; c++) {
      const ponto = parecer.pontos[c];
      const esperado = (row as unknown as Record<string, string>)[`estado_${c}`].trim();
      if (ponto.estadoProposto === esperado) acertosCriterio[c - 1]++;
      else falhas.push(`c${c}: proposto ${ponto.estadoProposto ?? "SEM ESTADO"} [${ponto.confianca}] ≠ ${esperado}`);
    }

    if (parecer.classeProposta === esperada) {
      acertosClasse++;
      console.log(`  ✓ ${id.padEnd(6)} | ${String(parecer.classeProposta).padEnd(23)}`);
    } else {
      console.error(`  ✗ ${id.padEnd(6)} | proposto ${parecer.classeProposta} ≠ esperado ${esperada}`);
    }
    for (const f of falhas) console.error(`      ${f}`);
  }

  console.log(`\n------------------------------------------------------------`);
  console.log(`Etapa 2 — Estados por critério: ${acertosCriterio.map((n, i) => `c${i + 1} ${n}/${total}`).join(" · ")}`);
  console.log(`Etapa 2 — Classe de ponta a ponta: ${acertosClasse}/${total}`);
  console.log(`------------------------------------------------------------\n`);
  const pipelineOk = acertosClasse === total && acertosCriterio.every((n) => n === total);
  const confrontosOk = validarConfrontos(confrontosPorProjeto);
  const evidenciasOk = validarEvidencias(resultados);
  const citacoesOk = validarCitacoes(resultados);
  const aritmeticaOk = validarAritmetica(resultados);
  return validarCondicionais(resultados) && aritmeticaOk && citacoesOk && evidenciasOk && confrontosOk && pipelineOk;
}

/**
 * Etapa 7 — Campos condicionais (§5.3, §13 item 4): a classe proposta traz os seus campos
 * preenchidos, as outras classes não; todo trecho entre aspas existe literalmente na evidência citada.
 */
function validarCondicionais(resultados: Array<{ row: LinhaHistorico; resultado: ResultadoAnalise }>): boolean {
  console.log(`Etapa 7 — Campos condicionais da classe (trecho literal × arquivo)\n`);
  const porClasse: Record<string, string[]> = {
    COM_RESSALVAS: ["recorteSustentado", "limitacaoEspecifica", "evidenciaNecessaria"],
    EVIDENCIA_INSUFICIENTE: ["eloAusente", "evidenciasASolicitar"],
    NAO_ELEGIVEL: ["mecanismoDocumentado"]
  };
  const todos = Object.values(porClasse).flat();
  let acertos = 0;
  let trechos = 0;
  for (const { resultado } of resultados) {
    const { caso, parecer, evidencias } = resultado;
    const esperados = porClasse[parecer.classeProposta] ?? [];
    const falhas: string[] = [];
    const campos = parecer as unknown as Record<string, string | string[] | null>;
    for (const campo of todos) {
      const valor = campos[campo];
      const preenchido = Array.isArray(valor) ? valor.length > 0 : !!valor;
      if (esperados.includes(campo) !== preenchido) falhas.push(`${campo} ${preenchido ? "indevido" : "vazio"}`);
      for (const texto of [valor ?? []].flat()) {
        for (const m of texto.matchAll(/“([^”]+)” \((PRJ\d+-EV\d+), /g)) {
          trechos++;
          const ev = evidencias.find((e) => e.id === m[2]);
          if (!ev?.textoExtraido?.includes(m[1])) falhas.push(`${campo}: trecho não literal em ${m[2]}`);
        }
      }
    }
    if (falhas.length === 0) acertos++;
    const linha = `  ${falhas.length ? "✗" : "✓"} ${caso.id.padEnd(6)} | ${parecer.classeProposta.padEnd(23)} | ${falhas.join(" | ") || esperados.join(", ") || "sem campos condicionais"}`;
    if (falhas.length) console.error(linha);
    else console.log(linha);
  }
  console.log(`\n------------------------------------------------------------`);
  console.log(`Etapa 7 — Campos condicionais: ${acertos}/${resultados.length} (${trechos} trechos conferidos)`);
  console.log(`------------------------------------------------------------\n`);
  return acertos === resultados.length;
}

/**
 * Etapa 6 — Aritmética (§6.6): toda linha de resultados.csv é recalculada a partir das medições
 * do mesmo ensaio, pela definição da operação, e nenhuma diverge.
 */
function validarAritmetica(resultados: Array<{ row: LinhaHistorico; resultado: ResultadoAnalise }>): boolean {
  console.log(`Etapa 6 — Aritmética (resultados × medições)\n`);
  let acertos = 0;
  let total = 0;
  for (const { resultado } of resultados) {
    const { caso } = resultado;
    const csv = fs.readFileSync(path.resolve(process.cwd(), "Arquivos", caso.id, "evidencias", "resultados.csv"), "utf-8");
    const linhas = csv.split(/\r?\n/).slice(1).filter((l) => l.trim()).length;
    total += caso.leitura.ensaiosConferidos;
    const ok = caso.leitura.ensaiosConferidos === linhas && caso.leitura.ensaiosDivergentes.length === 0;
    if (ok) acertos++;
    const linha = `  ${ok ? "✓" : "✗"} ${caso.id.padEnd(6)} | ${caso.leitura.ensaiosConferidos}/${linhas} ensaios recalculados · divergentes: ${caso.leitura.ensaiosDivergentes.join(", ") || "nenhum"}`;
    if (ok) console.log(linha);
    else console.error(linha);
  }
  console.log(`\n------------------------------------------------------------`);
  console.log(`Etapa 6 — Aritmética: ${acertos}/${resultados.length} (${total} ensaios recalculados)`);
  console.log(`------------------------------------------------------------\n`);
  return acertos === resultados.length;
}

/**
 * Etapa 5 — Citações (§2 regras 3 e 9): todo estado proposto tem ao menos um trecho; todo trecho
 * existe literalmente no arquivo, no offset declarado; o ID e a força são os do inventário; as
 * contrárias estão em citacoesContrarias.
 */
function validarCitacoes(resultados: Array<{ row: LinhaHistorico; resultado: ResultadoAnalise }>): boolean {
  console.log(`\nEtapa 5 — Citações (trecho literal × arquivo)\n`);
  let acertos = 0;
  let totalCitacoes = 0;
  for (const { resultado } of resultados) {
    const { caso, parecer, evidencias } = resultado;
    const falhas: string[] = [];
    const dosPontos = Object.values(parecer.pontos).flatMap((p) => p.citacoesPropostas);
    const todas = [...dosPontos, ...parecer.citacoesContrarias];
    totalCitacoes += todas.length;
    for (const ponto of Object.values(parecer.pontos)) {
      if (ponto.estadoProposto && ponto.citacoesPropostas.length === 0) falhas.push(`c${ponto.criterioId} sem citação`);
    }
    for (const c of todas) {
      const ev = evidencias.find((e) => e.id === c.evidenciaId);
      if (!ev?.presente || !ev.textoExtraido) { falhas.push(`${c.id}: evidência ${c.evidenciaId} inexistente`); continue; }
      if (c.offsetInicio === null || c.offsetFim === null || ev.textoExtraido.slice(c.offsetInicio, c.offsetFim) !== c.trecho) falhas.push(`${c.id}: trecho não está no offset declarado`);
      if (!c.trecho.trim()) falhas.push(`${c.id}: trecho vazio`);
      if (c.forcaProbatoria !== ev.forcaProbatoria) falhas.push(`${c.id}: força ${c.forcaProbatoria} ≠ inventário ${ev.forcaProbatoria}`);
    }
    // Regra 9: há evidência contrária; toda contrária dos pontos está listada, uma única vez
    const chave = (c: { evidenciaId: string; offsetInicio: number | null }) => `${c.evidenciaId}@${c.offsetInicio}`;
    const listadas = parecer.citacoesContrarias.map(chave);
    if (listadas.length === 0) falhas.push("nenhuma evidência contrária (regra 9)");
    if (new Set(listadas).size !== listadas.length) falhas.push("contrária repetida");
    if (parecer.citacoesContrarias.some((c) => c.sentido === "FAVORAVEL")) falhas.push("favorável entre as contrárias");
    for (const c of dosPontos.filter((c) => c.sentido === "CONTRARIA")) {
      if (!listadas.includes(chave(c))) falhas.push(`${c.id} contrária fora de citacoesContrarias`);
    }
    const contrarias = parecer.citacoesContrarias;
    const contraditorias = contrarias.filter((c) => c.sentido === "CONTRADITORIA").length;
    if (contraditorias !== parecer.confrontos.length) falhas.push(`${contraditorias} contraditórias para ${parecer.confrontos.length} confrontos`);

    if (falhas.length === 0) {
      acertos++;
      console.log(`  ✓ ${caso.id.padEnd(6)} | ${dosPontos.length} citações · ${contrarias.length} contrárias (${contraditorias} contraditórias)`);
    } else {
      console.error(`  ✗ ${caso.id.padEnd(6)} | ${falhas.join(" | ")}`);
    }
  }
  console.log(`\n------------------------------------------------------------`);
  console.log(`Etapa 5 — Citações: ${acertos}/${resultados.length} (${totalCitacoes} trechos conferidos)`);
  console.log(`------------------------------------------------------------\n`);
  return acertos === resultados.length;
}

// Seções fixas esperadas por arquivo (§6.2)
const SECOES_ESPERADAS: Record<string, number> = {
  "evidencias/metodo.md": 7,
  "evidencias/revisao_tecnica.md": 5,
  "transcricao_entrevista_tecnica.pdf": 7,
  "dossie_projeto.pdf": 6
};

/**
 * Etapa 4 — Pacote e evidências: os 14 arquivos do inventário presentes, nenhum ausente ou fora
 * do inventário, força derivada da coluna `observacao`, seções fixas localizadas, identificação
 * (título, equipe, duração) lida do dossiê.
 */
function validarEvidencias(resultados: Array<{ row: LinhaHistorico; resultado: ResultadoAnalise }>): boolean {
  console.log(`\nEtapa 4 — Pacote e evidências (inventário × arquivos)\n`);
  let acertos = 0;
  for (const { row, resultado } of resultados) {
    const { caso, parecer, evidencias } = resultado;
    const falhas: string[] = [];
    if (evidencias.length !== 14) falhas.push(`${evidencias.length} evidências`);
    if (caso.pacote.arquivosPresentes !== 14) falhas.push(`${caso.pacote.arquivosPresentes} presentes`);
    if (caso.pacote.arquivosAusentes.length > 0) falhas.push(`ausentes: ${caso.pacote.arquivosAusentes.join(", ")}`);
    for (const l of parecer.lacunas.filter((l) => /ausente do pacote|não consta do inventário|não identificada no dossiê|Inventário de evidências ausente/.test(l))) falhas.push(l);
    for (const e of evidencias) {
      if (!e.id.startsWith(`${caso.id}-EV`)) falhas.push(`ID fora do caso: ${e.id}`);
      // Seções fixas presentes (o pacote pode trazer extras, como a §8 do metodo.md do PRJ03)
      const esperadas = SECOES_ESPERADAS[e.arquivo];
      if (esperadas && (e.secoes?.length ?? 0) < esperadas) falhas.push(`${e.arquivo}: ${e.secoes?.length ?? 0}/${esperadas} seções`);
      const texto = e.textoExtraido ?? "";
      for (const sec of e.secoes ?? []) {
        // O intervalo precisa começar exatamente na linha do cabeçalho da seção
        const primeiraLinha = texto.slice(sec.inicio, sec.fim).split(/\r?\n/)[0];
        if (!(sec.inicio >= 0 && sec.inicio < sec.fim && sec.fim <= texto.length)) falhas.push(`${e.arquivo}${sec.ancora}: offsets inválidos`);
        else if (!primeiraLinha.includes(sec.titulo)) falhas.push(`${e.arquivo}${sec.ancora}: intervalo não começa no cabeçalho`);
      }
      const ultima = e.secoes?.at(-1);
      if (ultima && e.arquivo.endsWith(".md") && ultima.fim !== texto.length) falhas.push(`${e.arquivo}: última seção termina em ${ultima.fim} de ${texto.length}`);
    }
    const forcas = evidencias.map((e) => e.forcaProbatoria);
    if (!forcas.includes("CONTEXTO") || !forcas.includes("DECLARATORIA")) falhas.push(`forças: ${[...new Set(forcas)].join(", ")}`);
    if (caso.titulo !== row.titulo.trim()) falhas.push(`título “${caso.titulo}” ≠ “${row.titulo.trim()}”`);
    if (!caso.equipe || caso.duracaoSemanas === null) falhas.push(`equipe “${caso.equipe}” · ${caso.duracaoSemanas} semanas`);

    if (falhas.length === 0) {
      acertos++;
      console.log(`  ✓ ${caso.id.padEnd(6)} | 14/14 · ${caso.equipe} · ${caso.duracaoSemanas} semanas`);
    } else {
      console.error(`  ✗ ${caso.id.padEnd(6)} | ${falhas.join(" | ")}`);
    }
  }
  console.log(`\n------------------------------------------------------------`);
  console.log(`Etapa 4 — Pacote e evidências: ${acertos}/${resultados.length}`);
  console.log(`------------------------------------------------------------\n`);
  return acertos === resultados.length;
}

/**
 * Etapa 3 — Confrontos: os projetos com divergência registrada na referência devem gerar confronto
 * apontando um ensaio citado na própria justificativa; os demais não podem gerar nenhum.
 */
function validarConfrontos(projetos: Array<{ id: string; esperado: string; confrontos: Confronto[] }>): boolean {
  console.log(`Etapa 3 — Confrontos (depoimento × registro)\n`);
  let acertos = 0;
  for (const { id, esperado, confrontos } of projetos) {
    const citados: string[] = esperado.match(/PRJ\d{2}-S\d{2}/g) ?? [];
    const ok = esperado
      ? confrontos.length === 1 && citados.includes(confrontos[0].afirmacaoB.ensaioId ?? "")
      : confrontos.length === 0;
    if (ok) acertos++;
    const marca = ok ? "✓" : "✗";
    const resumo = confrontos.length
      ? confrontos.map((c) => `${c.campoLogico}: ${c.afirmacaoB.ensaioId ?? c.afirmacaoB.fonte}`).join("; ")
      : "sem confronto";
    const linha = `  ${marca} ${id.padEnd(6)} | esperado: ${esperado ? `divergência (${citados.join(", ") || "sem ensaio citado"})` : "nenhuma"} | detectado: ${resumo}`;
    if (ok) console.log(linha);
    else console.error(linha);
    if (ok && confrontos[0]) console.log(`      ${confrontos[0].textoFormatado}`);
  }
  console.log(`\n------------------------------------------------------------`);
  console.log(`Etapa 3 — Confrontos: ${acertos}/${projetos.length}`);
  console.log(`------------------------------------------------------------\n`);
  return acertos === projetos.length;
}

validar().catch((err) => {
  console.error("Erro na validação:", err);
  process.exit(1);
});

/**
 * Etapa 8 — Casos para análise × gabarito (informativa). O gabarito é material de avaliação e não
 * fica no repositório: GABARITO=/caminho/Gabarito.xlsx (1ª aba: nº do projeto | classe). Nunca entra
 * no cálculo — só confere, depois, o que o motor propôs a partir das evidências de cada pacote.
 */
async function compararComGabarito(): Promise<void> {
  const arquivo = process.env.GABARITO;
  if (!arquivo) {
    console.log(`Etapa 8 — Gabarito: pulada (defina GABARITO=/caminho/Gabarito.xlsx)\n`);
    return;
  }
  const normalizar = (c: string): string => {
    const t = c.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
    return t.startsWith("NAO") ? "NAO_ELEGIVEL" : t.startsWith("COM") ? "COM_RESSALVAS" : t.startsWith("EVID") ? "EVIDENCIA_INSUFICIENTE" : t.startsWith("ELEG") ? "ELEGIVEL" : `?${c}`;
  };
  const wb = XLSX.read(fs.readFileSync(arquivo));
  const linhas = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1 });
  const esperado = linhas
    .filter((l) => l.length >= 2 && /^\d+$/.test(String(l[0]).trim()))
    .map((l) => ({ id: `PRJ${String(l[0]).trim().padStart(2, "0")}`, classe: normalizar(String(l[1])) }));

  console.log(`Etapa 8 — Casos para análise × gabarito (informativa)\n`);
  let acertos = 0;
  let avaliados = 0;
  for (const { id, classe } of esperado) {
    const dir = path.resolve(process.cwd(), "Arquivos", id);
    if (!fs.existsSync(dir)) { console.error(`  ? ${id} | pacote ausente em Arquivos/`); continue; }
    const brutos = lerBrutos(dir);
    const { sha256 } = await hashPacote(brutos);
    const { arquivos, naoLidos } = await lerPacote(brutos);
    const { parecer } = analisarPacote(id, "", arquivos, { sha256Pacote: sha256, naoLidos });
    avaliados++;
    const ok = parecer.classeProposta === classe;
    if (ok) acertos++;
    const estados = [1, 2, 3, 4, 5].map((c) => `${parecer.pontos[c].estadoProposto ?? "∅"}${parecer.pontos[c].confianca === "ALTA" ? "" : ` (${parecer.pontos[c].confianca})`}`).join(" · ");
    const linha = `  ${ok ? "✓" : "✗"} ${id} | proposto ${parecer.classeProposta.padEnd(22)} | gabarito ${classe.padEnd(22)}${ok ? "" : ` | ${estados}`}`;
    if (ok) console.log(linha);
    else console.error(linha);
  }
  console.log(`\n------------------------------------------------------------`);
  console.log(`Etapa 8 — Gabarito (informativa): ${acertos}/${avaliados}`);
  console.log(`------------------------------------------------------------\n`);
}
