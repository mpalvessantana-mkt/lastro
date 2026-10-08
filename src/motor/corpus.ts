import corpusData from "../../manuais/corpus-completo.json";
import { Norma } from "../types";

export const corpusNormativo: Norma[] = corpusData.normas as Norma[];
export const versaoCorpus = corpusData.versaoCorpus;

export function obterNormaPorId(id: string): Norma | undefined {
  return corpusNormativo.find((n) => n.id === id);
}

export function listarNormasPorCriterio(criterioId: number): Norma[] {
  return corpusNormativo.filter((n) => n.criteriosRelacionados.includes(criterioId));
}

export function validarNormaId(id: string): boolean {
  return corpusNormativo.some((n) => n.id === id);
}
