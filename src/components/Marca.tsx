import React from "react";
import Image from "next/image";

// Elementos de marca. Os dois arquivos vêm das artes oficiais enviadas pela equipe, só com o
// fundo vermelho removido (mesmos traços e proporções): por isso aparecem sempre sobre as
// superfícies de marca (vinho/vermelho), que não mudam com o tema.

/** Símbolo + nome do LASTRO. */
export function MarcaLastro({ assinatura = true, tamanho = "md" }: { assinatura?: boolean; tamanho?: "md" | "lg" }) {
  const icone = tamanho === "lg" ? "h-10 w-auto" : "h-8 w-auto";
  const nome = tamanho === "lg" ? "text-2xl" : "text-[15px]";
  return (
    <span className="flex items-center gap-2.5">
      <Image src="/marca/lastro-icone.png" alt="" width={105} height={128} className={icone} priority />
      <span className="flex flex-col">
        <span className={`${nome} font-bold tracking-[0.06em] text-white leading-tight font-ui`}>LASTRO</span>
        {assinatura && (
          <span className="hidden xl:block whitespace-nowrap text-[9px] font-medium tracking-[0.14em] text-[var(--c-f28c00)] uppercase leading-tight font-ui">
            O analista decide. O LASTRO fundamenta.
          </span>
        )}
      </span>
    </span>
  );
}

/** Logo completa do Banco do Nordeste (versão negativa, sobre vinho/vermelho). */
export function LogoBNB({ altura = 32 }: { altura?: number }) {
  return (
    <Image
      src="/marca/bnb-negativo.png"
      alt="Banco do Nordeste"
      width={338}
      height={120}
      style={{ height: altura, width: "auto" }}
      priority
    />
  );
}
