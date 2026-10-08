"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Palavras } from "@/components/PalavrasAnimadas";
import { useAuth } from "@/contexts/AuthContext";
import { Papel } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const { trocarPapel } = useAuth();
  const [papel, setPapel] = useState<Papel>("analista");
  const [matricula, setMatricula] = useState("");
  const [senha, setSenha] = useState("");
  const [codigo, setCodigo] = useState("");
  const [aceite, setAceite] = useState(false);
  const [erro, setErro] = useState("");

  function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!matricula.trim() || !senha) {
      return setErro("Informe matrícula e senha.");
    }
    if (!/^\d{6}$/.test(codigo)) {
      return setErro("Digite o código de 6 dígitos.");
    }
    if (!aceite) {
      return setErro("Aceite o aviso de privacidade para entrar.");
    }

    // Persiste papel selecionado no contexto e storage
    trocarPapel(papel);
    if (typeof window !== "undefined") {
      localStorage.setItem("lastro_papel_ativo", papel);
      sessionStorage.setItem("lastro:sessao", "1");
    }

    // Redireciona para a esteira de casos
    router.replace("/casos");
  }

  const campo =
    "w-full rounded-lg border-[1.5px] border-[#EADFDC] bg-white px-3 py-2.5 text-sm text-[#2A1418] focus:outline-none focus:border-[#A71633] transition-colors";

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Coluna Esquerda: Marca e Apresentação */}
      <section className="relative flex min-h-[320px] flex-col justify-between overflow-hidden bg-[#A71633] p-8 text-white md:p-14">
        <div className="z-10 flex items-center gap-3">
          <div className="relative h-10 w-40">
            <Image
              src="/logo-bnb.png"
              alt="Banco do Nordeste"
              width={160}
              height={56}
              className="h-10 w-auto object-contain"
              priority
            />
          </div>
        </div>

        <div className="relative z-10 my-auto py-8">
          <h1 className="max-w-[14ch] text-4xl font-extrabold tracking-tight md:text-5xl leading-tight">
            <Palavras texto="Parecer da Lei do Bem, sem fila." />
          </h1>
          <p className="mt-4 max-w-[34ch] text-base opacity-90 leading-relaxed">
            <Palavras
              texto="Envie o projeto, receba a análise e acompanhe a homologação em um só lugar."
              inicio={1.65}
              passo={0.07}
            />
          </p>
        </div>

        {/* Detalhe geométrico institucional */}
        <div 
          className="absolute -bottom-20 -right-20 h-72 w-72 rounded-[80px] border-[46px] border-[#F28C00] pointer-events-none" 
          aria-hidden="true" 
        />
      </section>

      {/* Coluna Direita: Formulário */}
      <section className="flex items-center justify-center bg-white p-8">
        <form onSubmit={entrar} className="grid w-full max-w-sm gap-4" noValidate>
          <div>
            <h2 className="text-2xl font-bold text-[#2A1418]">Entrar</h2>
            <p className="text-sm text-[#74605F]">Acesso restrito a analistas credenciados.</p>
          </div>

          <label className="grid gap-1.5 text-sm font-semibold text-[#2A1418]">
            Perfil
            <select
              className={campo}
              value={papel}
              onChange={(e) => setPapel(e.target.value as Papel)}
            >
              <option value="analista">Analista</option>
              <option value="revisor">Revisor</option>
              <option value="auditor">Auditor</option>
            </select>
          </label>

          <label className="grid gap-1.5 text-sm font-semibold text-[#2A1418]">
            Matrícula ou e-mail corporativo
            <input
              className={campo}
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              autoComplete="username"
              placeholder="ex: ana.ribeiro ou 012345"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-semibold text-[#2A1418]">
            Senha
            <input
              className={campo}
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-semibold text-[#2A1418]">
            Código de verificação (6 dígitos)
            <input
              className={campo}
              inputMode="numeric"
              maxLength={6}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
            />
          </label>

          <label className="flex items-start gap-2.5 text-sm text-[#74605F] cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 h-[18px] w-[18px] accent-[#A71633] cursor-pointer"
              checked={aceite}
              onChange={(e) => setAceite(e.target.checked)}
            />
            <span>Li o aviso de privacidade e sei que meus acessos ficam registrados.</span>
          </label>

          {erro ? (
            <p className="min-h-5 text-sm font-medium text-[#A71633]" role="alert">
              {erro}
            </p>
          ) : (
            <div className="min-h-5" />
          )}

          <button
            type="submit"
            className="rounded-lg bg-[#A71633] py-3 font-bold text-white transition-colors hover:bg-[#85112a] active:bg-[#6e0e22] cursor-pointer"
          >
            Entrar
          </button>

          <small className="text-center text-xs text-[#74605F]">
            Protótipo: qualquer matrícula, senha e código (ex: 123456) funcionam.
          </small>
        </form>
      </section>
    </div>
  );
}
