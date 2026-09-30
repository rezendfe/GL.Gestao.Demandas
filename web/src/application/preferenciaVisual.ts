import { useEffect, useState } from "react";

const CHAVE = "gl.visualizacao-atendimento";

function ler(usuarioId: string): boolean {
  try {
    return localStorage.getItem(`${CHAVE}.${usuarioId}`) === "linha-do-tempo";
  } catch {
    return false;
  }
}

function guardar(usuarioId: string, linhaDoTempo: boolean) {
  try {
    localStorage.setItem(`${CHAVE}.${usuarioId}`, linhaDoTempo ? "linha-do-tempo" : "painel");
  } catch {
    /* a opção segue só nesta visita se o navegador bloquear o armazenamento */
  }
}

export function useLinhaDoTempo(usuarioId: string | undefined) {
  const [ativa, setAtiva] = useState(() => (usuarioId ? ler(usuarioId) : false));

  useEffect(() => {
    setAtiva(usuarioId ? ler(usuarioId) : false);
  }, [usuarioId]);

  function definir(valor: boolean) {
    setAtiva(valor);
    if (usuarioId) guardar(usuarioId, valor);
  }

  return [ativa, definir] as const;
}
