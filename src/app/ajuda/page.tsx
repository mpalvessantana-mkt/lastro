"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Scale,
  ShieldCheck,
  ChevronDown,
  Search,
  ArrowRight,
  FileText,
  Compass,
  Cpu,
  Lock,
  Layers,
  Sparkles,
  ExternalLink
} from "lucide-react";

interface FaqItem {
  id: string;
  pergunta: string;
  resposta: string;
  categoria: "lei_do_bem" | "operacao" | "ia_seguranca";
}

const FAQS: FaqItem[] = [
  {
    id: "faq-1",
    categoria: "lei_do_bem",
    pergunta: "Qual é o objetivo principal da Lei do Bem (Lei nº 11.196/2005)?",
    resposta:
      "A Lei do Bem é o mecanismo federal que concede incentivos fiscais para pessoas jurídicas que realizam Pesquisa e Desenvolvimento de Inovação Tecnológica (P&D). O benefício permite deduzir entre 60% e 80% dos dispêndios de P&D da base de cálculo do IRPJ e da CSLL (podendo atingir até 100% com patentes ou aumento de pesquisadores).",
  },
  {
    id: "faq-2",
    categoria: "lei_do_bem",
    pergunta: "Por que projetos de software sofrem tantas glosas fiscais perante o MCTI e a Receita?",
    resposta:
      "A causa principal é a confusão entre 'desenvolvimento rotineiro de software' e 'pesquisa tecnológica'. Parametrizações de ERPs, integração de APIs comerciais, correções de bugs e migrações de banco de dados NÃO são elegíveis. É preciso comprovar a superação de incerteza técnica real, hipóteses testadas e geração de novo conhecimento.",
  },
  {
    id: "faq-3",
    categoria: "lei_do_bem",
    pergunta: "O que acontece se houver divergência entre o relatório de atividades e os commits do Git?",
    resposta:
      "Na auditoria fiscal do MCTI ou em diligências do CARF, a inconsistência documental é a causa número 1 de glosa total. O LASTRO protege o contribuinte justamente apontando previamente essas divergências (ex: relatório afirma 28% de ganho, mas o log de produção registrou 21%), permitindo ao analista justificar ou sanear a evidência no parecer.",
  },
  {
    id: "faq-4",
    categoria: "operacao",
    pergunta: "Como funciona o fluxo de homologação de um caso no sistema?",
    resposta:
      "O fluxo segue 5 etapas rigorosas: 1) Ingestão dos arquivos técnicos (PDF, código, planilhas); 2) O motor determinístico extrai evidências e pontua os 5 critérios de Frascati; 3) O Analista revisa o resumo em 4 pilares e inspeciona as evidências em texto integral; 4) O Revisor valida os apontamentos; 5) A homologação congela a decisão com um hash criptográfico SHA-256.",
  },
  {
    id: "faq-5",
    categoria: "operacao",
    pergunta: "Posso alterar o veredito proposto pela ferramenta?",
    resposta:
      "Sim, absolutamente! Este é o primeiro mandamento do LASTRO: 'A ferramenta propõe, o analista decide'. O sistema fornece a recomendação objetiva, a pontuação e os fatos, mas o analista humano é soberano para concordar, divergir, reclassificar e adicionar notas técnicas no parecer.",
  },
  {
    id: "faq-6",
    categoria: "ia_seguranca",
    pergunta: "A inteligência artificial do LASTRO pode alucinar ou inventar justificativas?",
    resposta:
      "Não. O motor de cálculo e classificação do LASTRO é 100% determinístico (baseado em lógica de regras e correspondência exata de termos). O assistente generativo (Copilot) atua exclusivamente como copiloto de pesquisa, indexando 40 normas oficiais do MCTI/RFB com citações pontuais dos artigos aplicáveis.",
  },
  {
    id: "faq-7",
    categoria: "ia_seguranca",
    pergunta: "Como o hash SHA-256 garante a imutabilidade do parecer?",
    resposta:
      "Assim que o parecer é homologado, o sistema concatena os metadados do caso, as evidências citadas, a classificação final e a data/hora, gerando um hash criptográfico SHA-256. Qualquer tentativa posterior de adulterar o arquivo altera o hash, provando perante a auditoria que o parecer é original e imutável.",
  },
];

export default function AjudaPage() {
  const [abaAtiva, setAbaAtiva] = useState<"passo_a_passo" | "criterios" | "governanca" | "faq">("passo_a_passo");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [busca, setBusca] = useState<string>("");
  const [faqAberto, setFaqAberto] = useState<string | null>("faq-1");

  const faqsFiltrados = FAQS.filter((faq) => {
    const correspondeCategoria = filtroCategoria === "todas" || faq.categoria === filtroCategoria;
    const correspondeBusca =
      faq.pergunta.toLowerCase().includes(busca.toLowerCase()) ||
      faq.resposta.toLowerCase().includes(busca.toLowerCase());
    return correspondeCategoria && correspondeBusca;
  });

  return (
    <div className="min-h-screen bg-[#F3F3F1] text-[#231F20] pb-16 font-ui">
      {/* Header da Página de Ajuda */}
      <div className="bg-white border-b border-[#E0DEDA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#A6193C] mb-1">
                <HelpCircle className="w-4 h-4 text-[#FF8A22]" />
                <span>Central de Conhecimento &amp; Boas Práticas</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#231F20] tracking-tight">
                Como Funciona o LASTRO IA
              </h1>
              <p className="text-xs sm:text-sm text-[#52504E] mt-1 max-w-2xl">
                Manual prático de operação, critérios de enquadramento da Lei do Bem (Lei nº 11.196/2005) e diretrizes de governança para auditoria sem caixa-preta.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/casos"
                className="px-4 py-2 text-xs font-semibold rounded-[4px] bg-[#A6193C] text-white hover:bg-[#851430] transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <span>Acessar Casos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Abas Superiores de Navegação */}
          <div className="flex items-center gap-2 mt-8 overflow-x-auto border-b border-[#E0DEDA] pb-px">
            <button
              onClick={() => setAbaAtiva("passo_a_passo")}
              className={`px-4 py-2 text-xs font-medium rounded-t-[4px] transition-colors border-b-2 whitespace-nowrap ${
                abaAtiva === "passo_a_passo"
                  ? "border-[#A6193C] text-[#A6193C] bg-white"
                  : "border-transparent text-[#52504E] hover:text-[#231F20]"
              }`}
            >
              1. Passo a Passo da Homologação
            </button>

            <button
              onClick={() => setAbaAtiva("criterios")}
              className={`px-4 py-2 text-xs font-medium rounded-t-[4px] transition-colors border-b-2 whitespace-nowrap ${
                abaAtiva === "criterios"
                  ? "border-[#A6193C] text-[#A6193C] bg-white"
                  : "border-transparent text-[#52504E] hover:text-[#231F20]"
              }`}
            >
              2. Os 5 Critérios de Frascati
            </button>

            <button
              onClick={() => setAbaAtiva("governanca")}
              className={`px-4 py-2 text-xs font-medium rounded-t-[4px] transition-colors border-b-2 whitespace-nowrap ${
                abaAtiva === "governanca"
                  ? "border-[#A6193C] text-[#A6193C] bg-white"
                  : "border-transparent text-[#52504E] hover:text-[#231F20]"
              }`}
            >
              3. Regras Invioláveis de Governança
            </button>

            <button
              onClick={() => setAbaAtiva("faq")}
              className={`px-4 py-2 text-xs font-medium rounded-t-[4px] transition-colors border-b-2 whitespace-nowrap ${
                abaAtiva === "faq"
                  ? "border-[#A6193C] text-[#A6193C] bg-white"
                  : "border-transparent text-[#52504E] hover:text-[#231F20]"
              }`}
            >
              4. FAQ Interativo &amp; Dúvidas
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* ABA 1: PASSO A PASSO DA HOMOLOGAÇÃO */}
        {abaAtiva === "passo_a_passo" && (
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-[4px] border border-[#E0DEDA] shadow-2xs">
              <h2 className="text-lg font-bold text-[#231F20] flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#A6193C]" />
                O Fluxo de Homologação de Casos em 5 Etapas
              </h2>
              <p className="text-xs text-[#52504E] mt-1">
                Conheça a jornada de ponta a ponta desde o upload do dossiê do projeto até a assinatura digital com selo criptográfico SHA-256.
              </p>

              <div className="mt-8 space-y-6">
                {/* Passo 1 */}
                <div className="flex gap-4 items-start">
                  <div className="w-7 h-7 rounded-[4px] bg-[#A6193C] text-white flex items-center justify-center font-bold text-xs font-mono shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="flex-1 bg-[#F3F3F1] p-4 rounded-[4px] border border-[#E0DEDA]">
                    <h3 className="text-sm font-bold text-[#231F20]">Submissão e Ingestão do Pacote Técnico</h3>
                    <p className="text-xs text-[#52504E] mt-1 leading-relaxed">
                      O usuário acessa <strong>Casos &gt; Novo Caso</strong> e faz o upload de um arquivo ZIP contendo os artefatos do projeto:
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-[#52504E] list-disc list-inside">
                      <li><code>dossie_projeto.pdf</code> ou texto com a descrição do projeto, objetivos e equipe.</li>
                      <li>Repositório de código-fonte (commits, testes unitários, arquitetura).</li>
                      <li>Planilhas de horas ou apontamentos de horas da equipe de P&amp;D.</li>
                    </ul>
                  </div>
                </div>

                {/* Passo 2 */}
                <div className="flex gap-4 items-start">
                  <div className="w-7 h-7 rounded-[4px] bg-[#A6193C] text-white flex items-center justify-center font-bold text-xs font-mono shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1 bg-[#F3F3F1] p-4 rounded-[4px] border border-[#E0DEDA]">
                    <h3 className="text-sm font-bold text-[#231F20]">Extração de Metadados e Parsing Inteligente</h3>
                    <p className="text-xs text-[#52504E] mt-1 leading-relaxed">
                      O motor extrai automaticamente o <strong>Título Real</strong>, <strong>Nome da Equipe</strong>, <strong>Período de Execução</strong> e constrói a <strong>Síntese Executiva em 4 Pilares</strong>:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-[11px] font-medium text-[#A6193C]">
                      <span className="p-2 bg-white rounded-[4px] border border-[#E0DEDA]">1. Objetivo Tecnológico</span>
                      <span className="p-2 bg-white rounded-[4px] border border-[#E0DEDA]">2. Estado da Arte Superado</span>
                      <span className="p-2 bg-white rounded-[4px] border border-[#E0DEDA]">3. Metodologia Experimental</span>
                      <span className="p-2 bg-white rounded-[4px] border border-[#E0DEDA]">4. Transferência de Conhecimento</span>
                    </div>
                  </div>
                </div>

                {/* Passo 3 */}
                <div className="flex gap-4 items-start">
                  <div className="w-7 h-7 rounded-[4px] bg-[#A6193C] text-white flex items-center justify-center font-bold text-xs font-mono shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="flex-1 bg-[#F3F3F1] p-4 rounded-[4px] border border-[#E0DEDA]">
                    <h3 className="text-sm font-bold text-[#231F20]">Inspeção de Evidências em Texto Integral</h3>
                    <p className="text-xs text-[#52504E] mt-1 leading-relaxed">
                      Ao clicar em qualquer cartão de evidência ou divergência no parecer, abre-se a gaveta lateral (Drawer) exibindo o documento original completo, com rolagem automática e realce no trecho exato citado.
                    </p>
                  </div>
                </div>

                {/* Passo 4 */}
                <div className="flex gap-4 items-start">
                  <div className="w-7 h-7 rounded-[4px] bg-[#A6193C] text-white flex items-center justify-center font-bold text-xs font-mono shrink-0 mt-0.5">
                    4
                  </div>
                  <div className="flex-1 bg-[#F3F3F1] p-4 rounded-[4px] border border-[#E0DEDA]">
                    <h3 className="text-sm font-bold text-[#231F20]">Revisão e Notas do Analista / Revisor</h3>
                    <p className="text-xs text-[#52504E] mt-1 leading-relaxed">
                      O analista humano valida se concorda com a classificação sugerida pelo motor determinístico. Pode adicionar notas técnicas, observações de ressalva ou justificativas probatórias adicionais.
                    </p>
                  </div>
                </div>

                {/* Passo 5 */}
                <div className="flex gap-4 items-start">
                  <div className="w-7 h-7 rounded-[4px] bg-[#A6193C] text-white flex items-center justify-center font-bold text-xs font-mono shrink-0 mt-0.5">
                    5
                  </div>
                  <div className="flex-1 bg-[#F3F3F1] p-4 rounded-[4px] border border-[#E0DEDA]">
                    <h3 className="text-sm font-bold text-[#231F20]">Homologação e Congelamento Criptográfico SHA-256</h3>
                    <p className="text-xs text-[#52504E] mt-1 leading-relaxed">
                      Ao clicar em <strong>Homologar Parecer</strong>, a decisão é formalizada: o parecer se torna imutável, recebe o carimbo oficial de certificação e um hash SHA-256 que assegura sua cadeia de custódia perante a fiscalização do MCTI e Receita Federal.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: OS 5 CRITÉRIOS DE FRASCATI */}
        {abaAtiva === "criterios" && (
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-[4px] border border-[#E0DEDA] shadow-2xs">
              <h2 className="text-lg font-bold text-[#231F20] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#A6193C]" />
                Os 5 Critérios Canônicos do Manual de Frascati (OCDE)
              </h2>
              <p className="text-xs text-[#52504E] mt-1">
                Para que uma atividade seja considerada Pesquisa e Desenvolvimento (P&amp;D) na Lei do Bem, ela deve atender cumulativamente aos cinco critérios fundamentais definidos pela OCDE e adotados pelo MCTI.
              </p>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Novidade */}
                <div className="p-5 rounded-[4px] border border-[#E0DEDA] bg-[#F3F3F1]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 bg-white text-[#231F20] border border-[#E0DEDA] rounded-[4px]">
                      CRITÉRIO 1
                    </span>
                    <span className="text-xs text-[#52504E]">Frascati §2.15</span>
                  </div>
                  <h3 className="text-base font-bold text-[#231F20] mt-2">1. Novidade (Novelty)</h3>
                  <p className="text-xs text-[#52504E] mt-1 leading-relaxed">
                    A atividade deve visar novas descobertas ou novos conhecimentos que não estão no domínio público ou no estado da técnica atual.
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#E0DEDA] space-y-2 text-xs">
                    <div className="flex items-start gap-1.5 text-[#2F6B4F]">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span><strong>Aprova:</strong> Criação de nova arquitetura distribuída inédita para o setor.</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-[#52504E]">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#B06C1E]" />
                      <span><strong>Reprova:</strong> Simples customização de biblioteca open-source sem modificação estrutural.</span>
                    </div>
                  </div>
                </div>

                {/* 2. Criatividade Técnica */}
                <div className="p-5 rounded-[4px] border border-[#E0DEDA] bg-[#F3F3F1]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 bg-white text-[#231F20] border border-[#E0DEDA] rounded-[4px]">
                      CRITÉRIO 2
                    </span>
                    <span className="text-xs text-[#52504E]">Frascati §2.16</span>
                  </div>
                  <h3 className="text-base font-bold text-[#231F20] mt-2">2. Criatividade (Creativity)</h3>
                  <p className="text-xs text-[#52504E] mt-1 leading-relaxed">
                    O projeto deve basear-se em conceitos originais que vão além da dedução óbvia de um profissional habilitado na área técnica.
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#E0DEDA] space-y-2 text-xs">
                    <div className="flex items-start gap-1.5 text-[#2F6B4F]">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span><strong>Aprova:</strong> Algoritmo heurístico original formulado para contornar gargalo físico.</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-[#52504E]">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#B06C1E]" />
                      <span><strong>Reprova:</strong> Engenharia reversa de solução concorrente ou uso de templates prontos.</span>
                    </div>
                  </div>
                </div>

                {/* 3. Incerteza Tecnológica */}
                <div className="p-5 rounded-[4px] border border-[#E0DEDA] bg-[#F3F3F1]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 bg-white text-[#231F20] border border-[#E0DEDA] rounded-[4px]">
                      CRITÉRIO 3
                    </span>
                    <span className="text-xs text-[#52504E]">Frascati §2.17</span>
                  </div>
                  <h3 className="text-base font-bold text-[#231F20] mt-2">3. Incerteza Tecnológica (Uncertainty)</h3>
                  <p className="text-xs text-[#52504E] mt-1 leading-relaxed">
                    Deve existir dúvida genuína sobre a viabilidade técnica de alcançar o objetivo ou sobre os custos/tempo necessários.
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#E0DEDA] space-y-2 text-xs">
                    <div className="flex items-start gap-1.5 text-[#2F6B4F]">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span><strong>Aprova:</strong> Risco real de inviabilidade comprovado por testes laboratoriais preliminares.</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-[#52504E]">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#B06C1E]" />
                      <span><strong>Reprova:</strong> Incerteza meramente comercial ou de mercado (sem barreira de engenharia).</span>
                    </div>
                  </div>
                </div>

                {/* 4. Sistematicidade */}
                <div className="p-5 rounded-[4px] border border-[#E0DEDA] bg-[#F3F3F1]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 bg-white text-[#231F20] border border-[#E0DEDA] rounded-[4px]">
                      CRITÉRIO 4
                    </span>
                    <span className="text-xs text-[#52504E]">Frascati §2.18</span>
                  </div>
                  <h3 className="text-base font-bold text-[#231F20] mt-2">4. Sistematicidade (Systematic)</h3>
                  <p className="text-xs text-[#52504E] mt-1 leading-relaxed">
                    A pesquisa deve ser planejada, orçada e conduzida com método formal de registro e acompanhamento de marcos.
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#E0DEDA] space-y-2 text-xs">
                    <div className="flex items-start gap-1.5 text-[#2F6B4F]">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span><strong>Aprova:</strong> Cronograma com fases experimentais, relatórios técnicos periódicos e logs.</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-[#52504E]">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#B06C1E]" />
                      <span><strong>Reprova:</strong> Atividades improvisadas ou sem segregação de horas dedicadas por pesquisador.</span>
                    </div>
                  </div>
                </div>

                {/* 5. Transferência e Reprodução */}
                <div className="p-5 rounded-[4px] border border-[#E0DEDA] bg-[#F3F3F1] md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 bg-white text-[#231F20] border border-[#E0DEDA] rounded-[4px]">
                      CRITÉRIO 5
                    </span>
                    <span className="text-xs text-[#52504E]">Frascati §2.19</span>
                  </div>
                  <h3 className="text-base font-bold text-[#231F20] mt-2">5. Transferibilidade / Reprodutibilidade (Transferable / Reproducible)</h3>
                  <p className="text-xs text-[#52504E] mt-1 leading-relaxed">
                    O conhecimento gerado deve ser codificado e documentado de tal modo que outros pesquisadores possam reproduzir ou estender os resultados obtidos.
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#E0DEDA] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="flex items-start gap-1.5 text-[#2F6B4F]">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span><strong>Aprova:</strong> Documentação de arquitetura, publicações técnicas, patentes ou repositórios estruturados.</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-[#52504E]">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#B06C1E]" />
                      <span><strong>Reprova:</strong> Conhecimento tácito restrito à memória de um desenvolvedor, sem documentação técnica formal.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: REGRAS INVIOLÁVEIS DE GOVERNANÇA */}
        {abaAtiva === "governanca" && (
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-[4px] border border-[#E0DEDA] shadow-2xs">
              <h2 className="text-lg font-bold text-[#231F20] flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#A6193C]" />
                As 10 Regras Invioláveis da Plataforma LASTRO
              </h2>
              <p className="text-xs text-[#52504E] mt-1">
                Diretrizes de engenharia e compliance regulatório incorporadas no motor do sistema para assegurar blindagem total perante auditorias externas.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  {
                    num: "01",
                    titulo: "A ferramenta propõe; o analista decide",
                    desc: "O sistema nunca homologa ou reprova um projeto de forma autônoma. A decisão final é sempre prerrogativa soberana de um analista humano habilitado.",
                  },
                  {
                    num: "02",
                    titulo: "Zero afirmação sem evidência vinculada",
                    desc: "Nenhuma frase avaliativa é inserida no parecer sem a citação de um identificador nativo de evidência (ex: PRJ01-EV03) ou artigo normativo.",
                  },
                  {
                    num: "03",
                    titulo: "Motor de classificação determinístico",
                    desc: "O cálculo de pontuação e o enquadramento de regras não dependem de LLMs estocásticos. É puramente auditável e repetível.",
                  },
                  {
                    num: "04",
                    titulo: "Confronto transparente de divergências",
                    desc: "Quando o relatório declara algo que os dados técnicos contradizem, o sistema expõe a divergência com destaque, em vez de ocultá-la.",
                  },
                  {
                    num: "05",
                    titulo: "Imutabilidade após homologação (SHA-256)",
                    desc: "Uma vez homologado, o parecer é assinado digitalmente com hash SHA-256 e tem sua integridade congelada para proteção jurídica.",
                  },
                  {
                    num: "06",
                    titulo: "Cadeia de custódia de documentos",
                    desc: "Todos os arquivos brutos submetidos são catalogados com checksum e mantidos para fins de eventual fiscalização do MCTI ou Receita Federal.",
                  },
                  {
                    num: "07",
                    titulo: "Segregação de papéis de governança",
                    desc: "A plataforma diferencia as responsabilidades do Analista (proposta técnica), Revisor (validação cruzada) e Auditor (fiscalização e conformidade).",
                  },
                  {
                    num: "08",
                    titulo: "Base normativa canônica atualizada",
                    desc: "O acervo do sistema é referenciado nas 40 normas fundamentais, incluindo Lei nº 11.196/2005, Decreto nº 5.798/2006 e Instruções Normativas MCTI.",
                  },
                  {
                    num: "09",
                    titulo: "Copilot IA com ancoragem obrigatória (Grounding)",
                    desc: "O assistente flutuante só responde citando explicitamente a norma ou acórdão do CARF, impossibilitando alucinações tributárias.",
                  },
                  {
                    num: "10",
                    titulo: "Foco exclusivo em P&D tecnológico",
                    desc: "O sistema rejeita prontamente atividades rotineiras, como suporte, manutenção, parametrização ou compra de tecnologia de prateleira.",
                  },
                ].map((regra) => (
                  <div
                    key={regra.num}
                    className="p-4 rounded-[4px] bg-[#F3F3F1] border border-[#E0DEDA] flex items-start gap-4"
                  >
                    <span className="text-sm font-bold font-mono text-[#A6193C] bg-white border border-[#E0DEDA] px-2.5 py-1 rounded-[4px]">
                      {regra.num}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-[#231F20]">{regra.titulo}</h3>
                      <p className="text-xs text-[#52504E] mt-1 leading-relaxed">{regra.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ABA 4: FAQ INTERATIVO */}
        {abaAtiva === "faq" && (
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-[4px] border border-[#E0DEDA] shadow-2xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E0DEDA]">
                <div>
                  <h2 className="text-lg font-bold text-[#231F20] flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-[#FF8A22]" />
                    Perguntas Frequentes (FAQ)
                  </h2>
                  <p className="text-xs text-[#52504E] mt-0.5">
                    Tire dúvidas sobre regras da Lei do Bem, operação do sistema e conformidade probatória.
                  </p>
                </div>

                {/* Filtro de Categoria e Busca */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#52504E]" />
                    <input
                      type="text"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      placeholder="Buscar pergunta ou termo..."
                      className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E0DEDA] rounded-[4px] focus:outline-none focus:border-[#A6193C] w-48 sm:w-60"
                    />
                  </div>

                  <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="text-xs bg-white border border-[#E0DEDA] rounded-[4px] px-2.5 py-1.5 focus:outline-none focus:border-[#A6193C]"
                  >
                    <option value="todas">Todas as Categorias</option>
                    <option value="lei_do_bem">Lei do Bem &amp; Frascati</option>
                    <option value="operacao">Operação do Sistema</option>
                    <option value="ia_seguranca">IA &amp; Segurança SHA-256</option>
                  </select>
                </div>
              </div>

              {/* Lista de FAQs com Acordeão */}
              <div className="mt-6 space-y-3">
                {faqsFiltrados.length === 0 ? (
                  <div className="text-center py-10 text-xs text-[#52504E]">
                    Nenhuma pergunta encontrada com o termo pesquisado.
                  </div>
                ) : (
                  faqsFiltrados.map((faq) => {
                    const aberto = faqAberto === faq.id;
                    return (
                      <div
                        key={faq.id}
                        className="rounded-[4px] border border-[#E0DEDA] bg-[#F3F3F1] overflow-hidden transition-all"
                      >
                        <button
                          onClick={() => setFaqAberto(aberto ? null : faq.id)}
                          className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-white transition-colors"
                        >
                          <span className="text-xs sm:text-sm font-bold text-[#231F20]">
                            {faq.pergunta}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-[#52504E] shrink-0 transition-transform ${
                              aberto ? "rotate-180 text-[#A6193C]" : ""
                            }`}
                          />
                        </button>

                        {aberto && (
                          <div className="p-4 pt-1 border-t border-[#E0DEDA] bg-white text-xs text-[#52504E] leading-relaxed">
                            {faq.resposta}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
