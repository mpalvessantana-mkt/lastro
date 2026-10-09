/**
 * Cronometra o fluxo do upload ao parecer, etapa por etapa, como a tela /casos/novo executa:
 * hash → leitura pelo tipo → motor → IA (5 critérios em paralelo, pela própria rota).
 *
 *   npm run cronometrar -- PRJ05 PRJ13      (padrão: PRJ02)
 *   PACOTES=/caminho/02_casos_para_analise npm run cronometrar -- PRJ27   (pacotes fora de Arquivos/)
 *
 * Usa a GEMINI_API_KEY do .env.local (custo de 5 chamadas por projeto). Sem chave, ou com
 * MODO_SEM_REDE=true, mede o caminho sem IA.
 */
import fs from "fs";
import path from "path";
import { analisarPacote } from "../src/motor/index";
import { lerPacote } from "../src/motor/parsers/pacote";
import { hashPacote, ArquivoBruto } from "../src/motor/hash";
import { montarEntradasIA } from "../src/motor/enriquecimento";
import { POST } from "../src/app/api/ia/enriquecer/route";

function lerBrutos(dir: string, prefixo = ""): ArquivoBruto[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? lerBrutos(path.join(dir, e.name), `${prefixo}${e.name}/`)
      : [{ caminho: `${prefixo}${e.name}`, bytes: new Uint8Array(fs.readFileSync(path.join(dir, e.name))) }]
  );
}

async function cronometrar(id: string) {
  const brutos = lerBrutos(path.resolve(process.env.PACOTES || path.join(process.cwd(), "Arquivos"), id));
  const inicio = Date.now();
  let t = inicio;
  const etapa = () => { const agora = Date.now(); const d = agora - t; t = agora; return d; };

  const { sha256 } = await hashPacote(brutos);
  const hash = etapa();
  const { arquivos, naoLidos } = await lerPacote(brutos);
  const leitura = etapa();
  const { parecer, evidencias } = analisarPacote(id, "", arquivos, { sha256Pacote: sha256, naoLidos });
  const motor = etapa();
  const respostas = await Promise.all(
    montarEntradasIA(parecer, evidencias).map(async (e) => {
      const r = (await POST(new Request("http://local/api/ia/enriquecer", { method: "POST", body: JSON.stringify(e) }) as never)) as Response;
      return (await r.json()) as { usouIA: boolean; motivo: string | null };
    })
  );
  const ia = etapa();
  const usadas = respostas.filter((r) => r.usouIA).length;
  const total = Date.now() - inicio;
  console.log(
    `${id} · ${parecer.classeProposta.padEnd(22)} · hash ${hash} ms · leitura ${leitura} ms · motor ${motor} ms · ` +
    `IA ${ia} ms (${usadas}/${respostas.length}) · TOTAL ${(total / 1000).toFixed(1)} s ${total < 60_000 ? "✓ < 1 min" : "✗ ≥ 1 min"}`
  );
  for (const r of respostas.filter((x) => !x.usouIA)) console.log(`    sem IA: ${r.motivo}`);
}

(async () => {
  const ids = process.argv.slice(2).filter((a) => /^PRJ\d{2}$/.test(a));
  for (const id of ids.length ? ids : ["PRJ02"]) await cronometrar(id);
})();
