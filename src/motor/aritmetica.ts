import { Ensaio } from "../types";
import { parseDecimal } from "./parsers/csv";

export interface LinhaMedicao {
  registro_id: string;
  ensaio_id: string;
  versao: string;
  cenario: string;
  tipo: string;
  metrica: string;
  valor?: string;
  numerador?: string;
  denominador?: string;
  peso?: string;
  unidade: string;
}

export interface LinhaResultado {
  ensaio_id: string;
  versao: string;
  metrica: string;
  operacao: string;
  valor: string;
  base_de_calculo: string;
  descricao_base: string;
  taxa_percentual?: string;
  unidade: string;
  fonte: string;
  natureza: string;
}

const OPERACOES = [
  "contagem", "media", "mediana", "diferenca_maior_menor", "percentil_95", "valor_observado", "indicador_precalculado"
] as const;
type Operacao = (typeof OPERACOES)[number];

/**
 * Meia unidade da última casa declarada: "6.4" → 0.05; "66.666667" → 5e-7; "8" → 0.5.
 * O valor declarado é uma transcrição arredondada; fora disso, o recálculo diverge.
 */
function tolerancia(declarado: string | undefined): number {
  const casas = (declarado ?? "").trim().split(".")[1]?.length ?? 0;
  return 0.5 * 10 ** -casas + 1e-9;
}

function confere(declarado: string | undefined, valor: number | null, calculado: number): boolean {
  return valor !== null && Math.abs(valor - calculado) <= tolerancia(declarado);
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(6)));
}

function mediana(ordenados: number[]): number {
  const meio = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 ? ordenados[meio] : (ordenados[meio - 1] + ordenados[meio]) / 2;
}

interface Recalculo {
  valor: number | null;
  /** Base de cálculo esperada pela definição da operação (§6.6). */
  base: number | null;
  /** Taxa esperada (só contagem de desempenho). */
  taxa: number | null;
  problema: string | null;
}

/** Recalcula um resultado a partir das medições do mesmo ensaio, pela definição de operacoes_resultados. */
function recalcular(op: Operacao, meds: LinhaMedicao[], natureza: string): Recalculo {
  const valores = () => meds.map((m) => parseDecimal(m.valor)).filter((v): v is number => v !== null);

  switch (op) {
    case "contagem": {
      let num = 0;
      let den = 0;
      for (const m of meds) {
        const n = parseDecimal(m.numerador) ?? parseDecimal(m.valor);
        const d = parseDecimal(m.denominador);
        if (n === null) return { valor: null, base: null, taxa: null, problema: `medição ${m.registro_id} sem numerador` };
        num += n;
        den += d ?? 0;
      }
      const taxa = natureza !== "entrega" && den > 0 ? (num / den) * 100 : null;
      return { valor: num, base: den > 0 ? den : null, taxa, problema: null };
    }
    case "media":
    case "mediana":
    case "diferenca_maior_menor": {
      const v = valores();
      if (v.length !== meds.length) return { valor: null, base: null, taxa: null, problema: "medição sem valor" };
      const ordenados = [...v].sort((a, b) => a - b);
      const valor =
        op === "media" ? v.reduce((a, b) => a + b, 0) / v.length
        : op === "mediana" ? mediana(ordenados)
        : ordenados[ordenados.length - 1] - ordenados[0];
      return { valor, base: v.length, taxa: null, problema: null };
    }
    case "percentil_95": {
      const pares = meds.map((m) => ({ valor: parseDecimal(m.valor), peso: parseDecimal(m.peso) }));
      if (pares.some((p) => p.valor === null || p.peso === null)) {
        return { valor: null, base: null, taxa: null, problema: "linha do histograma sem valor ou peso" };
      }
      const ordenados = (pares as Array<{ valor: number; peso: number }>).sort((a, b) => a.valor - b.valor);
      const total = ordenados.reduce((a, p) => a + p.peso, 0);
      const posto = Math.ceil(0.95 * total);
      let acumulado = 0;
      const alvo = ordenados.find((p) => (acumulado += p.peso) >= posto);
      return { valor: alvo?.valor ?? null, base: total, taxa: null, problema: null };
    }
    case "valor_observado":
    case "indicador_precalculado": {
      if (meds.length !== 1) {
        return { valor: null, base: 1, taxa: null, problema: `esperada uma única medição, há ${meds.length}` };
      }
      return { valor: parseDecimal(meds[0].valor), base: 1, taxa: null, problema: null };
    }
  }
}

/**
 * Recalcula e confere resultados.csv contra medicoes.csv, só com as linhas do mesmo
 * ensaio_id (§6.6). Vazio nunca vira zero; ensaio sem medição não é dado como conferido.
 */
export function conferirAritmetica(resultados: LinhaResultado[], medicoes: LinhaMedicao[]): Ensaio[] {
  const medicoesPorEnsaio: Record<string, LinhaMedicao[]> = {};
  for (const m of medicoes) (medicoesPorEnsaio[m.ensaio_id] ??= []).push(m);

  return resultados.map((res) => {
    const meds = medicoesPorEnsaio[res.ensaio_id] ?? [];
    const valor = parseDecimal(res.valor);
    const base = parseDecimal(res.base_de_calculo);
    const taxa = parseDecimal(res.taxa_percentual);
    const op = (OPERACOES as readonly string[]).includes(res.operacao) ? (res.operacao as Operacao) : null;

    const divergencias: string[] = [];
    let recalculo: number | null = null;

    if (valor === null) divergencias.push("valor declarado vazio (vazio não é zero)");
    if (!op) {
      divergencias.push(`operação desconhecida: "${res.operacao}"`);
    } else if (meds.length === 0) {
      divergencias.push("nenhuma medição do ensaio em medicoes.csv; recálculo impossível");
    } else {
      const r = recalcular(op, meds, res.natureza);
      recalculo = r.valor;
      if (r.problema) divergencias.push(r.problema);
      if (r.valor !== null && valor !== null && !confere(res.valor, valor, r.valor)) {
        divergencias.push(`valor recalculado ${fmt(r.valor)} ≠ declarado ${res.valor}`);
      }
      if (r.base !== null && !confere(res.base_de_calculo, base, r.base)) {
        divergencias.push(`base recalculada ${fmt(r.base)} ≠ declarada ${res.base_de_calculo || "vazia"}`);
      }
      if (r.taxa !== null && taxa !== null && !confere(res.taxa_percentual, taxa, r.taxa)) {
        divergencias.push(`taxa recalculada ${fmt(r.taxa)}% ≠ declarada ${res.taxa_percentual}%`);
      }
      if (taxa !== null && r.taxa === null && !r.problema) {
        divergencias.push("taxa declarada onde a operação não admite taxa (só contagem de desempenho)");
      }
    }

    return {
      id: res.ensaio_id,
      versao: res.versao,
      metrica: res.metrica,
      operacao: (op ?? res.operacao) as Ensaio["operacao"],
      valor,
      baseDeCalculo: base,
      descricaoBase: res.descricao_base,
      taxaPercentual: taxa,
      unidade: res.unidade,
      natureza: res.natureza === "entrega" ? "entrega" : "desempenho",
      fonte: res.fonte,
      conferido: divergencias.length === 0,
      recalculo,
      divergenciaRecalculo: divergencias.length ? divergencias.join("; ") : null
    };
  });
}
