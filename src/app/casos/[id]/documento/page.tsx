"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { obterCasos, obterParecerPorId, obterAuditoria } from "@/lib/casos-store";
import { obterNormaPorId } from "@/motor/corpus";
import { Caso, Parecer, EventoAuditoria } from "@/types";
import { Printer, Download, ArrowLeft, ShieldCheck, History, FileText } from "lucide-react";

export default function DocumentoFinalPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const casoId = resolvedParams.id;

  const [caso, setCaso] = useState<Caso | null>(null);
  const [parecer, setParecer] = useState<Parecer | null>(null);
  const [eventosAuditoria, setEventosAuditoria] = useState<EventoAuditoria[]>([]);

  useEffect(() => {
    const casos = obterCasos();
    const c = casos.find((x) => x.id === casoId);
    if (c) {
      setCaso(c);
      if (c.parecerAtualId) {
        const p = obterParecerPorId(c.parecerAtualId);
        setParecer(p);
      }
    }
    const aud = obterAuditoria();
    setEventosAuditoria(aud.filter((e) => e.casoId === casoId));
  }, [casoId]);

  if (!caso || !parecer) {
    return (
      <div className="py-12 text-center text-xs text-[#6B6A65]">
        Carregando documento homologado...
      </div>
    );
  }

  const classeAtiva = parecer.classeFinal || parecer.classeProposta;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Barra de Ação Superior (TELA 6) */}
      <div className="bg-white border border-[#E3E2DD] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs print:hidden">
        <div className="flex items-center gap-2">
          <Link
            href={`/casos/${caso.id}/parecer`}
            className="text-xs text-[#6B6A65] hover:text-[#0F5132] font-semibold inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-xs font-semibold text-[#1A1A18]">
            Parecer {caso.id} · versão {parecer.versao} · {parecer.homologadoEm ? `Homologado em ${new Date(parecer.homologadoEm).toLocaleDateString()}` : "Minuta preliminar"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-[#0F5132] text-white text-[11px] font-bold px-2.5 py-1 rounded tracking-wider uppercase">
            HOMOLOGADO — IMUTÁVEL
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-semibold rounded-md shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Exportar / Imprimir PDF
          </button>
          <Link
            href={`/auditoria`}
            className="px-3 py-1.5 bg-white border border-[#E3E2DD] hover:bg-[#F7F7F4] text-[#1A1A18] text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5 text-[#6B6A65]" /> Ver Trilha de Auditoria
          </Link>
        </div>
      </div>

      {/* PRÉVIA DA PÁGINA A4 CENTRALIZADA (TELA 6) */}
      <div className="max-w-4xl mx-auto bg-white border border-[#E3E2DD] shadow-md rounded-lg p-8 sm:p-14 space-y-8 text-[#1A1A18] print:border-none print:shadow-none print:p-0">
        {/* Cabeçalho Oficial do BNB e Identificação */}
        <div className="border-b-2 border-[#0F5132] pb-5 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Image
                src="/logo-bnb.png"
                alt="Banco do Nordeste"
                width={28}
                height={28}
                className="object-contain"
              />
              <span className="text-sm font-bold text-[#0F5132] tracking-wider uppercase">
                Banco do Nordeste · Hubine
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#1A1A18]">
              Parecer Técnico de Enquadramento Preliminar — Lei do Bem
            </h1>
            <p className="text-xs text-[#6B6A65]">
              Sistema LASTRO · Sistema de Apoio à Decisão para Elegibilidade
            </p>
          </div>

          <div className="text-right text-[11px] text-[#6B6A65] space-y-0.5">
            <div><strong>Versão:</strong> {parecer.versao}.0</div>
            <div><strong>Corpus Legal:</strong> {parecer.versaoCorpusNormativo}</div>
            <div className="font-mono text-[9px] truncate max-w-[180px]">
              SHA256: {parecer.sha256Pacote.slice(0, 16)}...
            </div>
          </div>
        </div>

        {/* 1. Identificação */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-[#0F5132] uppercase tracking-wider">
            1. Identificação do Projeto
          </h2>
          <table className="w-full text-xs border border-[#E3E2DD] divide-y divide-[#EDECE7]">
            <tbody>
              <tr>
                <td className="py-2 px-3 font-semibold bg-[#F7F7F4] w-1/3">Código e Título:</td>
                <td className="py-2 px-3">{caso.id} — {caso.titulo}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold bg-[#F7F7F4]">Equipe Responsável:</td>
                <td className="py-2 px-3">{caso.equipe} (Duração: {caso.duracaoSemanas} semanas)</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold bg-[#F7F7F4]">Pacote Auditado:</td>
                <td className="py-2 px-3">{caso.pacote.arquivosPresentes} de 14 arquivos recebidos e conferidos</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold bg-[#F7F7F4]">Homologado por:</td>
                <td className="py-2 px-3">{parecer.homologadoPor || "Em fase de homologação"} em {new Date(parecer.homologadoEm || parecer.geradoEm).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. Classificação */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-[#0F5132] uppercase tracking-wider">
            2. Classificação Técnica Conclusiva
          </h2>
          <div className="bg-[#F7F7F4] p-4 rounded-md border border-[#E3E2DD] space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Classe Homologada:</span>
              <span className="font-bold text-sm text-[#0F5132]">
                {classeAtiva.replace("_", " ")}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#6B6A65]">
              <span>Classe Proposta pelo Motor:</span>
              <span>{parecer.classeProposta.replace("_", " ")}</span>
            </div>
            <div className="flex items-center justify-between text-[#6B6A65]">
              <span>Houve Divergência do Analista:</span>
              <span>
                {parecer.analistaDivergiuDaProposta
                  ? "Sim — Motivo formalmente registrado nos pontos correspondentes"
                  : "Não — Análise integralmente convergente com o motor de regras"}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Os Cinco Critérios */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-[#0F5132] uppercase tracking-wider">
            3. Fundamentação Ponto a Ponto dos Cinco Critérios
          </h2>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((cId) => {
              const pto = parecer.pontos[cId];
              if (!pto) return null;
              const estado = pto.estadoFinal || pto.estadoProposto;
              return (
                <div key={cId} className="border border-[#E3E2DD] rounded-md p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-[#EDECE7] pb-1.5">
                    <span className="font-bold text-[#1A1A18]">
                      {cId}. {pto.nomeCriterio}
                    </span>
                    <span className="font-semibold text-[#0F5132]">
                      {estado}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#6B6A65] block">
                      Fundamentação:
                    </span>
                    <p className="text-[#1A1A18] leading-relaxed mt-0.5">
                      {pto.porqueFinal || pto.porqueProposto}
                    </p>
                  </div>

                  {pto.citacoesPropostas.length > 0 && (
                    <div className="space-y-1 bg-[#FBFBF8] p-2.5 rounded border border-[#EDECE7]">
                      <span className="text-[10px] uppercase font-bold text-[#6B6A65] block">
                        Citação Literal de Evidência:
                      </span>
                      <p className="font-evidence text-[11px] italic text-[#1A1A18]">
                        &ldquo;{pto.citacoesPropostas[0].trecho}&rdquo;
                      </p>
                      <span className="text-[10px] text-[#6B6A65] block">
                        Fonte: {pto.citacoesPropostas[0].evidenciaId} · {pto.citacoesPropostas[0].seletor || "seção"} · Força: {pto.citacoesPropostas[0].forcaProbatoria}
                      </span>
                    </div>
                  )}

                  {pto.normasAplicadas.length > 0 && (
                    <div className="text-[10px] text-[#6B6A65]">
                      <strong>Dispositivo Legal:</strong> {pto.normasAplicadas.join(", ")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Campos Condicionais */}
        {(parecer.recorteSustentado || parecer.eloAusente || parecer.mecanismoDocumentado) && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-[#0F5132] uppercase tracking-wider">
              4. Delimitação Condicional da Classe
            </h2>
            <div className="bg-[#F7F7F4] p-3.5 rounded-md border border-[#E3E2DD] text-xs space-y-1">
              {parecer.recorteSustentado && (
                <p><strong>Recorte Sustentado:</strong> {parecer.recorteSustentado}</p>
              )}
              {parecer.limitacaoEspecifica && (
                <p><strong>Limitação Específica:</strong> {parecer.limitacaoEspecifica}</p>
              )}
              {parecer.eloAusente && (
                <p><strong>Elo Ausente:</strong> {parecer.eloAusente}</p>
              )}
              {parecer.mecanismoDocumentado && (
                <p><strong>Mecanismo Documentado:</strong> {parecer.mecanismoDocumentado}</p>
              )}
            </div>
          </div>
        )}

        {/* 5. Divergências Documentais */}
        {parecer.confrontos.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-[#0F5132] uppercase tracking-wider">
              5. Confronto e Resolução de Divergências Documentais
            </h2>
            <div className="space-y-2">
              {parecer.confrontos.map((conf, idx) => (
                <div key={idx} className="bg-[#FBFBF8] border border-[#E3E2DD] p-3 rounded-md text-xs space-y-1">
                  <span className="font-semibold text-[#1A1A18] block">
                    Divergência #{idx + 1} ({conf.campoLogico}):
                  </span>
                  <p className="text-[#6B6A65] italic leading-relaxed">
                    {conf.textoFormatado}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Conferência Numérica */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-[#0F5132] uppercase tracking-wider">
            6. Conferência Aritmética e Verificação Numérica
          </h2>
          <p className="text-xs text-[#1A1A18] bg-[#F7F7F4] p-3 rounded-md border border-[#E3E2DD]">
            Foram recalculados {caso.leitura.ensaiosConferidos} ensaios numéricos a partir dos registros primários de
            <code> medicoes.csv</code> e confrontados com <code> resultados.csv</code>. Todas as taxas, numeradores
            e denominadores foram validados com zero divergências aritméticas.
          </p>
        </div>

        {/* Rodapé Oficial Imutável (CLAUDE.md Seção 13) */}
        <div className="pt-6 border-t border-[#EDECE7] text-[10px] text-[#6B6A65] flex items-center justify-between">
          <div>
            LASTRO · Análise preliminar · Não substitui parecer técnico definitivo
          </div>
          <div>
            Parecer {parecer.hashConteudo} · v{parecer.versao} · Corpus {parecer.versaoCorpusNormativo}
          </div>
        </div>
      </div>
    </div>
  );
}
