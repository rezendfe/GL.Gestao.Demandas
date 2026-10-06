import { useEffect, useState } from "react";

const CHAVE = "gl.vista-agenda";

export type VistaAgenda = "mes" | "semana" | "dia";

const VALIDAS = new Set<VistaAgenda>(["mes", "semana", "dia"]);

export function lerVistaAgenda(usuarioId: string | undefined): VistaAgenda {
  if (!usuarioId) return "mes";
  try {
    const valor = localStorage.getItem(`${CHAVE}.${usuarioId}`);
    if (valor && VALIDAS.has(valor as VistaAgenda)) return valor as VistaAgenda;
  } catch {
    /* a opção segue o mês se o navegador bloquear o armazenamento */
  }
  return "mes";
}

function guardar(usuarioId: string, vista: VistaAgenda) {
  try {
    localStorage.setItem(`${CHAVE}.${usuarioId}`, vista);
  } catch {
    /* a opção segue só nesta visita se o navegador bloquear o armazenamento */
  }
}

export function useVistaAgenda(usuarioId: string | undefined) {
  const [vista, setVista] = useState<VistaAgenda>(() => lerVistaAgenda(usuarioId));

  useEffect(() => {
    setVista(lerVistaAgenda(usuarioId));
  }, [usuarioId]);

  function definir(valor: VistaAgenda) {
    setVista(valor);
    if (usuarioId) guardar(usuarioId, valor);
  }

  return [vista, definir] as const;
}
