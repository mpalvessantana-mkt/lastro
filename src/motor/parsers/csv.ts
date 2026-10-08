import Papa from "papaparse";

export function limparBOM(texto: string): string {
  if (texto.charCodeAt(0) === 0xFEFF) {
    return texto.slice(1);
  }
  return texto;
}

export function parseCSV<T = Record<string, string>>(conteudo: string): T[] {
  const textoLimpo = limparBOM(conteudo.trim());
  const resultado = Papa.parse<T>(textoLimpo, {
    header: true,
    delimiter: ";",
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    transform: (valor) => valor.trim()
  });

  if (resultado.errors.length > 0) {
    // Apenas avisos, retorno dos dados parseados
    console.warn("Avisos no parse de CSV:", resultado.errors[0]?.message);
  }

  return resultado.data;
}

export function parseDecimal(valorStr: string | null | undefined): number | null {
  if (!valorStr || valorStr.trim() === "") return null;
  const normalizado = valorStr.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(normalizado);
  return isNaN(num) ? null : num;
}
