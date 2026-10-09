// Sessão de demonstração: o login grava uma marca no sessionStorage (vale só para a aba).
// Não é autenticação: serve para que a primeira tela do site seja sempre o login.

const CHAVE_SESSAO = "lastro:sessao";

export function temSessao(): boolean {
  try {
    return sessionStorage.getItem(CHAVE_SESSAO) === "1";
  } catch {
    return false;
  }
}

export function iniciarSessao(): void {
  try {
    sessionStorage.setItem(CHAVE_SESSAO, "1");
  } catch {}
}

export function encerrarSessao(): void {
  try {
    sessionStorage.removeItem(CHAVE_SESSAO);
  } catch {}
}

/** Rota interna para onde voltar depois do login; qualquer outra coisa cai em /casos. */
export function destinoAposLogin(volta: string | null): string {
  if (!volta || !volta.startsWith("/") || volta.startsWith("//") || volta.startsWith("/login")) {
    return "/casos";
  }
  return volta;
}
