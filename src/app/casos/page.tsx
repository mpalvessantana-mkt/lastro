"use client";

import React, { useState } from "react";
import { useCarregarNoCliente } from "@/lib/use-carregar-no-cliente";
import Link from "next/link";
import { obterCasos, obterParecerPorId } from "@/lib/casos-store";
import { Caso, Parecer } from "@/types";
import { Plus, Search, Clock } from "lucide-react";

export default function CasosPage() {
  const [casos, setCasos] = useState<Caso[]>([]);
  const [pareceresMap, setPareceresMap] = useState<Record<string, Parecer | null>>({});
  const [busca, setBusca] = useState("");
  const [filtroClasse, setFiltroClasse] = useState("TODAS");
  const [filtroSituacao, setFiltroSituacao] = useState("TODAS");

  useCarregarNoCliente("casos", () => {
    const lista = obterCasos();
    setCasos(lista);

    const map: Record<string, Parecer | null> = {};
    for (const c of lista) {
      if (c.parecerAtualId) {
        map[c.id] = obterParecerPorId(c.parecerAtualId);
      }
    }
    setPareceresMap(map);
  });

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
        <span className="text-xs text-[var(--c-6b6a65)] flex items-center gap-1">
          <Clock className="w-3 h-3 animate-spin" /> lendo arquivos...
        </span>
      );
    }
    const classe = p.classeFinal || p.classeProposta;
    if (classe === "ELEGIVEL") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-semibold bg-[var(--c-ebf5f0)] text-[var(--c-2f6b4f)] border border-[var(--c-a3d9be)]">
          Elegível
        </span>
      );
    }
    if (classe === "COM_RESSALVAS") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-semibold bg-[var(--c-fff8e7)] text-[var(--c-b06c1e)] border border-[var(--c-f4d089)]">
          Com ressalvas
        </span>
      );
    }
    if (classe === "NAO_ELEGIVEL") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-semibold bg-[var(--c-f3f3f1)] text-[var(--c-52504e)] border border-[var(--c-e0deda)]">
          Não elegível
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-semibold bg-[var(--c-eff6ff)] text-[var(--c-3a5a78)] border border-[var(--c-bfdbfe)]">
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
          <h1 className="text-xl font-bold text-[var(--c-231f20)] tracking-tight">
            Casos em análise
          </h1>
          <p className="text-sm text-[var(--c-6b6762)] mt-0.5">
            Pareceres da Lei do Bem em revisão e homologados
          </p>
        </div>

        <Link
          href="/casos/novo"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--c-a6193c)] hover:bg-[var(--c-851430)] text-white text-xs font-semibold rounded-[4px] shadow-2xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Analisar novo projeto
        </Link>
      </div>

      {/* Contagem por classe e em revisão: uma faixa só */}
      <dl className="flex flex-wrap gap-x-8 gap-y-3 rounded-xl bg-[var(--c-ffffff)] px-5 py-4">
        {[
          { rotulo: "Elegível", valor: contagens.elegivel, cor: "bg-[var(--c-2f6b4f)]" },
          { rotulo: "Com ressalvas", valor: contagens.ressalvas, cor: "bg-[var(--c-b06c1e)]" },
          { rotulo: "Não elegível", valor: contagens.naoElegivel, cor: "bg-[var(--c-52504e)]" },
          { rotulo: "Evidência insuficiente", valor: contagens.insuficiente, cor: "bg-[var(--c-3a5a78)]" },
          { rotulo: "Em revisão", valor: contagens.emRevisao, cor: "bg-[var(--c-a6193c)]" }
        ].map(({ rotulo, valor, cor }) => (
          <div key={rotulo} className="flex items-baseline gap-2">
            <dd className="text-2xl font-semibold text-[var(--c-231f20)] tabular-nums">{valor}</dd>
            <dt className="flex items-center gap-1.5 text-xs text-[var(--c-6b6762)]">
              <span className={`h-2 w-2 rounded-full ${cor}`} aria-hidden="true" />
              {rotulo}
            </dt>
          </div>
        ))}
      </dl>

      {/* Barra de Filtros Discreta */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--c-96918a)] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por ID, título ou equipe..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full text-sm pl-9 pr-3 py-2 bg-[var(--c-ffffff)] text-[var(--c-231f20)] placeholder:text-[var(--c-96918a)] border border-[var(--c-e0deda)] rounded-lg focus:outline-none focus:border-[var(--c-a6193c)]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filtroClasse}
            onChange={(e) => setFiltroClasse(e.target.value)}
            className="text-sm bg-[var(--c-ffffff)] border border-[var(--c-e0deda)] rounded-lg px-2.5 py-2 text-[var(--c-231f20)] focus:outline-none focus:border-[var(--c-a6193c)]"
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
            className="text-sm bg-[var(--c-ffffff)] border border-[var(--c-e0deda)] rounded-lg px-2.5 py-2 text-[var(--c-231f20)] focus:outline-none focus:border-[var(--c-a6193c)]"
          >
            <option value="TODAS">Todas as situações</option>
            <option value="EM_REVISAO">Em revisão</option>
            <option value="HOMOLOGADO">Homologado</option>
            <option value="INGERIDO">Ingerido</option>
          </select>
        </div>
      </div>

      {/* Tabela Densa Institucional (TELA 7) */}
      <div className="bg-[var(--c-ffffff)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs table-dense">
            <thead className="border-b border-[var(--c-e0deda)] text-[var(--c-6b6762)] font-medium text-[11px] uppercase tracking-wider">
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
            <tbody className="divide-y divide-[var(--c-e0deda)]">
              {casosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-[var(--c-6b6762)]">
                    {casos.length === 0
                      ? "Nenhum caso analisado ainda. Use “Analisar novo projeto” para começar."
                      : "Nenhum caso encontrado com os filtros aplicados."}
                  </td>
                </tr>
              ) : (
                casosFiltrados.map((caso) => {
                  const p = pareceresMap[caso.id];
                  const pontosRev = getPontosRevisados(p);
                  return (
                    <tr
                      key={caso.id}
                      className="hover:bg-[var(--c-faf9f7)] transition-colors group cursor-pointer"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-[var(--c-a6193c)]">
                        <Link href={`/casos/${caso.id}/parecer`} className="hover:underline">
                          {caso.id}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[var(--c-231f20)] max-w-xs lg:max-w-xl truncate">
                        <Link href={`/casos/${caso.id}/parecer`} className="hover:underline">
                          {caso.titulo}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 text-[var(--c-52504e)]">{caso.equipe}</td>
                      <td className="py-2.5 px-3">{getClasseBadge(p)}</td>
                      <td className="py-2.5 px-3">
                        <span className="capitalize text-[var(--c-231f20)] font-medium">
                          {caso.situacao.toLowerCase().replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-[11px] text-[var(--c-52504e)] bg-[var(--c-f3f3f1)] px-1.5 py-0.5 rounded-[4px] border border-[var(--c-e0deda)]">
                          {pontosRev}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link
                          href={`/casos/${caso.id}/parecer`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--c-a6193c)] hover:text-[var(--c-851430)] hover:underline"
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
