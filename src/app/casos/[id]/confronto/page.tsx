"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { obterCasos, obterParecerPorId, salvarParecer, registrarAuditoria, obterEvidencias } from "@/lib/casos-store";
import { useCarregarNoCliente } from "@/lib/use-carregar-no-cliente";
import { resolverConfronto } from "@/motor/resolucao";
import { Caso, Parecer, Confronto } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";

export default function ConfrontoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const casoId = resolvedParams.id;
  const { usuario } = useAuth();

  const [caso, setCaso] = useState<Caso | null>(null);
  const [parecer, setParecer] = useState<Parecer | null>(null);
  const [confrontos, setConfrontos] = useState<Confronto[]>([]);
  const [razoes, setRazoes] = useState<Record<string, string>>({});
  const [erros, setErros] = useState<Record<string, string>>({});

  useCarregarNoCliente(casoId, () => {
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
  });

  if (!caso || !parecer) {
    return (
      <div className="py-12 text-center text-xs text-[var(--c-6b6a65)]">
        Carregando confrontos do caso {casoId}...
      </div>
    );
  }

  const handleResolver = (confId: string, prevalencia: "A" | "B") => {
    // Divergir da sugestão exige razão; a contraditória passa a ser a afirmação que perdeu (resolucao.ts)
    const r = resolverConfronto(parecer, obterEvidencias(casoId), confId, prevalencia, {
      razao: razoes[confId],
      por: usuario.nome,
      em: new Date().toISOString()
    });
    if (!r.ok) {
      setErros((e) => ({ ...e, [confId]: r.motivo }));
      return;
    }
    setErros((e) => ({ ...e, [confId]: "" }));
    const anterior = parecer.confrontos.find((c) => c.id === confId);
    const resolvido = r.parecer.confrontos.find((c) => c.id === confId);
    setConfrontos(r.parecer.confrontos);
    setParecer(r.parecer);
    salvarParecer(r.parecer);

    registrarAuditoria({
      casoId,
      ator: usuario.nome,
      papel: usuario.papel,
      acao: "CONFRONTO_RESOLVIDO",
      alvo: confId,
      antes: anterior ? { prevalencia: anterior.prevalencia, prevalenciaSugerida: anterior.prevalenciaSugerida } : null,
      depois: { prevalencia, razao: resolvido?.razaoDaPrevalencia ?? null },
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
            className="inline-flex items-center gap-1.5 text-xs text-[var(--c-6b6a65)] hover:text-[var(--c-0f5132)] font-semibold mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao parecer técnico
          </Link>
          <h1 className="text-xl font-bold text-[var(--c-1a1a18)] tracking-tight">
            Divergências entre fontes — {caso.id}
          </h1>
          <p className="text-xs text-[var(--c-6b6a65)] mt-0.5">
            {pendentes} pendentes · {resolvidas} resolvidas · O analista arbitra a prevalência documental
          </p>
        </div>
      </div>

      {confrontos.length === 0 ? (
        <div className="bg-[var(--c-ffffff)] border border-[var(--c-e3e2dd)] rounded-xl p-8 text-center text-xs text-[var(--c-6b6a65)]">
          Nenhuma divergência documental registrada para este caso.
        </div>
      ) : (
        <div className="space-y-6">
          {confrontos.map((conf, idx) => (
            <div
              key={conf.id}
              className="bg-[var(--c-ffffff)] border border-[var(--c-e3e2dd)] rounded-xl overflow-hidden shadow-xs space-y-4 p-5"
            >
              <div className="flex items-center justify-between border-b border-[var(--c-edece7)] pb-3">
                <span className="text-xs font-bold text-[var(--c-1a1a18)] uppercase tracking-wider">
                  Divergência #{idx + 1} — Campo: {conf.campoLogico}
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                    conf.resolvidoPor
                      ? "bg-[var(--c-ebf5f0)] text-[var(--c-0f5132)] border-[var(--c-a3d9be)]"
                      : "bg-[var(--c-fef9e7)] text-[var(--c-9a6700)] border-[var(--c-f4d089)]"
                  }`}
                >
                  {conf.resolvidoPor ? `Resolvida por ${conf.resolvidoPor}` : "Pendente de confirmação"}
                </span>
              </div>

              {/* Comparação Lado a Lado: Duas Metades com Divisória Central (TELA 5) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Metade Esquerda: afirmação A */}
                <div className="bg-[var(--c-ffffff)] border border-[var(--c-e3e2dd)] rounded-lg p-4 space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[var(--c-6b6a65)] uppercase tracking-wider block mb-1">
                      Afirmação A{conf.prevalenciaSugerida === "A" ? " — prevalência sugerida" : ""}
                    </span>
                    <p className="font-evidence text-xs text-[var(--c-1a1a18)] italic leading-relaxed">
                      &ldquo;{conf.afirmacaoA.texto}&rdquo;
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[var(--c-f0efea)] flex items-center justify-between text-[11px] text-[var(--c-6b6a65)]">
                    <span>{conf.afirmacaoA.fonte}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--c-f5f5f4)] text-[var(--c-44403c)] border border-[var(--c-d6d3d1)]">
                      {conf.afirmacaoA.forca}
                    </span>
                  </div>
                </div>

                {/* Metade Direita: afirmação B */}
                <div className="bg-[var(--c-fbfbf8)] border border-[var(--c-a3d9be)] rounded-lg p-4 space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[var(--c-0f5132)] uppercase tracking-wider block mb-1">
                      Afirmação B{conf.prevalenciaSugerida === "B" ? " — prevalência sugerida" : ""}
                    </span>
                    <p className="font-evidence text-xs text-[var(--c-1a1a18)] italic leading-relaxed">
                      &ldquo;{conf.afirmacaoB.texto}&rdquo;
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[var(--c-edece7)] flex items-center justify-between text-[11px] text-[var(--c-6b6a65)]">
                    <span>{conf.afirmacaoB.fonte}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--c-ebf5f0)] text-[var(--c-0f5132)] border border-[var(--c-a3d9be)]">
                      {conf.afirmacaoB.forca}
                    </span>
                  </div>
                </div>
              </div>

              {/* Faixa de Decisão: Prevalência */}
              <div className="bg-[var(--c-f7f7f4)] border border-[var(--c-e3e2dd)] rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--c-1a1a18)] uppercase tracking-wider">
                    Prevalece:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResolver(conf.id, "B")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                        conf.prevalencia === "B"
                          ? "bg-[var(--c-0f5132)] text-white border-[var(--c-0f5132)] shadow-xs ring-2 ring-[var(--c-0f5132)]/20"
                          : "bg-[var(--c-ffffff)] text-[var(--c-1a1a18)] border-[var(--c-e3e2dd)] hover:bg-[var(--c-f7f7f4)]"
                      }`}
                    >
                      B{conf.prevalenciaSugerida === "B" ? " (sugerida)" : ""}
                    </button>
                    <button
                      onClick={() => handleResolver(conf.id, "A")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                        conf.prevalencia === "A"
                          ? "bg-[var(--c-44403c)] text-white border-[var(--c-44403c)] shadow-xs"
                          : "bg-[var(--c-ffffff)] text-[var(--c-1a1a18)] border-[var(--c-e3e2dd)] hover:bg-[var(--c-f7f7f4)]"
                      }`}
                    >
                      A{conf.prevalenciaSugerida === "A" ? " (sugerida)" : ""}
                    </button>
                  </div>
                </div>

                <span className="text-[11px] text-[var(--c-6b6a65)] italic">
                  Razão: {conf.razaoDaPrevalencia}
                </span>
              </div>

              {/* Razão do analista: obrigatória para divergir da prevalência sugerida (§2 regra 6) */}
              <div className="space-y-1">
                <textarea
                  value={razoes[conf.id] ?? ""}
                  onChange={(e) => setRazoes((r) => ({ ...r, [conf.id]: e.target.value }))}
                  rows={2}
                  placeholder="Razão da prevalência (obrigatória se escolher contra a sugestão)"
                  className="w-full text-xs p-2 rounded-md border border-[var(--c-e3e2dd)] bg-[var(--c-ffffff)] focus:outline-none focus:ring-1 focus:ring-[var(--c-0f5132)]"
                />
                {erros[conf.id] && <p className="text-[11px] text-[var(--c-a6193c)]">{erros[conf.id]}</p>}
              </div>

              {/* Bloco "COMO ENTRARÁ NO PARECER" (Padrão Literal Guia STS) */}
              <div className="bg-[var(--c-f0efea)] rounded-lg p-3 space-y-1">
                <span className="text-[10px] font-bold text-[var(--c-6b6a65)] uppercase tracking-wider block">
                  Como entrará no parecer técnico
                </span>
                <p className="text-xs text-[var(--c-1a1a18)] leading-relaxed">
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
