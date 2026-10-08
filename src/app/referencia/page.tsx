"use client";

import React, { useState } from "react";
import { HISTORICOS_REFERENCIA, ProjetoHistorico } from "@/lib/referencia-data";
import { Search, Filter, BookOpen, Scale, ArrowRight, X } from "lucide-react";

const CORES_CLASSES: Record<string, { border: string; text: string; bg: string }> = {
  "Elegível": { border: "#2F6B4F", text: "#2F6B4F", bg: "#EBF5F0" },
  "Com ressalvas": { border: "#B06C1E", text: "#B06C1E", bg: "#FFF8E7" },
  "Não elegível": { border: "#52504E", text: "#52504E", bg: "#F3F3F1" },
  "Evidência insuficiente": { border: "#3A5A78", text: "#3A5A78", bg: "#EFF6FF" }
};

const CORES_ESTADOS: Record<string, string> = {
  "DEMONSTRADA NO RECORTE": "#2F6B4F",
  "INVESTIGADA": "#2F6B4F",
  "DOCUMENTADA": "#2F6B4F",
  "DOCUMENTADA NO ESCOPO": "#2F6B4F",
  "DOCUMENTADA COM LIMITE": "#B06C1E",
  "NÃO DEMONSTRADA": "#52504E",
  "NÃO CARACTERIZADA": "#52504E",
  "DOCUMENTADA COMO ACEITE": "#52504E",
  "DOCUMENTADA PARA A CONFIGURAÇÃO": "#52504E",
  "INDETERMINADA": "#3A5A78",
  "ALEGADA, NÃO VERIFICÁVEL": "#3A5A78",
  "PARCIAL": "#3A5A78",
  "INSUFICIENTE PARA O NÚCLEO ALEGADO": "#3A5A78"
};

export default function ReferenciaPage() {
  const [filtroClasse, setFiltroClasse] = useState("TODAS");
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<ProjetoHistorico | null>(HISTORICOS_REFERENCIA[17]); // PRJ18 selecionado por padrão

  const filtrados = HISTORICOS_REFERENCIA.filter((p) => {
    const matchBusca =
      busca === "" ||
      p.id.toLowerCase().includes(busca.toLowerCase()) ||
      p.titulo.toLowerCase().includes(busca.toLowerCase());
    const matchClasse = filtroClasse === "TODAS" || p.classificacao === filtroClasse;
    return matchBusca && matchClasse;
  });

  return (
    <div className="space-y-6 font-ui">
      {/* Topo Institucional (TELA 8) */}
      <div>
        <h1 className="text-xl font-bold text-[#231F20] tracking-tight">
          Base de referência — Precedentes de P&D
        </h1>
        <p className="text-xs text-[#52504E] mt-0.5">
          20 projetos classificados · Usados para calibrar a régua e consultar precedentes.{" "}
          <strong className="text-[#231F20]">Nunca entram no cálculo de um caso novo.</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Filtros e Grade de Cards (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Barra de Filtros */}
          <div className="bg-white border border-[#E0DEDA] rounded-[4px] p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#52504E] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar precedente por ID ou título..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-1.5 bg-[#F3F3F1] border border-[#E0DEDA] rounded-[4px] focus:outline-none focus:border-[#A6193C]"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              {["TODAS", "Elegível", "Com ressalvas", "Não elegível", "Evidência insuficiente"].map(
                (cl) => (
                  <button
                    key={cl}
                    onClick={() => setFiltroClasse(cl)}
                    className={`px-2 py-1 rounded-[4px] text-[11px] font-semibold transition-colors ${
                      filtroClasse === cl
                        ? "bg-[#A6193C] text-white"
                        : "bg-[#F3F3F1] text-[#52504E] hover:bg-[#E0DEDA]"
                    }`}
                  >
                    {cl === "TODAS" ? "Todas" : cl}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Grade de 20 Cards com Assinatura Visual (5 quadradinhos coloridos) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {filtrados.map((item) => {
              const estilo = CORES_CLASSES[item.classificacao] || CORES_CLASSES["Elegível"];
              const ativo = selecionado?.id === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelecionado(item)}
                  className={`bg-white border rounded-[4px] p-3 cursor-pointer transition-all shadow-2xs flex flex-col justify-between h-36 relative overflow-hidden ${
                    ativo
                      ? "ring-2 ring-[#A6193C] border-[#A6193C]"
                      : "border-[#E0DEDA] hover:border-[#FF8A22]"
                  }`}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: estilo.border }}
                  />

                  <div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="font-mono font-bold text-[#231F20]">{item.id}</span>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.2 rounded-[2px]"
                        style={{
                          backgroundColor: estilo.bg,
                          color: estilo.text
                        }}
                      >
                        {item.classificacao}
                      </span>
                    </div>

                    <h3 className="text-xs font-semibold text-[#231F20] line-clamp-2 mt-1.5 leading-snug">
                      {item.titulo}
                    </h3>
                  </div>

                  {/* Assinatura Visual: 5 quadradinhos dos estados */}
                  <div className="pt-2 border-t border-[#E0DEDA] flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold text-[#52504E]">
                      Assinatura:
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((cId) => {
                        const cor = CORES_ESTADOS[item.estados[cId]] || "#52504E";
                        return (
                          <div
                            key={cId}
                            title={`Critério ${cId}: ${item.estados[cId]}`}
                            className="w-2.5 h-2.5 rounded-[2px]"
                            style={{ backgroundColor: cor }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coluna Direita: Painel Lateral com Detalhes da Fundamentação (TELA 8) */}
        <div className="lg:col-span-4 bg-white border border-[#E0DEDA] rounded-[4px] p-5 shadow-2xs space-y-4 sticky top-20">
          {selecionado ? (
            <>
              <div className="border-b border-[#E0DEDA] pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-[#A6193C]">
                    {selecionado.id}
                  </span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-[4px] border"
                    style={{
                      backgroundColor: CORES_CLASSES[selecionado.classificacao]?.bg,
                      color: CORES_CLASSES[selecionado.classificacao]?.text,
                      borderColor: CORES_CLASSES[selecionado.classificacao]?.border
                    }}
                  >
                    {selecionado.classificacao}
                  </span>
                </div>
                <h2 className="text-sm font-bold text-[#231F20] mt-1 leading-snug">
                  {selecionado.titulo}
                </h2>
              </div>

              {/* Justificativa Geral */}
              <div>
                <span className="text-[10px] font-bold text-[#52504E] uppercase tracking-wider block mb-1">
                  Justificativa da Decisão
                </span>
                <p className="text-xs text-[#231F20] leading-relaxed bg-[#F3F3F1] p-3 rounded-[4px] border border-[#E0DEDA]">
                  {selecionado.justificativa}
                </p>
              </div>

              {/* Limite da Conclusão */}
              <div>
                <span className="text-[10px] font-bold text-[#52504E] uppercase tracking-wider block mb-1">
                  Limite da Conclusão
                </span>
                <p className="text-xs text-[#231F20] leading-relaxed bg-[#F3F3F1] p-3 rounded-[4px] border border-[#E0DEDA]">
                  {selecionado.limite}
                </p>
              </div>

              {/* Estados dos Cinco Critérios */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-[#52504E] uppercase tracking-wider block">
                  Os Cinco Critérios no Histórico
                </span>
                {[1, 2, 3, 4, 5].map((cId) => (
                  <div
                    key={cId}
                    className="p-2.5 rounded-[4px] border border-[#E0DEDA] bg-white text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#231F20]">
                        Critério {cId}
                      </span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.2 rounded-[2px]"
                        style={{
                          backgroundColor: "#F3F3F1",
                          color: CORES_ESTADOS[selecionado.estados[cId]] || "#231F20"
                        }}
                      >
                        {selecionado.estados[cId]}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#52504E] line-clamp-2 leading-tight">
                      {selecionado.justificativas[cId]}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-xs text-[#52504E]">
              Selecione um projeto histórico para consultar os fundamentos de referência.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
