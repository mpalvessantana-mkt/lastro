import { NextRequest, NextResponse } from "next/server";
import { avaliarProjetoComIA } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { casoId, titulo, textoCompleto } = body;

    if (!casoId) {
      return NextResponse.json({ error: "casoId é obrigatório" }, { status: 400 });
    }

    const { avaliacao, usouIA } = await avaliarProjetoComIA({
      casoId,
      titulo: titulo || `Projeto ${casoId}`,
      textoCompleto: textoCompleto || ""
    });

    return NextResponse.json({
      avaliacao,
      usouIA
    });
  } catch (err) {
    console.error("Erro na rota /api/ia/avaliar:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar avaliação com IA", detalhes: String(err) },
      { status: 500 }
    );
  }
}
