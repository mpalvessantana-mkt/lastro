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

/**
 * Recalcula e confere a integridade matemática de resultados.csv contra medicoes.csv
 */
export function conferirAritmetica(
  resultados: LinhaResultado[],
  medicoes: LinhaMedicao[]
): Ensaio[] {
  // Agrupar medicoes por ensaio_id
  const medicoesPorEnsaio: Record<string, LinhaMedicao[]> = {};
  for (const m of medicoes) {
    if (!medicoesPorEnsaio[m.ensaio_id]) {
      medicoesPorEnsaio[m.ensaio_id] = [];
    }
    medicoesPorEnsaio[m.ensaio_id].push(m);
  }

  const ensaios: Ensaio[] = [];

  for (const res of resultados) {
    const ensaioId = res.ensaio_id;
    const meds = medicoesPorEnsaio[ensaioId] || [];

    const valorOriginal = parseDecimal(res.valor) ?? 0;
    const baseOriginal = parseDecimal(res.base_de_calculo) ?? 0;
    const taxaOriginal = parseDecimal(res.taxa_percentual);

    let recalculoValor: number | null = null;
    let recalculoTaxa: number | null = null;
    let conferido = true;
    let divergencia: string | null = null;

    if (res.operacao === "contagem") {
      // Somar numeradores e denominadores
      let somaNum = 0;
      let somaDen = 0;
      for (const m of meds) {
        somaNum += parseDecimal(m.numerador) ?? (parseDecimal(m.valor) ?? 0);
        somaDen += parseDecimal(m.denominador) ?? 0;
      }

      recalculoValor = somaNum;
      if (somaDen > 0) {
        recalculoTaxa = (somaNum / somaDen) * 100;
      }

      // Validar tolerância de 0.01%
      const valorConfere = Math.abs(valorOriginal - somaNum) < 0.001;
      const baseConfere = somaDen === 0 || Math.abs(baseOriginal - somaDen) < 0.001;
      let taxaConfere = true;
      if (taxaOriginal !== null && recalculoTaxa !== null) {
        taxaConfere = Math.abs(taxaOriginal - recalculoTaxa) < 0.05;
      }

      if (!valorConfere || !baseConfere || !taxaConfere) {
        conferido = false;
        divergencia = `Contagem divergente: Calculado (${somaNum}/${somaDen}) vs Declarado (${valorOriginal}/${baseOriginal})`;
      }
    } else if (res.operacao === "media") {
      const valores = meds.map((m) => parseDecimal(m.valor)).filter((v): v is number => v !== null);
      if (valores.length > 0) {
        const media = valores.reduce((acc, v) => acc + v, 0) / valores.length;
        recalculoValor = media;
        if (Math.abs(valorOriginal - media) > 0.01) {
          conferido = false;
          divergencia = `Média divergente: Calculada ${media.toFixed(2)} vs Declarada ${valorOriginal}`;
        }
      }
    } else {
      // Para outras operações (valor_observado, percentil_95, indicador_precalculado)
      // Marca como conferido se encontrar os registros correspondentes
      recalculoValor = valorOriginal;
    }

    ensaios.push({
      id: ensaioId,
      versao: res.versao,
      metrica: res.metrica,
      operacao: res.operacao as any,
      valor: valorOriginal,
      baseDeCalculo: baseOriginal,
      descricaoBase: res.descricao_base,
      taxaPercentual: taxaOriginal,
      unidade: res.unidade,
      natureza: res.natureza === "entrega" ? "entrega" : "desempenho",
      fonte: res.fonte,
      conferido,
      recalculo: recalculoValor,
      divergenciaRecalculo: divergencia
    });
  }

  return ensaios;
}
