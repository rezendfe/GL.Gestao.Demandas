import { useEffect, useState } from "react";

const CHAVE = "gl.vista-fila";

export type VistaFila = "grade" | "cartoes" | "pulso";

const VALIDAS = new Set<VistaFila>(["grade", "cartoes", "pulso"]);

function ler(usuarioId: string): VistaFila {
  try {
    const valor = localStorage.getItem(`${CHAVE}.${usuarioId}`);
    if (valor && VALIDAS.has(valor as VistaFila)) return valor as VistaFila;
  } catch {
    /* a opção segue o padrão se o navegador bloquear o armazenamento */
  }
  return "grade";
}

function guardar(usuarioId: string, vista: VistaFila) {
  try {
    localStorage.setItem(`${CHAVE}.${usuarioId}`, vista);
  } catch {
    /* a opção segue só nesta visita se o navegador bloquear o armazenamento */
  }
}

export function useVistaFila(usuarioId: string | undefined) {
  const [vista, setVista] = useState<VistaFila>(() => (usuarioId ? ler(usuarioId) : "grade"));

  useEffect(() => {
    setVista(usuarioId ? ler(usuarioId) : "grade");
  }, [usuarioId]);

  function definir(valor: VistaFila) {
    setVista(valor);
    if (usuarioId) guardar(usuarioId, valor);
  }

  return [vista, definir] as const;
}
