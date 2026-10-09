"use client";

import React, { createContext, useContext, useState } from "react";
import { useCarregarNoCliente } from "@/lib/use-carregar-no-cliente";
import { Papel } from "@/types";

export interface Usuario {
  nome: string;
  papel: Papel;
  email: string;
  cargo: string;
}

const USUARIOS_DEMO: Record<Papel, Usuario> = {
  analista: {
    nome: "Ana Ribeiro",
    papel: "analista",
    email: "ana.ribeiro@bnb.gov.br",
    cargo: "Analista de Inovação e P&D"
  },
  revisor: {
    nome: "Carlos Mendes",
    papel: "revisor",
    email: "carlos.mendes@bnb.gov.br",
    cargo: "Revisor Técnico Senior"
  },
  auditor: {
    nome: "Mariana Costa",
    papel: "auditor",
    email: "mariana.costa@bnb.gov.br",
    cargo: "Auditora Interna"
  }
};

interface AuthContextType {
  usuario: Usuario;
  trocarPapel: (papel: Papel) => void;
  usuariosDisponiveis: typeof USUARIOS_DEMO;
}

const AuthContext = createContext<AuthContextType>({
  usuario: USUARIOS_DEMO.analista,
  trocarPapel: () => {},
  usuariosDisponiveis: USUARIOS_DEMO
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [papel, setPapel] = useState<Papel>("analista");

  useCarregarNoCliente("papel", () => {
    const salvo = localStorage.getItem("lastro_papel_ativo") as Papel;
    if (salvo && USUARIOS_DEMO[salvo]) {
      setPapel(salvo);
    }
  });

  const trocarPapel = (novoPapel: Papel) => {
    setPapel(novoPapel);
    localStorage.setItem("lastro_papel_ativo", novoPapel);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario: USUARIOS_DEMO[papel],
        trocarPapel,
        usuariosDisponiveis: USUARIOS_DEMO
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
