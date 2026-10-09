"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { obterCasos, obterParecerPorId, salvarParecer, salvarCasos, registrarAuditoria } from "@/lib/casos-store";
import { useCarregarNoCliente } from "@/lib/use-carregar-no-cliente";
import { Caso, Parecer } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { hashConteudoParecer } from "@/motor/hash";
import { ArrowLeft, Lock, AlertTriangle } from "lucide-react";

export default function HomologarPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const casoId = resolvedParams.id;
  const router = useRouter();
  const { usuario } = useAuth();

  const [caso, setCaso] = useState<Caso | null>(null);
  const [parecer, setParecer] = useState<Parecer | null>(null);

  // Campos condicionais
  const [recorteSustentado, setRecorteSustentado] = useState("");
  const [limitacaoEspecifica, setLimitacaoEspecifica] = useState("");
  const [evidenciaNecessaria, setEvidenciaNecessaria] = useState("");
  const [eloAusente, setEloAusente] = useState("");
  const [mecanismoDocumentado, setMecanismoDocumentado] = useState("");

  const [confirmacao, setConfirmacao] = useState(false);

  useCarregarNoCliente(casoId, () => {
    const casos = obterCasos();
    const c = casos.find((x) => x.id === casoId);
    if (c) {
      setCaso(c);
      if (c.parecerAtualId) {
        const p = obterParecerPorId(c.parecerAtualId);
        if (p) {
          setParecer(p);
          setRecorteSustentado(p.recorteSustentado || "");
          setLimitacaoEspecifica(p.limitacaoEspecifica || "");
          setEvidenciaNecessaria(p.evidenciaNecessaria || "");
          setEloAusente(p.eloAusente || "");
          setMecanismoDocumentado(p.mecanismoDocumentado || "");
        }
      }
    }
  });

  if (!caso || !parecer) {
    return (
      <div className="py-12 text-center text-xs text-[var(--c-6b6a65)]">
        Carregando dados para homologação...
      </div>
    );
  }

  const classeAtiva = parecer.classeFinal || parecer.classeProposta;
  // §11: só o revisor homologa e congela
  const podeHomologar = usuario.papel === "revisor";

  const handleHomologar = async () => {
    if (!podeHomologar) {
      alert("Somente o revisor pode homologar e congelar o parecer.");
      return;
    }
    if (!confirmacao) {
      alert("É necessário marcar o termo de responsabilidade e integridade para homologar.");
      return;
    }

    const agora = new Date().toISOString();

    const pAtualizado: Parecer = {
      ...parecer,
      situacao: "HOMOLOGADO",
      homologadoEm: agora,
      homologadoPor: usuario.nome,
      hashConteudo: "",
      recorteSustentado: classeAtiva === "COM_RESSALVAS" ? recorteSustentado : null,
      limitacaoEspecifica: classeAtiva === "COM_RESSALVAS" ? limitacaoEspecifica : null,
      evidenciaNecessaria: classeAtiva === "COM_RESSALVAS" ? evidenciaNecessaria : null,
      eloAusente: classeAtiva === "EVIDENCIA_INSUFICIENTE" ? eloAusente : null,
      mecanismoDocumentado: classeAtiva === "NAO_ELEGIVEL" ? mecanismoDocumentado : null
    };
    // SHA-256 do parecer já assinado (inclui homologadoPor/Em); exclui o próprio hash
    // Sem hash não há congelamento: parecer homologado precisa ser verificável
    const hash = await hashConteudoParecer(pAtualizado).catch(() => null);
    if (!hash) {
      alert("Não foi possível calcular o hash SHA-256 neste navegador (a página precisa estar em https ou localhost). O parecer não foi homologado.");
      return;
    }
    pAtualizado.hashConteudo = hash;

    salvarParecer(pAtualizado);

    // Atualizar situação do caso
    const casos = obterCasos();
    const casosAtualizados = casos.map((c) =>
      c.id === caso.id ? { ...c, situacao: "HOMOLOGADO" as const } : c
    );
    salvarCasos(casosAtualizados);

    registrarAuditoria({
      casoId,
      ator: usuario.nome,
      papel: usuario.papel,
      acao: "PARECER_HOMOLOGADO",
      alvo: parecer.id,
      antes: "EM_REVISAO",
      depois: { situacao: "HOMOLOGADO", hash, classeFinal: classeAtiva },
      em: agora
    });

    router.push(`/casos/${caso.id}/documento`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href={`/casos/${caso.id}/parecer`}
        className="inline-flex items-center gap-1.5 text-xs text-[var(--c-6b6a65)] hover:text-[var(--c-0f5132)] font-semibold"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar à revisão do parecer
      </Link>

      <div className="bg-[var(--c-ffffff)] border border-[var(--c-e3e2dd)] rounded-xl p-6 shadow-xs space-y-6">
        <div className="border-b border-[var(--c-edece7)] pb-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[var(--c-0f5132)]" />
            <h1 className="text-lg font-bold text-[var(--c-1a1a18)] tracking-tight">
              Homologação e Congelamento do Parecer — {caso.id}
            </h1>
          </div>
          <p className="text-xs text-[var(--c-6b6a65)] mt-1">
            Esta ação congela o documento final de forma imutável, registrando a assinatura digital de{" "}
            <strong>{usuario.nome} ({usuario.cargo})</strong> e calculando o hash SHA-256 de integridade.
          </p>
        </div>

        {/* Resumo da Decisão */}
        <div className="bg-[var(--c-f7f7f4)] p-4 rounded-lg space-y-2 border border-[var(--c-edece7)] text-xs">
          <div className="flex justify-between">
            <span className="text-[var(--c-6b6a65)]">Projeto:</span>
            <span className="font-semibold text-[var(--c-1a1a18)]">{caso.titulo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--c-6b6a65)]">Classificação Final Homologada:</span>
            <span className="font-bold text-[var(--c-0f5132)]">{classeAtiva.replace("_", " ")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--c-6b6a65)]">Houve divergência da máquina:</span>
            <span className="font-semibold text-[var(--c-1a1a18)]">
              {parecer.analistaDivergiuDaProposta ? "Sim (registrada com fundamentação)" : "Não"}
            </span>
          </div>
        </div>

        {/* Campos Condicionais por Classe (CLAUDE.md Seção 10 e 13) */}
        {classeAtiva === "COM_RESSALVAS" && (
          <div className="space-y-3 bg-[var(--c-fef9e7)] p-4 rounded-lg border border-[var(--c-f4d089)]">
            <span className="text-xs font-bold text-[var(--c-9a6700)] uppercase tracking-wider block">
              Campos Condicionais — Classe Com Ressalvas
            </span>
            <div>
              <label className="text-xs font-semibold text-[var(--c-1a1a18)] block mb-1">
                Recorte Sustentado:
              </label>
              <input
                type="text"
                value={recorteSustentado}
                onChange={(e) => setRecorteSustentado(e.target.value)}
                placeholder="Ex: Cobrança de boletos simples em canais digitais"
                className="w-full text-xs p-2 bg-[var(--c-ffffff)] border border-[var(--c-e3e2dd)] rounded-md focus:outline-none focus:border-[var(--c-9a6700)]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--c-1a1a18)] block mb-1">
                Limitação Específica:
              </label>
              <input
                type="text"
                value={limitacaoEspecifica}
                onChange={(e) => setLimitacaoEspecifica(e.target.value)}
                placeholder="Ex: A alegação de aplicação a contratos complexos ainda não foi validada"
                className="w-full text-xs p-2 bg-[var(--c-ffffff)] border border-[var(--c-e3e2dd)] rounded-md focus:outline-none focus:border-[var(--c-9a6700)]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--c-1a1a18)] block mb-1">
                Evidência Necessária para Generalização:
              </label>
              <input
                type="text"
                value={evidenciaNecessaria}
                onChange={(e) => setEvidenciaNecessaria(e.target.value)}
                placeholder="Ex: Ensaios de campo com contratos de crédito renegociados"
                className="w-full text-xs p-2 bg-[var(--c-ffffff)] border border-[var(--c-e3e2dd)] rounded-md focus:outline-none focus:border-[var(--c-9a6700)]"
              />
            </div>
          </div>
        )}

        {classeAtiva === "EVIDENCIA_INSUFICIENTE" && (
          <div className="space-y-3 bg-[var(--c-eff6ff)] p-4 rounded-lg border border-[var(--c-bfdbfe)]">
            <span className="text-xs font-bold text-[var(--c-2c4f7c)] uppercase tracking-wider block">
              Campos Condicionais — Evidência Insuficiente
            </span>
            <div>
              <label className="text-xs font-semibold text-[var(--c-1a1a18)] block mb-1">
                Elo Ausente Identificado:
              </label>
              <input
                type="text"
                value={eloAusente}
                onChange={(e) => setEloAusente(e.target.value)}
                placeholder="Ex: Faltam versão do classificador, causas de referência e decisões por evento"
                className="w-full text-xs p-2 bg-[var(--c-ffffff)] border border-[var(--c-e3e2dd)] rounded-md focus:outline-none focus:border-[var(--c-2c4f7c)]"
              />
            </div>
          </div>
        )}

        {classeAtiva === "NAO_ELEGIVEL" && (
          <div className="space-y-3 bg-[var(--c-f5f5f4)] p-4 rounded-lg border border-[var(--c-d6d3d1)]">
            <span className="text-xs font-bold text-[var(--c-44403c)] uppercase tracking-wider block">
              Campos Condicionais — Não Elegível
            </span>
            <div>
              <label className="text-xs font-semibold text-[var(--c-1a1a18)] block mb-1">
                Mecanismo Documentado que Já Resolvia o Problema:
              </label>
              <input
                type="text"
                value={mecanismoDocumentado}
                onChange={(e) => setMecanismoDocumentado(e.target.value)}
                placeholder="Ex: O manual fictício já fornecia o recurso aplicado antes da configuração"
                className="w-full text-xs p-2 bg-[var(--c-ffffff)] border border-[var(--c-e3e2dd)] rounded-md focus:outline-none focus:border-[var(--c-44403c)]"
              />
            </div>
          </div>
        )}

        {/* Termo de Homologação */}
        <label className="flex items-start gap-2.5 p-3 bg-[var(--c-fbfbf8)] border border-[var(--c-edece7)] rounded-lg cursor-pointer text-xs">
          <input
            type="checkbox"
            checked={confirmacao}
            onChange={(e) => setConfirmacao(e.target.checked)}
            className="mt-0.5 accent-[var(--c-0f5132)]"
          />
          <span className="text-[var(--c-1a1a18)] leading-relaxed">
            Declaro que revisei todos os pontos, as evidências citadas e os fundamentos legais. Confirmo
            a homologação desta análise preliminar para arquivo imutável como peça de sustentação técnica.
          </span>
        </label>

        {!podeHomologar && (
          <div className="flex items-start gap-2 p-3 bg-[var(--c-fef9e7)] border border-[var(--c-f4d089)] rounded-lg text-xs text-[var(--c-9a6700)]">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Somente o <strong>revisor</strong> pode homologar e congelar o parecer. Papel atual:{" "}
              <strong>{usuario.papel}</strong>.
            </span>
          </div>
        )}

        {/* Botão de Homologação */}
        <button
          onClick={handleHomologar}
          disabled={!confirmacao || !podeHomologar}
          className={`w-full py-2.5 px-4 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs ${
            confirmacao && podeHomologar
              ? "bg-[var(--c-0f5132)] hover:bg-[var(--c-0b3d26)] text-white"
              : "bg-[var(--c-edece7)] text-[var(--c-a8a7a1)] cursor-not-allowed"
          }`}
        >
          <Lock className="w-4 h-4" /> Homologar, Assinar e Congelar Parecer
        </button>
      </div>
    </div>
  );
}
