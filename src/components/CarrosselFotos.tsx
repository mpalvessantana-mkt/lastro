"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface Foto {
  src: string;
  alt: string;
  /**
   * "cobrir": preenche o painel (para peças em paisagem cujo texto fica longe das bordas).
   * "conter": mostra a peça inteira sobre `fundo` — use a cor de fundo da própria peça para
   * que ela se funda ao painel, sem moldura aparente.
   */
  ajuste?: "cobrir" | "conter";
  fundo?: string;
}

const INTERVALO_MS = 5000;

/**
 * Carrossel de fotos com troca automática e transição suave (esmaecimento com leve zoom e
 * desfoque; aproximação lenta na foto ativa). Pausa com o mouse em cima, com foco de teclado
 * dentro e com a aba oculta; sem movimento automático para quem prefere movimento reduzido.
 */
export function CarrosselFotos({ fotos, className = "" }: { fotos: Foto[]; className?: string }) {
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [movimentoReduzido, setMovimentoReduzido] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const total = fotos.length;

  const ir = useCallback((i: number) => setAtual(((i % total) + total) % total), [total]);

  useEffect(() => {
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
    const aplicar = () => setMovimentoReduzido(consulta.matches);
    aplicar();
    consulta.addEventListener("change", aplicar);
    return () => consulta.removeEventListener("change", aplicar);
  }, []);

  useEffect(() => {
    if (pausado || movimentoReduzido || total < 2) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") setAtual((a) => (a + 1) % total);
    }, INTERVALO_MS);
    return () => window.clearInterval(id);
  }, [pausado, movimentoReduzido, total]);

  if (total === 0) return null;

  return (
    <div
      ref={raiz}
      className={`group relative isolate overflow-hidden ${className}`}
      role="region"
      aria-roledescription="carrossel"
      aria-label="Fotos institucionais do Banco do Nordeste"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={(e) => {
        if (!raiz.current?.contains(e.relatedTarget as Node)) setPausado(false);
      }}
    >
      {fotos.map((f, i) => {
        const ativa = i === atual;
        const cobrir = (f.ajuste ?? "conter") === "cobrir";
        return (
          <div
            key={f.src}
            className={`absolute inset-0 transition-[opacity,transform,filter] duration-[1100ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none ${
              ativa ? "z-10 opacity-100 scale-100 blur-0" : "z-0 opacity-0 scale-[1.04] blur-[2px]"
            }`}
            style={{ backgroundColor: f.fundo }}
            aria-hidden={!ativa}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} de ${total}`}
          >
            {/* Peça em retrato: inteira, com folga embaixo para os indicadores; o fundo é a cor dela */}
            <div className={cobrir ? "absolute inset-0" : "absolute inset-x-4 top-4 bottom-10"}>
              <Image
                src={f.src}
                alt={f.alt}
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className={`${cobrir ? "object-cover" : "object-contain"} ${ativa ? "carrossel-aproximar" : ""}`}
                priority={i === 0}
              />
            </div>
          </div>
        );
      })}

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => ir(atual - 1)}
            aria-label="Foto anterior"
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/50 focus-visible:opacity-100 group-hover:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => ir(atual + 1)}
            aria-label="Próxima foto"
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/50 focus-visible:opacity-100 group-hover:opacity-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          {/* Indicadores no canto: no centro cobririam a logo da peça em paisagem */}
          <div className="absolute bottom-3 right-4 z-20 flex gap-2 rounded-full bg-black/25 px-2.5 py-1.5 backdrop-blur-sm">
            {fotos.map((f, i) => (
              <button
                key={f.src}
                type="button"
                onClick={() => ir(i)}
                aria-label={`Mostrar foto ${i + 1} de ${total}`}
                aria-current={i === atual}
                className={`h-2 rounded-full transition-all duration-500 ${i === atual ? "w-5 bg-[var(--c-f28c00)]" : "w-2 bg-white/70 hover:bg-white"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
