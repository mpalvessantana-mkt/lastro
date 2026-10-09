import * as XLSX from "xlsx";
import Papa from "papaparse";

export function parseAtividadesXLSX<T = Record<string, string>>(dataBuffer: ArrayBuffer | Uint8Array): T[] {
  const workbook = XLSX.read(dataBuffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Cabeçalho na linha 5 (índice 4 no array 0-indexed)
  const rows = XLSX.utils.sheet_to_json<T>(worksheet, {
    range: 4,
    defval: ""
  });

  return rows;
}

// Rótulos da planilha → colunas de atividades.csv (o CSV é derivado do XLSX, EV14 ← EV03).
const COLUNAS_ATIVIDADES: Record<string, string> = {
  "id da atividade": "id_atividade",
  ciclo: "ciclo",
  fase: "fase",
  "natureza informada": "natureza_informada_pela_equipe",
  "descrição": "descricao",
  "resultado ou saída": "resultado_ou_saida",
  "evidências relacionadas": "evidencias_relacionadas",
  "responsável por função": "responsavel_por_funcao"
};

/**
 * atividades.xlsx → texto no formato de atividades.csv (`;`, mesmas colunas), para o motor ler
 * as duas fontes pelo mesmo caminho. Rótulo desconhecido é mantido como veio.
 */
export function atividadesXLSXparaCSV(dados: ArrayBuffer | Uint8Array): string {
  const linhas = parseAtividadesXLSX<Record<string, unknown>>(dados);
  const convertidas = linhas
    .map((linha) =>
      Object.fromEntries(
        Object.entries(linha).map(([rotulo, valor]) => [
          COLUNAS_ATIVIDADES[rotulo.trim().toLowerCase()] ?? rotulo.trim(),
          String(valor ?? "").trim()
        ])
      )
    )
    .filter((l) => Object.values(l).some((v) => v !== ""));
  return Papa.unparse(convertidas, { delimiter: ";", newline: "\n" });
}
