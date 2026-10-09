"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  FileText,
  Copy,
  Check,
  Download,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { Citacao } from "@/types";
import { obterArquivosCaso } from "@/lib/casos-store";
import { SeloForca } from "./SeloForca";

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
  const [copiado, setCopiado] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<"INTEGRAL" | "ISOLADO">("INTEGRAL");
  const destaqueRef = useRef<HTMLElement | null>(null);

  // Identificar caminho do arquivo da evidência
  let nomeArquivo = "";
  if (aberto && citacao) {
    nomeArquivo = "evidencias/metodo.md";
    const evMatch = citacao.evidenciaId.match(/EV\d{2}/i);
    if (evMatch) {
      const chave = evMatch[0].toUpperCase();
      nomeArquivo = MAPA_EVIDENCIAS[chave] || nomeArquivo;
    } else if (citacao.seletor?.includes("revisao") || citacao.trecho.includes("limite")) {
      nomeArquivo = "evidencias/revisao_tecnica.md";
    }
  }

  // Texto já disponível: passado como prop, ou nos arquivos em memória/sessionStorage do caso
  let textoLocal: string | null = null;
  if (aberto && citacao) {
    if (textoCompletoEvidencia) {
      textoLocal = textoCompletoEvidencia;
    } else {
      const arquivosLocais = obterArquivosCaso(casoId);
      if (arquivosLocais && arquivosLocais[nomeArquivo]) textoLocal = arquivosLocais[nomeArquivo];
    }
  }

  // Sem texto local, busca na API do servidor; o resultado fica associado à chave do pedido
  const chaveRemota = aberto && citacao && textoLocal === null ? `${casoId}|${nomeArquivo}|${citacao.evidenciaId}` : null;
  const [remoto, setRemoto] = useState<{ chave: string; texto: string | null } | null>(null);
  useEffect(() => {
    if (!chaveRemota || !citacao) return;
    fetch(`/api/arquivos-caso?casoId=${casoId}&arquivo=${encodeURIComponent(nomeArquivo)}&evidenciaId=${citacao.evidenciaId}`)
      .then((res) => {
        if (res.ok) return res.text();
        throw new Error("Arquivo não encontrado");
      })
      .then((texto) => {
        setRemoto({ chave: chaveRemota, texto });
      })
      .catch(() => {
        // Arquivo não localizado: nada é montado no lugar dele; a tela avisa e mostra só o trecho
        setRemoto({ chave: chaveRemota, texto: null });
      });
    // a chave já reúne caso, arquivo e evidência
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveRemota]);

  const remotoRespondeu = chaveRemota !== null && remoto?.chave === chaveRemota;
  const remotoAtual = remotoRespondeu ? remoto.texto : null;
  const carregando = chaveRemota !== null && !remotoRespondeu;
  const arquivoIndisponivel = remotoRespondeu && remotoAtual === null;
  const textoBruto = textoLocal ?? remotoAtual;
  const conteudoIntegral = useMemo(() => {
    if (textoBruto === null) return "";
    return textoBruto.includes("%PDF") || nomeArquivo.toLowerCase().endsWith(".pdf")
      ? extrairTextoCompletoPDF(textoBruto)
      : textoBruto;
  }, [textoBruto, nomeArquivo]);
  const trechoLocalizado = !!citacao && conteudoIntegral !== "" && conteudoIntegral.includes(citacao.trecho.trim());

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
    if (arquivoIndisponivel) {
      return (
        <div className="p-4 space-y-3 text-xs">
          <p className="text-[var(--c-9a6700)] bg-[var(--c-fef9e7)] border border-[var(--c-f4d089)] rounded-[4px] p-3">
            O arquivo {nomeArquivo} não foi encontrado neste navegador nem no servidor. Abaixo está só o trecho
            como registrado no parecer; não foi possível conferi-lo no arquivo.
          </p>
          <p className="font-evidence italic text-[var(--c-231f20)]">&ldquo;{citacao.trecho}&rdquo;</p>
        </div>
      );
    }
    if (!conteudoIntegral) {
      return (
        <div className="p-4 text-xs text-[var(--c-6b6a65)] italic">
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
        <div className="font-mono text-xs leading-relaxed divide-y divide-[var(--c-f0efea)]">
          {linhas.map((linha, idx) => {
            const contemParteDoTrecho = trechoLimpo.slice(0, 40) && linha.includes(trechoLimpo.slice(0, 40));
            return (
              <div
                key={idx}
                className={`flex items-start gap-3 py-1 px-3 ${
                  contemParteDoTrecho ? "bg-[var(--c-fef9e7)] border-l-4 border-[var(--c-9a6700)]" : "hover:bg-[var(--c-fbfbf8)]"
                }`}
                ref={contemParteDoTrecho ? (el) => { destaqueRef.current = el; } : undefined}
              >
                <span className="w-8 shrink-0 text-right text-[11px] text-[var(--c-a8a7a1)] select-none">
                  {idx + 1}
                </span>
                <span className={`whitespace-pre-wrap ${contemParteDoTrecho ? "font-semibold text-[var(--c-1a1a18)]" : "text-[var(--c-44403c)]"}`}>
                  {linha || " "}
                </span>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="p-4 font-mono text-xs leading-relaxed text-[var(--c-1a1a18)] whitespace-pre-wrap">
        <span>{partes[0]}</span>
        <mark
          ref={(el) => { destaqueRef.current = el; }}
          className="bg-[var(--c-fef9e7)] text-[var(--c-9a6700)] px-1.5 py-1 rounded-sm border-2 border-[var(--c-f4d089)] font-bold block my-2 shadow-xs ring-2 ring-[var(--c-f4d089)]/30"
          id="trecho-destaque"
        >
          <span className="block text-[10px] uppercase font-bold tracking-wider text-[var(--c-9a6700)] mb-0.5 not-italic select-none">
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
      <div className="w-full max-w-3xl bg-[var(--c-ffffff)] h-full shadow-2xl flex flex-col border-l border-[var(--c-e3e2dd)] animate-in slide-in-from-right duration-200">
        {/* TOPO DO DRAWER */}
        <div className="p-4 border-b border-[var(--c-e0deda)] bg-[var(--c-f3f3f1)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[4px] bg-[var(--c-ffffff)] border border-[var(--c-e0deda)] flex items-center justify-center text-[var(--c-a6193c)]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-id text-xs font-bold text-[var(--c-a6193c)]">
                  {citacao.evidenciaId}
                </span>
                <span className="text-[var(--c-c9c6c1)]">·</span>
                <span className="text-xs font-medium text-[var(--c-231f20)] font-ui">
                  {nomeArquivo}
                </span>
              </div>
              <div className="text-[11px] text-[var(--c-6b6762)] font-ui">
                {citacao.seletor ? `Âncora: ${citacao.seletor}` : "Arquivo completo"} · {totalLinhas} linhas
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SeloForca forca={citacao.forcaProbatoria} prefixo="Força:" />

            <button
              onClick={onFechar}
              className="p-1.5 rounded-[4px] text-[var(--c-6b6762)] hover:text-[var(--c-231f20)] hover:bg-[var(--c-eaeaea)] transition-colors"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BARRA DE METADADOS E AÇÕES */}
        <div className="px-4 py-2.5 bg-[var(--c-fbfbf8)] border-b border-[var(--c-edece7)] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {/* Abas */}
            <div className="flex bg-[var(--c-edece7)] p-0.5 rounded-md">
              <button
                onClick={() => setAbaAtiva("INTEGRAL")}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  abaAtiva === "INTEGRAL"
                    ? "bg-[var(--c-ffffff)] text-[var(--c-1a1a18)] shadow-2xs"
                    : "text-[var(--c-6b6a65)] hover:text-[var(--c-1a1a18)]"
                }`}
              >
                Documento Integral ({totalLinhas} linhas)
              </button>
              <button
                onClick={() => setAbaAtiva("ISOLADO")}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  abaAtiva === "ISOLADO"
                    ? "bg-[var(--c-ffffff)] text-[var(--c-1a1a18)] shadow-2xs"
                    : "text-[var(--c-6b6a65)] hover:text-[var(--c-1a1a18)]"
                }`}
              >
                Apenas Trecho Citado
              </button>
            </div>

            <span className="text-[11px] text-[var(--c-6b6a65)] hidden sm:inline">
              Sentido:{" "}
              <strong
                className={
                  citacao.sentido === "CONTRARIA"
                    ? "text-[var(--c-9a6700)]"
                    : citacao.sentido === "CONTRADITORIA"
                    ? "text-[var(--c-a6193c)]"
                    : "text-[var(--c-2f6b4f)]"
                }
              >
                {citacao.sentido}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copiarDocumento}
              className="px-2.5 py-1 bg-[var(--c-ffffff)] border border-[var(--c-e0deda)] hover:bg-[var(--c-f3f3f1)] text-[var(--c-231f20)] font-medium rounded-[4px] transition-colors inline-flex items-center gap-1.5 shadow-2xs text-xs"
              title="Copiar texto do arquivo"
            >
              {copiado ? <Check className="w-3.5 h-3.5 text-[var(--c-2f6b4f)]" /> : <Copy className="w-3.5 h-3.5 text-[var(--c-52504e)]" />}
              {copiado ? "Copiado!" : "Copiar"}
            </button>

            <button
              onClick={baixarDocumento}
              className="px-2.5 py-1 bg-[var(--c-ffffff)] border border-[var(--c-e0deda)] hover:bg-[var(--c-f3f3f1)] text-[var(--c-231f20)] font-medium rounded-[4px] transition-colors inline-flex items-center gap-1.5 shadow-2xs text-xs"
              title="Baixar arquivo de evidência"
            >
              <Download className="w-3.5 h-3.5 text-[var(--c-52504e)]" /> Baixar
            </button>
          </div>
        </div>

        {/* CORPO DO DOCUMENTO */}
        <div className="flex-1 overflow-y-auto bg-[var(--c-ffffff)]">
          {carregando ? (
            <div className="py-20 text-center text-xs text-[var(--c-52504e)] space-y-2">
              <div className="w-6 h-6 mx-auto border-2 border-[var(--c-a6193c)] border-t-transparent rounded-full animate-spin" />
              <p>Carregando arquivo integral {nomeArquivo}...</p>
            </div>
          ) : abaAtiva === "INTEGRAL" ? (
            <div className="space-y-4">
              <div className="bg-[var(--c-f3f3f1)] border-b border-[var(--c-e0deda)] px-4 py-2 text-[11px] text-[var(--c-52504e)] flex items-center justify-between">
                <span>
                  Mostrando o arquivo completo do pacote técnico. O trecho que fundamenta o critério está destacado abaixo:
                </span>
                <span className="font-mono text-[var(--c-a6193c)] font-semibold">
                  {nomeArquivo}
                </span>
              </div>
              {renderizarTextoIntegral()}
            </div>
          ) : (
            /* Visualização Isolada do Trecho */
            <div className="p-6 space-y-4">
              <div className="bg-[var(--c-fff8e7)] border border-[var(--c-f4d089)] rounded-[4px] p-4 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--c-b06c1e)] block">
                  Trecho Selecionado no Parecer
                </span>
                <p className="font-evidence text-sm text-[var(--c-231f20)] italic leading-relaxed">
                  &ldquo;{citacao.trecho}&rdquo;
                </p>
              </div>

              <div className="bg-[var(--c-f3f3f1)] border border-[var(--c-e0deda)] rounded-[4px] p-4 space-y-2 text-xs">
                <span className="font-bold text-[var(--c-231f20)] block">Metadados de Rastreabilidade</span>
                <div className="grid grid-cols-2 gap-2 text-[var(--c-52504e)]">
                  <div>Identificador: <strong className="text-[var(--c-231f20)] font-mono">{citacao.evidenciaId}</strong></div>
                  <div>Arquivo: <strong className="text-[var(--c-231f20)] font-mono">{nomeArquivo}</strong></div>
                  <div>Seletor / Âncora: <strong className="text-[var(--c-231f20)]">{citacao.seletor || "N/A"}</strong></div>
                  <div className="flex items-center gap-1.5">Força Probatória: <SeloForca forca={citacao.forcaProbatoria} /></div>
                  <div>Sentido no Parecer: <strong className="text-[var(--c-231f20)]">{citacao.sentido}</strong></div>
                  <div>Origem da Extração: <strong className="text-[var(--c-231f20)]">{citacao.origem}</strong></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RODAPÉ DO DRAWER */}
        <div className="p-3.5 border-t border-[var(--c-e0deda)] bg-[var(--c-f3f3f1)] flex items-center justify-between text-xs text-[var(--c-52504e)]">
          {carregando ? (
            <span className="text-[11px]">Conferindo o trecho no arquivo {nomeArquivo}...</span>
          ) : trechoLocalizado ? (
            <span className="inline-flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--c-2f6b4f)]" />
              Trecho localizado literalmente no arquivo {nomeArquivo}.
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--c-9a6700)]">
              <AlertTriangle className="w-3.5 h-3.5" />
              Trecho não localizado literalmente em {nomeArquivo}: conferir manualmente.
            </span>
          )}
          <button
            onClick={onFechar}
            className="px-3.5 py-1.5 bg-[var(--c-ffffff)] border border-[var(--c-e0deda)] hover:bg-[var(--c-eae8e4)] text-[var(--c-231f20)] font-semibold rounded-[4px] shadow-2xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
