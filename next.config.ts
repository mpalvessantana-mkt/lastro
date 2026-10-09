import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove o selo "N" do Next.js que aparece no canto da tela em `next dev`.
  // So afeta o indicador; o overlay de erros do desenvolvimento continua ativo.
  devIndicators: false,
  // As rotas que servem pacotes leem Arquivos/ em tempo de execução: incluir no deploy.
  outputFileTracingIncludes: {
    "/api/pacote-demo": ["./Arquivos/PRJ*/**/*"],
    "/api/arquivos-caso": ["./Arquivos/PRJ*/**/*"],
  },
  // Raiz do projeto explícita: sem ela o Next procura lockfiles nas pastas acima (ex.: ~/package-lock.json).
  outputFileTracingRoot: path.resolve(__dirname),
  turbopack: {
    root: path.resolve(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
