"use client";

import React from "react";
import Link from "next/link";
import { Scale, FolderGit2, HelpCircle, ArrowRight, FileText, Users, ShieldCheck } from "lucide-react";
import { CarrosselFotos, type Foto } from "@/components/CarrosselFotos";

/** Fotos da coluna direita (peças institucionais do Banco do Nordeste), em rolagem automática. */
const FOTOS: Foto[] = [
  { src: "/marca/carrossel/bnb-ta-on.webp", alt: "Campanha do Banco do Nordeste: “O BNB tá ON!” — parceria que segue até nos canais oficiais.", ajuste: "cobrir" },
  { src: "/marca/carrossel/crediamigo-planejamento.webp", alt: "Campanha Crediamigo: planejamento financeiro para o seu negócio crescer — condições, limites, prazos e documentos.", ajuste: "conter", fundo: "#A81836" }
];

const ETAPAS = [
  { n: "01", titulo: "Ingestão do pacote", texto: "Pasta ou .zip com os arquivos do projeto: PDF, planilhas, CSV e JSON." },
  { n: "02", titulo: "Cinco critérios", texto: "Estado proposto para cada critério, com citação literal do trecho que o sustenta." },
  { n: "03", titulo: "Confronto de fontes", texto: "Divergências entre depoimento e registro, com a fonte que prevalece e por quê." },
  { n: "04", titulo: "Homologação", texto: "O analista decide; o parecer é congelado com hash SHA-256 e trilha de auditoria." }
];

const PERFIS = [
  { icone: FileText, titulo: "Analista", texto: "Revisa ponto a ponto e emite o parecer preliminar." },
  { icone: Users, titulo: "Revisor", texto: "Confere a fundamentação e homologa." },
  { icone: ShieldCheck, titulo: "Auditor", texto: "Consulta pareceres, hashes e a trilha completa." }
];

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-14 font-ui text-[var(--c-231f20)]">
      {/* 1. Apresentação: duas colunas */}
      <section className="grid items-center gap-10 pt-6 lg:grid-cols-[1.1fr_0.9fr] lg:pt-12">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-[var(--c-6b6762)]">
            <span className="h-2 w-2 rounded-full bg-[var(--c-a6193c)]" />
            Banco do Nordeste · Lei do Bem
          </span>

          <h1 className="mt-4 text-4xl font-medium leading-[1.12] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            O analista decide.
            <br />
            <span className="text-[var(--c-a6193c)]">O LASTRO fundamenta.</span>
          </h1>
          <span className="mt-4 block h-[3px] w-14 rounded-full bg-[var(--c-f28c00)]" aria-hidden="true" />

          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--c-6b6762)]">
            Transforme relatórios técnicos, código e apontamentos em pareceres de P&amp;D auditáveis,
            protegidos contra glosas do MCTI e da Receita Federal.
          </p>

          {/* Princípio institucional, discreto */}
          <p className="mt-5 flex max-w-xl items-start gap-2.5 border-l-2 border-[var(--c-f28c00)] pl-3 text-sm text-[var(--c-52504e)]">
            <Scale className="mt-0.5 h-4 w-4 shrink-0 text-[var(--c-b06c1e)]" />
            <span>
              <span className="font-medium text-[var(--c-231f20)]">Princípio inviolável:</span> a ferramenta propõe e
              rastreia; o analista decide com soberania.
            </span>
          </p>

          {/* Ações (mesmos destinos de antes) */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/casos"
              className="inline-flex items-center gap-2 rounded-[4px] bg-[var(--c-a6193c)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--c-7e122d)]"
            >
              <span>Acessar Esteira de Casos</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/casos/novo"
              className="inline-flex items-center gap-2 rounded-[4px] border border-[var(--c-c9c6c1)] bg-[var(--c-ffffff)] px-4 py-2.5 text-sm font-medium text-[var(--c-231f20)] transition-colors hover:bg-[var(--c-f3f3f1)]"
            >
              <FolderGit2 className="h-4 w-4 text-[var(--c-6b6762)]" />
              <span>Auditar Novo Projeto</span>
            </Link>
            <Link
              href="/ajuda"
              className="inline-flex items-center gap-2 rounded-[4px] px-4 py-2.5 text-sm font-medium text-[var(--c-6b6762)] transition-colors hover:bg-[var(--c-f3f3f1)] hover:text-[var(--c-231f20)]"
            >
              <HelpCircle className="h-4 w-4 text-[var(--c-b06c1e)]" />
              <span>Guia &amp; Boas Práticas</span>
            </Link>
          </div>
        </div>

        {/* Coluna direita: fotos institucionais em rolagem automática */}
        <CarrosselFotos fotos={FOTOS} className="aspect-[16/10] w-full rounded-2xl bg-[var(--marca-painel)] shadow-[var(--elevado)]" />
      </section>

      {/* 2. Como funciona */}
      <section aria-labelledby="como-funciona">
        <h2 id="como-funciona" className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--c-a6193c)]">
          Como funciona
        </h2>
        <ol className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ETAPAS.map((e) => (
            <li key={e.n} className="border-t border-[var(--c-e0deda)] pt-4">
              <span className="font-id text-xs text-[var(--c-96918a)]">{e.n}</span>
              <h3 className="mt-1 text-sm font-medium">{e.titulo}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--c-6b6762)]">{e.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 3. Para quem */}
      <section aria-labelledby="perfis" className="pb-4">
        <h2 id="perfis" className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--c-a6193c)]">
          Para quem
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-3">
          {PERFIS.map(({ icone: Icone, titulo, texto }) => (
            <li key={titulo} className="flex items-start gap-3 rounded-xl bg-[var(--c-ffffff)] p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--c-f3f3f1)] text-[var(--c-a6193c)]">
                <Icone className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-medium">{titulo}</span>
                <span className="block text-sm text-[var(--c-6b6762)]">{texto}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
