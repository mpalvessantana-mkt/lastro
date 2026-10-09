"use client";

import React, { useState, use } from "react";
import { useCarregarNoCliente } from "@/lib/use-carregar-no-cliente";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  obterCasos,
  obterParecerPorId,
  salvarParecer,
  salvarCasos,
  salvarEvidencias,
  salvarArquivosCaso,
  registrarAuditoria
} from "@/lib/casos-store";
import { Caso, Parecer, Evidencia } from "@/types";
import { analisarPacote, PacoteArquivos } from "@/motor";
import { hashPacote, ArquivoBruto } from "@/motor/hash";
import { lerPacote } from "@/motor/parsers/pacote";
import { ARQUIVOS_DO_PACOTE } from "@/motor/inventario";
import { enriquecerParecer } from "@/lib/enriquecer-parecer";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, RefreshCw, CheckCircle2, ArrowRight, GitCompare } from "lucide-react";

interface ResultadoReanalise {
  parecer: Parecer;
  caso: Caso;
  evidencias: Evidencia[];
  arquivos: PacoteArquivos;
}

// Reanálise (§12, tela 8): o analista anexa a versão nova ou corrigida de um dos 14 arquivos, o
// motor roda de novo sobre o pacote atualizado e a versão anterior do parecer é preservada.
// Nenhum estado é escrito à mão: o que muda no diff é o que o motor leu no arquivo novo.
export default function ReanalisePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const casoId = resolvedParams.id;
  const router = useRouter();
  const { usuario } = useAuth();

  const [caso, setCaso] = useState<Caso | null>(null);
  const [parecerV1, setParecerV1] = useState<Parecer | null>(null);

  const [arquivoNovo, setArquivoNovo] = useState<File | null>(null);
  const [destino, setDestino] = useState("");
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoReanalise | null>(null);

  useCarregarNoCliente(casoId, () => {
    const casos = obterCasos();
    const c = casos.find((x) => x.id === casoId);
    if (c) {
      setCaso(c);
      if (c.parecerAtualId) {
        const p = obterParecerPorId(c.parecerAtualId);
        setParecerV1(p);
      }
    }
  });

  if (!caso || !parecerV1) {
    return (
      <div className="py-12 text-center text-xs text-[var(--c-6b6a65)]">
        Carregando caso para reanálise...
      </div>
    );
  }

  const escolherArquivo = (f: File | null) => {
    setArquivoNovo(f);
    setResultado(null);
    setErro(null);
    if (!f) return;
    // Sugere o destino pelo nome do arquivo; o analista confirma ou troca
    const pelaNome = ARQUIVOS_DO_PACOTE.find((a) => a.caminho.split("/").pop() === f.name);
    setDestino(pelaNome ? pelaNome.caminho : "");
  };

  const executarReanalise = async () => {
    if (!arquivoNovo || !destino) return;
    setProcessando(true);
    setErro(null);
    setResultado(null);
    try {
      // Pacote original (bytes) do servidor; sem ele não há como reanalisar só um arquivo
      const res = await fetch(`/api/pacote-demo?id=${caso.id}`).catch(() => null);
      if (!res?.ok) {
        setErro(
          `O pacote original de ${caso.id} não está disponível no servidor. Para reanalisar, suba o pacote completo atualizado em Casos › Novo.`
        );
        return;
      }
      const { arquivos } = (await res.json()) as { arquivos: Array<{ caminho: string; base64: string }> };
      const brutos: ArquivoBruto[] = arquivos
        .filter(({ caminho }) => caminho !== destino)
        .map(({ caminho, base64 }) => ({
          caminho,
          bytes: Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0))
        }));
      brutos.push({ caminho: destino, bytes: new Uint8Array(await arquivoNovo.arrayBuffer()) });

      // O mesmo caminho do upload: hash dos bytes, leitura pelo tipo, motor e IA
      const sha256 = await hashPacote(brutos).then((h) => h.sha256, () => undefined);
      const lido = await lerPacote(brutos);
      const analise = analisarPacote(caso.id, caso.titulo, lido.arquivos, { sha256Pacote: sha256, naoLidos: lido.naoLidos });
      const enriquecido = await enriquecerParecer(analise.parecer, analise.evidencias);

      const versao = parecerV1.versao + 1;
      const v2: Parecer = {
        ...enriquecido,
        id: `PAR-${caso.id}-V${versao}`,
        versao,
        versaoAnteriorId: parecerV1.id,
        situacao: "PROPOSTO",
        geradoPor: `Reanálise: ${destino} substituído por ${arquivoNovo.name}`
      };
      setResultado({ parecer: v2, caso: analise.caso, evidencias: analise.evidencias, arquivos: lido.arquivos });
    } catch (e) {
      setErro(`Não foi possível reanalisar: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setProcessando(false);
    }
  };

  const aprovarV2 = () => {
    if (!resultado) return;
    const v2 = resultado.parecer;

    salvarParecer(v2);
    salvarEvidencias(caso.id, resultado.evidencias);
    // A gaveta de evidência lê primeiro estes textos: mostra o arquivo novo, não o do servidor
    salvarArquivosCaso(caso.id, resultado.arquivos);

    // Caso aponta para a nova versão, com o hash e a leitura do pacote atualizado
    const casos = obterCasos();
    const casosAtualizados = casos.map((c) =>
      c.id === caso.id
        ? {
            ...c,
            situacao: "EM_REVISAO" as const,
            parecerAtualId: v2.id,
            pacote: resultado.caso.pacote,
            leitura: resultado.caso.leitura
          }
        : c
    );
    salvarCasos(casosAtualizados);

    registrarAuditoria({
      casoId,
      ator: usuario.nome,
      papel: usuario.papel,
      acao: "REANALISE",
      alvo: v2.id,
      antes: {
        versao: parecerV1.versao,
        classe: parecerV1.classeFinal || parecerV1.classeProposta,
        sha256Pacote: parecerV1.sha256Pacote
      },
      depois: {
        versao: v2.versao,
        classe: v2.classeProposta,
        sha256Pacote: v2.sha256Pacote,
        arquivoSubstituido: destino,
        arquivoNovo: arquivoNovo?.name ?? null
      },
      em: new Date().toISOString()
    });

    router.push(`/casos/${caso.id}/parecer`);
  };

  const estadoV1 = (c: number) => parecerV1.pontos[c]?.estadoFinal || parecerV1.pontos[c]?.estadoProposto || null;
  const classeV1 = parecerV1.classeFinal || parecerV1.classeProposta;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href={`/casos/${caso.id}/parecer`}
        className="inline-flex items-center gap-1.5 text-xs text-[var(--c-6b6a65)] hover:text-[var(--c-0f5132)] font-semibold"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao parecer
      </Link>

      <div className="bg-[var(--c-ffffff)] border border-[var(--c-e3e2dd)] rounded-xl p-6 shadow-xs space-y-6">
        <div className="border-b border-[var(--c-edece7)] pb-4">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-[var(--c-0f5132)]" />
            <h1 className="text-lg font-bold text-[var(--c-1a1a18)] tracking-tight">
              Reanálise com Diff Documental — {caso.id}
            </h1>
          </div>
          <p className="text-xs text-[var(--c-6b6a65)] mt-1">
            Anexe a versão nova ou corrigida de um arquivo do pacote. O motor lê o pacote atualizado de novo e
            gera a versão {parecerV1.versao + 1} do parecer; a versão {parecerV1.versao} fica preservada.
          </p>
        </div>

        {/* Arquivo novo ou corrigido */}
        <div className="space-y-4 bg-[var(--c-f7f7f4)] p-4 rounded-lg border border-[var(--c-edece7)]">
          <span className="text-xs font-bold text-[var(--c-1a1a18)] uppercase tracking-wider block">
            Anexar Evidência Nova ao Pacote
          </span>

          <div>
            <label className="text-xs font-semibold text-[var(--c-1a1a18)] block mb-1">Arquivo:</label>
            <input
              type="file"
              onChange={(e) => escolherArquivo(e.target.files?.[0] ?? null)}
              className="w-full text-xs p-2 bg-[var(--c-ffffff)] border border-[var(--c-e3e2dd)] rounded-md"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--c-1a1a18)] block mb-1">
              Substitui qual arquivo do pacote?
            </label>
            <select
              value={destino}
              onChange={(e) => {
                setDestino(e.target.value);
                setResultado(null);
              }}
              className="w-full text-xs p-2 bg-[var(--c-ffffff)] border border-[var(--c-e3e2dd)] rounded-md font-mono"
            >
              <option value="">— escolha —</option>
              {ARQUIVOS_DO_PACOTE.map((a) => (
                <option key={a.caminho} value={a.caminho}>
                  {a.caminho} ({a.tipo})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={executarReanalise}
            disabled={!arquivoNovo || !destino || processando}
            className="px-4 py-2 bg-[var(--c-a6193c)] hover:bg-[var(--c-851430)] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-[4px] shadow-2xs transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${processando ? "animate-spin" : ""}`} />
            {processando ? "Reanalisando o pacote..." : "Processar Reanálise e Gerar Diff"}
          </button>

          {erro && (
            <p className="text-xs text-[var(--c-9a6700)] bg-[var(--c-fef9e7)] border border-[var(--c-f4d089)] rounded-md p-2.5">
              {erro}
            </p>
          )}
        </div>

        {/* DIFF COMPARATIVO ENTRE VERSÕES */}
        {resultado && (
          <div className="space-y-4 border-t border-[var(--c-e0deda)] pt-5">
            <h2 className="text-sm font-bold text-[var(--c-231f20)] tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[var(--c-2f6b4f)]" />
              Diff Entre Versões (v{parecerV1.versao} → v{resultado.parecer.versao})
            </h2>

            <table className="w-full text-xs border border-[var(--c-e0deda)] divide-y divide-[var(--c-e0deda)]">
              <thead className="bg-[var(--c-f3f3f1)] text-[11px] text-[var(--c-52504e)] uppercase">
                <tr>
                  <th className="text-left py-1.5 px-2">Ponto</th>
                  <th className="text-left py-1.5 px-2">v{parecerV1.versao} (preservada)</th>
                  <th className="text-left py-1.5 px-2">v{resultado.parecer.versao} (nova proposta)</th>
                </tr>
              </thead>
              <tbody>
                <tr className={classeV1 !== resultado.parecer.classeProposta ? "bg-[var(--c-fef9e7)]" : ""}>
                  <td className="py-1.5 px-2 font-semibold">Classe</td>
                  <td className="py-1.5 px-2">{classeV1}</td>
                  <td className="py-1.5 px-2 font-semibold">{resultado.parecer.classeProposta}</td>
                </tr>
                {[1, 2, 3, 4, 5].map((c) => {
                  const antes = estadoV1(c);
                  const depois = resultado.parecer.pontos[c]?.estadoProposto ?? null;
                  return (
                    <tr key={c} className={antes !== depois ? "bg-[var(--c-fef9e7)]" : ""}>
                      <td className="py-1.5 px-2">
                        {c}. {resultado.parecer.pontos[c]?.nomeCriterio}
                      </td>
                      <td className="py-1.5 px-2">{antes || "lacuna"}</td>
                      <td className="py-1.5 px-2">
                        {depois || "lacuna"}
                        {antes !== depois && <span className="ml-1 text-[10px] text-[var(--c-9a6700)]">(mudou)</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {[1, 2, 3, 4, 5]
              .filter((c) => estadoV1(c) !== (resultado.parecer.pontos[c]?.estadoProposto ?? null))
              .map((c) => (
                <div key={c} className="p-3 bg-[var(--c-ebf5f0)] rounded-[4px] border border-[var(--c-a3d9be)] text-xs space-y-1">
                  <div className="font-bold text-[var(--c-2f6b4f)]">
                    Por que o critério {c} mudou (v{resultado.parecer.versao}):
                  </div>
                  <p className="text-[var(--c-231f20)]">{resultado.parecer.pontos[c]?.porqueProposto}</p>
                </div>
              ))}

            <p className="text-[11px] text-[var(--c-52504e)]">
              A nova versão nasce como proposta: todos os pontos voltam para a revisão do analista.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setResultado(null)}
                className="px-3 py-1.5 text-xs text-[var(--c-52504e)] hover:text-[var(--c-231f20)]"
              >
                Descartar
              </button>
              <button
                onClick={aprovarV2}
                className="px-4 py-2 bg-[var(--c-a6193c)] hover:bg-[var(--c-851430)] text-white text-xs font-semibold rounded-[4px] shadow-2xs transition-colors inline-flex items-center gap-2"
              >
                Ativar Versão {resultado.parecer.versao} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
