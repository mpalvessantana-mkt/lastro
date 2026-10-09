import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Atalho de demonstração do upload: devolve o pacote real de Arquivos/PRJxx (bytes originais em
// base64), para o cliente seguir exatamente o caminho do upload de pasta — hash, leitura pelo tipo,
// motor e IA. Só leitura e só IDs PRJnn: nada fora de Arquivos/ é servido.

const ID_PROJETO = /^PRJ\d{2}$/;

function listar(dir: string, prefixo = ""): Array<{ caminho: string; base64: string }> {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? listar(path.join(dir, e.name), `${prefixo}${e.name}/`)
      : [{ caminho: `${prefixo}${e.name}`, base64: fs.readFileSync(path.join(dir, e.name)).toString("base64") }]
  );
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!ID_PROJETO.test(id)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }
  const dir = path.resolve(process.cwd(), "Arquivos", id);
  if (!fs.existsSync(dir)) {
    return NextResponse.json({ error: `Pacote ${id} não está disponível` }, { status: 404 });
  }
  return NextResponse.json({ id, arquivos: listar(dir) });
}
