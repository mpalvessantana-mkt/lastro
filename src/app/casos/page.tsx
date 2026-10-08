"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { obterCasos, obterParecerPorId } from "@/lib/casos-store";
import { Caso, Parecer } from "@/types";
import { Plus, Search, FolderKanban, CheckCircle2, Clock, AlertTriangle, FileText } from "lucide-react";

export default function CasosPage() {
  const [casos, setCasos] = useState<Caso[]>([]);
  const [pareceresMap, setPareceresMap] = useState<Record<string, Parecer | null>>({});
  const [busca, setBusca] = useState("");
  const [filtroClasse, setFiltroClasse] = useState("TODAS");
  const [filtroSituacao, setFiltroSituacao] = useState("TODAS");

  useEffect(() => {
    const lista = obterCasos();
    setCasos(lista);

    const map: Record<string, Parecer | null> = {};
    for (const c of lista) {
      if (c.parecerAtualId) {
        map[c.id] = obterParecerPorId(c.parecerAtualId);
      }
    }
    setPareceresMap(map);
  }, []);

  const contagens = {
    elegivel: 0,
    ressalvas: 0,
    naoElegivel: 0,
    insuficiente: 0,
    emRevisao: 0
  };

  for (const c of casos) {
    const p = pareceresMap[c.id];
    const classe = p?.classeFinal || p?.classeProposta;
    if (classe === "ELEGIVEL") contagens.elegivel++;
    else if (classe === "COM_RESSALVAS") contagens.ressalvas++;
    else if (classe === "NAO_ELEGIVEL") contagens.naoElegivel++;
    else if (classe === "EVIDENCIA_INSUFICIENTE") contagens.insuficiente++;

    if (c.situacao === "EM_REVISAO" || c.situacao === "INGERIDO") {
      contagens.emRevisao++;
    }
  }

  const casosFiltrados = casos.filter((c) => {
    const matchBusca =
      busca === "" ||
      c.id.toLowerCase().includes(busca.toLowerCase()) ||
      c.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      c.equipe.toLowerCase().includes(busca.toLowerCase());

    const p = pareceresMap[c.id];
    const classe = p?.classeFinal || p?.classeProposta;
    const matchClasse = filtroClasse === "TODAS" || classe === filtroClasse;
    const matchSituacao = filtroSituacao === "TODAS" || c.situacao === filtroSituacao;

    return matchBusca && matchClasse && matchSituacao;
  });

  const getClasseBadge = (p: Parecer | null | undefined) => {
    if (!p) {
      return (
        <span className="text-xs text-[#6B6A65] flex items-center gap-1">
          <Clock className="w-3 h-3 animate-spin" /> lendo arquivos...
        </span>
      );
    }
    const classe = p.classeFinal || p.classeProposta;
    if (classe === "ELEGIVEL") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-semibold bg-[#EBF5F0] text-[#2F6B4F] border border-[#A3D9BE]">
          Elegível
        </span>
      );
    }
    if (classe === "COM_RESSALVAS") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-semibold bg-[#FFF8E7] text-[#B06C1E] border border-[#F4D089]">
          Com ressalvas
        </span>
      );
    }
    if (classe === "NAO_ELEGIVEL") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-semibold bg-[#F3F3F1] text-[#52504E] border border-[#E0DEDA]">
          Não elegível
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-semibold bg-[#EFF6FF] text-[#3A5A78] border border-[#BFDBFE]">
        Evidência insuficiente
      </span>
    );
  };

  const getPontosRevisados = (p: Parecer | null | undefined) => {
    if (!p || !p.pontos) return "0/5";
    let rev = 0;
    for (let i = 1; i <= 5; i++) {
      if (p.pontos[i]?.acaoDoAnalista && p.pontos[i].acaoDoAnalista !== "PENDENTE") {
        rev++;
      }
    }
    return `${rev}/5`;
  };

  return (
    <div className="space-y-6 font-ui">
      {/* Topo: Título da tela + Botão de Ação Primária */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#231F20] tracking-tight">
            Casos em análise
          </h1>
          <p className="text-xs text-[#52504E] mt-0.5">
            Projetos submetidos para emissão e homologação do parecer técnico na Lei do Bem
          </p>
        </div>

        <Link
          href="/casos/novo"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#A6193C] hover:bg-[#851430] text-white text-xs font-semibold rounded-[4px] shadow-2xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Analisar novo projeto
        </Link>
      </div>

      {/* 5 Blocos de Contagem com Filetes Superiores (TELA 7) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Elegível */}
        <div className="bg-white border border-[#E0DEDA] rounded-[4px] p-3 relative overflow-hidden shadow-2xs">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#2F6B4F]" />
          <div className="text-2xl font-bold text-[#231F20] mt-1">{contagens.elegivel}</div>
          <div className="text-[11px] font-semibold text-[#2F6B4F] uppercase tracking-wider mt-0.5">
            Elegível
          </div>
        </div>

        {/* Com ressalvas */}
        <div className="bg-white border border-[#E0DEDA] rounded-[4px] p-3 relative overflow-hidden shadow-2xs">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#B06C1E]" />
          <div className="text-2xl font-bold text-[#231F20] mt-1">{contagens.ressalvas}</div>
          <div className="text-[11px] font-semibold text-[#B06C1E] uppercase tracking-wider mt-0.5">
            Com ressalvas
          </div>
        </div>

        {/* Não elegível */}
        <div className="bg-white border border-[#E0DEDA] rounded-[4px] p-3 relative overflow-hidden shadow-2xs">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#52504E]" />
          <div className="text-2xl font-bold text-[#231F20] mt-1">{contagens.naoElegivel}</div>
          <div className="text-[11px] font-semibold text-[#52504E] uppercase tracking-wider mt-0.5">
            Não elegível
          </div>
        </div>

        {/* Evidência insuficiente */}
        <div className="bg-white border border-[#E0DEDA] rounded-[4px] p-3 relative overflow-hidden shadow-2xs">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#3A5A78]" />
          <div className="text-2xl font-bold text-[#231F20] mt-1">{contagens.insuficiente}</div>
          <div className="text-[11px] font-semibold text-[#3A5A78] uppercase tracking-wider mt-0.5">
            Evidência insuficiente
          </div>
        </div>

        {/* Em revisão */}
        <div className="bg-white border border-[#E0DEDA] rounded-[4px] p-3 relative overflow-hidden shadow-2xs col-span-2 sm:col-span-1">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#A6193C]" />
          <div className="text-2xl font-bold text-[#231F20] mt-1">{contagens.emRevisao}</div>
          <div className="text-[11px] font-semibold text-[#A6193C] uppercase tracking-wider mt-0.5">
            Em revisão
          </div>
        </div>
      </div>

      {/* Barra de Filtros Discreta */}
      <div className="bg-white border border-[#E0DEDA] rounded-[4px] p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#52504E] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por ID, título ou equipe..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-1.5 bg-[#F3F3F1] border border-[#E0DEDA] rounded-[4px] focus:outline-none focus:border-[#A6193C]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filtroClasse}
            onChange={(e) => setFiltroClasse(e.target.value)}
            className="text-xs bg-[#F3F3F1] border border-[#E0DEDA] rounded-[4px] px-2.5 py-1.5 font-medium text-[#231F20] focus:outline-none focus:border-[#A6193C]"
          >
            <option value="TODAS">Todas as classes</option>
            <option value="ELEGIVEL">Elegível</option>
            <option value="COM_RESSALVAS">Com ressalvas</option>
            <option value="NAO_ELEGIVEL">Não elegível</option>
            <option value="EVIDENCIA_INSUFICIENTE">Evidência insuficiente</option>
          </select>

          <select
            value={filtroSituacao}
            onChange={(e) => setFiltroSituacao(e.target.value)}
            className="text-xs bg-[#F3F3F1] border border-[#E0DEDA] rounded-[4px] px-2.5 py-1.5 font-medium text-[#231F20] focus:outline-none focus:border-[#A6193C]"
          >
            <option value="TODAS">Todas as situações</option>
            <option value="EM_REVISAO">Em revisão</option>
            <option value="HOMOLOGADO">Homologado</option>
            <option value="INGERIDO">Ingerido</option>
          </select>
        </div>
      </div>

      {/* Tabela Densa Institucional (TELA 7) */}
      <div className="bg-white border border-[#E0DEDA] rounded-[4px] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs table-dense">
            <thead className="bg-[#F3F3F1] border-b border-[#E0DEDA] text-[#52504E] font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Caso</th>
                <th className="py-2.5 px-3">Título do Projeto</th>
                <th className="py-2.5 px-3">Equipe</th>
                <th className="py-2.5 px-3">Classe</th>
                <th className="py-2.5 px-3">Situação</th>
                <th className="py-2.5 px-3">Revisão</th>
                <th className="py-2.5 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0DEDA]">
              {casosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#52504E]">
                    Nenhum caso encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                casosFiltrados.map((caso) => {
                  const p = pareceresMap[caso.id];
                  const pontosRev = getPontosRevisados(p);
                  return (
                    <tr
                      key={caso.id}
                      className="hover:bg-[#FAF9F7] transition-colors group cursor-pointer"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-[#A6193C]">
                        <Link href={`/casos/${caso.id}/parecer`} className="hover:underline">
                          {caso.id}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#231F20] max-w-xs truncate">
                        <Link href={`/casos/${caso.id}/parecer`} className="hover:underline">
                          {caso.titulo}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 text-[#52504E]">{caso.equipe}</td>
                      <td className="py-2.5 px-3">{getClasseBadge(p)}</td>
                      <td className="py-2.5 px-3">
                        <span className="capitalize text-[#231F20] font-medium">
                          {caso.situacao.toLowerCase().replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-[11px] text-[#52504E] bg-[#F3F3F1] px-1.5 py-0.5 rounded-[4px] border border-[#E0DEDA]">
                          {pontosRev}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link
                          href={`/casos/${caso.id}/parecer`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#A6193C] hover:text-[#851430] hover:underline"
                        >
                          Ver parecer →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
