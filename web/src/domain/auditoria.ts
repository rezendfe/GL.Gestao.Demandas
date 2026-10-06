import type { EventoAuditoria } from "./types";
import { horaCurta } from "./types";

const ROTULOS: Record<string, string> = {
  ABERTURA: "Abriu o chamado",
  RECLAMACAO: "Registrou reclamação",
  CLASSIFICACAO: "Classificou o atendimento",
  REDIRECIONAMENTO: "Direcionou o atendimento",
  ANDAMENTO: "Atualizou o andamento",
  VALIDACAO: "Validou o atendimento",
  CADEIA: "Avançou na cadeia",
  PREVISAO: "Definiu a previsão",
  AVALIACAO: "Avaliou o atendimento",
  MENSAGEM: "Enviou uma mensagem",
  ANEXO: "Anexou um documento",
  ENCERRAMENTO: "Encerrou",
  CANCELAMENTO: "Cancelou o chamado",
  APROVACAO: "Registrou uma decisão",
  NOTIFICACAO: "Registrou uma notificação",
  PUBLICACAO: "Publicou um comunicado",
  LEITURA: "Leu um comunicado",
};

const CORES: Record<string, string> = {
  ABERTURA: "#7047ee",
  RECLAMACAO: "#e11d48",
  CLASSIFICACAO: "#3b82f6",
  REDIRECIONAMENTO: "#0ea5e9",
  ANDAMENTO: "#16a34a",
  VALIDACAO: "#0f766e",
  CADEIA: "#7c3aed",
  PREVISAO: "#d97706",
  AVALIACAO: "#f5a524",
  MENSAGEM: "#2563eb",
  ANEXO: "#9333ea",
  ENCERRAMENTO: "#64748b",
  CANCELAMENTO: "#e11d48",
  APROVACAO: "#16a34a",
  NOTIFICACAO: "#0ea5e9",
  PUBLICACAO: "#7047ee",
  LEITURA: "#3b82f6",
};

export function rotuloAcao(tipo: string) {
  return ROTULOS[tipo] ?? "Registrou uma ação";
}

export function corAcao(tipo: string) {
  return CORES[tipo] ?? "#3b82f6";
}

export function destinoAuditoria(evento: EventoAuditoria) {
  if (!evento.alvoId) return undefined;
  if (evento.origem === "comunicado") return `/comunicados/${evento.alvoId}`;
  return `/demandas/${evento.alvoId}`;
}

export function detalheAuditoria(evento: EventoAuditoria) {
  const mudanca = evento.statusAnterior && evento.statusAnterior !== evento.statusNovo
    ? `${evento.statusAnterior} → ${evento.statusNovo}`
    : "";
  return [evento.referencia, mudanca, evento.comentario].filter(Boolean).join(" · ");
}

export function horaAuditoria(iso: string) {
  return horaCurta(iso);
}
