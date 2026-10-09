import { Forca } from "../types";
import { parseCSV } from "./parsers/csv";

/** Mantido por compatibilidade: o tipo Forca já inclui CONTEXTO (§6.4). */
export type ForcaInventario = Forca;

export interface ItemInventario {
  id: string;            // "PRJ02-EV08" — ID nativo
  tipo: string;
  arquivo: string;       // "evidencias/medicoes.csv"
  observacao: string;    // a coluna que declara a natureza probatória
  conteudoEsperado: string;
  status: string;        // "Localizada" em todo o pacote: distrator (§6.5), não comprovação
  forca: ForcaInventario;
}

interface LinhaInventario {
  id_evidencia: string;
  tipo: string;
  arquivo: string;
  conteudo_esperado?: string;
  status?: string;
  observacao: string;
}

/**
 * Força probatória derivada da coluna `observacao` do próprio inventário (§6.4),
 * não de uma tabela nossa. A ordem dos testes importa: "síntese derivada" antes de "síntese".
 */
export function forcaDaObservacao(observacao: string): ForcaInventario {
  const o = observacao.toLowerCase();
  if (o.includes("depoimento")) return "DECLARATORIA";
  if (o.includes("calculado") || o.includes("derivad") || o.includes("síntese")) return "DERIVADA";
  if (o.includes("registro primário") || o.includes("especificação") || o.includes("recortes")) return "PRIMARIA";
  return "CONTEXTO";
}

// Fallback quando o inventário não vem no pacote: a ordem canônica dos 14 arquivos (§6.1).
const ORDEM_CANONICA: Array<[string, string, string]> = [
  ["dossie_projeto.pdf", "Dossiê", "síntese"],
  ["registro_tecnico.pdf", "Registro técnico", "síntese derivada"],
  ["atividades.xlsx", "Atividades", "registro de atividades"],
  ["inventario_evidencias.csv", "Inventário", "índice"],
  ["evidencias/configuracao.json", "Configuração", "especificação"],
  ["evidencias/metodo.md", "Método", "especificação"],
  ["evidencias/cronologia.csv", "Cronologia", "registro de versões"],
  ["evidencias/medicoes.csv", "Medições", "registro primário sintético"],
  ["evidencias/resultados.csv", "Resultados", "calculado ou transcrito de EV08, conforme operação"],
  ["transcricao_entrevista_tecnica.pdf", "Entrevista", "depoimento"],
  ["evidencias/observacoes.csv", "Observações", "recortes sintéticos"],
  ["evidencias/entradas.csv", "Entradas", "recortes sintéticos"],
  ["evidencias/revisao_tecnica.md", "Revisão técnica", "revisão"],
  ["atividades.csv", "Atividades CSV", "derivado de EV03"]
];

/** Os 14 arquivos do pacote, na ordem canônica (§6.1). */
export const ARQUIVOS_DO_PACOTE: ReadonlyArray<{ caminho: string; tipo: string }> = ORDEM_CANONICA.map(
  ([caminho, tipo]) => ({ caminho, tipo })
);

export interface Inventario {
  itens: ItemInventario[];
  declarado: boolean;    // false = montado pelo fallback canônico
  /** Item pelo nome ou caminho do arquivo ("medicoes.csv" ou "evidencias/medicoes.csv"). */
  porArquivo(arquivo: string): ItemInventario | undefined;
}

export function lerInventario(casoId: string, textoInventario: string | undefined): Inventario {
  let itens: ItemInventario[] = [];
  if (textoInventario) {
    itens = parseCSV<LinhaInventario>(textoInventario)
      .filter((l) => l.id_evidencia && l.arquivo)
      .map((l) => ({
        id: l.id_evidencia,
        tipo: l.tipo,
        arquivo: l.arquivo,
        observacao: l.observacao,
        conteudoEsperado: l.conteudo_esperado || "",
        status: l.status || "",
        forca: forcaDaObservacao(l.observacao || "")
      }));
  }
  const declarado = itens.length > 0;
  if (!declarado) {
    itens = ORDEM_CANONICA.map(([arquivo, tipo, observacao], i) => ({
      id: `${casoId}-EV${String(i + 1).padStart(2, "0")}`,
      tipo,
      arquivo,
      observacao,
      conteudoEsperado: "",
      status: "",
      forca: forcaDaObservacao(observacao)
    }));
  }

  return {
    itens,
    declarado,
    porArquivo(arquivo: string) {
      return itens.find((i) => i.arquivo === arquivo || i.arquivo.endsWith(`/${arquivo}`) || arquivo.endsWith(i.arquivo));
    }
  };
}
