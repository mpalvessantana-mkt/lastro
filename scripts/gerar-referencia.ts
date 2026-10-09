import fs from "fs";
import path from "path";
import Papa from "papaparse";

const csvPath = path.resolve(process.cwd(), "Arquivos/historicos_classificados.csv");
const outPath = path.resolve(process.cwd(), "src/lib/referencia-data.ts");

const content = fs.readFileSync(csvPath, "utf-8");
const parsed = Papa.parse<Record<string, string>>(content, {
  header: true,
  delimiter: ";",
  skipEmptyLines: true
});

const data = parsed.data.map((r) => ({
  id: r.projeto_id,
  titulo: r.titulo,
  classificacao: r.classificacao,
  justificativa: r.justificativa,
  limite: r.limite,
  divergenciaDepoimento: r.divergencia_depoimento || "",
  estados: {
    1: r.estado_1,
    2: r.estado_2,
    3: r.estado_3,
    4: r.estado_4,
    5: r.estado_5
  },
  justificativas: {
    1: r.justificativa_1,
    2: r.justificativa_2,
    3: r.justificativa_3,
    4: r.justificativa_4,
    5: r.justificativa_5
  },
  fontes: {
    1: r.fonte_1,
    2: r.fonte_2,
    3: r.fonte_3,
    4: r.fonte_4,
    5: r.fonte_5
  }
}));

const tsContent = `export interface ProjetoHistorico {
  id: string;
  titulo: string;
  classificacao: string;
  justificativa: string;
  limite: string;
  divergenciaDepoimento: string;
  estados: Record<number, string>;
  justificativas: Record<number, string>;
  fontes: Record<number, string>;
}

export const HISTORICOS_REFERENCIA: ProjetoHistorico[] = ${JSON.stringify(data, null, 2)};
`;

fs.writeFileSync(outPath, tsContent, "utf-8");
console.log(`Gerado com sucesso em ${outPath} (${data.length} projetos)`);
