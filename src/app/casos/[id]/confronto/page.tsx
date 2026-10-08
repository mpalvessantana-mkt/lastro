"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { obterCasos, obterParecerPorId, salvarParecer, registrarAuditoria } from "@/lib/casos-store";
import { Caso, Parecer, Confronto } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, CheckCircle2, AlertTriangle, Scale, Check } from "lucide-react";

export default function ConfrontoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const casoId = resolvedParams.id;
  const { usuario } = useAuth();

  const [caso, setCaso] = useState<Caso | null>(null);
  const [parecer, setParecer] = useState<Parecer | null>(null);
  const [confrontos, setConfrontos] = useState<Confronto[]>([]);

  useEffect(() => {
    const casos = obterCasos();
    const c = casos.find((x) => x.id === casoId);
    if (c) {
      setCaso(c);
      if (c.parecerAtualId) {
        const p = obterParecerPorId(c.parecerAtualId);
        if (p) {
          setParecer(p);
          setConfrontos(p.confrontos || []);
        }
      }
    }
  }, [casoId]);

  if (!caso || !parecer) {
    return (
      <div className="py-12 text-center text-xs text-[#6B6A65]">
        Carregando confrontos do caso {casoId}...
      </div>
    );
  }

  const handleResolver = (confId: string, prevalencia: "A" | "B") => {
    const atualizados = confrontos.map((conf) => {
      if (conf.id === confId) {
        const vencedora = prevalencia === "A" ? conf.afirmacaoA : conf.afirmacaoB;
        const textoFormatado = `${conf.afirmacaoA.fonte} afirma "${conf.afirmacaoA.texto}"; ${conf.afirmacaoB.fonte} mostra "${conf.afirmacaoB.texto}". Prevalece ${vencedora.fonte}, por ser primário e identificado por versão.`;

        return {
          ...conf,
          prevalencia,
          textoFormatado,
          resolvidoPor: usuario.nome,
          resolvidoEm: new Date().toISOString()
        };
      }
      return conf;
    });

    setConfrontos(atualizados);
    const pAtualizado = { ...parecer, confrontos: atualizados };
    setParecer(pAtualizado);
    salvarParecer(pAtualizado);

    registrarAuditoria({
      casoId,
      ator: usuario.nome,
      papel: usuario.papel,
      acao: "CONFRONTO_RESOLVIDO",
      alvo: confId,
      antes: null,
      depois: { prevalencia },
      em: new Date().toISOString()
    });
  };

  const pendentes = confrontos.filter((c) => !c.resolvidoPor).length;
  const resolvidas = confrontos.filter((c) => c.resolvidoPor).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Topo com Botão Voltar */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/casos/${caso.id}/parecer`}
            className="inline-flex items-center gap-1.5 text-xs text-[#6B6A65] hover:text-[#0F5132] font-semibold mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao parecer técnico
          </Link>
          <h1 className="text-xl font-bold text-[#1A1A18] tracking-tight">
            Divergências entre fontes — {caso.id}
          </h1>
          <p className="text-xs text-[#6B6A65] mt-0.5">
            {pendentes} pendentes · {resolvidas} resolvidas · O analista arbitra a prevalência documental
          </p>
        </div>
      </div>

      {confrontos.length === 0 ? (
        <div className="bg-white border border-[#E3E2DD] rounded-xl p-8 text-center text-xs text-[#6B6A65]">
          Nenhuma divergência documental registrada para este caso.
        </div>
      ) : (
        <div className="space-y-6">
          {confrontos.map((conf, idx) => (
            <div
              key={conf.id}
              className="bg-white border border-[#E3E2DD] rounded-xl overflow-hidden shadow-xs space-y-4 p-5"
            >
              <div className="flex items-center justify-between border-b border-[#EDECE7] pb-3">
                <span className="text-xs font-bold text-[#1A1A18] uppercase tracking-wider">
                  Divergência #{idx + 1} — Campo: {conf.campoLogico}
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                    conf.resolvidoPor
                      ? "bg-[#EBF5F0] text-[#0F5132] border-[#A3D9BE]"
                      : "bg-[#FEF9E7] text-[#9A6700] border-[#F4D089]"
                  }`}
                >
                  {conf.resolvidoPor ? `Resolvida por ${conf.resolvidoPor}` : "Pendente de confirmação"}
                </span>
              </div>

              {/* Comparação Lado a Lado: Duas Metades com Divisória Central (TELA 5) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Metade Esquerda: Entrevista / Depoimento */}
                <div className="bg-white border border-[#E3E2DD] rounded-lg p-4 space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#6B6A65] uppercase tracking-wider block mb-1">
                      O que a entrevista afirma
                    </span>
                    <p className="font-evidence text-xs text-[#1A1A18] italic leading-relaxed">
                      &ldquo;{conf.afirmacaoA.texto}&rdquo;
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#F0EFEA] flex items-center justify-between text-[11px] text-[#6B6A65]">
                    <span>{conf.afirmacaoA.fonte}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#F5F5F4] text-[#44403C] border border-[#D6D3D1]">
                      DECLARATÓRIA
                    </span>
                  </div>
                </div>

                {/* Metade Direita: Registros Primários */}
                <div className="bg-[#FBFBF8] border border-[#A3D9BE] rounded-lg p-4 space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#0F5132] uppercase tracking-wider block mb-1">
                      O que o registro primário mostra
                    </span>
                    <p className="font-evidence text-xs text-[#1A1A18] italic leading-relaxed">
                      &ldquo;{conf.afirmacaoB.texto}&rdquo;
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#EDECE7] flex items-center justify-between text-[11px] text-[#6B6A65]">
                    <span>{conf.afirmacaoB.fonte}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#EBF5F0] text-[#0F5132] border border-[#A3D9BE]">
                      PRIMÁRIA
                    </span>
                  </div>
                </div>
              </div>

              {/* Faixa de Decisão: Prevalência */}
              <div className="bg-[#F7F7F4] border border-[#E3E2DD] rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1A1A18] uppercase tracking-wider">
                    Prevalece:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResolver(conf.id, "B")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                        conf.prevalencia === "B"
                          ? "bg-[#0F5132] text-white border-[#0F5132] shadow-xs ring-2 ring-[#0F5132]/20"
                          : "bg-white text-[#1A1A18] border-[#E3E2DD] hover:bg-[#F7F7F4]"
                      }`}
                    >
                      O registro primário (Sugerido)
                    </button>
                    <button
                      onClick={() => handleResolver(conf.id, "A")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                        conf.prevalencia === "A"
                          ? "bg-[#44403C] text-white border-[#44403C] shadow-xs"
                          : "bg-white text-[#1A1A18] border-[#E3E2DD] hover:bg-[#F7F7F4]"
                      }`}
                    >
                      A entrevista
                    </button>
                  </div>
                </div>

                <span className="text-[11px] text-[#6B6A65] italic">
                  Razão: por ser primário e identificado por versão e ensaio.
                </span>
              </div>

              {/* Bloco "COMO ENTRARÁ NO PARECER" (Padrão Literal Guia STS) */}
              <div className="bg-[#F0EFEA] rounded-lg p-3 space-y-1">
                <span className="text-[10px] font-bold text-[#6B6A65] uppercase tracking-wider block">
                  Como entrará no parecer técnico
                </span>
                <p className="text-xs text-[#1A1A18] leading-relaxed">
                  {conf.textoFormatado}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
