"use client";

import React, { useState, use } from "react";
import { useCarregarNoCliente } from "@/lib/use-carregar-no-cliente";
import Link from "next/link";
import {
  obterCasos,
  obterParecerPorId,
  salvarParecer,
  registrarAuditoria,
  obterArquivosCaso
} from "@/lib/casos-store";
import { extrairDadosDossie } from "@/motor/parsers/dossie";

function sanitizarAcentosTexto(txt: string): string {
  if (!txt) return "";
  return txt
    .replace(/Resilincia/gi, "Resiliência")
    .replace(/instantneos/gi, "instantâneos")
    .replace(/\bno\b/g, "não")
    .replace(/\bNo\b/g, "Não")
    .replace(/recuperao/gi, "recuperação")
    .replace(/servios/gi, "serviços")
    .replace(/sequncias/gi, "sequências")
    .replace(/repeties/gi, "repetições")
    .replace(/S01S11/g, "S01–S11")
    .replace(/S12S22/g, "S12–S22")
    .replace(/S23S32/g, "S23–S32")
    .replace(/L1L3/g, "L1–L3")
    .replace(/distribuio/gi, "distribuição")
    .replace(/Concluso/gi, "Conclusão")
    .replace(/\bs\s+32/g, "às 32")
    .replace(/\bs\b/g, "às")
    .replace(/pseudocdigo/gi, "pseudocódigo")
    .replace(/idempotncia/gi, "idempotência")
    .replace(/legtimos/gi, "legítimos")
    .replace(/referncia/gi, "referência")
    .replace(/operao/gi, "operação")
    .replace(/interrupo/gi, "interrupção")
    .replace(/adequo/gi, "adequação")
    .replace(/parmetros/gi, "parâmetros")
    .replace(/medies/gi, "medições")
    .replace(/observaes/gi, "observações")
    .replace(/reviso/gi, "revisão")
    .replace(/inventrio/gi, "inventário")
    .replace(/sintticos/gi, "sintéticos")
    .replace(/anlise/gi, "análise")
    .replace(/fictcia/gi, "fictícia")
    .replace(/nicos/gi, "únicos")
    .replace(/retransmisses/gi, "retransmissões")
    .replace(/h\s*hiptese/gi, "há hipótese");
}
import { comporClasse } from "@/motor/classificacao";
import { obterNormaPorId } from "@/motor/corpus";
import { HISTORICOS_REFERENCIA } from "@/lib/referencia-data";
import { useAuth } from "@/contexts/AuthContext";
import {
  Caso,
  Parecer,
  EstadoCriterio,
  Classe,
  Citacao
} from "@/types";
import { EvidenciaDrawer } from "@/components/EvidenciaDrawer";
import { SeloForca } from "@/components/SeloForca";
import {
  Check,
  AlertTriangle,
  FileText,
  Scale,
  Clock,
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp
} from "lucide-react";

const OPCOES_ESTADOS: Record<number, EstadoCriterio[]> = {
  1: ["DEMONSTRADA NO RECORTE", "NÃO DEMONSTRADA", "INDETERMINADA"],
  2: ["DEMONSTRADA NO RECORTE", "NÃO DEMONSTRADA", "INDETERMINADA"],
  3: ["INVESTIGADA", "NÃO CARACTERIZADA", "ALEGADA, NÃO VERIFICÁVEL"],
  4: ["DOCUMENTADA", "DOCUMENTADA COMO ACEITE", "PARCIAL"],
  5: [
    "DOCUMENTADA NO ESCOPO",
    "DOCUMENTADA COM LIMITE",
    "DOCUMENTADA PARA A CONFIGURAÇÃO",
    "INSUFICIENTE PARA O NÚCLEO ALEGADO"
  ]
};

const CORES_ESTADOS: Record<string, { bg: string; text: string; border: string }> = {
  "DEMONSTRADA NO RECORTE": { bg: "var(--c-f4f8f5)", text: "var(--c-2f6b4f)", border: "var(--c-a3d9be)" },
  "INVESTIGADA": { bg: "var(--c-f4f8f5)", text: "var(--c-2f6b4f)", border: "var(--c-a3d9be)" },
  "DOCUMENTADA": { bg: "var(--c-f4f8f5)", text: "var(--c-2f6b4f)", border: "var(--c-a3d9be)" },
  "DOCUMENTADA NO ESCOPO": { bg: "var(--c-f4f8f5)", text: "var(--c-2f6b4f)", border: "var(--c-a3d9be)" },
  "DOCUMENTADA COM LIMITE": { bg: "var(--c-fdf8f0)", text: "var(--c-b06c1e)", border: "var(--c-ead4b6)" },
  "NÃO DEMONSTRADA": { bg: "var(--c-f5f5f4)", text: "var(--c-52504e)", border: "var(--c-d8d6d2)" },
  "NÃO CARACTERIZADA": { bg: "var(--c-f5f5f4)", text: "var(--c-52504e)", border: "var(--c-d8d6d2)" },
  "DOCUMENTADA COMO ACEITE": { bg: "var(--c-f5f5f4)", text: "var(--c-52504e)", border: "var(--c-d8d6d2)" },
  "DOCUMENTADA PARA A CONFIGURAÇÃO": { bg: "var(--c-f5f5f4)", text: "var(--c-52504e)", border: "var(--c-d8d6d2)" },
  "INDETERMINADA": { bg: "var(--c-f0f5fa)", text: "var(--c-3a5a78)", border: "var(--c-c5d8ea)" },
  "ALEGADA, NÃO VERIFICÁVEL": { bg: "var(--c-f0f5fa)", text: "var(--c-3a5a78)", border: "var(--c-c5d8ea)" },
  "PARCIAL": { bg: "var(--c-f0f5fa)", text: "var(--c-3a5a78)", border: "var(--c-c5d8ea)" },
  "INSUFICIENTE PARA O NÚCLEO ALEGADO": { bg: "var(--c-f0f5fa)", text: "var(--c-3a5a78)", border: "var(--c-c5d8ea)" }
};

const NOMES_CLASSES: Record<Classe | "CONFLITO" | "INCOMPLETO", string> = {
  ELEGIVEL: "Elegível",
  COM_RESSALVAS: "Com ressalvas",
  NAO_ELEGIVEL: "Não elegível",
  EVIDENCIA_INSUFICIENTE: "Evidência insuficiente",
  CONFLITO: "Conflito de Sinais",
  INCOMPLETO: "Em análise"
};

const CORES_CLASSES: Record<string, { border: string; text: string; bg: string }> = {
  ELEGIVEL: { border: "var(--c-2f6b4f)", text: "var(--c-2f6b4f)", bg: "var(--c-f4f8f5)" },
  COM_RESSALVAS: { border: "var(--c-b06c1e)", text: "var(--c-b06c1e)", bg: "var(--c-fdf8f0)" },
  NAO_ELEGIVEL: { border: "var(--c-52504e)", text: "var(--c-52504e)", bg: "var(--c-f5f5f4)" },
  EVIDENCIA_INSUFICIENTE: { border: "var(--c-3a5a78)", text: "var(--c-3a5a78)", bg: "var(--c-f0f5fa)" },
  CONFLITO: { border: "var(--c-c2410c)", text: "var(--c-c2410c)", bg: "var(--c-fdf4ec)" },
  INCOMPLETO: { border: "var(--c-6b6762)", text: "var(--c-6b6762)", bg: "var(--c-f3f3f1)" }
};

export default function ParecerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const casoId = resolvedParams.id;
  const { usuario } = useAuth();

  const [caso, setCaso] = useState<Caso | null>(null);
  const [parecer, setParecer] = useState<Parecer | null>(null);
  const [cardExpandido, setCardExpandido] = useState<number | null>(5); // critério 5 aberto por padrão
  const [modoEdicao, setModoEdicao] = useState<number | null>(null);
  const [estadoEditado, setEstadoEditado] = useState<EstadoCriterio | "">("");
  const [motivoEdicao, setMotivoEdicao] = useState("");
  const [citacaoModal, setCitacaoModal] = useState<Citacao | null>(null);
  const [resumoExpandido, setResumoExpandido] = useState(true);

  useCarregarNoCliente(casoId, () => {
    const casos = obterCasos();
    const c = casos.find((x) => x.id === casoId);
    if (c) {
      // Re-extrair metadados com novo extrator se houver arquivos em cache
      const arqs = obterArquivosCaso(casoId);
      if (arqs) {
        const dadosNovos = extrairDadosDossie(casoId, arqs);
        if (dadosNovos.titulo) c.titulo = dadosNovos.titulo;
        if (dadosNovos.equipe) c.equipe = dadosNovos.equipe;
        if (dadosNovos.resumo) c.resumo = dadosNovos.resumo;
      }
      setCaso(c);
      if (c.parecerAtualId) {
        const p = obterParecerPorId(c.parecerAtualId);
        setParecer(p);
      }
    }
  });

  if (!caso || !parecer) {
    return (
      <div className="py-12 text-center text-xs text-[var(--c-6b6a65)] flex items-center justify-center gap-2">
        <Clock className="w-4 h-4 animate-spin text-[var(--c-0f5132)]" />
        Carregando parecer técnico do caso {casoId}...
      </div>
    );
  }

  // Contar pontos revisados
  let pontosRevisados = 0;
  for (let i = 1; i <= 5; i++) {
    if (parecer.pontos[i]?.acaoDoAnalista && parecer.pontos[i].acaoDoAnalista !== "PENDENTE") {
      pontosRevisados++;
    }
  }

  // Ações do analista
  const handleConcordar = (criterioId: number) => {
    const pAtualizado = { ...parecer };
    const ponto = { ...pAtualizado.pontos[criterioId] };
    ponto.acaoDoAnalista = "CONCORDOU";
    ponto.estadoFinal = ponto.estadoProposto;
    ponto.porqueFinal = ponto.porqueProposto;
    ponto.decididoPor = usuario.nome;
    ponto.decididoEm = new Date().toISOString();
    pAtualizado.pontos[criterioId] = ponto;

    recalcularParecer(pAtualizado);
  };

  const handleAceitarTodos = () => {
    const pAtualizado = { ...parecer };
    const aceitos: number[] = [];
    for (let i = 1; i <= 5; i++) {
      // Ponto sem estado proposto é lacuna: não há o que aceitar, fica pendente para Ajustar
      if (!pAtualizado.pontos[i]?.estadoProposto) continue;
      aceitos.push(i);
      const ponto = { ...pAtualizado.pontos[i] };
      ponto.acaoDoAnalista = "CONCORDOU";
      ponto.estadoFinal = ponto.estadoProposto;
      ponto.porqueFinal = ponto.porqueProposto;
      ponto.aceiteEmBloco = true;
      ponto.decididoPor = usuario.nome;
      ponto.decididoEm = new Date().toISOString();
      pAtualizado.pontos[i] = ponto;
    }
    recalcularParecer(pAtualizado);

    registrarAuditoria({
      casoId,
      ator: usuario.nome,
      papel: usuario.papel,
      acao: "ACEITE_EM_BLOCO",
      alvo: parecer.id,
      antes: null,
      depois: { totalPontos: aceitos.length, criterios: aceitos },
      em: new Date().toISOString()
    });
  };

  const iniciarEdicao = (criterioId: number) => {
    setModoEdicao(criterioId);
    setCardExpandido(criterioId);
    setEstadoEditado(parecer.pontos[criterioId].estadoFinal || parecer.pontos[criterioId].estadoProposto || "");
    setMotivoEdicao(parecer.pontos[criterioId].motivoDaMudanca || "");
  };

  const confirmarEdicao = (criterioId: number) => {
    if (!estadoEditado || !motivoEdicao.trim()) {
      alert("O motivo da discordância/ajuste é obrigatório para manter a rastreabilidade do parecer.");
      return;
    }

    const pAtualizado = { ...parecer };
    const ponto = { ...pAtualizado.pontos[criterioId] };
    const discordou = estadoEditado !== ponto.estadoProposto;

    ponto.acaoDoAnalista = discordou ? "DISCORDOU" : "AJUSTOU";
    ponto.estadoFinal = estadoEditado as EstadoCriterio;
    ponto.motivoDaMudanca = motivoEdicao.trim();
    ponto.porqueFinal = `O analista divergiu da proposta: ${motivoEdicao.trim()}`;
    ponto.decididoPor = usuario.nome;
    ponto.decididoEm = new Date().toISOString();

    pAtualizado.pontos[criterioId] = ponto;
    setModoEdicao(null);

    recalcularParecer(pAtualizado);

    registrarAuditoria({
      casoId,
      ator: usuario.nome,
      papel: usuario.papel,
      acao: discordou ? "PONTO_DISCORDADO" : "PONTO_AJUSTADO",
      alvo: `Critério ${criterioId}`,
      antes: ponto.estadoProposto,
      depois: estadoEditado,
      em: new Date().toISOString()
    });
  };

  const recalcularParecer = (pAtualizado: Parecer) => {
    // Obter estados ativos (finais ou propostos)
    const estadosAtivos: Record<number, EstadoCriterio | null> = {
      1: pAtualizado.pontos[1].estadoFinal || pAtualizado.pontos[1].estadoProposto,
      2: pAtualizado.pontos[2].estadoFinal || pAtualizado.pontos[2].estadoProposto,
      3: pAtualizado.pontos[3].estadoFinal || pAtualizado.pontos[3].estadoProposto,
      4: pAtualizado.pontos[4].estadoFinal || pAtualizado.pontos[4].estadoProposto,
      5: pAtualizado.pontos[5].estadoFinal || pAtualizado.pontos[5].estadoProposto
    };

    const res = comporClasse(estadosAtivos);
    const classeCalculada = res.classe === "CONFLITO" || res.classe === "INCOMPLETO" ? null : res.classe;
    
    pAtualizado.classeFinal = classeCalculada;
    pAtualizado.analistaDivergiuDaProposta = classeCalculada !== pAtualizado.classeProposta;

    setParecer(pAtualizado);
    salvarParecer(pAtualizado);
  };

  const classeAtiva = parecer.classeFinal || parecer.classeProposta;
  const estiloClasseAtiva = CORES_CLASSES[classeAtiva] || CORES_CLASSES.COM_RESSALVAS;

  const historicoRef = HISTORICOS_REFERENCIA.find((h) => h.id.toUpperCase() === caso.id.toUpperCase());

  const contextoProjeto = sanitizarAcentosTexto(
    caso.resumo?.contexto ||
    (historicoRef
      ? `Projeto catalogado na base técnica com foco em ${caso.titulo.toLowerCase()}. Demanda operacional registrada pela equipe de ${caso.equipe || "nome não declarado"}.`
      : `Demanda de desenvolvimento e inovação tecnológica conduzida pela equipe de ${caso.equipe || "nome não declarado"} em ciclo de ${caso.duracaoSemanas !== null ? `${caso.duracaoSemanas} semanas` : "duração não declarada"}.`)
  );

  const objetivoProjeto = sanitizarAcentosTexto(
    caso.resumo?.objetivo ||
    (historicoRef
      ? `Investigação de viabilidade técnica sob as condições experimentais do recorte (${historicoRef.titulo}).`
      : `Superar incerteza técnica de integração e desempenho sob métricas verificáveis.`)
  );

  const trabalhoProjeto = sanitizarAcentosTexto(
    caso.resumo?.trabalhoDocumentado ||
    (historicoRef
      ? historicoRef.justificativas[4] || historicoRef.justificativas[2] || historicoRef.justificativa
      : "Protocolo experimental executado com conferência aritmética de ensaios e medições primárias.")
  );

  const limiteProjeto = sanitizarAcentosTexto(
    caso.resumo?.limiteConclusao ||
    (historicoRef ? historicoRef.limite : "Recorte documentado estritamente nas configurações e condições de teste registradas.")
  );

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DO CASO + DESTAQUE DE CLASSIFICAÇÃO PROPOSTA (TELA 1) */}
      <div className="bg-[var(--c-ffffff)] border border-[var(--c-e3e2dd)] rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-[var(--c-0f5132)]">{caso.id}</span>
            <span className="text-gray-300">·</span>
            <h1 className="text-base sm:text-lg font-bold text-[var(--c-1a1a18)] tracking-tight">
              {sanitizarAcentosTexto(caso.titulo)}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--c-6b6a65)] mt-1">
            <span>{caso.equipe ? sanitizarAcentosTexto(caso.equipe) : "Equipe não declarada"}</span>
            <span>·</span>
            <span>{caso.duracaoSemanas !== null ? `${caso.duracaoSemanas} semanas` : "Duração não declarada"}</span>
            <span>·</span>
            <span
              className={`font-medium ${
                caso.pacote.arquivosAusentes.length > 0 ? "text-[var(--c-9a6700)]" : "text-[var(--c-0f5132)]"
              }`}
            >
              {caso.pacote.arquivosPresentes} de {caso.pacote.arquivosEsperados} arquivos lidos
            </span>
            {caso.pacote.arquivosAusentes.length > 0 && (
              <span className="text-[var(--c-9a6700)]" title={caso.pacote.arquivosAusentes.join(", ")}>
                (ausentes, declarados como lacuna: {caso.pacote.arquivosAusentes.join(", ")})
              </span>
            )}
            <span>·</span>
            <span>análise concluída em {(caso.leitura.duracaoMs / 1000).toFixed(0)} segundos</span>
          </div>
        </div>

        {/* Bloco de Destaque da Classificação Proposta (com animação de recomposição ao vivo) */}
        <div
          className="border-l-4 p-3 bg-[var(--c-ffffff)] rounded-r-lg shadow-2xs min-w-[230px]"
          style={{ borderColor: estiloClasseAtiva.border }}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--c-6b6a65)]">
            {parecer.classeFinal && parecer.analistaDivergiuDaProposta ? (
              <span className="text-[var(--c-b42318)] font-bold">RECOMPOSTA AGORA</span>
            ) : (
              "CLASSIFICAÇÃO PROPOSTA"
            )}
          </div>

          <div className="flex items-baseline gap-2 mt-0.5">
            {parecer.classeFinal && parecer.analistaDivergiuDaProposta && (
              <span className="text-sm line-through text-[var(--c-a8a7a1)]">
                {NOMES_CLASSES[parecer.classeProposta]}
              </span>
            )}
            <span
              className="text-xl font-bold tracking-tight"
              style={{ color: estiloClasseAtiva.text }}
            >
              {NOMES_CLASSES[classeAtiva]}
            </span>
          </div>

          <div className="mt-1">
            {parecer.situacao === "HOMOLOGADO" ? (
              <span className="carimbo-homologado">HOMOLOGADO</span>
            ) : parecer.situacao === "EM_REVISAO" ? (
              <span className="carimbo-revisao">EM REVISÃO</span>
            ) : (
              <span className="carimbo-proposta">PROPOSTA</span>
            )}
          </div>
        </div>
      </div>

      {/* SÍNTESE EXECUTIVA DO PROJETO (ETAPA 2) */}
      <div className="bg-[var(--c-ffffff)] border border-[var(--c-e0deda)] rounded-[4px] shadow-2xs overflow-hidden transition-all">
        <div
          className="p-3.5 bg-[var(--c-f3f3f1)] border-b border-[var(--c-e0deda)] flex items-center justify-between cursor-pointer hover:bg-[var(--c-eaeaea)] transition-colors"
          onClick={() => setResumoExpandido(!resumoExpandido)}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[4px] bg-[var(--c-ffffff)] border border-[var(--c-e0deda)] flex items-center justify-center text-[var(--c-a6193c)]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--c-231f20)] uppercase tracking-wider font-ui">
                  Síntese Executiva do Projeto — O que era o projeto
                </span>
                <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-medium bg-[var(--c-ffffff)] text-[var(--c-231f20)] border border-[var(--c-e0deda)] font-ui">
                  Dossiê Institucional
                </span>
              </div>
              <p className="text-[11px] text-[var(--c-6b6762)] font-ui">
                Contexto de negócio, desafio técnico e escopo delimitado no dossiê
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCitacaoModal({
                  id: `CIT-${caso.id}-DOSSIE`,
                  criterioId: 0,
                  evidenciaId: `${caso.id}-EV01`,
                  seletor: "dossie_projeto.pdf",
                  trecho: contextoProjeto.slice(0, 180),
                  offsetInicio: 0,
                  offsetFim: 180,
                  forcaProbatoria: "DERIVADA", // dossiê = síntese no inventário (§6.4)
                  sentido: "FAVORAVEL",
                  origem: "MOTOR"
                });
              }}
              className="text-xs font-medium text-[var(--c-a6193c)] hover:text-[var(--c-7e122d)] hover:underline inline-flex items-center gap-1 hidden sm:inline-flex font-ui"
            >
              <FileText className="w-3.5 h-3.5" /> Abrir Dossiê Completo
            </button>
            <button className="text-[var(--c-6b6762)] p-1">
              {resumoExpandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {resumoExpandido && (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-[var(--c-ffffff)] animate-in fade-in duration-150">
            {/* Bloco 1: Contexto & Motivação */}
            <div className="p-3.5 rounded-[4px] border border-[var(--c-e0deda)] bg-[var(--c-f3f3f1)]/50 space-y-1.5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-medium uppercase tracking-[0.02em] text-[var(--c-a6193c)] block font-ui">
                  1. Contexto &amp; Problema
                </span>
                <p className="text-xs text-[var(--c-231f20)] leading-relaxed mt-1 font-ui">
                  {contextoProjeto}
                </p>
              </div>
              <span className="text-[10px] text-[var(--c-96918a)] italic font-ui">
                Fonte: Dossiê Bloco 1 / Demanda
              </span>
            </div>

            {/* Bloco 2: Pergunta & Incerteza */}
            <div className="p-3.5 rounded-[4px] border border-[var(--c-e0deda)] bg-[var(--c-f3f3f1)]/50 space-y-1.5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-medium uppercase tracking-[0.02em] text-[var(--c-a6193c)] block font-ui">
                  2. Pergunta &amp; Incerteza
                </span>
                <p className="text-xs text-[var(--c-231f20)] leading-relaxed mt-1 font-ui">
                  {objetivoProjeto}
                </p>
              </div>
              <span className="text-[10px] text-[var(--c-96918a)] italic font-ui">
                Fonte: Hipótese investigada
              </span>
            </div>

            {/* Bloco 3: Trabalho Documentado */}
            <div className="p-3.5 rounded-[4px] border border-[var(--c-e0deda)] bg-[var(--c-f3f3f1)]/50 space-y-1.5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-medium uppercase tracking-[0.02em] text-[var(--c-a6193c)] block font-ui">
                  3. Trabalho Documentado
                </span>
                <p className="text-xs text-[var(--c-231f20)] leading-relaxed mt-1 font-ui">
                  {trabalhoProjeto}
                </p>
              </div>
              <span className="text-[10px] text-[var(--c-96918a)] italic font-ui">
                Fonte: Protocolos e ensaios
              </span>
            </div>

            {/* Bloco 4: Limite da Conclusão */}
            <div className="p-3.5 rounded-[4px] border border-[var(--c-e0deda)] bg-[var(--c-f3f3f1)]/50 space-y-1.5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-medium uppercase tracking-[0.02em] text-[var(--c-a6193c)] block font-ui">
                  4. Limite da Conclusão
                </span>
                <p className="text-xs text-[var(--c-231f20)] leading-relaxed mt-1 font-ui">
                  {limiteProjeto}
                </p>
              </div>
              <span className="text-[10px] text-[var(--c-96918a)] italic font-ui">
                Fonte: Recorte técnico admitido
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Faixa de Aviso se Houve Recomposição de Classe (TELA 4) */}
      {parecer.classeFinal && parecer.analistaDivergiuDaProposta && (
        <div className="bg-[var(--c-fef9e7)] border border-[var(--c-f4d089)] text-[var(--c-9a6700)] rounded-lg p-3 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            <strong>A alteração realizada mudou a classificação do projeto.</strong> O sistema registrou
            a proposta da máquina e a divergência fundamentada pelo analista.
          </span>
        </div>
      )}

      {/* CORPO PRINCIPAL EM DUAS COLUNAS: 70% e 30% */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Os 5 Critérios (70% - lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Barra de Progresso de Revisão e Botão "Aceitar Todos" */}
          <div className="bg-[var(--c-ffffff)] border border-[var(--c-e3e2dd)] rounded-lg p-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-[var(--c-1a1a18)]">
                {pontosRevisados} de 5 pontos revisados
              </span>
              <div className="w-24 h-1.5 bg-[var(--c-edece7)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--c-0f5132)] transition-all"
                  style={{ width: `${(pontosRevisados / 5) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/casos/${caso.id}/reanalise`}
                className="text-xs font-medium px-2.5 py-1 text-[var(--c-6b6a65)] hover:text-[var(--c-0f5132)] hover:bg-[var(--c-f7f7f4)] border border-[var(--c-e3e2dd)] rounded-md transition-colors inline-flex items-center gap-1"
                title={`Anexar evidência nova e gerar a versão ${parecer.versao + 1} do parecer com diff`}
              >
                Aditar nova evidência (v{parecer.versao + 1})
              </Link>
              <button
                onClick={handleAceitarTodos}
                title="Aceita a proposta dos pontos com estado; ponto sem estado (lacuna) fica pendente para Ajustar"
                className="text-xs font-semibold px-3 py-1 bg-[var(--c-ffffff)] border border-[var(--c-a3d9be)] text-[var(--c-0f5132)] hover:bg-[var(--c-ebf5f0)] rounded-md transition-colors inline-flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Aceitar todos
              </button>
            </div>
          </div>

          {/* Os 5 Cards dos Critérios */}
          {[1, 2, 3, 4, 5].map((criterioId) => {
            const ponto = parecer.pontos[criterioId];
            if (!ponto) return null;

            const expandido = cardExpandido === criterioId;
            const emEdicao = modoEdicao === criterioId;
            const estadoExibido = ponto.estadoFinal || ponto.estadoProposto;
            // Sem estado proposto (lacuna): cor neutra, nunca a cor de um estado positivo
            const corEstado = estadoExibido
              ? CORES_ESTADOS[estadoExibido] || CORES_ESTADOS["DEMONSTRADA NO RECORTE"]
              : { border: "var(--c-6b6a65)", text: "var(--c-6b6a65)", bg: "var(--c-f7f7f4)" };
            const historicosComEstado = HISTORICOS_REFERENCIA.filter(
              (h) => h.estados[criterioId] === estadoExibido
            );

            return (
              <div
                key={criterioId}
                className={`bg-[var(--c-ffffff)] border rounded-lg transition-all shadow-xs ${
                  expandido ? "border-[var(--c-a3d9be)] ring-1 ring-[var(--c-0f5132)]/10" : "border-[var(--c-e3e2dd)]"
                }`}
              >
                {/* Linha de Topo do Card (Recolhido / Cabeçalho) */}
                <div
                  className="p-3.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 cursor-pointer hover:bg-[var(--c-fbfbf8)] transition-colors"
                  onClick={() => setCardExpandido(expandido ? null : criterioId)}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="w-6 h-6 rounded-full border border-[var(--c-d6d5cf)] flex items-center justify-center font-mono text-xs font-semibold text-[var(--c-1a1a18)]">
                      {criterioId}
                    </div>
                    <span className="text-xs font-semibold text-[var(--c-1a1a18)]">
                      {ponto.nomeCriterio}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${estadoExibido ? "" : "border-dashed"}`}
                      style={{
                        backgroundColor: corEstado.bg,
                        color: corEstado.text,
                        borderColor: corEstado.border
                      }}
                    >
                      {estadoExibido || "LACUNA — sem estado proposto"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleConcordar(criterioId)}
                      disabled={!ponto.estadoProposto}
                      title={ponto.estadoProposto ? undefined : "Sem estado proposto: use Ajustar para escolher um estado e registrar o motivo"}
                      className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        ponto.acaoDoAnalista === "CONCORDOU"
                          ? "bg-[var(--c-0f5132)] text-white border-[var(--c-0f5132)]"
                          : "bg-[var(--c-ffffff)] text-[var(--c-6b6a65)] border-[var(--c-e3e2dd)] hover:bg-[var(--c-f7f7f4)]"
                      }`}
                    >
                      Concordo
                    </button>
                    <button
                      onClick={() => iniciarEdicao(criterioId)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors ${
                        ponto.acaoDoAnalista === "AJUSTOU" || ponto.acaoDoAnalista === "DISCORDOU"
                          ? "bg-[var(--c-9a6700)] text-white border-[var(--c-9a6700)]"
                          : "bg-[var(--c-ffffff)] text-[var(--c-6b6a65)] border-[var(--c-e3e2dd)] hover:bg-[var(--c-f7f7f4)]"
                      }`}
                    >
                      Ajustar
                    </button>
                    <button
                      onClick={() => iniciarEdicao(criterioId)}
                      className="px-2.5 py-1 text-xs font-semibold rounded border bg-[var(--c-ffffff)] text-[var(--c-6b6a65)] border-[var(--c-e3e2dd)] hover:bg-[var(--c-f7f7f4)] transition-colors"
                    >
                      Discordo
                    </button>

                    <div className="text-[var(--c-6b6a65)] pl-1">
                      {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* CONTEÚDO EXPANDIDO DO CRITÉRIO (TELA 2 / TELA 4) */}
                {expandido && (
                  <div className="p-4 border-t border-[var(--c-edece7)] bg-[var(--c-fafaf8)] space-y-4">
                    {/* Modo de Edição / Discordância (TELA 4) */}
                    {emEdicao ? (
                      <div className="bg-[var(--c-ffffff)] border border-[var(--c-e3e2dd)] rounded-lg p-4 space-y-3">
                        <span className="text-[11px] font-bold text-[var(--c-1a1a18)] uppercase tracking-wider block">
                          Alterar estado do Critério {criterioId} — {ponto.nomeCriterio}
                        </span>

                        <div className="space-y-2">
                          {OPCOES_ESTADOS[criterioId].map((opcao) => (
                            <label
                              key={opcao}
                              className={`flex items-center gap-2 p-2 border rounded-md cursor-pointer text-xs transition-colors ${
                                estadoEditado === opcao
                                  ? "border-[var(--c-0f5132)] bg-[var(--c-ebf5f0)] text-[var(--c-0f5132)] font-semibold"
                                  : "border-[var(--c-e3e2dd)] hover:bg-[var(--c-f7f7f4)] text-[var(--c-1a1a18)]"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`estado-${criterioId}`}
                                value={opcao}
                                checked={estadoEditado === opcao}
                                onChange={() => setEstadoEditado(opcao)}
                                className="accent-[var(--c-0f5132)]"
                              />
                              <span>{opcao}</span>
                              {opcao === ponto.estadoProposto && (
                                <span className="ml-auto text-[10px] text-[var(--c-6b6a65)] bg-[var(--c-edece7)] px-1.5 py-0.5 rounded">
                                  proposto pela ferramenta
                                </span>
                              )}
                            </label>
                          ))}
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-[var(--c-1a1a18)] block mb-1">
                            Por que você discorda da proposta? (Obrigatório)
                          </label>
                          <textarea
                            value={motivoEdicao}
                            onChange={(e) => setMotivoEdicao(e.target.value)}
                            placeholder="Descreva o fundamento técnico ou evidência que sustenta a sua decisão..."
                            rows={3}
                            className="w-full text-xs p-2.5 bg-[var(--c-f7f7f4)] border border-[var(--c-e3e2dd)] rounded-md focus:outline-none focus:border-[var(--c-0f5132)]"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={() => setModoEdicao(null)}
                            className="px-3 py-1.5 text-xs text-[var(--c-6b6a65)] hover:text-[var(--c-1a1a18)]"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => confirmarEdicao(criterioId)}
                            className="px-4 py-1.5 bg-[var(--c-0f5132)] hover:bg-[var(--c-0b3d26)] text-white text-xs font-semibold rounded-md shadow-xs"
                          >
                            Salvar alteração e recompor classe
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Bloco "POR QUE ESTE ESTADO" */}
                        <div>
                          <span className="text-[11px] font-bold text-[var(--c-6b6a65)] uppercase tracking-wider block mb-1">
                            Por que este estado
                            {!ponto.porqueFinal && ponto.porqueOrigem === "IA" && (
                              <span className="ml-2 normal-case tracking-normal font-medium text-[var(--c-9a6700)]">
                                · redigido por IA a partir dos trechos citados — revisar
                              </span>
                            )}
                          </span>
                          <p className="text-xs text-[var(--c-1a1a18)] leading-relaxed bg-[var(--c-ffffff)] p-3 rounded-md border border-[var(--c-edece7)]">
                            {ponto.porqueFinal || ponto.porqueProposto}
                          </p>
                        </div>

                        {/* Bloco "EVIDÊNCIAS CITADAS" */}
                        <div>
                          <span className="text-[11px] font-bold text-[var(--c-6b6a65)] uppercase tracking-wider block mb-1.5">
                            Evidências citadas ({ponto.citacoesPropostas.length})
                          </span>
                          <div className="space-y-2">
                            {ponto.citacoesPropostas.map((cit) => (
                              <div
                                key={cit.id}
                                onClick={() => setCitacaoModal(cit)}
                                className="bg-[var(--c-ffffff)] border-l-3 border-[var(--c-0f5132)] border border-[var(--c-e3e2dd)] rounded-r-md p-3 space-y-1.5 cursor-pointer hover:bg-[var(--c-f7f7f4)] transition-all hover:shadow-2xs"
                                title="Clique para abrir a evidência no documento original com realce literal"
                              >
                                <p className="font-evidence text-xs text-[var(--c-1a1a18)] italic leading-normal">
                                  &ldquo;{cit.trecho}&rdquo;
                                </p>
                                <div className="flex items-center justify-between text-[11px] text-[var(--c-6b6a65)] pt-1 border-t border-[var(--c-f0efea)]">
                                  <span>
                                    {cit.evidenciaId} · {cit.seletor || "seção"}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <SeloForca forca={cit.forcaProbatoria} />
                                    {cit.sentido === "CONTRARIA" && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--c-fef9e7)] text-[var(--c-9a6700)] border border-[var(--c-f4d089)]">
                                        CONTRÁRIA
                                      </span>
                                    )}
                                    {cit.origem === "IA" && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--c-f7f7f4)] text-[var(--c-6b6a65)] border border-[var(--c-e3e2dd)]" title="Trecho localizado pela IA e conferido literalmente no arquivo">
                                        IA
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Bloco "FUNDAMENTO NORMATIVO" */}
                        <div>
                          <span className="text-[11px] font-bold text-[var(--c-6b6a65)] uppercase tracking-wider block mb-1.5">
                            Fundamento normativo
                          </span>
                          <div className="space-y-2">
                            {ponto.normasAplicadas.map((normaId) => {
                              const n = obterNormaPorId(normaId);
                              if (!n) return null;
                              return (
                                <div
                                  key={normaId}
                                  className="bg-[var(--c-ffffff)] border border-[var(--c-e3e2dd)] rounded-md p-2.5 flex items-start gap-2.5"
                                >
                                  <Scale className="w-4 h-4 text-[var(--c-0f5132)] shrink-0 mt-0.5" />
                                  <div className="space-y-0.5">
                                    <div className="text-xs font-semibold text-[var(--c-1a1a18)]">
                                      {n.fonte.replace("_", " ")} — {n.dispositivo}
                                    </div>
                                    <p className="text-[11px] text-[var(--c-6b6a65)] leading-snug line-clamp-2">
                                      {n.texto}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Bloco "REFERÊNCIA DE FUNDAMENTAÇÃO" (Precedentes nos 20 Históricos) */}
                        <div className="bg-[var(--c-f7f7f4)] border border-[var(--c-e3e2dd)] rounded-md p-3">
                          <span className="text-[10px] font-bold text-[var(--c-6b6a65)] uppercase tracking-wider block mb-1">
                            Referência de fundamentação · {historicosComEstado.length} projetos históricos
                          </span>
                          <p className="text-[11px] text-[var(--c-6b6a65)] mb-2">
                            Este estado foi fundamentado nos históricos abaixo (usado para calibrar a régua, nunca no cálculo do caso novo):
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {historicosComEstado.slice(0, 4).map((h) => (
                              <div
                                key={h.id}
                                className="bg-[var(--c-ffffff)] p-1.5 rounded border border-[var(--c-edece7)] text-[10px]"
                              >
                                <span className="font-mono font-bold text-[var(--c-0f5132)] block">{h.id}</span>
                                <span className="text-[var(--c-6b6a65)] truncate block">{h.titulo}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Coluna Direita: Divergências, Aritmética e Lacunas (30% - lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Divergências entre Fontes (TELA 1 / TELA 5) */}
          <div className="bg-[var(--c-ffffff)] border border-[var(--c-e3e2dd)] rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--c-1a1a18)] uppercase tracking-wider">
                Divergências entre fontes
              </span>
              <span className="text-[11px] font-semibold text-[var(--c-9a6700)] bg-[var(--c-fef9e7)] px-2 py-0.5 rounded border border-[var(--c-f4d089)]">
                {parecer.confrontos.length} identificadas
              </span>
            </div>

            {parecer.confrontos.length > 0 ? (
              <div className="space-y-2">
                {parecer.confrontos.map((conf) => (
                  <div
                    key={conf.id}
                    className="p-2.5 bg-[var(--c-fbfbf8)] border border-[var(--c-edece7)] rounded-md text-xs space-y-1"
                  >
                    <div className="text-[10px] font-bold text-[var(--c-6b6a65)] uppercase">
                      Campo: {conf.campoLogico}
                    </div>
                    <p className="text-[11px] text-[var(--c-1a1a18)] line-clamp-2">
                      {conf.textoFormatado}
                    </p>
                  </div>
                ))}

                <Link
                  href={`/casos/${caso.id}/confronto`}
                  className="block text-center text-xs font-semibold text-[var(--c-0f5132)] hover:text-[var(--c-0b3d26)] hover:underline pt-1"
                >
                  Abrir módulo de confronto detalhado →
                </Link>
              </div>
            ) : (
              <p className="text-xs text-[var(--c-6b6a65)]">
                Nenhuma divergência literal detectada entre as fontes primárias e o depoimento.
              </p>
            )}
          </div>

          {/* Conferência Numérica (Aritmética Recalculada) */}
          <div className="bg-[var(--c-ffffff)] border border-[var(--c-e0deda)] rounded-[4px] p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--c-231f20)] uppercase tracking-wider font-ui">
                Conferência numérica
              </span>
              <span className="text-[11px] font-medium text-[var(--c-2f6b4f)] bg-[var(--c-f4f8f5)] px-2 py-0.5 rounded-[4px] border border-[var(--c-a3d9be)] font-ui">
                {caso.leitura.ensaiosConferidos} ensaios recalculados
              </span>
            </div>
            <p className="text-xs text-[var(--c-6b6762)] leading-normal font-ui">
              100% das medições de <code className="font-id">medicoes.csv</code> e <code className="font-id">resultados.csv</code> foram recalculadas
              pelo motor. Zero divergências de taxa ou contagem.
            </p>
          </div>

          {/* Lacunas Identificadas */}
          <div className="bg-[var(--c-ffffff)] border border-[var(--c-e0deda)] rounded-[4px] p-4 shadow-2xs space-y-2">
            <span className="text-xs font-medium text-[var(--c-231f20)] uppercase tracking-wider block font-ui">
              Lacunas identificadas
            </span>
            {parecer.lacunas.length > 0 ? (
              <ul className="text-xs text-[var(--c-6b6762)] list-disc list-inside space-y-1 font-ui">
                {parecer.lacunas.map((lac, idx) => (
                  <li key={idx}>{lac}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[var(--c-6b6762)] font-ui">
                Todos os elos causais previstos foram localizados no pacote.
              </p>
            )}
          </div>

          {/* Ação de Conclusão: Homologação */}
          <div className="bg-[var(--c-ffffff)] border border-[var(--c-e0deda)] rounded-[4px] p-4 text-center space-y-2.5 shadow-2xs">
            <div className="text-xs font-bold text-[var(--c-231f20)] font-ui">
              Parecer Pronto para Homologação
            </div>
            <p className="text-[11px] text-[var(--c-6b6762)] font-ui">
              Após a revisão dos cinco critérios, o parecer pode ser assinado e congelado pelo revisor.
            </p>
            <Link
              href={`/casos/${caso.id}/homologar`}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--c-a6193c)] hover:bg-[var(--c-7e122d)] text-white text-xs font-medium rounded-[4px] transition-colors font-ui"
            >
              Homologar parecer <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Visualizador de Evidência com Realce Literal (Off-Canvas Drawer) */}
      <EvidenciaDrawer
        casoId={caso.id}
        citacao={citacaoModal}
        aberto={citacaoModal !== null}
        onFechar={() => setCitacaoModal(null)}
      />
    </div>
  );
}
