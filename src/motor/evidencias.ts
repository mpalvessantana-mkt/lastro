import { Evidencia } from "../types";
import type { PacoteArquivos } from "./index";
import { Inventario, ItemInventario } from "./inventario";
import { fatiarMetodoMD, PERGUNTAS_ENTREVISTA, BLOCOS_DOSSIE } from "./secoes";

export interface EvidenciasDoPacote {
  /** Uma por item do inventário, na ordem dele — presentes e ausentes. */
  evidencias: Evidencia[];
  /** Itens do inventário sem arquivo correspondente no pacote (lacuna declarada, não erro). */
  ausentes: ItemInventario[];
  /** Arquivos do pacote que o inventário não lista. */
  foraDoInventario: string[];
}

type Secao = NonNullable<Evidencia["secoes"]>[number];

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Seções a partir de cabeçalhos localizados no texto; cada uma vai até o próximo cabeçalho. */
function secoesPorCabecalho(texto: string, achados: Array<{ ancora: string; titulo: string; inicio: number }>): Secao[] {
  const ordenados = achados.filter((a) => a.inicio !== -1).sort((a, b) => a.inicio - b.inicio);
  return ordenados.map((a, i) => ({ ...a, fim: i + 1 < ordenados.length ? ordenados[i + 1].inicio : texto.length }));
}

/** Seções com offsets no texto extraído, para o visualizador realçar o trecho citado. */
function secoesDoArquivo(arquivo: string, texto: string): Secao[] | undefined {
  if (arquivo.endsWith("metodo.md")) {
    return Object.values(fatiarMetodoMD(texto)).map(({ ancora, titulo, inicio, fim }) => ({ ancora, titulo, inicio, fim }));
  }
  if (arquivo.endsWith(".md")) {
    const achados = [...texto.matchAll(/^##\s+(.+)$/gm)].map((m, i) => ({ ancora: `#${i + 1}`, titulo: m[1].trim(), inicio: m.index ?? -1 }));
    return secoesPorCabecalho(texto, achados);
  }
  if (arquivo.endsWith("transcricao_entrevista_tecnica.pdf")) {
    // A ordem das perguntas muda entre pacotes; a âncora segue o número impresso no documento.
    const achados = Object.values(PERGUNTAS_ENTREVISTA).map((pergunta) => {
      const m = new RegExp(`^(?:(\\d+)\\.\\s*)?${escapar(pergunta)}`, "m").exec(texto);
      return { ancora: m?.[1] ? `#${m[1]}` : `#${pergunta}`, titulo: pergunta, inicio: m?.index ?? -1 };
    });
    return secoesPorCabecalho(texto, achados);
  }
  if (arquivo.endsWith("dossie_projeto.pdf")) {
    const achados = BLOCOS_DOSSIE.map((bloco, i) => ({
      ancora: `#${i + 1}`,
      titulo: bloco,
      inicio: new RegExp(`^${escapar(bloco)}\\s*$`, "m").exec(texto)?.index ?? -1
    }));
    return secoesPorCabecalho(texto, achados);
  }
  return undefined;
}

/**
 * Cruza o inventário com os arquivos do pacote. A força probatória vem da coluna `observacao`
 * do próprio inventário (§6.4); `status = Localizada` é preservado só como registro do
 * inventário — a presença real é conferida aqui, pelo arquivo.
 *
 * @param naoLidos caminhos presentes no pacote mas ilegíveis: contam como presentes, sem texto.
 */
export function montarEvidencias(inventario: Inventario, arquivos: PacoteArquivos, naoLidos: string[] = []): EvidenciasDoPacote {
  const caminhos = [...Object.keys(arquivos), ...naoLidos];
  const usados = new Set<string>();

  const localizar = (arquivo: string) =>
    caminhos.find((c) => c === arquivo) ?? caminhos.find((c) => c.endsWith(`/${arquivo}`));

  const evidencias: Evidencia[] = inventario.itens.map((item) => {
    const caminho = localizar(item.arquivo);
    if (caminho) usados.add(caminho);
    const texto = caminho !== undefined ? arquivos[caminho] ?? null : null;
    return {
      id: item.id,
      tipo: item.tipo,
      arquivo: item.arquivo,
      caminhoNoPacote: caminho ?? "",
      conteudoEsperado: item.conteudoEsperado,
      observacaoInventario: item.observacao,
      forcaProbatoria: item.forca,
      statusInventario: item.status,
      presente: caminho !== undefined,
      textoExtraido: texto,
      secoes: texto ? secoesDoArquivo(item.arquivo, texto) : undefined
    };
  });

  return {
    evidencias,
    ausentes: inventario.itens.filter((_, i) => !evidencias[i].presente),
    foraDoInventario: caminhos.filter((c) => !usados.has(c))
  };
}
