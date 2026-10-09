"use client";

import React, { useState } from "react";
import { obterAuditoria } from "@/lib/casos-store";
import { useCarregarNoCliente } from "@/lib/use-carregar-no-cliente";
import { EventoAuditoria } from "@/types";
import { ShieldCheck, Clock } from "lucide-react";

export default function AuditoriaPage() {
  const [eventos, setEventos] = useState<EventoAuditoria[]>([]);

  useCarregarNoCliente("auditoria", () => {
    setEventos(obterAuditoria());
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-ui">
      <div>
        <h1 className="text-xl font-bold text-[var(--c-231f20)] tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[var(--c-a6193c)]" />
          Rastro — Trilha de Auditoria Imutável
        </h1>
        <p className="text-xs text-[var(--c-52504e)] mt-0.5">
          Registro cronológico imutável de todas as propostas da máquina, deliberações e homologações humanas
        </p>
      </div>

      <div className="bg-[var(--c-ffffff)] border border-[var(--c-e0deda)] rounded-[4px] overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-[var(--c-e0deda)] bg-[var(--c-f3f3f1)] flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--c-231f20)] uppercase tracking-wider">
            Linha do Tempo de Decisões
          </span>
          <span className="text-[11px] font-semibold text-[var(--c-2f6b4f)] bg-[var(--c-ebf5f0)] px-2 py-0.5 rounded-[4px] border border-[var(--c-a3d9be)]">
            {eventos.length} eventos registrados
          </span>
        </div>

        {eventos.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--c-52504e)]">
            Nenhum evento registrado ainda. As ações realizadas em pareceres aparecerão aqui em ordem cronológica.
          </div>
        ) : (
          <div className="divide-y divide-[var(--c-e0deda)]">
            {eventos.map((ev, idx) => (
              <div key={idx} className="p-4 hover:bg-[var(--c-faf9f7)] transition-colors flex items-start gap-3.5 text-xs">
                <div className="w-8 h-8 rounded-[4px] bg-[var(--c-f3f3f1)] border border-[var(--c-e0deda)] flex items-center justify-center text-[var(--c-a6193c)] shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--c-231f20)]">
                      {ev.acao.replace(/_/g, " ")} — {ev.alvo}
                    </span>
                    <span className="text-[11px] text-[var(--c-52504e)]">
                      {new Date(ev.em).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[var(--c-52504e)]">
                    <span className="font-semibold text-[var(--c-a6193c)]">{ev.ator}</span>
                    <span>({ev.papel})</span>
                    <span>·</span>
                    <span className="font-mono text-[11px]">Caso: {ev.casoId}</span>
                  </div>

                  {ev.depois ? (
                    <div className="bg-[var(--c-f3f3f1)] p-2 rounded-[4px] border border-[var(--c-e0deda)] text-[11px] font-mono text-[var(--c-231f20)] mt-1">
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
