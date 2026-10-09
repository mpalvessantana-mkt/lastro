/**
 * Integridade do pacote e do parecer (SHA-256 real, via Web Crypto — navegador e Node ≥ 20).
 *
 * Hash do pacote: manifesto no formato do `sha256sum`, sobre os BYTES ORIGINAIS de cada arquivo
 * (nunca sobre o texto extraído), ordenado por caminho relativo à raiz do pacote. Conferível fora
 * do LASTRO, dentro da pasta do projeto:
 *
 *   find . -type f | LC_ALL=C sort | sed 's|^\./||' | xargs sha256sum | sha256sum
 *
 * Hash do conteúdo: serialização canônica do parecer (chaves ordenadas), sem os campos
 * `hashConteudo` e `snapshot`. A assinatura (homologadoPor/Em) entra no hash.
 */

export interface ArquivoBruto {
  caminho: string;
  bytes: Uint8Array;
}

export interface HashDoPacote {
  /** SHA-256 do manifesto: o hash do pacote. */
  sha256: string;
  /** O manifesto exato que foi hasheado ("<hex>  <caminho>\n" por arquivo). */
  manifesto: string;
  /** caminho normalizado → SHA-256 do arquivo. */
  porArquivo: Record<string, string>;
}

const IGNORADOS = /(^|\/)(__MACOSX\/|\.DS_Store$|Thumbs\.db$)/;

function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(dados: Uint8Array | string): Promise<string> {
  const bytes = typeof dados === "string" ? new TextEncoder().encode(dados) : dados;
  return hex(await globalThis.crypto.subtle.digest("SHA-256", bytes as BufferSource));
}

/**
 * Caminhos relativos à raiz do pacote: barras normais, sem "./" e sem a pasta raiz comum
 * (o zip costuma trazer "PRJ27/..."; a pasta já chega sem ela).
 */
function normalizarCaminhos(caminhos: string[]): string[] {
  const limpos = caminhos.map((c) => c.replace(/\\/g, "/").replace(/^(\.\/)+/, "").replace(/^\/+/, ""));
  const primeiros = new Set(limpos.map((c) => (c.includes("/") ? c.split("/")[0] : "")));
  const [raiz] = [...primeiros];
  // "evidencias/" é subpasta do próprio pacote, nunca raiz (pacote só com essa pasta continua igual).
  if (primeiros.size === 1 && raiz && raiz !== "evidencias") return limpos.map((c) => c.slice(raiz.length + 1));
  return limpos;
}

export async function hashPacote(arquivos: ArquivoBruto[]): Promise<HashDoPacote> {
  const validos = arquivos.filter((a) => !IGNORADOS.test(a.caminho.replace(/\\/g, "/")));
  const caminhos = normalizarCaminhos(validos.map((a) => a.caminho));

  const entradas = await Promise.all(
    validos.map(async (a, i) => ({ caminho: caminhos[i], sha256: await sha256Hex(a.bytes) }))
  );
  // Ordem por ponto de código, igual ao `LC_ALL=C sort` para caminhos ASCII.
  entradas.sort((a, b) => (a.caminho < b.caminho ? -1 : a.caminho > b.caminho ? 1 : 0));

  const manifesto = entradas.map((e) => `${e.sha256}  ${e.caminho}\n`).join("");
  return {
    sha256: await sha256Hex(manifesto),
    manifesto,
    porArquivo: Object.fromEntries(entradas.map((e) => [e.caminho, e.sha256]))
  };
}

/** JSON com chaves ordenadas em todos os níveis; `undefined` some, como no JSON.stringify. */
export function serializarCanonico(valor: unknown): string {
  if (valor === null || typeof valor !== "object") return JSON.stringify(valor) ?? "null";
  if (Array.isArray(valor)) return `[${valor.map((v) => serializarCanonico(v === undefined ? null : v)).join(",")}]`;
  const obj = valor as Record<string, unknown>;
  const pares = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${serializarCanonico(obj[k])}`);
  return `{${pares.join(",")}}`;
}

/** SHA-256 do parecer, excluídos o próprio hash e o snapshot. Calcular sobre o parecer já assinado. */
export async function hashConteudoParecer(parecer: object): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hashConteudo, snapshot, ...conteudo } = parecer as Record<string, unknown>;
  return sha256Hex(serializarCanonico(conteudo));
}
