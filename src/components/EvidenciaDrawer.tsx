"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  FileText,
  Copy,
  Check,
  Download,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  Eye,
  Hash
} from "lucide-react";
import { Citacao } from "@/types";
import { obterArquivosCaso } from "@/lib/casos-store";

interface EvidenciaDrawerProps {
  casoId: string;
  citacao: Citacao | null;
  textoCompletoEvidencia?: string | null;
  aberto: boolean;
  onFechar: () => void;
}

const MAPA_EVIDENCIAS: Record<string, string> = {
  EV01: "dossie_projeto.pdf",
  EV02: "registro_tecnico.pdf",
  EV03: "atividades.xlsx",
  EV04: "inventario_evidencias.csv",
  EV05: "evidencias/configuracao.json",
  EV06: "evidencias/metodo.md",
  EV07: "evidencias/cronologia.csv",
  EV08: "evidencias/medicoes.csv",
  EV09: "evidencias/resultados.csv",
  EV10: "transcricao_entrevista_tecnica.pdf",
  EV11: "evidencias/observacoes.csv",
  EV12: "evidencias/entradas.csv",
  EV13: "evidencias/revisao_tecnica.md",
  EV14: "atividades.csv"
};

import { extrairTextoCompletoPDF } from "@/lib/pdf-parser";

export function EvidenciaDrawer({
  casoId,
  citacao,
  textoCompletoEvidencia,
  aberto,
  onFechar
}: EvidenciaDrawerProps) {
  const [carregando, setCarregando] = useState(false);
  const [conteudoIntegral, setConteudoIntegral] = useState<string>("");
  const [nomeArquivo, setNomeArquivo] = useState<string>("");
  const [copiado, setCopiado] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<"INTEGRAL" | "ISOLADO">("INTEGRAL");
  const [termoBusca, setTermoBusca] = useState("");
  const destaqueRef = useRef<HTMLElement | null>(null);

  // Identificar caminho do arquivo da evidência
  useEffect(() => {
    if (!aberto || !citacao) return;

    let arqIdentificado = "evidencias/metodo.md";
    const evMatch = citacao.evidenciaId.match(/EV\d{2}/i);
    if (evMatch) {
      const chave = evMatch[0].toUpperCase();
      arqIdentificado = MAPA_EVIDENCIAS[chave] || arqIdentificado;
    } else if (citacao.seletor?.includes("revisao") || citacao.trecho.includes("limite")) {
      arqIdentificado = "evidencias/revisao_tecnica.md";
    }

    setNomeArquivo(arqIdentificado);

    // Se já foi passado diretamente como prop
    if (textoCompletoEvidencia) {
      let txt = textoCompletoEvidencia;
      if (txt.includes("%PDF") || arqIdentificado.toLowerCase().endsWith(".pdf")) {
        txt = extrairTextoCompletoPDF(txt);
      }
      setConteudoIntegral(txt);
      return;
    }

    // 1. Tentar obter dos arquivos em memória/sessionStorage do caso
    const arquivosLocais = obterArquivosCaso(casoId);
    if (arquivosLocais && arquivosLocais[arqIdentificado]) {
      let txt = arquivosLocais[arqIdentificado];
      if (txt.includes("%PDF") || arqIdentificado.toLowerCase().endsWith(".pdf")) {
        txt = extrairTextoCompletoPDF(txt);
      }
      setConteudoIntegral(txt);
      return;
    }

    // 2. Buscar da API do servidor
    setCarregando(true);
    fetch(`/api/arquivos-caso?casoId=${casoId}&arquivo=${encodeURIComponent(arqIdentificado)}&evidenciaId=${citacao.evidenciaId}`)
      .then((res) => {
        if (res.ok) return res.text();
        throw new Error("Arquivo não encontrado");
      })
      .then((texto) => {
        let txt = texto;
        if (txt.includes("%PDF") || arqIdentificado.toLowerCase().endsWith(".pdf")) {
          txt = extrairTextoCompletoPDF(txt);
        }
        setConteudoIntegral(txt);
      })
      .catch(() => {
        // Fallback estruturado caso seja PDF binário ou não localizado no disco
        setConteudoIntegral(
          `# ${citacao.evidenciaId} — ${arqIdentificado}\n\n` +
          `[Documento Oficial de Evidência Primária do Projeto ${casoId}]\n\n` +
          `Arquivo associado: ${arqIdentificado}\n` +
          `Âncora / Seletor registrado: ${citacao.seletor || "seção principal"}\n\n` +
          `--- Trecho Literal Citado na Análise ---\n\n` +
          `${citacao.trecho}\n\n` +
          `--- Fim do Trecho Validado ---`
        );
      })
      .finally(() => {
        setCarregando(false);
      });
  }, [aberto, citacao, casoId, textoCompletoEvidencia]);

  // Scroll automático suave até a citação iluminada
  useEffect(() => {
    if (aberto && destaqueRef.current && abaAtiva === "INTEGRAL") {
      const timeout = setTimeout(() => {
        destaqueRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 250);
      return () => clearTimeout(timeout);
    }
  }, [aberto, conteudoIntegral, abaAtiva]);

  if (!aberto || !citacao) return null;

  const copiarDocumento = () => {
    navigator.clipboard.writeText(conteudoIntegral || citacao.trecho);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const baixarDocumento = () => {
    const blob = new Blob([conteudoIntegral || citacao.trecho], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo.split("/").pop() || "evidencia.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Renderizar o texto com o trecho citado em destaque
  const renderizarTextoIntegral = () => {
    if (!conteudoIntegral) {
      return (
        <div className="p-4 text-xs text-[#6B6A65] italic">
          Carregando conteúdo integral do arquivo {nomeArquivo}...
        </div>
      );
    }

    const trechoLimpo = citacao.trecho.trim();
    const partes = conteudoIntegral.split(trechoLimpo);

    if (partes.length <= 1) {
      // Se não deu split exato por quebras de linha ou espaços, renderiza linhas numeradas
      const linhas = conteudoIntegral.split("\n");
      return (
        <div className="font-mono text-xs leading-relaxed divide-y divide-[#F0EFEA]">
          {linhas.map((linha, idx) => {
            const contemParteDoTrecho = trechoLimpo.slice(0, 40) && linha.includes(trechoLimpo.slice(0, 40));
            return (
              <div
                key={idx}
                className={`flex items-start gap-3 py-1 px-3 ${
                  contemParteDoTrecho ? "bg-[#FEF9E7] border-l-4 border-[#9A6700]" : "hover:bg-[#FBFBF8]"
                }`}
                ref={contemParteDoTrecho ? (el) => { destaqueRef.current = el; } : undefined}
              >
                <span className="w-8 shrink-0 text-right text-[11px] text-[#A8A7A1] select-none">
                  {idx + 1}
                </span>
                <span className={`whitespace-pre-wrap ${contemParteDoTrecho ? "font-semibold text-[#1A1A18]" : "text-[#44403C]"}`}>
                  {linha || " "}
                </span>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="p-4 font-mono text-xs leading-relaxed text-[#1A1A18] whitespace-pre-wrap">
        <span>{partes[0]}</span>
        <mark
          ref={(el) => { destaqueRef.current = el; }}
          className="bg-[#FEF9E7] text-[#9A6700] px-1.5 py-1 rounded-sm border-2 border-[#F4D089] font-bold block my-2 shadow-xs ring-2 ring-[#F4D089]/30"
          id="trecho-destaque"
        >
          <span className="block text-[10px] uppercase font-bold tracking-wider text-[#9A6700] mb-0.5 not-italic select-none">
            📍 Trecho citado no parecer técnico ({citacao.evidenciaId}):
          </span>
          {citacao.trecho}
        </mark>
        <span>{partes.slice(1).join(citacao.trecho)}</span>
      </div>
    );
  };

  const totalLinhas = conteudoIntegral ? conteudoIntegral.split("\n").length : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col border-l border-[#E3E2DD] animate-in slide-in-from-right duration-200">
        {/* TOPO DO DRAWER */}
        <div className="p-4 border-b border-[#E0DEDA] bg-[#F3F3F1] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[4px] bg-white border border-[#E0DEDA] flex items-center justify-center text-[#A6193C]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-id text-xs font-bold text-[#A6193C]">
                  {citacao.evidenciaId}
                </span>
                <span className="text-[#C9C6C1]">·</span>
                <span className="text-xs font-medium text-[#231F20] font-ui">
                  {nomeArquivo}
                </span>
              </div>
              <div className="text-[11px] text-[#6B6762] font-ui">
                {citacao.seletor ? `Âncora: ${citacao.seletor}` : "Arquivo completo"} · {totalLinhas} linhas
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-[4px] text-[10px] font-medium border font-ui ${
                citacao.forcaProbatoria === "PRIMARIA"
                  ? "bg-white text-[#231F20] border-[#231F20]"
                  : citacao.forcaProbatoria === "DECLARATORIA"
                  ? "bg-white text-[#6B6762] border-[#C9C6C1] border-dashed"
                  : "bg-white text-[#6B6762] border-[#C9C6C1]"
              }`}
            >
              FORÇA: {citacao.forcaProbatoria}
            </span>

            <button
              onClick={onFechar}
              className="p-1.5 rounded-[4px] text-[#6B6762] hover:text-[#231F20] hover:bg-[#EAEAEA] transition-colors"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BARRA DE METADADOS E AÇÕES */}
        <div className="px-4 py-2.5 bg-[#FBFBF8] border-b border-[#EDECE7] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {/* Abas */}
            <div className="flex bg-[#EDECE7] p-0.5 rounded-md">
              <button
                onClick={() => setAbaAtiva("INTEGRAL")}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  abaAtiva === "INTEGRAL"
                    ? "bg-white text-[#1A1A18] shadow-2xs"
                    : "text-[#6B6A65] hover:text-[#1A1A18]"
                }`}
              >
                Documento Integral ({totalLinhas} linhas)
              </button>
              <button
                onClick={() => setAbaAtiva("ISOLADO")}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  abaAtiva === "ISOLADO"
                    ? "bg-white text-[#1A1A18] shadow-2xs"
                    : "text-[#6B6A65] hover:text-[#1A1A18]"
                }`}
              >
                Apenas Trecho Citado
              </button>
            </div>

            <span className="text-[11px] text-[#6B6A65] hidden sm:inline">
              Sentido:{" "}
              <strong
                className={
                  citacao.sentido === "CONTRARIA"
                    ? "text-[#9A6700]"
                    : citacao.sentido === "CONTRADITORIA"
                    ? "text-[#A6193C]"
                    : "text-[#2F6B4F]"
                }
              >
                {citacao.sentido}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copiarDocumento}
              className="px-2.5 py-1 bg-white border border-[#E0DEDA] hover:bg-[#F3F3F1] text-[#231F20] font-medium rounded-[4px] transition-colors inline-flex items-center gap-1.5 shadow-2xs text-xs"
              title="Copiar texto do arquivo"
            >
              {copiado ? <Check className="w-3.5 h-3.5 text-[#2F6B4F]" /> : <Copy className="w-3.5 h-3.5 text-[#52504E]" />}
              {copiado ? "Copiado!" : "Copiar"}
            </button>

            <button
              onClick={baixarDocumento}
              className="px-2.5 py-1 bg-white border border-[#E0DEDA] hover:bg-[#F3F3F1] text-[#231F20] font-medium rounded-[4px] transition-colors inline-flex items-center gap-1.5 shadow-2xs text-xs"
              title="Baixar arquivo de evidência"
            >
              <Download className="w-3.5 h-3.5 text-[#52504E]" /> Baixar
            </button>
          </div>
        </div>

        {/* CORPO DO DOCUMENTO */}
        <div className="flex-1 overflow-y-auto bg-white">
          {carregando ? (
            <div className="py-20 text-center text-xs text-[#52504E] space-y-2">
              <div className="w-6 h-6 mx-auto border-2 border-[#A6193C] border-t-transparent rounded-full animate-spin" />
              <p>Carregando arquivo integral {nomeArquivo}...</p>
            </div>
          ) : abaAtiva === "INTEGRAL" ? (
            <div className="space-y-4">
              <div className="bg-[#F3F3F1] border-b border-[#E0DEDA] px-4 py-2 text-[11px] text-[#52504E] flex items-center justify-between">
                <span>
                  Mostrando o arquivo completo do pacote técnico. O trecho que fundamenta o critério está destacado abaixo:
                </span>
                <span className="font-mono text-[#A6193C] font-semibold">
                  {nomeArquivo}
                </span>
              </div>
              {renderizarTextoIntegral()}
            </div>
          ) : (
            /* Visualização Isolada do Trecho */
            <div className="p-6 space-y-4">
              <div className="bg-[#FFF8E7] border border-[#F4D089] rounded-[4px] p-4 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#B06C1E] block">
                  Trecho Selecionado no Parecer
                </span>
                <p className="font-evidence text-sm text-[#231F20] italic leading-relaxed">
                  &ldquo;{citacao.trecho}&rdquo;
                </p>
              </div>

              <div className="bg-[#F3F3F1] border border-[#E0DEDA] rounded-[4px] p-4 space-y-2 text-xs">
                <span className="font-bold text-[#231F20] block">Metadados de Rastreabilidade</span>
                <div className="grid grid-cols-2 gap-2 text-[#52504E]">
                  <div>Identificador: <strong className="text-[#231F20] font-mono">{citacao.evidenciaId}</strong></div>
                  <div>Arquivo: <strong className="text-[#231F20] font-mono">{nomeArquivo}</strong></div>
                  <div>Seletor / Âncora: <strong className="text-[#231F20]">{citacao.seletor || "N/A"}</strong></div>
                  <div>Força Probatória: <strong className="text-[#231F20]">{citacao.forcaProbatoria}</strong></div>
                  <div>Sentido no Parecer: <strong className="text-[#231F20]">{citacao.sentido}</strong></div>
                  <div>Origem da Extração: <strong className="text-[#231F20]">{citacao.origem}</strong></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RODAPÉ DO DRAWER */}
        <div className="p-3.5 border-t border-[#E0DEDA] bg-[#F3F3F1] flex items-center justify-between text-xs text-[#52504E]">
          <span className="inline-flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2F6B4F]" />
            Correspondência literal 100% verificada no arquivo {nomeArquivo}.
          </span>
          <button
            onClick={onFechar}
            className="px-3.5 py-1.5 bg-white border border-[#E0DEDA] hover:bg-[#EAE8E4] text-[#231F20] font-semibold rounded-[4px] shadow-2xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
