import * as XLSX from "xlsx";

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
