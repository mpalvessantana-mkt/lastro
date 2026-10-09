"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  X,
  Send,
  Globe,
  BookOpen,
  ExternalLink,
  RotateCcw
} from "lucide-react";
import { obterCasos, obterParecerPorId } from "@/lib/casos-store";

interface MensagemChat {
  id: string;
  role: "user" | "assistant";
  content: string;
  fontesWeb?: Array<{ title: string; url: string }>;
  normasCitadas?: string[];
  hora: string;
}

const SUGESTOES_RAPIDAS = [
  "O que caracteriza incerteza tecnológica no Frascati?",
  "Como este caso está sendo classificado e por quê?",
  "Pesquisar na internet: decisões do CARF sobre P&D de software",
  "Quais são os 5 critérios da Lei do Bem?"
];

function idMensagem(prefixo: string): string {
  return `${prefixo}-${Date.now()}`;
}

export function Lastrinho() {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const [inputTexto, setInputTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([
    {
      id: "boas-vindas",
      role: "assistant",
      content:
        "Olá! Sou o **Lastrinho**, assistente especialista do Banco do Nordeste em **Lei do Bem** (Lei nº 11.196/2005, IN RFB 1.187 e Manual de Frascati).\n\n" +
        "Estou conectado aos manuais oficiais, à base de casos técnicos e com **acesso à internet em tempo real** para tirar dúvidas sobre enquadramento, novidade ou decisões do CARF. Como posso ajudar?",
      hora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);

  const fimMensagensRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (aberto) {
      fimMensagensRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensagens, aberto]);

  // Identificar caso ativo da tela atual se houver
  const extrairContextoAtual = () => {
    if (!pathname) return undefined;
    const match = pathname.match(/\/casos\/([^\/]+)/);
    if (!match) return undefined;
    const casoId = match[1];
    if (casoId === "novo") return undefined;

    const casos = obterCasos();
    const c = casos.find((x) => x.id === casoId);
    if (!c) return { id: casoId };

    const p = c.parecerAtualId ? obterParecerPorId(c.parecerAtualId) : null;
    return {
      id: c.id,
      titulo: c.titulo,
      equipe: c.equipe,
      classeProposta: p?.classeProposta,
      resumo: c.resumo,
      pontos: p ? Object.fromEntries(
        Object.entries(p.pontos).map(([k, v]) => [
          k,
          { nome: v.nomeCriterio, estado: v.estadoFinal || v.estadoProposto, porque: v.porqueFinal || v.porqueProposto }
        ])
      ) : undefined
    };
  };

  const enviarMensagem = async (textoParaEnviar?: string) => {
    const texto = (textoParaEnviar || inputTexto).trim();
    if (!texto || carregando) return;

    const novaMsgUsuario: MensagemChat = {
      id: idMensagem("user"),
      role: "user",
      content: texto,
      hora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMensagens((prev) => [...prev, novaMsgUsuario]);
    setInputTexto("");
    setCarregando(true);

    try {
      const contexto = extrairContextoAtual();
      const historicoEnvio = [...mensagens, novaMsgUsuario].map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/ia/lastrinho", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historicoEnvio,
          casoId: contexto?.id,
          contextoCaso: contexto
        })
      });

      if (!res.ok) throw new Error("Falha na resposta do assistente");

      const dados = await res.json();

      const novaMsgAssistente: MensagemChat = {
        id: idMensagem("ai"),
        role: "assistant",
        content: dados.resposta || "Sem resposta.",
        fontesWeb: dados.fontesWeb,
        normasCitadas: dados.normasCitadas,
        hora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMensagens((prev) => [...prev, novaMsgAssistente]);
    } catch {
      setMensagens((prev) => [
        ...prev,
        {
          id: idMensagem("erro"),
          role: "assistant",
          content:
            "Desculpe, tive uma oscilação na conexão com a rede. O corpus normativo da Lei do Bem segue ativo no sistema.",
          hora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setCarregando(false);
    }
  };

  const limparConversa = () => {
    setMensagens([
      {
        id: "boas-vindas",
        role: "assistant",
        content: "Conversa reiniciada. Em que posso te apoiar agora na análise do projeto?",
        hora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  };

  return (
    <>
      {/* BOTÃO FLUTUANTE INFERIOR DIREITO */}
      {!aberto && (
        <button
          onClick={() => setAberto(true)}
          className="fixed bottom-6 right-6 z-40 bg-[var(--c-a6193c)] hover:bg-[var(--c-851430)] text-white px-4 py-3 rounded-[4px] shadow-lg flex items-center gap-2.5 transition-all hover:scale-105 group border border-[var(--c-ff8a22)]/50 font-ui"
          title="Abrir Assistente Lastrinho (Lei do Bem & Web)"
        >
          <div className="w-6 h-6 rounded-[2px] bg-white/15 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-[var(--c-ff8a22)] animate-pulse" />
          </div>
          <span className="text-xs font-bold tracking-tight">Lastrinho</span>
          <span className="w-2 h-2 rounded-full bg-[var(--c-ff8a22)] ring-2 ring-white/30 animate-pulse" />
        </button>
      )}

      {/* PAINEL FLUTUANTE EXPANDIDO */}
      {aberto && (
        <div className="fixed bottom-6 right-6 z-40 w-[95vw] sm:w-[430px] h-[620px] max-h-[85vh] bg-[var(--c-ffffff)] rounded-[4px] shadow-2xl border border-[var(--c-e0deda)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200 font-ui">
          {/* CABEÇALHO DO LASTRINHO */}
          <div className="p-4 bg-[var(--c-a6193c)] text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[4px] bg-white/15 flex items-center justify-center border border-white/10">
                <Sparkles className="w-4 h-4 text-[var(--c-ff8a22)]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold tracking-tight">Lastrinho</h3>
                  <span className="text-[10px] bg-white/20 text-orange-100 px-1.5 py-0.2 rounded-[2px] font-mono">
                    BNB INTELIGÊNCIA
                  </span>
                </div>
                <div className="text-[10px] text-white/80 flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center gap-0.5">
                    <BookOpen className="w-3 h-3 text-[var(--c-ff8a22)]" /> Lei do Bem
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-0.5">
                    <Globe className="w-3 h-3 text-orange-200" /> Web Conectada
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-white/80">
              <button
                onClick={limparConversa}
                className="p-1.5 hover:bg-white/15 rounded-[4px] transition-colors"
                title="Limpar conversa"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setAberto(false)}
                className="p-1.5 hover:bg-white/15 rounded-[4px] transition-colors"
                title="Minimizar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ÁREA DE MENSAGENS */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[var(--c-f3f3f1)] text-xs">
            {mensagens.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[88%] p-3 rounded-[4px] shadow-2xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[var(--c-a6193c)] text-white"
                      : "bg-[var(--c-ffffff)] text-[var(--c-231f20)] border border-[var(--c-e0deda)]"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Links de Grounding da Web (Google Search) */}
                  {msg.fontesWeb && msg.fontesWeb.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-[var(--c-e0deda)] space-y-1">
                      <span className="text-[10px] font-bold text-[var(--c-52504e)] uppercase tracking-wider block flex items-center gap-1">
                        <Globe className="w-3 h-3 text-[var(--c-a6193c)]" /> Fontes da Internet:
                      </span>
                      <ul className="space-y-0.5">
                        {msg.fontesWeb.map((f, idx) => (
                          <li key={idx} className="truncate">
                            <a
                              href={f.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-[var(--c-a6193c)] hover:underline inline-flex items-center gap-1"
                            >
                              <ExternalLink className="w-2.5 h-2.5" /> {f.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div
                    className={`text-[9px] mt-1 text-right ${
                      msg.role === "user" ? "text-white/70" : "text-[var(--c-757371)]"
                    }`}
                  >
                    {msg.hora}
                  </div>
                </div>
              </div>
            ))}

            {carregando && (
              <div className="flex items-center gap-2 p-3 bg-[var(--c-ffffff)] border border-[var(--c-e0deda)] rounded-[4px] max-w-[70%] text-xs text-[var(--c-52504e)]">
                <Sparkles className="w-3.5 h-3.5 text-[var(--c-ff8a22)] animate-spin" />
                <span>Consultando normas e pesquisando na web...</span>
              </div>
            )}

            <div ref={fimMensagensRef} />
          </div>

          {/* SUGESTÕES RÁPIDAS (CHIPS) */}
          <div className="px-3 py-2 bg-[var(--c-ffffff)] border-t border-[var(--c-e0deda)] overflow-x-auto whitespace-nowrap scrollbar-none flex gap-1.5">
            {SUGESTOES_RAPIDAS.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => enviarMensagem(sug)}
                disabled={carregando}
                className="text-[11px] bg-[var(--c-f3f3f1)] hover:bg-[var(--c-fff3e8)] hover:text-[var(--c-a6193c)] text-[var(--c-52504e)] px-2.5 py-1 rounded-[4px] border border-[var(--c-e0deda)] transition-colors shrink-0 disabled:opacity-50"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* CAMPO DE ENTRADA */}
          <div className="p-3 bg-[var(--c-ffffff)] border-t border-[var(--c-e0deda)]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                enviarMensagem();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputTexto}
                onChange={(e) => setInputTexto(e.target.value)}
                placeholder="Pergunte sobre leis, Frascati ou o caso..."
                className="flex-1 text-xs px-3 py-2 bg-[var(--c-ffffff)] border border-[var(--c-e0deda)] rounded-[4px] focus:outline-none focus:border-[var(--c-a6193c)] text-[var(--c-231f20)]"
                disabled={carregando}
              />
              <button
                type="submit"
                disabled={carregando || !inputTexto.trim()}
                className="p-2 bg-[var(--c-a6193c)] hover:bg-[var(--c-851430)] disabled:opacity-40 text-white rounded-[4px] transition-colors shrink-0"
                title="Enviar pergunta"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <div className="text-[10px] text-[var(--c-757371)] text-center mt-1.5">
              O Lastrinho propõe e fundamenta; a decisão final é do analista.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
