import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Sessao } from "../domain/types";
import { guardarSessao, lerSessao, limparSessao, api } from "../infrastructure/api/client";

interface SessaoContexto {
  sessao: Sessao | null;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => void;
}

const Contexto = createContext<SessaoContexto | null>(null);

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(() => lerSessao());
  const valor = useMemo<SessaoContexto>(() => ({
    sessao,
    entrar: async (email, senha) => {
      const nova = await api.login(email, senha);
      guardarSessao(nova);
      setSessao(nova);
    },
    sair: () => {
      limparSessao();
      setSessao(null);
    },
  }), [sessao]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("Sessão indisponível.");
  return ctx;
}
