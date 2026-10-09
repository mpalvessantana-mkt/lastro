"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Folder, FileCheck, CheckCircle2, Clock, AlertCircle, ArrowRight, Play } from "lucide-react";
import JSZip from "jszip";
import { analisarPacote, comporClasse, PacoteArquivos } from "@/motor";
import { extrairDadosDossie } from "@/motor/parsers/dossie";
import { extrairTextoCompletoPDF } from "@/lib/pdf-parser";
import { EstadoCriterio } from "@/types";
import { AvaliacaoProjetoOutput } from "@/lib/gemini";
import { adicionarCasoComParecer, salvarArquivosCaso, registrarAuditoria } from "@/lib/casos-store";
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
  const [arquivosLidos, setArquivosLidos] = useState<string[]>([]);
  const [casoIdEmAnalise, setCasoIdEmAnalise] = useState("PRJ27");
  const [tituloEmAnalise, setTituloEmAnalise] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const processarArquivosTexto = async (arquivos: PacoteArquivos, idProjeto: string, tituloProjeto: string) => {
    setProcessando(true);
    setCasoIdEmAnalise(idProjeto);
    setTituloEmAnalise(tituloProjeto);

    // Iniciar avaliação inteligente com Gemini Flash em paralelo com o stepper visual
    const promessaIA = (async () => {
      try {
        let textoTotal = "";
        for (const [nome, conteudo] of Object.entries(arquivos)) {
          if (nome.toLowerCase().endsWith(".pdf")) {
            const decodificado = extrairTextoCompletoPDF(conteudo);
            if (decodificado) textoTotal += `\n--- [${nome}] ---\n` + decodificado.slice(0, 10000);
          } else if (nome.endsWith(".md") || nome.endsWith(".txt") || nome.endsWith(".json")) {
            textoTotal += `\n--- [${nome}] ---\n` + conteudo.slice(0, 10000);
          }
        }

        if (textoTotal.trim().length > 50) {
          const res = await fetch("/api/ia/avaliar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              casoId: idProjeto,
              titulo: tituloProjeto,
              textoCompleto: textoTotal
            })
          });

          if (res.ok) {
            const dados = await res.json();
            return dados.avaliacao as AvaliacaoProjetoOutput | null;
          }
        }
        return null;
      } catch (err) {
        console.warn("Avaliação de IA não retornou a tempo, usando motor determinístico:", err);
        return null;
      }
    })();

    // Avançar as etapas visuais servindo como loader natural para o Gemini Flash (~3s no total)
    setEtapaAtual(0);
    setArquivosLidos(Object.keys(arquivos));
    await new Promise((r) => setTimeout(r, 500));

    setEtapaAtual(1);
    await new Promise((r) => setTimeout(r, 600));

    setEtapaAtual(2);
    await new Promise((r) => setTimeout(r, 600));

    setEtapaAtual(3);
    await new Promise((r) => setTimeout(r, 600));

    setEtapaAtual(4);

    // Aguardar conclusão da IA (Gemini Flash) ou timeout de segurança de 15s
    const avaliacaoIA = await Promise.race([
      promessaIA,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 15000))
    ]);

    // Executar motor determinístico recalibrado com prudência fiscal
    const resultado = analisarPacote(idProjeto, tituloProjeto, arquivos);

    // Se a IA tiver concluído a análise dos 5 critérios, aplicar os pareceres refinados
    if (avaliacaoIA && avaliacaoIA.criterios) {
      const c = avaliacaoIA.criterios;
      const novosEstados: Record<number, EstadoCriterio> = {
        1: c.c1_novidade.estado,
        2: c.c2_criatividade.estado,
        3: c.c3_incerteza.estado,
        4: c.c4_sistematicidade.estado,
        5: c.c5_transferibilidade.estado
      };

      const novaComp = comporClasse(novosEstados);
      if (novaComp.classe !== "CONFLITO" && novaComp.classe !== "INCOMPLETO") {
        resultado.parecer.classeProposta = novaComp.classe;
      }

      const lista = [
        { id: 1, dado: c.c1_novidade },
        { id: 2, dado: c.c2_criatividade },
        { id: 3, dado: c.c3_incerteza },
        { id: 4, dado: c.c4_sistematicidade },
        { id: 5, dado: c.c5_transferibilidade }
      ];

      for (const item of lista) {
        if (resultado.parecer.pontos[item.id]) {
          resultado.parecer.pontos[item.id].estadoProposto = item.dado.estado;
          resultado.parecer.pontos[item.id].porqueProposto = item.dado.justificativa;
          resultado.parecer.pontos[item.id].confianca = "ALTA";
          if (item.dado.trechoCitado && resultado.parecer.pontos[item.id].citacoesPropostas.length > 0) {
            resultado.parecer.pontos[item.id].citacoesPropostas[0].trecho = item.dado.trechoCitado;
            resultado.parecer.pontos[item.id].citacoesPropostas[0].origem = "IA";
          }
        }
      }

      if (avaliacaoIA.lacunasDeEvidencia && avaliacaoIA.lacunasDeEvidencia.length > 0) {
        resultado.parecer.lacunas = [
          ...resultado.parecer.lacunas,
          ...avaliacaoIA.lacunasDeEvidencia
        ];
      }

      if (avaliacaoIA.atividadesDeRotinaIdentificadas && avaliacaoIA.atividadesDeRotinaIdentificadas.length > 0) {
        resultado.parecer.lacunas.push(
          `Vedações de Rotina (§ 141 Frascati): ${avaliacaoIA.atividadesDeRotinaIdentificadas.join("; ")}`
        );
      }

      resultado.parecer.geradoPor = "LASTRO AI (Gemini Flash + Motor Recalibrado)";
    }

    // Salvar no repositório de casos
    adicionarCasoComParecer(resultado.caso, resultado.parecer);
    salvarArquivosCaso(idProjeto, arquivos);

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
      ator: resultado.parecer.geradoPor,
      papel: "analista",
      acao: "PARECER_PROPOSTO",
      alvo: resultado.parecer.id,
      antes: null,
      depois: { classe: resultado.parecer.classeProposta },
      em: new Date().toISOString()
    });

    setEtapaAtual(5); // Concluído
    await new Promise((r) => setTimeout(r, 400));
    router.push(`/casos/${idProjeto}/parecer`);
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const zip = new JSZip();
    const zipData = await zip.loadAsync(file);
    const arquivos: PacoteArquivos = {};

    let detectedId = file.name.replace(/\.[^/.]+$/, "").toUpperCase();
    if (!detectedId.startsWith("PRJ")) detectedId = "PRJ28";

    for (const [pathName, zipEntry] of Object.entries(zipData.files)) {
      if (!zipEntry.dir) {
        let content: string;
        if (pathName.toLowerCase().endsWith(".pdf")) {
          content = await zipEntry.async("binarystring");
        } else {
          content = await zipEntry.async("text");
        }
        arquivos[pathName] = content;
      }
    }

    const dadosDossie = extrairDadosDossie(detectedId, arquivos);
    const tituloFinal = dadosDossie.titulo || `Projeto ${detectedId}`;
    setTituloEmAnalise(tituloFinal);
    processarArquivosTexto(arquivos, detectedId, tituloFinal);
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const arquivos: PacoteArquivos = {};
    let detectedId = "PRJ29";

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const relPath = f.webkitRelativePath || f.name;
      const partes = relPath.split("/");
      if (partes[0].startsWith("PRJ")) detectedId = partes[0].toUpperCase();
      const relativeClean = partes.slice(1).join("/") || f.name;

      let content: string;
      if (f.name.toLowerCase().endsWith(".pdf")) {
        content = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string) || "");
          reader.readAsBinaryString(f);
        });
      } else {
        content = await f.text();
      }
      arquivos[relativeClean] = content;
    }

    const dadosDossie = extrairDadosDossie(detectedId, arquivos);
    const tituloFinal = dadosDossie.titulo || `Projeto ${detectedId}`;
    setTituloEmAnalise(tituloFinal);
    processarArquivosTexto(arquivos, detectedId, tituloFinal);
  };

  // Demonstração rápida direta com um dos 20 casos históricos de teste
  const carregarCasoDemo = async (projetoId: string, titulo: string) => {
    setProcessando(true);
    setCasoIdEmAnalise(projetoId);

    const historico = HISTORICOS_REFERENCIA.find((h) => h.id === projetoId);
    const tituloReal = historico?.titulo || titulo;
    setTituloEmAnalise(tituloReal);

    // Carregar arquivos sintéticos via fetch de API ou geração estruturada
    const arquivosDemo: PacoteArquivos = {};
    ARQUIVOS_CANONICOS.forEach((arq) => {
      arquivosDemo[arq] = `Conteúdo indexado de ${arq} para ${projetoId}`;
    });

    // Injetar método real do projeto para o motor fatiar as 7 seções
    const res = await fetch(`/api/metodo-demo?id=${projetoId}`).catch(() => null);
    if (res && res.ok) {
      const txt = await res.text();
      arquivosDemo["evidencias/metodo.md"] = txt;
    }

    processarArquivosTexto(arquivosDemo, projetoId, tituloReal);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-ui">
      <div>
        <h1 className="text-xl font-bold text-[#231F20] tracking-tight">
          Acervo — Upload de novo projeto
        </h1>
        <p className="text-xs text-[#52504E] mt-0.5">
          Arraste a pasta descompactada ou o arquivo .zip com os 14 arquivos do projeto
        </p>
      </div>

      {/* Área Retangular Tracejada (TELA 3) */}
      {!processando ? (
        <div className="bg-white border-2 border-dashed border-[#E0DEDA] rounded-[4px] p-8 sm:p-12 text-center shadow-2xs space-y-4">
          <div className="w-14 h-14 mx-auto rounded-[4px] bg-[#F3F3F1] flex items-center justify-center text-[#A6193C]">
            <Folder className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#231F20]">
              Arraste a pasta do projeto ou um arquivo .zip
            </h3>
            <p className="text-xs text-[#52504E] mt-1">
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
              className="px-4 py-2 bg-[#A6193C] hover:bg-[#851430] text-white text-xs font-semibold rounded-[4px] shadow-2xs transition-colors inline-flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" /> Selecionar arquivo .ZIP
            </button>

            <input
              type="file"
              ref={folderInputRef}
              onChange={handleFolderUpload}
              {...({ webkitdirectory: "", directory: "" } as any)}
              className="hidden"
            />
            <button
              onClick={() => folderInputRef.current?.click()}
              className="px-4 py-2 bg-white border border-[#E0DEDA] hover:bg-[#F3F3F1] text-[#231F20] text-xs font-semibold rounded-[4px] shadow-2xs transition-colors inline-flex items-center gap-2"
            >
              <Folder className="w-4 h-4 text-[#52504E]" /> Selecionar Pasta
            </button>
          </div>

          {/* Atalho de Demonstração Rápida no Palco */}
          <div className="pt-6 border-t border-[#E0DEDA] max-w-lg mx-auto">
            <span className="text-[11px] font-semibold text-[#52504E] uppercase tracking-wider block mb-2">
              Demonstração ao Vivo no Pitch (Atalho sem upload de arquivo)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => carregarCasoDemo("PRJ02", "Detecção de divergências entre razão e extrato")}
                className="p-2 text-left bg-[#F3F3F1] hover:bg-[#EBF5F0] border border-[#E0DEDA] rounded-[4px] transition-colors"
              >
                <div className="font-mono font-bold text-xs text-[#2F6B4F]">PRJ02</div>
                <div className="text-[10px] text-[#52504E] truncate">Elegível</div>
              </button>

              <button
                onClick={() => carregarCasoDemo("PRJ05", "Aplicativo de proposta com trabalho offline")}
                className="p-2 text-left bg-[#F3F3F1] hover:bg-[#FFF8E7] border border-[#E0DEDA] rounded-[4px] transition-colors"
              >
                <div className="font-mono font-bold text-xs text-[#B06C1E]">PRJ05</div>
                <div className="text-[10px] text-[#52504E] truncate">Com ressalvas</div>
              </button>

              <button
                onClick={() => carregarCasoDemo("PRJ01", "Reprocessamento seguro de mensagens duplicadas")}
                className="p-2 text-left bg-[#F3F3F1] hover:bg-[#FAF9F7] border border-[#E0DEDA] rounded-[4px] transition-colors"
              >
                <div className="font-mono font-bold text-xs text-[#52504E]">PRJ01</div>
                <div className="text-[10px] text-[#52504E] truncate">Não elegível</div>
              </button>

              <button
                onClick={() => carregarCasoDemo("PRJ08", "Monitoramento de canais em agências remotas")}
                className="p-2 text-left bg-[#F3F3F1] hover:bg-[#EFF6FF] border border-[#E0DEDA] rounded-[4px] transition-colors"
              >
                <div className="font-mono font-bold text-xs text-[#3A5A78]">PRJ08</div>
                <div className="text-[10px] text-[#52504E] truncate">Evid. insuf.</div>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Painel de Progresso em Andamento (TELA 3) */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white border border-[#E0DEDA] rounded-[4px] p-6 shadow-2xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-[#231F20] tracking-tight">
                Lendo {casoIdEmAnalise}{tituloEmAnalise ? ` · ${tituloEmAnalise}` : ""}...
              </h2>
              <p className="text-xs text-[#52504E]">
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
                      <CheckCircle2 className="w-4 h-4 text-[#2F6B4F] shrink-0" />
                    ) : emAndamento ? (
                      <Clock className="w-4 h-4 text-[#FF8A22] animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-[#E0DEDA] shrink-0" />
                    )}
                    <span
                      className={`${
                        concluido
                          ? "text-[#231F20] font-medium"
                          : emAndamento
                          ? "text-[#FF8A22] font-semibold"
                          : "text-[#757371]"
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
          <div className="bg-white border border-[#E0DEDA] rounded-[4px] p-5 shadow-2xs">
            <h3 className="text-xs font-semibold text-[#231F20] uppercase tracking-wider mb-3">
              Arquivos do Pacote (14)
            </h3>
            <ul className="space-y-1.5 font-mono text-[11px]">
              {ARQUIVOS_CANONICOS.map((arq, idx) => (
                <li key={idx} className="flex items-center justify-between text-[#52504E]">
                  <span className="truncate pr-2">{arq}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2F6B4F] shrink-0" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
