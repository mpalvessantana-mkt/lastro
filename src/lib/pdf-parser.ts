// @ts-expect-error - pako está disponível nas dependências
import pako from "pako";

/**
 * Decodifica stream codificado em ASCII85 (<~ ... ~>)
 */
function decodeAscii85(a85: string): Uint8Array {
  const clean = a85.replace(/\s+/g, "");
  const out: number[] = [];
  let tuple = 0;
  let count = 0;

  for (let i = 0; i < clean.length; i++) {
    if (clean[i] === "~" && clean[i + 1] === ">") break;
    if (clean[i] === "z" && count === 0) {
      out.push(0, 0, 0, 0);
      continue;
    }
    tuple = tuple * 85 + (clean.charCodeAt(i) - 33);
    count++;
    if (count === 5) {
      out.push((tuple >>> 24) & 255, (tuple >>> 16) & 255, (tuple >>> 8) & 255, tuple & 255);
      tuple = 0;
      count = 0;
    }
  }

  if (count > 1) {
    for (let i = count; i < 5; i++) tuple = tuple * 85 + 84;
    for (let i = 0; i < count - 1; i++) {
      out.push((tuple >>> (24 - 8 * i)) & 255);
    }
  }

  return new Uint8Array(out);
}

/**
 * Mapeamento padrão de caracteres para fontes sem ToUnicode explícito
 * (WinAnsi e fontes padrão dos relatórios técnicos de P&D)
 */
const MAPA_PADRAO_ACENTOS: Record<number, string> = {
  1: "í",
  2: "é",
  3: "á",
  4: "ç",
  5: "ã",
  6: "ê",
  7: "à",
  8: "ú",
  9: "õ",
  10: "ó",
  11: "â",
  12: "ô",
  13: "–",
  14: "—",
  15: "“",
  16: "”",
  17: "É",
  18: "Á",
  19: "Í",
  20: "Ó",
  21: "Ú",
  22: "Â",
  23: "Ê",
  24: "Ô",
  25: "Ã",
  26: "Õ",
  27: "Ç",
  28: "À",
  0x00ed: "í",
  0x00e9: "é",
  0x00e1: "á",
  0x00e7: "ç",
  0x00e3: "ã",
  0x00ea: "ê",
  0x00e0: "à",
  0x00fa: "ú",
  0x00f5: "õ",
  0x00f3: "ó",
  0x00e2: "â",
  0x00f4: "ô",
  0x00c9: "É",
  0x00c1: "Á",
  0x00cd: "Í",
  0x00d3: "Ó",
  0x00da: "Ú",
  0x00c2: "Â",
  0x00ca: "Ê",
  0x00d4: "Ô",
  0x00c3: "Ã",
  0x00d5: "Õ",
  0x00c7: "Ç",
  0x00c0: "À",
  0x2013: "–",
  0x2014: "—"
};

/**
 * Extrai texto 100% legível e formatado de um arquivo PDF binário,
 * decodificando CMaps ToUnicode e preservando acentos em português.
 */
export function extrairTextoCompletoPDF(conteudo: Uint8Array | string): string {
  let bytes: Uint8Array;
  if (typeof conteudo === "string") {
    bytes = new Uint8Array(conteudo.length);
    for (let i = 0; i < conteudo.length; i++) {
      bytes[i] = conteudo.charCodeAt(i) & 255;
    }
  } else {
    bytes = conteudo;
  }

  const str = new TextDecoder("latin1").decode(bytes);

  // 1. Identificar mapeamento de fontes para ToUnicode inspecionando cada dicionário
  const fontToCmapId: Record<string, number> = {};
  const fontObjMatches = [...str.matchAll(/(\d+)\s+0\s+obj\s*<<([\s\S]*?)>>/g)];
  for (const fm of fontObjMatches) {
    const dict = fm[2];
    if (dict.includes("/Type /Font") || dict.includes("/Type/Font") || dict.includes("/BaseFont")) {
      const nameMatch = dict.match(/\/Name\s*\/([^\s\/]+)/);
      const toUnicodeMatch = dict.match(/\/ToUnicode\s*(\d+)\s+0\s+R/);
      if (nameMatch && toUnicodeMatch) {
        const fName = nameMatch[1];
        const cmapObj = parseInt(toUnicodeMatch[1], 10);
        fontToCmapId[fName] = cmapObj;
        fontToCmapId[fName.replace(/\+\d+$/, "")] = cmapObj;
      }
    }
  }

  const cmapsByObjId: Record<number, Record<number, string>> = {};
  const textStreams: Array<{ objId: number; text: string }> = [];

  // 2. Varrer todos os streams no binário do PDF
  let idx = 0;
  while (true) {
    const sIdx = str.indexOf("stream", idx);
    if (sIdx === -1) break;
    const eIdx = str.indexOf("endstream", sIdx);
    if (eIdx === -1) break;

    // Descobrir o número do objeto (ex: "8 0 obj") pegando a última declaração antes do stream
    const headerSlice = str.slice(Math.max(0, sIdx - 350), sIdx);
    const allObjMatches = [...headerSlice.matchAll(/(\d+)\s+0\s+obj/g)];
    const objId = allObjMatches.length > 0 ? parseInt(allObjMatches[allObjMatches.length - 1][1], 10) : 0;

    let slice = bytes.slice(sIdx + 6, eIdx);
    if (slice[0] === 13 && slice[1] === 10) slice = slice.slice(2);
    else if (slice[0] === 10 || slice[0] === 13) slice = slice.slice(1);
    if (slice[slice.length - 1] === 10) slice = slice.slice(0, -1);
    if (slice[slice.length - 1] === 13) slice = slice.slice(0, -1);

    try {
      let unzipped: Uint8Array | null = null;
      try {
        unzipped = pako.inflate(slice);
      } catch {
        const sliceStr = new TextDecoder("latin1").decode(slice).trim();
        if (sliceStr.endsWith("~>")) {
          const a85Decoded = decodeAscii85(sliceStr);
          unzipped = pako.inflate(a85Decoded);
        }
      }

      if (unzipped) {
        const unzippedText = new TextDecoder("latin1").decode(unzipped);

        if (unzippedText.includes("beginbfchar") || unzippedText.includes("beginbfrange")) {
          const map: Record<number, string> = {};

          // Extrair blocos beginbfchar estritamente delimitados
          const bfCharSections = [...unzippedText.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)];
          for (const sec of bfCharSections) {
            const pairs = [...sec[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)];
            for (const p of pairs) {
              const src = parseInt(p[1], 16);
              const dst = parseInt(p[2], 16);
              if (dst > 0) {
                map[src] = String.fromCharCode(dst);
              }
            }
          }

          // Extrair blocos beginbfrange estritamente delimitados
          const bfRangeSections = [...unzippedText.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)];
          for (const sec of bfRangeSections) {
            const triplets = [...sec[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)];
            for (const tr of triplets) {
              const start = parseInt(tr[1], 16);
              const end = parseInt(tr[2], 16);
              const destStart = parseInt(tr[3], 16);
              for (let c = start; c <= end; c++) {
                map[c] = String.fromCharCode(destStart + (c - start));
              }
            }
          }

          cmapsByObjId[objId] = map;
        } else if (unzippedText.includes("Tj") || unzippedText.includes("TJ") || unzippedText.includes("BT")) {
          textStreams.push({ objId, text: unzippedText });
        }
      }
    } catch {
      // Ignorar streams de imagens ou fontes brutas incompatíveis
    }

    idx = eIdx + 9;
  }

  // 3. Associar fontes aos seus respectivos CMaps
  const fontMaps: Record<string, Record<number, string>> = {};
  for (const [fName, cmapId] of Object.entries(fontToCmapId)) {
    if (cmapsByObjId[cmapId]) {
      fontMaps[fName] = cmapsByObjId[cmapId];
    }
  }

  // Fallback consolidado para CMaps
  const fallbackMap: Record<number, string> = { ...MAPA_PADRAO_ACENTOS };
  for (const c of Object.values(cmapsByObjId)) {
    for (const [k, v] of Object.entries(c)) {
      const numK = Number(k);
      if (!fallbackMap[numK]) fallbackMap[numK] = v;
    }
  }

  // 4. Decodificar fluxos de texto
  const linhasExtraidas: string[] = [];
  let linhaAtual = "";

  for (const st of textStreams) {
    let currentFont = "";
    // Separar comandos do PDF
    const chunks = st.text.split(/(\/[^\s]+\s+[\d\.]+\s+Tf|\([^\)]*\)\s*Tj|\[[^\]]*\]\s*TJ|T\*|ET)/g);

    for (const chunk of chunks) {
      if (!chunk) continue;

      const tfMatch = chunk.match(/\/([^\s]+)\s+[\d\.]+\s+Tf/);
      if (tfMatch) {
        currentFont = tfMatch[1];
        continue;
      }

      if (chunk.includes("Tj")) {
        const tjMatch = chunk.match(/\((.*?)\)\s*Tj/);
        if (tjMatch) {
          let t = tjMatch[1];
          const activeMap = fontMaps[currentFont] || fallbackMap;

          // Decodificar escapes octais (ex: \004, \005)
          t = t.replace(/\\([0-7]{1,3})/g, (_m, oct) => {
            const code = parseInt(oct, 8);
            return activeMap[code] || MAPA_PADRAO_ACENTOS[code] || "";
          });

          // Decodificar outros escapes padrão do PDF
          t = t
            .replace(/\\n/g, "\n")
            .replace(/\\r/g, "")
            .replace(/\\t/g, " ")
            .replace(/\\([\\(\)])/g, "$1");

          linhaAtual += (linhaAtual.length > 0 && !linhaAtual.endsWith(" ") ? " " : "") + t;
        }
      } else if (chunk.includes("TJ")) {
        // Formato array [ (texto) -120 (texto) ]
        const arrayContent = chunk.replace(/^\[/, "").replace(/\]\s*TJ$/, "");
        const partMatches = [...arrayContent.matchAll(/\((.*?)\)/g)];
        const activeMap = fontMaps[currentFont] || fallbackMap;

        for (const pm of partMatches) {
          let t = pm[1];
          t = t.replace(/\\([0-7]{1,3})/g, (_m, oct) => {
            const code = parseInt(oct, 8);
            return activeMap[code] || MAPA_PADRAO_ACENTOS[code] || "";
          });
          t = t
            .replace(/\\n/g, "\n")
            .replace(/\\r/g, "")
            .replace(/\\t/g, " ")
            .replace(/\\([\\(\)])/g, "$1");

          linhaAtual += t;
        }
      } else if (chunk === "T*" || chunk === "ET") {
        if (linhaAtual.trim()) {
          linhasExtraidas.push(linhaAtual.trim());
          linhaAtual = "";
        }
      }
    }
  }

  if (linhaAtual.trim()) {
    linhasExtraidas.push(linhaAtual.trim());
  }

  // Se nenhum stream estruturado foi encontrado, retornar texto sanitizado
  if (linhasExtraidas.length === 0) {
    return str
      .replace(/[^\x20-\x7E\xA0-\xFF\n\r\t]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Agrupar linhas em seções legíveis
  return linhasExtraidas.join("\n");
}
