import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id") || "PRJ01";

  // Caminho do metodo.md no projeto correspondente
  const metodoPath = path.resolve(process.cwd(), `Arquivos/${id}/evidencias/metodo.md`);
  if (!fs.existsSync(metodoPath)) {
    return new NextResponse("Arquivo não encontrado", { status: 404 });
  }

  const content = fs.readFileSync(metodoPath, "utf-8");
  return new NextResponse(content, {
    status: 200,
    headers: { "Content-Type": "text/markdown; charset=utf-8" }
  });
}
