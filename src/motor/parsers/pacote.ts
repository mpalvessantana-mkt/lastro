import type { PacoteArquivos } from "../index";
import type { ArquivoBruto } from "../hash";
import { extrairTextoPDF } from "./pdf";
import { atividadesXLSXparaCSV } from "./xlsx";

export interface PacoteLido {
  /** caminho → texto, como o analisarPacote espera (PDF já extraído, XLSX convertido em CSV). */
  arquivos: PacoteArquivos;
  /** Arquivos que não puderam ser lidos (formato desconhecido ou conteúdo corrompido). */
  naoLidos: Array<{ caminho: string; motivo: string }>;
}

const IGNORADOS = /(^|\/)(__MACOSX\/|\.DS_Store$|Thumbs\.db$)/;

/**
 * Lê os bytes originais de cada arquivo pelo tipo — o único caminho de leitura, usado pelo
 * upload no navegador e pelo `npm run validar` no Node. Falha de leitura vira registro em
 * `naoLidos`, nunca erro: o motor trata o arquivo como lacuna.
 */
export async function lerPacote(brutos: ArquivoBruto[]): Promise<PacoteLido> {
  const arquivos: PacoteArquivos = {};
  const naoLidos: PacoteLido["naoLidos"] = [];
  const decodificador = new TextDecoder("utf-8");

  for (const { caminho, bytes } of brutos) {
    if (IGNORADOS.test(caminho)) continue;
    const extensao = caminho.toLowerCase().split(".").pop();
    try {
      if (extensao === "pdf") arquivos[caminho] = await extrairTextoPDF(bytes);
      else if (extensao === "xlsx") arquivos[caminho] = atividadesXLSXparaCSV(bytes);
      else if (extensao === "md" || extensao === "csv" || extensao === "json") arquivos[caminho] = decodificador.decode(bytes);
      else naoLidos.push({ caminho, motivo: "formato não previsto no pacote" });
    } catch {
      naoLidos.push({ caminho, motivo: `conteúdo não reconhecido como ${extensao?.toUpperCase()}` });
    }
  }

  return { arquivos, naoLidos };
}
