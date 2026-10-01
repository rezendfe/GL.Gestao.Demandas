import type { ModeloAbertura } from "./types";

export const PERIODOS_ABERTURA = ["Manhã", "Tarde", "Noite", "Qualquer horário"] as const;

export function modeloPreenchido(modelo: ModeloAbertura | null | undefined) {
  if (!modelo) return false;
  return Boolean(modelo.assunto?.trim() || modelo.ponto?.trim() || modelo.periodo?.trim() || modelo.itens.length > 0);
}
