import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * Extrai o texto de um PDF do pacote (dossiê, registro técnico, entrevista).
 * Remonta as linhas pela marca de fim de linha do pdf.js; páginas separadas por linha em branco.
 *
 * O worker do pdf.js é carregado no próprio processo (globalThis.pdfjsWorker): funciona igual
 * no Node e no navegador, sem configurar GlobalWorkerOptions.workerSrc. Os PDFs do pacote são
 * pequenos; o custo de não usar um Web Worker é desprezível.
 */
export async function extrairTextoPDF(dados: ArrayBuffer | Uint8Array): Promise<string> {
  // Cópia simples: o pdf.js recusa Buffer do Node e transfere (inutiliza) o buffer recebido.
  if (!(globalThis as { pdfjsWorker?: unknown }).pdfjsWorker) {
    await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
  }
  const bytes = dados instanceof Uint8Array ? new Uint8Array(dados) : new Uint8Array(dados.slice(0));
  // verbosity 0: só erros. Fontes padrão não são necessárias para extrair texto.
  const tarefa = getDocument({ data: bytes, useSystemFonts: false, verbosity: 0 });
  const doc = await tarefa.promise;

  const paginas: string[] = [];
  try {
    for (let n = 1; n <= doc.numPages; n++) {
      const pagina = await doc.getPage(n);
      const conteudo = await pagina.getTextContent();
      let texto = "";
      for (const item of conteudo.items) {
        if (!("str" in item)) continue;
        texto += item.str;
        if (item.hasEOL) texto += "\n";
      }
      paginas.push(texto.trim());
    }
  } finally {
    await tarefa.destroy();
  }

  return paginas.join("\n\n");
}
