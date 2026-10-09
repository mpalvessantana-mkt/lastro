"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Folder, CheckCircle2, Clock } from "lucide-react";
import JSZip from "jszip";
import { analisarPacote } from "@/motor";
import { hashPacote, ArquivoBruto } from "@/motor/hash";
import { lerPacote } from "@/motor/parsers/pacote";
import { adicionarCasoComParecer, registrarAuditoria } from "@/lib/casos-store";
import { enriquecerParecer } from "@/lib/enriquecer-parecer";
import { HISTORICOS_REFERENCIA } from "@/lib/referencia-data";
import { useAuth } from "@/contexts/AuthContext";

const ETAPAS = [
  "Localizando e indexando os 14 arquivos",
  "Fatiando método em 7 seções canônicas",
  "Recalculando ensaios e conferindo aritmética",
  "Cruzando 10 campos espelhados entre as fontes",
  "Redigindo e fundamentando a proposta de parecer"
];

const ARQUIVOS_CANONICOS = [
  "dossie_projeto.pdf",
  "registro_tecnico.pdf",
  "transcricao_entrevista_tecnica.pdf",
  "atividades.csv",
  "atividades.xlsx",
  "inventario_evidencias.csv",
  "evidencias/metodo.md",
  "evidencias/configuracao.json",
  "evidencias/cronologia.csv",
  "evidencias/medicoes.csv",
  "evidencias/resultados.csv",
  "evidencias/entradas.csv",
  "evidencias/observacoes.csv",
  "evidencias/revisao_tecnica.md"
];

export default function NovoCasoPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [processando, setProcessando] = useState(false);
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [, setArquivosLidos] = useState<string[]>([]);
  const [casoIdEmAnalise, setCasoIdEmAnalise] = useState("PRJ27");
  const [tituloEmAnalise, setTituloEmAnalise] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const processarArquivosTexto = async (brutos: ArquivoBruto[], idProjeto: string, tituloProjeto: string) => {
    setProcessando(true);
    setCasoIdEmAnalise(idProjeto);
    setTituloEmAnalise(tituloProjeto);

    // Etapas reais do processamento: cada uma acende quando o trabalho dela começa.
    // pintar() cede um quadro ao navegador para a etapa aparecer antes do trabalho síncrono.
    const pintar = () => new Promise((r) => setTimeout(r, 0));
    const inicio = performance.now();
    setArquivosLidos(brutos.map((b) => b.caminho));

    // 0 · Leitura e indexação: hash sobre os bytes originais (não sobre o texto) e leitura pelo
    // tipo (PDF → texto, XLSX → CSV). Sem crypto.subtle (fora de https/localhost) o motor registra
    // a lacuna do hash; arquivo ilegível vira lacuna, não erro.
    setEtapaAtual(0);
    await pintar();
    const sha256 = await hashPacote(brutos).then((h) => h.sha256, () => undefined);
    const { arquivos, naoLidos } = await lerPacote(brutos);

    // 1–3 · Motor determinístico: seções, aritmética e confronto rodam juntos em analisarPacote.
    setEtapaAtual(1);
    await pintar();
    const resultado = analisarPacote(idProjeto, tituloProjeto, arquivos, { sha256Pacote: sha256, naoLidos });

    // 4 · Camada de IA (§8.2): só redige o porquê e acrescenta trechos validados.
    // Sem chave, sem rede ou com resposta descartada, segue o parecer do motor.
    setEtapaAtual(4);
    await pintar();
    const parecer = await enriquecerParecer(resultado.parecer, resultado.evidencias);
    // Tempo do upload ao parecer (o que o analista espera), não só o do motor.
    resultado.caso.leitura.duracaoMs = Math.round(performance.now() - inicio);

    // Salvar no repositório de casos
    adicionarCasoComParecer(resultado.caso, parecer, resultado.evidencias);

    registrarAuditoria({
      casoId: idProjeto,
      ator: usuario.nome,
      papel: usuario.papel,
      acao: "PACOTE_INGERIDO",
      alvo: idProjeto,
      antes: null,
      depois: { arquivos: Object.keys(arquivos).length, classeProposta: resultado.parecer.classeProposta },
      em: new Date().toISOString()
    });

    registrarAuditoria({
      casoId: idProjeto,
      ator: "LASTRO Motor v1.0",
      papel: "analista",
      acao: "PARECER_PROPOSTO",
      alvo: parecer.id,
      antes: null,
      depois: {
        classe: parecer.classeProposta,
        ia: parecer.enriquecimentoIA
          ? { modelo: parecer.enriquecimentoIA.modelo, criterios: parecer.enriquecimentoIA.criteriosEnriquecidos }
          : null
      },
      em: new Date().toISOString()
    });

    setEtapaAtual(5); // Concluído
    await new Promise((r) => setTimeout(r, 300));
    router.push(`/casos/${idProjeto}/parecer`);
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const zip = new JSZip();
    const zipData = await zip.loadAsync(file);
    const brutos: ArquivoBruto[] = [];

    let detectedId = file.name.replace(/\.[^/.]+$/, "").toUpperCase();
    if (!detectedId.startsWith("PRJ")) detectedId = "PRJ28";

    for (const [pathName, zipEntry] of Object.entries(zipData.files)) {
      if (!zipEntry.dir) {
        const bytes = await zipEntry.async("uint8array");
        brutos.push({ caminho: pathName, bytes });
      }
    }

    processarArquivosTexto(brutos, detectedId, `Projeto ${detectedId}`);
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const brutos: ArquivoBruto[] = [];
    let detectedId = "PRJ29";

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const relPath = f.webkitRelativePath || f.name;
      const partes = relPath.split("/");
      if (partes[0].startsWith("PRJ")) detectedId = partes[0].toUpperCase();
      const relativeClean = partes.slice(1).join("/") || f.name;

      const bytes = new Uint8Array(await f.arrayBuffer());
      brutos.push({ caminho: relativeClean, bytes });
    }

    processarArquivosTexto(brutos, detectedId, `Projeto ${detectedId}`);
  };

  // Demonstração rápida direta com um dos 20 casos históricos de teste
  const carregarCasoDemo = async (projetoId: string, titulo: string) => {
    setProcessando(true);
    setCasoIdEmAnalise(projetoId);

    const historico = HISTORICOS_REFERENCIA.find((h) => h.id === projetoId);
    const tituloReal = historico?.titulo || titulo;
    setTituloEmAnalise(tituloReal);

    // Pacote real de Arquivos/ (bytes originais): o mesmo caminho do upload de pasta
    const res = await fetch(`/api/pacote-demo?id=${projetoId}`).catch(() => null);
    if (!res?.ok) {
      setProcessando(false);
      alert(`O pacote ${projetoId} não está disponível no servidor.`);
      return;
    }
    const { arquivos } = (await res.json()) as { arquivos: Array<{ caminho: string; base64: string }> };
    const brutosDemo = arquivos.map(({ caminho, base64 }) => ({
      caminho,
      bytes: Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0))
    }));
    processarArquivosTexto(brutosDemo, projetoId, tituloReal);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-ui">
      <div>
        <h1 className="text-xl font-bold text-[var(--c-231f20)] tracking-tight">
          Acervo — Upload de novo projeto
        </h1>
        <p className="text-xs text-[var(--c-52504e)] mt-0.5">
          Arraste a pasta descompactada ou o arquivo .zip com os 14 arquivos do projeto
        </p>
      </div>

      {/* Área Retangular Tracejada (TELA 3) */}
      {!processando ? (
        <div className="bg-[var(--c-ffffff)] border-2 border-dashed border-[var(--c-e0deda)] rounded-[4px] p-8 sm:p-12 text-center shadow-2xs space-y-4">
          <div className="w-14 h-14 mx-auto rounded-[4px] bg-[var(--c-f3f3f1)] flex items-center justify-center text-[var(--c-a6193c)]">
            <Folder className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[var(--c-231f20)]">
              Arraste a pasta do projeto ou um arquivo .zip
            </h3>
            <p className="text-xs text-[var(--c-52504e)] mt-1">
              PRJ21 a PRJ40 · 14 arquivos por pacote conforme estrutura canônica
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleZipUpload}
              accept=".zip"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-[var(--c-a6193c)] hover:bg-[var(--c-851430)] text-white text-xs font-semibold rounded-[4px] shadow-2xs transition-colors inline-flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" /> Selecionar arquivo .ZIP
            </button>

            <input
              type="file"
              ref={folderInputRef}
              onChange={handleFolderUpload}
              {...({ webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
              className="hidden"
            />
            <button
              onClick={() => folderInputRef.current?.click()}
              className="px-4 py-2 bg-[var(--c-ffffff)] border border-[var(--c-e0deda)] hover:bg-[var(--c-f3f3f1)] text-[var(--c-231f20)] text-xs font-semibold rounded-[4px] shadow-2xs transition-colors inline-flex items-center gap-2"
            >
              <Folder className="w-4 h-4 text-[var(--c-52504e)]" /> Selecionar Pasta
            </button>
          </div>

          {/* Atalho de Demonstração Rápida no Palco */}
          <div className="pt-6 border-t border-[var(--c-e0deda)] max-w-lg mx-auto">
            <span className="text-[11px] font-semibold text-[var(--c-52504e)] uppercase tracking-wider block mb-2">
              Demonstração ao Vivo no Pitch (Atalho sem upload de arquivo)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => carregarCasoDemo("PRJ02", "Detecção de divergências entre razão e extrato")}
                className="p-2 text-left bg-[var(--c-f3f3f1)] hover:bg-[var(--c-ebf5f0)] border border-[var(--c-e0deda)] rounded-[4px] transition-colors"
              >
                <div className="font-mono font-bold text-xs text-[var(--c-2f6b4f)]">PRJ02</div>
                <div className="text-[10px] text-[var(--c-52504e)] truncate">Elegível</div>
              </button>

              <button
                onClick={() => carregarCasoDemo("PRJ05", "Aplicativo de proposta com trabalho offline")}
                className="p-2 text-left bg-[var(--c-f3f3f1)] hover:bg-[var(--c-fff8e7)] border border-[var(--c-e0deda)] rounded-[4px] transition-colors"
              >
                <div className="font-mono font-bold text-xs text-[var(--c-b06c1e)]">PRJ05</div>
                <div className="text-[10px] text-[var(--c-52504e)] truncate">Com ressalvas</div>
              </button>

              <button
                onClick={() => carregarCasoDemo("PRJ01", "Reprocessamento seguro de mensagens duplicadas")}
                className="p-2 text-left bg-[var(--c-f3f3f1)] hover:bg-[var(--c-faf9f7)] border border-[var(--c-e0deda)] rounded-[4px] transition-colors"
              >
                <div className="font-mono font-bold text-xs text-[var(--c-52504e)]">PRJ01</div>
                <div className="text-[10px] text-[var(--c-52504e)] truncate">Não elegível</div>
              </button>

              <button
                onClick={() => carregarCasoDemo("PRJ08", "Monitoramento de canais em agências remotas")}
                className="p-2 text-left bg-[var(--c-f3f3f1)] hover:bg-[var(--c-eff6ff)] border border-[var(--c-e0deda)] rounded-[4px] transition-colors"
              >
                <div className="font-mono font-bold text-xs text-[var(--c-3a5a78)]">PRJ08</div>
                <div className="text-[10px] text-[var(--c-52504e)] truncate">Evid. insuf.</div>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Painel de Progresso em Andamento (TELA 3) */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-[var(--c-ffffff)] border border-[var(--c-e0deda)] rounded-[4px] p-6 shadow-2xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-[var(--c-231f20)] tracking-tight">
                Lendo {casoIdEmAnalise}{tituloEmAnalise ? ` · ${tituloEmAnalise}` : ""}...
              </h2>
              <p className="text-xs text-[var(--c-52504e)]">
                Executando extração determinística, conferência de aritmética e matriz de regras
              </p>
            </div>

            <div className="space-y-3">
              {ETAPAS.map((etapa, idx) => {
                const concluido = idx < etapaAtual;
                const emAndamento = idx === etapaAtual;
                return (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    {concluido ? (
                      <CheckCircle2 className="w-4 h-4 text-[var(--c-2f6b4f)] shrink-0" />
                    ) : emAndamento ? (
                      <Clock className="w-4 h-4 text-[var(--c-ff8a22)] animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-[var(--c-e0deda)] shrink-0" />
                    )}
                    <span
                      className={`${
                        concluido
                          ? "text-[var(--c-231f20)] font-medium"
                          : emAndamento
                          ? "text-[var(--c-ff8a22)] font-semibold"
                          : "text-[var(--c-757371)]"
                      }`}
                    >
                      {etapa}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coluna Estreita com Checklist dos Arquivos */}
          <div className="bg-[var(--c-ffffff)] border border-[var(--c-e0deda)] rounded-[4px] p-5 shadow-2xs">
            <h3 className="text-xs font-semibold text-[var(--c-231f20)] uppercase tracking-wider mb-3">
              Arquivos do Pacote (14)
            </h3>
            <ul className="space-y-1.5 font-mono text-[11px]">
              {ARQUIVOS_CANONICOS.map((arq, idx) => (
                <li key={idx} className="flex items-center justify-between text-[var(--c-52504e)]">
                  <span className="truncate pr-2">{arq}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--c-2f6b4f)] shrink-0" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
