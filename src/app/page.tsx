"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Scale,
  FolderGit2,
  HelpCircle,
  FileText,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F3F3F1] text-[#231F20] flex flex-col font-ui">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 border-b border-[#E0DEDA] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Tag Institucional Oficial */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-[#F3F3F1] border border-[#E0DEDA] text-[#231F20] text-xs font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-[#A6193C]" />
              Banco do Nordeste · Inteligência Regulatória &amp; Auditoria da Lei do Bem
            </div>

            {/* Headline Principal */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#231F20] leading-[1.15]">
              Toda Decisão com Lastro. <br />
              <span className="text-[#A6193C]">
                Zero Caixa-Preta.
              </span>
            </h1>

            {/* Subheadline Explicativa */}
            <p className="mt-6 text-base sm:text-lg text-[#6B6762] leading-relaxed max-w-2xl mx-auto">
              Transforme relatórios técnicos, repositórios de código e apontamentos em pareceres
              de P&amp;D auditáveis, protegendo sua instituição contra glosas fiscais do MCTI e da Receita Federal.
            </p>

            {/* Princípio de Governança */}
            <div className="mt-4 text-xs font-medium text-[#96918A] flex items-center justify-center gap-2">
              <Scale className="w-4 h-4 text-[#B06C1E]" />
              <span>Princípio Inviolável: <strong>A ferramenta propõe e rastreia; o analista decide com soberania.</strong></span>
            </div>

            {/* CTAs de Ação Oficiais */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/casos"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[4px] bg-[#A6193C] text-white font-medium text-sm hover:bg-[#7E122D] transition-colors"
              >
                <span>Acessar Esteira de Casos</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/casos/novo"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[4px] bg-white border border-[#C9C6C1] text-[#231F20] font-medium text-sm hover:bg-[#F3F3F1] transition-colors"
              >
                <FolderGit2 className="w-4 h-4 text-[#6B6762]" />
                <span>Auditar Novo Projeto</span>
              </Link>

              <Link
                href="/ajuda"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[4px] text-[#6B6762] hover:text-[#231F20] hover:bg-[#F3F3F1] text-sm font-medium transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-[#B06C1E]" />
                <span>Guia &amp; Boas Práticas</span>
              </Link>
            </div>
          </div>

          {/* Interactive Hero Showcase / Document Preview */}
          <div className="mt-12 max-w-5xl mx-auto">
            <div className="bg-white rounded-[4px] border border-[#E0DEDA] shadow-xs overflow-hidden">
              {/* Header do Documento */}
              <div className="bg-[#F3F3F1] border-b border-[#E0DEDA] px-5 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-id text-[#6B6762]">
                    BANCO DO NORDESTE // PARECER TÉCNICO DE P&amp;D · LEI Nº 11.196/2005
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="carimbo-homologado">
                    HOMOLOGADO
                  </span>
                </div>
              </div>

              {/* Corpo da Ficha Técnica */}
              <div className="p-6 space-y-6">
                {/* Linha Superior: Título do Dossiê e Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E0DEDA]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-id text-xs font-bold text-[#A6193C]">
                        CASO #01
                      </span>
                      <span className="text-xs text-[#2F6B4F] font-medium bg-[#F4F8F5] px-2 py-0.5 rounded-[4px] border border-[#A3D9BE]">
                        Classificação: ELEGÍVEL COM RESSALVA
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-[#231F20] mt-1.5">
                      Otimizador de Rotas Logísticas com Redes Neurais e Grafos Dinâmicos
                    </h3>
                    <p className="text-xs text-[#6B6762] mt-0.5">
                      Equipe: TechLog Labs · Duração: 12 semanas · Incerteza Tecnológica Comprovada
                    </p>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                    <span className="text-xs text-[#96918A]">Score Frascati</span>
                    <span className="text-2xl font-medium text-[#2F6B4F] font-id">85 / 100</span>
                  </div>
                </div>

                {/* 4 Pilares da Síntese Executiva em Ficha */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-[#F3F3F1] p-3.5 rounded-[4px] border border-[#E0DEDA]">
                    <span className="text-[10px] uppercase font-medium text-[#96918A] tracking-[0.02em] block">
                      1. Objetivo Tecnológico
                    </span>
                    <p className="text-xs text-[#231F20] mt-1 leading-snug">
                      Desenvolver algoritmo proprietário de roteirização para frotas pesadas sob restrição estocástica.
                    </p>
                  </div>

                  <div className="bg-[#F3F3F1] p-3.5 rounded-[4px] border border-[#E0DEDA]">
                    <span className="text-[10px] uppercase font-medium text-[#96918A] tracking-[0.02em] block">
                      2. Estado da Arte Superado
                    </span>
                    <p className="text-xs text-[#231F20] mt-1 leading-snug">
                      Superação de algoritmos Dijkstra/A* em malhas com mais de 50.000 nós com latência inferior a 150ms.
                    </p>
                  </div>

                  <div className="bg-[#F3F3F1] p-3.5 rounded-[4px] border border-[#E0DEDA]">
                    <span className="text-[10px] uppercase font-medium text-[#96918A] tracking-[0.02em] block">
                      3. Metodologia Experimental
                    </span>
                    <p className="text-xs text-[#231F20] mt-1 leading-snug">
                      Testes comparativos empíricos em 12 sprints documentadas com rastreabilidade de commits no Git.
                    </p>
                  </div>

                  <div className="bg-[#F3F3F1] p-3.5 rounded-[4px] border border-[#E0DEDA]">
                    <span className="text-[10px] uppercase font-medium text-[#96918A] tracking-[0.02em] block">
                      4. Transferência / Código
                    </span>
                    <p className="text-xs text-[#231F20] mt-1 leading-snug">
                      Módulos encapsulados em biblioteca proprietária, artigo submetido e documentação de arquitetura.
                    </p>
                  </div>
                </div>

                {/* Linha de Citação com Filete Oficial */}
                <div className="p-3.5 rounded-[4px] border border-[#EAD4B6] bg-[#FDF8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start sm:items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-[#B06C1E] shrink-0 mt-0.5 sm:mt-0" />
                    <div>
                      <span className="font-bold text-[#B06C1E] font-id mr-1.5">[PRJ01-EV03]</span>
                      <span className="text-[#231F20]">
                        Confronto probatório: O relatório técnico declarou ganho de 28%, enquanto o log aferiu 21,4%.
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-[#2F6B4F] bg-white px-2 py-1 rounded-[4px] border border-[#A3D9BE] whitespace-nowrap self-start sm:self-auto">
                    ✓ Ressalva Justificada no Parecer
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS & INDICADORES DE CONFIANÇA */}
      <section className="py-10 bg-white border-b border-[#E0DEDA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-[4px] bg-[#F3F3F1] border border-[#E0DEDA]">
              <div className="text-3xl font-medium text-[#2F6B4F] font-id">100%</div>
              <div className="text-xs font-medium uppercase tracking-[0.02em] text-[#6B6762] mt-1">
                Acerto em Testes Canônicos
              </div>
              <p className="text-[11px] text-[#96918A] mt-0.5">Conformidade total com jurisprudência do MCTI</p>
            </div>

            <div className="p-4 rounded-[4px] bg-[#F3F3F1] border border-[#E0DEDA]">
              <div className="text-3xl font-medium text-[#231F20] font-id">0%</div>
              <div className="text-xs font-medium uppercase tracking-[0.02em] text-[#6B6762] mt-1">
                Alucinação no Veredito
              </div>
              <p className="text-[11px] text-[#96918A] mt-0.5">Motor determinístico puramente auditável</p>
            </div>

            <div className="p-4 rounded-[4px] bg-[#F3F3F1] border border-[#E0DEDA]">
              <div className="text-3xl font-medium text-[#B06C1E] font-id">70%</div>
              <div className="text-xs font-medium uppercase tracking-[0.02em] text-[#6B6762] mt-1">
                Redução de Tempo
              </div>
              <p className="text-[11px] text-[#96918A] mt-0.5">De semanas de análise manual para minutos</p>
            </div>

            <div className="p-4 rounded-[4px] bg-[#F3F3F1] border border-[#E0DEDA]">
              <div className="text-3xl font-medium text-[#A6193C] font-id">SHA-256</div>
              <div className="text-xs font-medium uppercase tracking-[0.02em] text-[#6B6762] mt-1">
                Cadeia de Custódia
              </div>
              <p className="text-[11px] text-[#96918A] mt-0.5">Imutabilidade probatória para fiscalização</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. A DOR DO MERCADO VS A SOLUÇÃO LASTRO */}
      <section className="py-14 bg-[#F3F3F1] border-b border-[#E0DEDA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#B06C1E]">Segurança Jurídica &amp; Tributária</span>
            <h2 className="text-2xl sm:text-3xl font-medium text-[#231F20] mt-1">
              Por que processos tradicionais são autuados no CARF?
            </h2>
            <p className="text-xs sm:text-sm text-[#6B6762] mt-2">
              Mais de 30% das empresas que utilizam a Lei do Bem recebem notificações ou glosas do MCTI por falta de evidências técnicas e relatórios frágeis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* O Modelo Frágil Tradicional */}
            <div className="bg-white rounded-[4px] border border-[#C9C6C1] p-6 relative">
              <div className="w-1 h-full bg-[#52504E] absolute top-0 left-0" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-[4px] bg-[#F3F3F1] text-[#52504E] flex items-center justify-center font-bold">
                  ✕
                </div>
                <div>
                  <h3 className="text-base font-medium text-[#231F20]">O Processo Tradicional</h3>
                  <span className="text-xs text-[#6B6762]">Alto risco de glosa fiscal</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs text-[#6B6762]">
                <li className="flex items-start gap-2">
                  <span className="text-[#52504E] font-bold">·</span>
                  <span><strong>Pareceres Genéricos:</strong> Textos vagos que não comprovam a barreira técnica perante o Manual de Frascati.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#52504E] font-bold">·</span>
                  <span><strong>Planilhas e Pastas Dispersas:</strong> Dossiês em PDF, repositórios e apontamentos sem cruzamento auditável.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#52504E] font-bold">·</span>
                  <span><strong>Divergências Ocultas:</strong> Relatórios prometem resultados que os commits do código desmentem.</span>
                </li>
              </ul>
            </div>

            {/* A Plataforma LASTRO */}
            <div className="bg-white rounded-[4px] border border-[#E0DEDA] p-6 relative">
              <div className="w-1 h-full bg-[#A6193C] absolute top-0 left-0" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-[4px] bg-[#F3F3F1] text-[#A6193C] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-[#A6193C]">A Solução LASTRO</h3>
                  <span className="text-xs text-[#2F6B4F]">Certeza probatória para auditoria</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs text-[#231F20]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                  <span><strong>Citação Literal Rastreável:</strong> Cada frase é vinculada ao identificador nativo (<code className="font-id">PRJ01-EV02</code>).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                  <span><strong>Confronto Prévio de Evidências:</strong> O sistema detecta divergências antes da submissão ao FormP&amp;D.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                  <span><strong>5 Critérios Canônicos:</strong> Avaliação pontual de Novidade, Criatividade, Incerteza, Sistematicidade e Transferência.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. O FLUXO EM 4 ETAPAS DA PLATAFORMA */}
      <section className="py-14 bg-white border-b border-[#E0DEDA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#A6193C]">Pipeline da Auditoria</span>
            <h2 className="text-2xl sm:text-3xl font-medium text-[#231F20] mt-1">
              Como o LASTRO opera em 4 etapas
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#F3F3F1] p-5 rounded-[4px] border border-[#E0DEDA]">
              <div className="w-7 h-7 rounded-[4px] bg-[#231F20] text-white flex items-center justify-center font-id text-xs mb-3">
                01
              </div>
              <h3 className="text-sm font-medium text-[#231F20]">Ingestão Multiformato</h3>
              <p className="text-xs text-[#6B6762] mt-1.5 leading-relaxed">
                Carregamento do pacote técnico com suporte a PDF nativo, planilhas de horas e repositórios de código.
              </p>
            </div>

            <div className="bg-[#F3F3F1] p-5 rounded-[4px] border border-[#E0DEDA]">
              <div className="w-7 h-7 rounded-[4px] bg-[#231F20] text-white flex items-center justify-center font-id text-xs mb-3">
                02
              </div>
              <h3 className="text-sm font-medium text-[#231F20]">Matriz dos 5 Critérios</h3>
              <p className="text-xs text-[#6B6762] mt-1.5 leading-relaxed">
                O motor avalia o projeto segundo os 5 critérios do Manual de Frascati, vinculando citações literais.
              </p>
            </div>

            <div className="bg-[#F3F3F1] p-5 rounded-[4px] border border-[#E0DEDA]">
              <div className="w-7 h-7 rounded-[4px] bg-[#231F20] text-white flex items-center justify-center font-id text-xs mb-3">
                03
              </div>
              <h3 className="text-sm font-medium text-[#231F20]">Confronto Probatório</h3>
              <p className="text-xs text-[#6B6762] mt-1.5 leading-relaxed">
                Confronto imediato entre declarações e execuções técnicas, sinalizando divergências antes da homologação.
              </p>
            </div>

            <div className="bg-[#F3F3F1] p-5 rounded-[4px] border border-[#E0DEDA]">
              <div className="w-7 h-7 rounded-[4px] bg-[#A6193C] text-white flex items-center justify-center font-id text-xs mb-3">
                04
              </div>
              <h3 className="text-sm font-medium text-[#231F20]">Homologação e Selo</h3>
              <p className="text-xs text-[#6B6762] mt-1.5 leading-relaxed">
                O analista revisa e formaliza a decisão soberana. O parecer é carimbado com hash SHA-256 e selo imutável.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PARA QUEM É O SISTEMA (PERSONAS) */}
      <section className="py-14 bg-[#F3F3F1] border-b border-[#E0DEDA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#A6193C]">Perfis &amp; Governança</span>
            <h2 className="text-2xl sm:text-3xl font-medium text-[#231F20] mt-1">
              Desenhado para toda a cadeia de inovação
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-[4px] border border-[#E0DEDA]">
              <div className="w-8 h-8 rounded-[4px] bg-[#F3F3F1] text-[#A6193C] flex items-center justify-center mb-3">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-base font-medium text-[#231F20]">Analista de P&amp;D</h3>
              <p className="text-xs text-[#6B6762] mt-0.5">Ex: Engenheiro de Software ou Pesquisador</p>
              <ul className="mt-3 space-y-1.5 text-xs text-[#6B6762]">
                <li>· Acessa a síntese executiva em 4 pilares</li>
                <li>· Examina evidências em texto integral formatado</li>
                <li>· Utiliza o Copilot Regulatório com normas oficiais</li>
              </ul>
            </div>

            <div className="bg-white p-5 rounded-[4px] border border-[#E0DEDA]">
              <div className="w-8 h-8 rounded-[4px] bg-[#F3F3F1] text-[#B06C1E] flex items-center justify-center mb-3">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-base font-medium text-[#231F20]">Revisor / Gestor</h3>
              <p className="text-xs text-[#6B6762] mt-0.5">Ex: Comitê de Inovação do Banco do Nordeste</p>
              <ul className="mt-3 space-y-1.5 text-xs text-[#6B6762]">
                <li>· Verifica a consistência e o equilíbrio probatório</li>
                <li>· Adiciona parecer técnico complementar e ressalvas</li>
                <li>· Garante alinhamento antes da homologação final</li>
              </ul>
            </div>

            <div className="bg-white p-5 rounded-[4px] border border-[#E0DEDA]">
              <div className="w-8 h-8 rounded-[4px] bg-[#F3F3F1] text-[#2F6B4F] flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-base font-medium text-[#231F20]">Auditor Fiscal</h3>
              <p className="text-xs text-[#6B6762] mt-0.5">Ex: Compliance, Auditoria Interna e MCTI</p>
              <ul className="mt-3 space-y-1.5 text-xs text-[#6B6762]">
                <li>· Inspeciona trilha de auditoria completa</li>
                <li>· Valida a integridade do hash SHA-256 do parecer</li>
                <li>· Emite relatórios de defesa estruturados para o CARF</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CTA FINAL INSTITUCIONAL */}
      <section className="py-14 bg-white border-t border-[#E0DEDA]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-medium text-[#231F20]">
            Pronto para auditar projetos de inovação com total segurança?
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-[#6B6762] max-w-xl mx-auto">
            Explore a esteira de casos canônicos, simule novos pareceres e consulte as melhores práticas da plataforma.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/casos"
              className="px-5 py-2.5 rounded-[4px] bg-[#A6193C] text-white font-medium text-sm hover:bg-[#7E122D] transition-colors"
            >
              Acessar Plataforma Agora
            </Link>

            <Link
              href="/ajuda"
              className="px-5 py-2.5 rounded-[4px] bg-white border border-[#C9C6C1] text-[#231F20] font-medium text-sm hover:bg-[#F3F3F1] transition-colors"
            >
              Ver Central de Ajuda &amp; FAQ
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[#E0DEDA] flex flex-wrap items-center justify-between text-xs text-[#96918A]">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#A6193C]">LASTRO</span>
              <span>·</span>
              <span>Banco do Nordeste do Brasil</span>
            </div>
            <div>
              <span>Conformidade com a Lei nº 11.196/2005 e Manual de Frascati (OCDE)</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
