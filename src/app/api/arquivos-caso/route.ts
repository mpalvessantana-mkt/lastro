import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MAPA_EVIDENCIAS: Record<string, string> = {
  "EV01": "dossie_projeto.pdf",
  "EV02": "registro_tecnico.pdf",
  "EV03": "atividades.xlsx",
  "EV04": "inventario_evidencias.csv",
  "EV05": "evidencias/configuracao.json",
  "EV06": "evidencias/metodo.md",
  "EV07": "evidencias/cronologia.csv",
  "EV08": "evidencias/medicoes.csv",
  "EV09": "evidencias/resultados.csv",
  "EV10": "transcricao_entrevista_tecnica.pdf",
  "EV11": "evidencias/observacoes.csv",
  "EV12": "evidencias/entradas.csv",
  "EV13": "evidencias/revisao_tecnica.md",
  "EV14": "atividades.csv"
};

import { extrairTextoCompletoPDF } from "@/lib/pdf-parser";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const casoId = searchParams.get("casoId") || "PRJ01";
  let arquivo = searchParams.get("arquivo") || "";
  const evidenciaId = searchParams.get("evidenciaId") || "";
  const modo = searchParams.get("modo") || "visualizar"; // "visualizar" ou "download"

  // Se passou evidenciaId (ex: PRJ01-EV06 ou EV06), mapear para o arquivo
  if (!arquivo && evidenciaId) {
    const match = evidenciaId.match(/EV\d{2}/i);
    if (match) {
      const evNum = match[0].toUpperCase();
      arquivo = MAPA_EVIDENCIAS[evNum] || "evidencias/metodo.md";
    }
  }

  if (!arquivo) {
    arquivo = "evidencias/metodo.md";
  }

  // Sanitizar caminho para evitar directory traversal: casoId só PRJnn; arquivo sem ".."
  if (!/^PRJ\d{2}$/.test(casoId)) {
    return NextResponse.json({ error: "casoId inválido" }, { status: 400 });
  }
  const safeArquivo = arquivo.replace(/\\/g, "/").replace(/\.\./g, "");
  const filePath = path.resolve(process.cwd(), `Arquivos/${casoId}/${safeArquivo}`);

  if (!fs.existsSync(filePath)) {
    // Tentar fallback genérico se for arquivo comum
    const fallbackPath = path.resolve(process.cwd(), `Arquivos/PRJ01/${safeArquivo}`);
    if (fs.existsSync(fallbackPath)) {
      if (fallbackPath.endsWith(".pdf") && modo !== "download") {
        const buf = fs.readFileSync(fallbackPath);
        const text = extrairTextoCompletoPDF(buf);
        return new NextResponse(text, {
          status: 200,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      }
      const content = fs.readFileSync(fallbackPath, "utf-8");
      return new NextResponse(content, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }
    return new NextResponse("Arquivo não encontrado", { status: 404 });
  }

  // 1. Arquivos PDF
  if (filePath.endsWith(".pdf")) {
    const buf = fs.readFileSync(filePath);
    if (modo === "download") {
      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${path.basename(filePath)}"`
        }
      });
    }

    // Modo visualização: entregar texto legível sem linguagem de máquina
    const text = extrairTextoCompletoPDF(buf);
    return new NextResponse(text, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  // 2. Planilhas Excel (.xlsx)
  if (filePath.endsWith(".xlsx")) {
    if (modo === "download") {
      const buf = fs.readFileSync(filePath);
      return new NextResponse(buf, {
        status: 200,
        headers: { "Content-Type": "application/octet-stream" }
      });
    }

    // Se houver CSV correspondente, exibir o CSV legível
    const csvAlternative = filePath.replace(/\.xlsx$/i, ".csv");
    if (fs.existsSync(csvAlternative)) {
      const csvContent = fs.readFileSync(csvAlternative, "utf-8");
      return new NextResponse(csvContent, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }
  }

  const content = fs.readFileSync(filePath, "utf-8");
  return new NextResponse(content, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}
