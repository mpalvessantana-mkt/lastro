"use client";

import { useState, useSyncExternalStore } from "react";

const semAssinatura = () => () => {};

/** false no servidor e na hidratação; true depois, no navegador. */
export function useMontado(): boolean {
  return useSyncExternalStore(
    semAssinatura,
    () => true,
    () => false
  );
}

/**
 * Executa `carregar` uma vez por `chave`, já no navegador (o localStorage não existe no
 * servidor). Substitui o `useEffect(() => setX(lerDoStorage()), [chave])`: o estado é
 * ajustado durante a renderização, sem a renderização extra que o efeito provoca.
 */
export function useCarregarNoCliente(chave: string, carregar: () => void): boolean {
  const montado = useMontado();
  const [carregadoPara, setCarregadoPara] = useState<string | null>(null);
  if (montado && carregadoPara !== chave) {
    setCarregadoPara(chave);
    carregar();
  }
  return montado;
}
