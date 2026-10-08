"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { obterAuditoria } from "@/lib/casos-store";
import { EventoAuditoria } from "@/types";
import { ShieldCheck, History, User, Clock, ArrowRight, ArrowLeft } from "lucide-react";

export default function AuditoriaPage() {
  const [eventos, setEventos] = useState<EventoAuditoria[]>([]);

  useEffect(() => {
    setEventos(obterAuditoria());
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-ui">
      <div>
        <h1 className="text-xl font-bold text-[#231F20] tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#A6193C]" />
          Rastro — Trilha de Auditoria Imutável
        </h1>
        <p className="text-xs text-[#52504E] mt-0.5">
          Registro cronológico imutável de todas as propostas da máquina, deliberações e homologações humanas
        </p>
      </div>

      <div className="bg-white border border-[#E0DEDA] rounded-[4px] overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-[#E0DEDA] bg-[#F3F3F1] flex items-center justify-between">
          <span className="text-xs font-bold text-[#231F20] uppercase tracking-wider">
            Linha do Tempo de Decisões
          </span>
          <span className="text-[11px] font-semibold text-[#2F6B4F] bg-[#EBF5F0] px-2 py-0.5 rounded-[4px] border border-[#A3D9BE]">
            {eventos.length} eventos registrados
          </span>
        </div>

        {eventos.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#52504E]">
            Nenhum evento registrado ainda. As ações realizadas em pareceres aparecerão aqui em ordem cronológica.
          </div>
        ) : (
          <div className="divide-y divide-[#E0DEDA]">
            {eventos.map((ev, idx) => (
              <div key={idx} className="p-4 hover:bg-[#FAF9F7] transition-colors flex items-start gap-3.5 text-xs">
                <div className="w-8 h-8 rounded-[4px] bg-[#F3F3F1] border border-[#E0DEDA] flex items-center justify-center text-[#A6193C] shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#231F20]">
                      {ev.acao.replace(/_/g, " ")} — {ev.alvo}
                    </span>
                    <span className="text-[11px] text-[#52504E]">
                      {new Date(ev.em).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[#52504E]">
                    <span className="font-semibold text-[#A6193C]">{ev.ator}</span>
                    <span>({ev.papel})</span>
                    <span>·</span>
                    <span className="font-mono text-[11px]">Caso: {ev.casoId}</span>
                  </div>

                  {ev.depois ? (
                    <div className="bg-[#F3F3F1] p-2 rounded-[4px] border border-[#E0DEDA] text-[11px] font-mono text-[#231F20] mt-1">
                      {typeof ev.depois === "object"
                        ? JSON.stringify(ev.depois)
                        : String(ev.depois)}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
