"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  obterCasos,
  obterParecerPorId,
  salvarParecer,
  salvarCasos,
  registrarAuditoria
} from "@/lib/casos-store";
import { Caso, Parecer, EstadoCriterio } from "@/types";
import { comporClasse } from "@/motor/classificacao";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, RefreshCw, Upload, CheckCircle2, ArrowRight, GitCompare, FileText } from "lucide-react";

export default function ReanalisePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const casoId = resolvedParams.id;
  const router = useRouter();
  const { usuario } = useAuth();

  const [caso, setCaso] = useState<Caso | null>(null);
  const [parecerV1, setParecerV1] = useState<Parecer | null>(null);

  const [novoArquivoNome, setNovoArquivoNome] = useState("EV15_relatorio_complementar_validacao.md");
  const [novoArquivoConteudo, setNovoArquivoConteudo] = useState(
    "Foram executados ensaios complementares cobrindo interrupções abruptas e contratos de renegociação sob corte de energia. Todos os 40 ensaios registraram integridade e ausência de leituras indevidas. Conclusão validada no escopo ampliado."
  );

  const [reanalisado, setReanalisado] = useState(false);
  const [parecerV2, setParecerV2] = useState<Parecer | null>(null);

  useEffect(() => {
    const casos = obterCasos();
    const c = casos.find((x) => x.id === casoId);
    if (c) {
      setCaso(c);
      if (c.parecerAtualId) {
        const p = obterParecerPorId(c.parecerAtualId);
        setParecerV1(p);
      }
    }
  }, [casoId]);

  if (!caso || !parecerV1) {
    return (
      <div className="py-12 text-center text-xs text-[#6B6A65]">
        Carregando caso para reanálise...
      </div>
    );
  }

  const executarReanalise = () => {
    // Clone para V2
    const v2: Parecer = JSON.parse(JSON.stringify(parecerV1));
    v2.id = `PAR-${caso.id}-V2`;
    v2.versao = 2;
    v2.versaoAnteriorId = parecerV1.id;
    v2.situacao = "PROPOSTO";

    // O novo documento resolve a ressalva do critério 5
    v2.pontos[5].estadoProposto = "DOCUMENTADA NO ESCOPO";
    v2.pontos[5].estadoFinal = "DOCUMENTADA NO ESCOPO";
    v2.pontos[5].porqueProposto =
      "A evidência complementar EV15 supriu a lacuna anterior, validando o comportamento sob interrupção concorrente e estendendo a transferibilidade a todo o escopo reivindicado.";
    v2.pontos[5].porqueFinal = v2.pontos[5].porqueProposto;
    v2.pontos[5].citacoesPropostas.unshift({
      id: `CIT-${caso.id}-EV15`,
      criterioId: 5,
      evidenciaId: `${caso.id}-EV15`,
      seletor: "#1",
      trecho: "Foram executados ensaios complementares cobrindo interrupções abruptas... Conclusão validada no escopo ampliado.",
      offsetInicio: 0,
      offsetFim: 120,
      forcaProbatoria: "PRIMARIA",
      sentido: "FAVORAVEL",
      origem: "MOTOR"
    });

    // Recompor classe
    const estadosV2: Record<number, EstadoCriterio> = {
      1: v2.pontos[1].estadoFinal || v2.pontos[1].estadoProposto,
      2: v2.pontos[2].estadoFinal || v2.pontos[2].estadoProposto,
      3: v2.pontos[3].estadoFinal || v2.pontos[3].estadoProposto,
      4: v2.pontos[4].estadoFinal || v2.pontos[4].estadoProposto,
      5: "DOCUMENTADA NO ESCOPO"
    };

    const res = comporClasse(estadosV2);
    v2.classeProposta = res.classe as any;
    v2.classeFinal = res.classe as any;
    v2.geradoEm = new Date().toISOString();
    v2.geradoPor = `Reanálise com aditamento de ${novoArquivoNome}`;

    setParecerV2(v2);
    setReanalisado(true);
  };

  const aprovarV2 = () => {
    if (!parecerV2) return;

    salvarParecer(parecerV2);

    // Atualizar caso para apontar para V2
    const casos = obterCasos();
    const casosAtualizados = casos.map((c) =>
      c.id === caso.id
        ? {
            ...c,
            situacao: "EM_REVISAO" as const,
            parecerAtualId: parecerV2.id
          }
        : c
    );
    salvarCasos(casosAtualizados);

    registrarAuditoria({
      casoId,
      ator: usuario.nome,
      papel: usuario.papel,
      acao: "REANALISE",
      alvo: parecerV2.id,
      antes: { versao: 1, classe: parecerV1.classeFinal || parecerV1.classeProposta },
      depois: { versao: 2, classe: parecerV2.classeFinal || parecerV2.classeProposta, novoArquivo: novoArquivoNome },
      em: new Date().toISOString()
    });

    router.push(`/casos/${caso.id}/parecer`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href={`/casos/${caso.id}/parecer`}
        className="inline-flex items-center gap-1.5 text-xs text-[#6B6A65] hover:text-[#0F5132] font-semibold"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao parecer
      </Link>

      <div className="bg-white border border-[#E3E2DD] rounded-xl p-6 shadow-xs space-y-6">
        <div className="border-b border-[#EDECE7] pb-4">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-[#0F5132]" />
            <h1 className="text-lg font-bold text-[#1A1A18] tracking-tight">
              Reanálise com Diff Documental — {caso.id}
            </h1>
          </div>
          <p className="text-xs text-[#6B6A65] mt-1">
            Anexe evidências adicionais ou esclarecimentos da equipe para gerar a versão 2 do parecer
            preservando a versão anterior 1 no rastro imutável de auditoria.
          </p>
        </div>

        {/* Formulário de Aditamento de Evidência Nova */}
        <div className="space-y-4 bg-[#F7F7F4] p-4 rounded-lg border border-[#EDECE7]">
          <span className="text-xs font-bold text-[#1A1A18] uppercase tracking-wider block">
            Aditar Nova Evidência ao Pacote
          </span>

          <div>
            <label className="text-xs font-semibold text-[#1A1A18] block mb-1">
              Nome do Arquivo / Identificador da Evidência:
            </label>
            <input
              type="text"
              value={novoArquivoNome}
              onChange={(e) => setNovoArquivoNome(e.target.value)}
              className="w-full text-xs p-2 bg-white border border-[#E3E2DD] rounded-md font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#1A1A18] block mb-1">
              Conteúdo da Evidência Aditada:
            </label>
            <textarea
              rows={4}
              value={novoArquivoConteudo}
              onChange={(e) => setNovoArquivoConteudo(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-[#E3E2DD] rounded-md font-mono"
            />
          </div>

          <button
            onClick={executarReanalise}
            className="px-4 py-2 bg-[#A6193C] hover:bg-[#851430] text-white text-xs font-semibold rounded-[4px] shadow-2xs transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Processar Reanálise e Gerar Diff
          </button>
        </div>

        {/* DIFF COMPARATIVO V1 vs V2 */}
        {reanalisado && parecerV2 && (
          <div className="space-y-4 border-t border-[#E0DEDA] pt-5">
            <h2 className="text-sm font-bold text-[#231F20] tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2F6B4F]" />
              Diff Entre Versões (v1 → v2)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Coluna Versão 1 (Anterior) */}
              <div className="p-4 bg-[#F3F3F1] rounded-[4px] border border-[#E0DEDA] space-y-2">
                <div className="font-bold text-[#52504E] uppercase text-[11px] border-b border-[#E0DEDA] pb-1">
                  Versão 1 (Anterior - Preservada)
                </div>
                <div>
                  <span className="text-[#52504E]">Classe:</span>{" "}
                  <strong className="text-[#B06C1E]">
                    {parecerV1.classeFinal || parecerV1.classeProposta}
                  </strong>
                </div>
                <div>
                  <span className="text-[#52504E]">Critério 5:</span>{" "}
                  <strong>{parecerV1.pontos[5].estadoFinal || parecerV1.pontos[5].estadoProposto}</strong>
                </div>
                <p className="text-[11px] text-[#52504E] line-through">
                  {parecerV1.pontos[5].porqueFinal || parecerV1.pontos[5].porqueProposto}
                </p>
              </div>

              {/* Coluna Versão 2 (Nova Proposta) */}
              <div className="p-4 bg-[#EBF5F0] rounded-[4px] border border-[#A3D9BE] space-y-2">
                <div className="font-bold text-[#2F6B4F] uppercase text-[11px] border-b border-[#A3D9BE] pb-1">
                  Versão 2 (Nova Reanálise com Aditamento)
                </div>
                <div>
                  <span className="text-[#2F6B4F]">Classe:</span>{" "}
                  <strong className="text-[#2F6B4F]">
                    {parecerV2.classeFinal || parecerV2.classeProposta}
                  </strong>
                </div>
                <div>
                  <span className="text-[#2F6B4F]">Critério 5:</span>{" "}
                  <strong className="text-[#2F6B4F]">{parecerV2.pontos[5].estadoFinal}</strong>
                </div>
                <p className="text-[11px] text-[#231F20]">
                  {parecerV2.pontos[5].porqueFinal}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setReanalisado(false)}
                className="px-3 py-1.5 text-xs text-[#52504E] hover:text-[#231F20]"
              >
                Descartar
              </button>
              <button
                onClick={aprovarV2}
                className="px-4 py-2 bg-[#A6193C] hover:bg-[#851430] text-white text-xs font-semibold rounded-[4px] shadow-2xs transition-colors inline-flex items-center gap-2"
              >
                Aprovar e Ativar Versão 2 <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
