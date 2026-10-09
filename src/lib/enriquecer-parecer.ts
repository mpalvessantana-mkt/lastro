import type { Evidencia, Parecer } from "@/types";
import { montarEntradasIA, incorporarEnriquecimento } from "@/motor/enriquecimento";
import { validarRespostaIA } from "@/motor/schemas";

// Chamada do cliente à camada de IA (§8.2), um critério por requisição, em paralelo.
// Nunca lança: o que falhar fica com o motor determinístico e é registrado no parecer.

const TIMEOUT_MS = 35_000;

interface RespostaRota {
  output: unknown;
  usouIA: boolean;
  motivo: string | null;
  modelo?: string;
}

export async function enriquecerParecer(parecer: Parecer, evidencias: Evidencia[]): Promise<Parecer> {
  const entradas = montarEntradasIA(parecer, evidencias);
  if (entradas.length === 0) return parecer;

  const respostas = await Promise.all(
    entradas.map(async (e) => {
      try {
        const res = await fetch("/api/ia/enriquecer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(e),
          signal: AbortSignal.timeout(TIMEOUT_MS)
        });
        if (!res.ok) return { entrada: e, dados: null, motivo: `HTTP ${res.status}` };
        return { entrada: e, dados: (await res.json()) as RespostaRota, motivo: null };
      } catch {
        return { entrada: e, dados: null, motivo: "sem resposta da rota" };
      }
    })
  );

  let resultado = parecer;
  let modelo = "";
  const criteriosEnriquecidos: number[] = [];
  const naoEnriquecidos: Array<{ criterioId: number; motivo: string }> = [];
  const lacunasSugeridas: Array<{ criterioId: number; texto: string }> = [];

  for (const { entrada, dados, motivo } of respostas) {
    if (dados?.modelo) modelo = dados.modelo;
    if (!dados || !dados.usouIA) {
      naoEnriquecidos.push({ criterioId: entrada.criterioId, motivo: dados?.motivo ?? motivo ?? "IA não usada" });
      continue;
    }
    // Revalida no cliente: a rota é uma fronteira HTTP.
    const v = validarRespostaIA(dados.output, {
      textoEvidencias: Object.values(entrada.textosPorId).join("\n"),
      idsValidos: entrada.idsValidos,
      textosPorId: entrada.textosPorId
    });
    if (!v.ok) {
      naoEnriquecidos.push({ criterioId: entrada.criterioId, motivo: `descartada no cliente: ${v.motivo}` });
      continue;
    }
    resultado = incorporarEnriquecimento(resultado, evidencias, entrada.criterioId, v.output);
    const lacuna = v.output.lacunaIdentificada?.trim();
    if (lacuna) lacunasSugeridas.push({ criterioId: entrada.criterioId, texto: lacuna });
    criteriosEnriquecidos.push(entrada.criterioId);
  }

  return {
    ...resultado,
    enriquecimentoIA: { modelo, em: new Date().toISOString(), criteriosEnriquecidos, naoEnriquecidos, lacunasSugeridas }
  };
}
