import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { comporClasse } from "../src/motor/classificacao";
import { Classe, EstadoCriterio } from "../src/types";

interface LinhaHistorico {
  projeto_id: string;
  titulo: string;
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
  console.log(`Resultado Final: ${acertos}/${total} (${((acertos / total) * 100).toFixed(0)}%)`);
  if (acertos === total) {
    console.log(`STATUS: SUCESSO ABSOLUTO (20/20). A regra reproduz todos os históricos sem exceção.`);
    console.log(`------------------------------------------------------------\n`);
    process.exit(0);
  } else {
    console.error(`STATUS: FALHA NA CALIBRAÇÃO (${acertos}/${total}).`);
    console.log(`------------------------------------------------------------\n`);
    process.exit(1);
  }
}

validar().catch((err) => {
  console.error("Erro na validação:", err);
  process.exit(1);
});
