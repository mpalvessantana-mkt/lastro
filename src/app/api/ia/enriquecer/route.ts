import { NextRequest, NextResponse } from "next/server";
import { enriquecerComIA, rotularEvidencias, MODELO_IA } from "@/lib/gemini";

// Contrato: { criterioId, estadoSugerido, textoEvidencias | textosPorId, idsValidos? }
//   textosPorId (ID nativo → texto) faz cada trecho ser conferido na evidência que cita.
//        → { output, usouIA, motivo, modelo }. Falha da IA nunca é erro: usouIA: false, status 200.
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido", usouIA: false }, { status: 400 });
  }

  const { criterioId, estadoSugerido, idsValidos } = body;
  const textosPorId = lerTextosPorId(body.textosPorId);
  const textoEvidencias = typeof body.textoEvidencias === "string" && body.textoEvidencias
    ? body.textoEvidencias
    : textosPorId ? rotularEvidencias(textosPorId) : "";
  if (typeof criterioId !== "number" || typeof estadoSugerido !== "string" || !textoEvidencias) {
    return NextResponse.json({ error: "Parâmetros obrigatórios ausentes", usouIA: false }, { status: 400 });
  }
  const ids = Array.isArray(idsValidos) ? idsValidos.filter((id): id is string => typeof id === "string") : [];

  const resultado = await enriquecerComIA(criterioId, estadoSugerido, textoEvidencias, ids, textosPorId);
  return NextResponse.json({ ...resultado, modelo: MODELO_IA }, { status: 200 });
}

function lerTextosPorId(valor: unknown): Record<string, string> | undefined {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return undefined;
  const entradas = Object.entries(valor).filter((e): e is [string, string] => typeof e[1] === "string");
  return entradas.length > 0 ? Object.fromEntries(entradas) : undefined;
}
