"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { obterCasos, obterParecerPorId, obterAuditoria } from "@/lib/casos-store";
import { useCarregarNoCliente } from "@/lib/use-carregar-no-cliente";
import { Caso, Parecer, EventoAuditoria, Citacao } from "@/types";
import { obterNormaPorId } from "@/motor/corpus";
import { SeloForca } from "@/components/SeloForca";
import { Printer, ArrowLeft, History } from "lucide-react";

export default function DocumentoFinalPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const casoId = resolvedParams.id;

  const [caso, setCaso] = useState<Caso | null>(null);
  const [parecer, setParecer] = useState<Parecer | null>(null);
  const [eventosAuditoria, setEventosAuditoria] = useState<EventoAuditoria[]>([]);

  useCarregarNoCliente(casoId, () => {
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
  });

  if (!caso || !parecer) {
    return (
      <div className="py-12 text-center text-xs text-[var(--c-6b6a65)]">
        Carregando documento do parecer...
      </div>
    );
  }

  const classeAtiva = parecer.classeFinal || parecer.classeProposta;
  const homologado = parecer.situacao === "HOMOLOGADO";
  const nomeClasse = (c: string) => NOMES_CLASSES[c] || c;
  const dataHora = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Barra de Ação Superior (TELA 6) */}
      <div className="bg-[var(--c-ffffff)] border border-[var(--c-e3e2dd)] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs print:hidden">
        <div className="flex items-center gap-2">
          <Link
            href={`/casos/${caso.id}/parecer`}
            className="text-xs text-[var(--c-6b6a65)] hover:text-[var(--c-0f5132)] font-semibold inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-xs font-semibold text-[var(--c-1a1a18)]">
            Parecer {caso.id} · versão {parecer.versao} · {parecer.homologadoEm ? `Homologado em ${new Date(parecer.homologadoEm).toLocaleDateString()}` : "Minuta preliminar"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Regra 8: o selo de imutável só existe depois da homologação */}
          {homologado ? (
            <span className="bg-[var(--c-0f5132)] text-white text-[11px] font-bold px-2.5 py-1 rounded tracking-wider uppercase">
              HOMOLOGADO — IMUTÁVEL
            </span>
          ) : (
            <span className="bg-[var(--c-fef9e7)] text-[var(--c-9a6700)] border border-dashed border-[var(--c-f4d089)] text-[11px] font-bold px-2.5 py-1 rounded tracking-wider uppercase">
              PROPOSTA — NÃO HOMOLOGADA
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-[var(--c-0f5132)] hover:bg-[var(--c-0b3d26)] text-white text-xs font-semibold rounded-md shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Exportar / Imprimir PDF
          </button>
          <Link
            href={`/auditoria`}
            className="px-3 py-1.5 bg-[var(--c-ffffff)] border border-[var(--c-e3e2dd)] hover:bg-[var(--c-f7f7f4)] text-[var(--c-1a1a18)] text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5 text-[var(--c-6b6a65)]" /> Ver Trilha de Auditoria
          </Link>
        </div>
      </div>

      {/* PRÉVIA DA PÁGINA A4 CENTRALIZADA (TELA 6) */}
      <div className="max-w-4xl mx-auto bg-[var(--c-ffffff)] border border-[var(--c-e3e2dd)] shadow-md rounded-lg p-8 sm:p-14 space-y-8 text-[var(--c-1a1a18)] print:border-none print:shadow-none print:p-0">
        {!homologado && (
          <div className="border border-dashed border-[var(--c-f4d089)] bg-[var(--c-fef9e7)] text-[var(--c-9a6700)] text-xs font-semibold rounded-md p-3 text-center">
            Minuta — parecer ainda não homologado. Este documento pode mudar e não tem valor de peça final.
          </div>
        )}

        {/* Cabeçalho Oficial do BNB e Identificação */}
        <div className="border-b-2 border-[var(--c-0f5132)] pb-5 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Image
                src="/logo-bnb.png"
                alt="Banco do Nordeste"
                width={28}
                height={28}
                className="object-contain"
              />
              <span className="text-sm font-bold text-[var(--c-0f5132)] tracking-wider uppercase">
                Banco do Nordeste · Hubine
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--c-1a1a18)]">
              Parecer Técnico de Enquadramento Preliminar — Lei do Bem
            </h1>
            <p className="text-xs text-[var(--c-6b6a65)]">
              Sistema LASTRO · Sistema de Apoio à Decisão para Elegibilidade
            </p>
          </div>

          <div className="text-right text-[11px] text-[var(--c-6b6a65)] space-y-0.5">
            <div><strong>Versão:</strong> {parecer.versao}.0</div>
            <div><strong>Corpus Legal:</strong> {parecer.versaoCorpusNormativo}</div>
            <div className="font-mono text-[9px] truncate max-w-[180px]">
              SHA256: {parecer.sha256Pacote ? `${parecer.sha256Pacote.slice(0, 16)}...` : "não calculado"}
            </div>
          </div>
        </div>

        {/* 1. Identificação */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-[var(--c-0f5132)] uppercase tracking-wider">
            1. Identificação do Projeto
          </h2>
          <table className="w-full text-xs border border-[var(--c-e3e2dd)] divide-y divide-[var(--c-edece7)]">
            <tbody>
              <tr>
                <td className="py-2 px-3 font-semibold bg-[var(--c-f7f7f4)] w-1/3">Código e Título:</td>
                <td className="py-2 px-3">{caso.id} — {caso.titulo}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold bg-[var(--c-f7f7f4)]">Equipe Responsável:</td>
                <td className="py-2 px-3">
                  {caso.equipe || "Equipe não declarada no pacote"} (Duração:{" "}
                  {caso.duracaoSemanas !== null ? `${caso.duracaoSemanas} semanas` : "não declarada no pacote"})
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold bg-[var(--c-f7f7f4)]">Pacote Auditado:</td>
                <td className="py-2 px-3">
                  {caso.pacote.arquivosPresentes} de {caso.pacote.arquivosEsperados} arquivos recebidos e conferidos
                  {caso.pacote.arquivosAusentes.length > 0 && (
                    <span className="block text-[var(--c-9a6700)] mt-0.5">
                      Ausentes, declarados como lacuna: {caso.pacote.arquivosAusentes.join(", ")}
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold bg-[var(--c-f7f7f4)]">Hash do Pacote (SHA-256):</td>
                <td className="py-2 px-3 font-mono text-[10px] break-all">{parecer.sha256Pacote || "não calculado"}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold bg-[var(--c-f7f7f4)]">Homologado por:</td>
                <td className="py-2 px-3">
                  {homologado
                    ? `${parecer.homologadoPor} em ${dataHora(parecer.homologadoEm)}`
                    : `Ainda não homologado (proposta gerada em ${dataHora(parecer.geradoEm)})`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. Classificação */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-[var(--c-0f5132)] uppercase tracking-wider">
            2. Classificação Técnica Conclusiva
          </h2>
          <div className="bg-[var(--c-f7f7f4)] p-4 rounded-md border border-[var(--c-e3e2dd)] space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{homologado ? "Classe Homologada:" : "Classe em revisão (não homologada):"}</span>
              <span className="font-bold text-sm text-[var(--c-0f5132)]">
                {nomeClasse(classeAtiva)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[var(--c-6b6a65)]">
              <span>Classe Proposta pelo Motor:</span>
              <span>{nomeClasse(parecer.classeProposta)}</span>
            </div>
            <div className="flex items-center justify-between text-[var(--c-6b6a65)]">
              <span>Houve Divergência do Analista:</span>
              <span>
                {parecer.analistaDivergiuDaProposta
                  ? "Sim — Motivo formalmente registrado nos pontos correspondentes"
                  : "Não — Análise integralmente convergente com o motor de regras"}
              </span>
            </div>
            {parecer.motivoDaDivergencia && (
              <p className="text-[var(--c-1a1a18)] pt-1 border-t border-[var(--c-e3e2dd)]">
                <strong>Motivo da divergência:</strong> {parecer.motivoDaDivergencia}
              </p>
            )}
          </div>
        </div>

        {/* 3. Os Cinco Critérios */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-[var(--c-0f5132)] uppercase tracking-wider">
            3. Fundamentação Ponto a Ponto dos Cinco Critérios
          </h2>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((cId) => {
              const pto = parecer.pontos[cId];
              if (!pto) return null;
              const estado = pto.estadoFinal || pto.estadoProposto;
              return (
                <div key={cId} className="border border-[var(--c-e3e2dd)] rounded-md p-3.5 space-y-2 text-xs break-inside-avoid">
                  <div className="flex items-center justify-between border-b border-[var(--c-edece7)] pb-1.5">
                    <span className="font-bold text-[var(--c-1a1a18)]">
                      {cId}. {pto.nomeCriterio}
                    </span>
                    {estado ? (
                      <span className="font-semibold text-[var(--c-0f5132)]">{estado}</span>
                    ) : (
                      <span className="font-semibold text-[var(--c-6b6a65)] border border-dashed border-[var(--c-6b6a65)] rounded px-1.5">
                        LACUNA — sem estado proposto
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-[var(--c-6b6a65)] block">
                      Fundamentação:
                    </span>
                    <p className="text-[var(--c-1a1a18)] leading-relaxed mt-0.5">
                      {pto.porqueFinal || pto.porqueProposto}
                    </p>
                  </div>

                  {pto.citacoesPropostas.length > 0 && (
                    <div className="space-y-2 bg-[var(--c-fbfbf8)] p-2.5 rounded border border-[var(--c-edece7)]">
                      <span className="text-[10px] uppercase font-bold text-[var(--c-6b6a65)] block">
                        Citações Literais de Evidência ({pto.citacoesPropostas.length}):
                      </span>
                      {pto.citacoesPropostas.map((cit) => (
                        <CitacaoLiteral key={cit.id} cit={cit} />
                      ))}
                    </div>
                  )}

                  {pto.normasAplicadas.length > 0 && (
                    <div className="text-[10px] text-[var(--c-6b6a65)]">
                      <strong>Dispositivo Legal:</strong>{" "}
                      {pto.normasAplicadas
                        .map((id) => {
                          const n = obterNormaPorId(id);
                          return n ? `${n.dispositivo} (${id})` : id;
                        })
                        .join("; ")}
                    </div>
                  )}

                  {/* O que a ferramenta propôs × o que o analista fez (§4.1) */}
                  <div className="text-[10px] text-[var(--c-6b6a65)] border-t border-[var(--c-edece7)] pt-1.5 space-y-0.5">
                    <div>
                      <strong>Proposto pela ferramenta:</strong> {pto.estadoProposto || "sem estado (lacuna)"}
                    </div>
                    <div>
                      <strong>Ação do analista:</strong>{" "}
                      {ROTULOS_ACAO[pto.acaoDoAnalista || "PENDENTE"]}
                      {pto.aceiteEmBloco ? " (aceite em bloco)" : ""}
                      {pto.decididoPor ? ` · ${pto.decididoPor} em ${dataHora(pto.decididoEm)}` : ""}
                    </div>
                    {pto.motivoDaMudanca && (
                      <div>
                        <strong>Motivo da mudança:</strong> {pto.motivoDaMudanca}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Campos Condicionais */}
        {(parecer.recorteSustentado ||
          parecer.limitacaoEspecifica ||
          parecer.evidenciaNecessaria ||
          parecer.eloAusente ||
          (parecer.evidenciasASolicitar && parecer.evidenciasASolicitar.length > 0) ||
          parecer.mecanismoDocumentado) && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-[var(--c-0f5132)] uppercase tracking-wider">
              4. Delimitação Condicional da Classe
            </h2>
            <div className="bg-[var(--c-f7f7f4)] p-3.5 rounded-md border border-[var(--c-e3e2dd)] text-xs space-y-1">
              {parecer.recorteSustentado && (
                <p><strong>Recorte Sustentado:</strong> {parecer.recorteSustentado}</p>
              )}
              {parecer.limitacaoEspecifica && (
                <p><strong>Limitação Específica:</strong> {parecer.limitacaoEspecifica}</p>
              )}
              {parecer.evidenciaNecessaria && (
                <p><strong>Evidência Necessária:</strong> {parecer.evidenciaNecessaria}</p>
              )}
              {parecer.eloAusente && (
                <p><strong>Elo Ausente:</strong> {parecer.eloAusente}</p>
              )}
              {parecer.evidenciasASolicitar && parecer.evidenciasASolicitar.length > 0 && (
                <div>
                  <strong>Evidências a Solicitar:</strong>
                  <ul className="list-disc pl-5 mt-0.5">
                    {parecer.evidenciasASolicitar.map((ev, i) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                </div>
              )}
              {parecer.mecanismoDocumentado && (
                <p><strong>Mecanismo Documentado:</strong> {parecer.mecanismoDocumentado}</p>
              )}
            </div>
          </div>
        )}

        {/* 5. Evidências contrárias e contraditórias (regra 9) */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-[var(--c-0f5132)] uppercase tracking-wider">
            5. Evidências Contrárias e Contraditórias
          </h2>
          {parecer.citacoesContrarias.length > 0 ? (
            <div className="space-y-2 bg-[var(--c-fbfbf8)] p-2.5 rounded border border-[var(--c-edece7)] text-xs">
              {parecer.citacoesContrarias.map((cit) => (
                <CitacaoLiteral key={cit.id} cit={cit} mostrarCriterio />
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--c-9a6700)] bg-[var(--c-fef9e7)] p-3 rounded-md border border-[var(--c-f4d089)]">
              Nenhuma evidência contrária foi registrada. Um parecer só com evidência favorável é um parecer fraco: o
              analista deve confirmar que não há trecho contrário no pacote.
            </p>
          )}
        </div>

        {/* 6. Divergências Documentais */}
        {parecer.confrontos.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-[var(--c-0f5132)] uppercase tracking-wider">
              6. Confronto e Resolução de Divergências Documentais
            </h2>
            <div className="space-y-2">
              {parecer.confrontos.map((conf, idx) => (
                <div key={idx} className="bg-[var(--c-fbfbf8)] border border-[var(--c-e3e2dd)] p-3 rounded-md text-xs space-y-1">
                  <span className="font-semibold text-[var(--c-1a1a18)] block">
                    Divergência #{idx + 1} ({conf.campoLogico}):
                  </span>
                  <p className="text-[var(--c-6b6a65)] italic leading-relaxed">
                    {conf.textoFormatado}
                  </p>
                  <p className="text-[10px] text-[var(--c-6b6a65)]">
                    {conf.prevalencia === "NAO_RESOLVIDO"
                      ? "Situação: não resolvida pelo analista (prevalência apenas sugerida pelo motor)"
                      : `Resolvido por ${conf.resolvidoPor || "—"} em ${dataHora(conf.resolvidoEm)}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. Conferência Numérica */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-[var(--c-0f5132)] uppercase tracking-wider">
            7. Conferência Aritmética e Verificação Numérica
          </h2>
          <p className="text-xs text-[var(--c-1a1a18)] bg-[var(--c-f7f7f4)] p-3 rounded-md border border-[var(--c-e3e2dd)]">
            Foram recalculados {caso.leitura.ensaiosConferidos} ensaios numéricos a partir dos registros primários de
            <code> medicoes.csv</code> e confrontados com <code> resultados.csv</code>.{" "}
            {caso.leitura.ensaiosDivergentes.length === 0
              ? "Todos os ensaios bateram com o recálculo."
              : `Não conferidos ou divergentes no recálculo: ${caso.leitura.ensaiosDivergentes.join(", ")}.`}
          </p>
        </div>

        {/* 8. Lacunas */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-[var(--c-0f5132)] uppercase tracking-wider">
            8. Lacunas Identificadas
          </h2>
          {parecer.lacunas.length > 0 ? (
            <ul className="list-disc pl-5 text-xs space-y-0.5">
              {parecer.lacunas.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[var(--c-6b6a65)]">Nenhuma lacuna registrada.</p>
          )}
        </div>

        {/* 9. Anexo: trilha de auditoria */}
        <div className="space-y-2 break-before-page">
          <h2 className="text-xs font-bold text-[var(--c-0f5132)] uppercase tracking-wider">
            9. Anexo — Trilha de Auditoria
          </h2>
          {eventosAuditoria.length > 0 ? (
            <table className="w-full text-[10px] border border-[var(--c-e3e2dd)] divide-y divide-[var(--c-edece7)]">
              <tbody>
                {eventosAuditoria.map((ev, i) => (
                  <tr key={ev.id || i}>
                    <td className="py-1 px-2 whitespace-nowrap text-[var(--c-6b6a65)]">{dataHora(ev.em)}</td>
                    <td className="py-1 px-2 font-semibold">{ev.acao}</td>
                    <td className="py-1 px-2">{ev.ator} ({ev.papel})</td>
                    <td className="py-1 px-2 font-mono text-[var(--c-6b6a65)]">{ev.alvo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-[var(--c-6b6a65)]">Nenhum evento registrado para este caso neste navegador.</p>
          )}
        </div>

        {/* Rodapé Oficial (CLAUDE.md Seção 13) */}
        <div className="pt-6 border-t border-[var(--c-edece7)] text-[10px] text-[var(--c-6b6a65)] flex items-center justify-between">
          <div>
            LASTRO · Análise preliminar · Não substitui parecer técnico definitivo
          </div>
          <div>
            Parecer {parecer.hashConteudo || "não homologado (sem hash)"} · v{parecer.versao} · Corpus {parecer.versaoCorpusNormativo}
          </div>
        </div>
      </div>
    </div>
  );
}

const NOMES_CLASSES: Record<string, string> = {
  ELEGIVEL: "Elegível",
  COM_RESSALVAS: "Com ressalvas",
  NAO_ELEGIVEL: "Não elegível",
  EVIDENCIA_INSUFICIENTE: "Evidência insuficiente",
  CONFLITO: "Conflito de sinais",
  INCOMPLETO: "Incompleto (classe não calculada)"
};

const ROTULOS_ACAO: Record<string, string> = {
  PENDENTE: "pendente (não revisado)",
  CONCORDOU: "concordou",
  AJUSTOU: "ajustou",
  DISCORDOU: "discordou"
};

const ROTULOS_SENTIDO: Record<string, string> = {
  FAVORAVEL: "Favorável",
  CONTRARIA: "Contrária",
  CONTRADITORIA: "Contraditória"
};

function CitacaoLiteral({ cit, mostrarCriterio }: { cit: Citacao; mostrarCriterio?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="font-evidence text-[11px] italic text-[var(--c-1a1a18)]">&ldquo;{cit.trecho}&rdquo;</p>
      <span className="text-[10px] text-[var(--c-6b6a65)] flex flex-wrap items-center gap-1.5">
        {mostrarCriterio && cit.criterioId > 0 && <span>Critério {cit.criterioId} ·</span>}
        <span>
          Fonte: {cit.evidenciaId} · {cit.seletor || "seção"} · {ROTULOS_SENTIDO[cit.sentido] || cit.sentido}
          {cit.origem === "IA" ? " · localizado por IA" : ""}
        </span>
        <SeloForca forca={cit.forcaProbatoria} />
      </span>
    </div>
  );
}
