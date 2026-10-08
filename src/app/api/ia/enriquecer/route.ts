import { NextRequest, NextResponse } from "next/server";
import { enriquecerComIA } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { criterioId, estadoSugerido, textoEvidencias, idsValidos } = body;

    if (!criterioId || !estadoSugerido || !textoEvidencias) {
      return NextResponse.json(
        { error: "Parâmetros obrigatórios ausentes" },
        { status: 400 }
      );
    }

    const resultado = await enriquecerComIA(
      criterioId,
      estadoSugerido,
      textoEvidencias,
      idsValidos || []
    );

    return NextResponse.json(resultado, { status: 200 });
  } catch (err: any) {
    console.error("Erro na rota /api/ia/enriquecer:", err);
    return NextResponse.json(
      { error: err.message || "Erro interno", usouIA: false },
      { status: 500 }
    );
  }
}
