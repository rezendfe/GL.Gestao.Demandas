import { areaManutencao } from "./atuacao";
import type { FilaItem, Perfil } from "./types";

export function encerrada(situacao: string) {
  return situacao === "Concluído" || situacao === "Reprovado" || situacao === "Encerrada" || situacao === "Cancelada";
}

export function itensDoRecorte(
  fila: FilaItem[],
  recorte: string | null,
  servico: string | null,
  avisos?: Set<string>,
  atuacao?: string | null,
  cessionario?: string | null,
) {
  return fila.filter((item) => {
    if (servico && item.servico !== servico) return false;
    if (atuacao && areaManutencao(item) !== atuacao) return false;
    if (cessionario && item.cessionario !== cessionario) return false;
    if (recorte === "abertas") return !encerrada(item.situacao);
    if (recorte === "atendimento") return item.situacao === "Em andamento" || item.situacao === "Liberado para execução";
    if (recorte === "entrada" || recorte === "solicitacao") return item.situacao === "Novo" || item.situacao === "Recebido";
    if (recorte === "decisao" || recorte === "aprovacao") return item.situacao === "Aguardando aprovação" || item.situacao === "Aguardando ajuste";
    if (recorte === "validacao") return item.situacao === "Aguardando validação";
    if (recorte === "concluidas") return item.situacao === "Concluído";
    if (recorte === "alta") return item.prioridade === "Alta" && !encerrada(item.situacao);
    if (recorte === "sem-alta") return item.prioridade !== "Alta" && !encerrada(item.situacao);
    if (recorte === "encerramento" || recorte === "conclusao") return encerrada(item.situacao);
    if (recorte === "avisos") return avisos?.has(item.id) ?? false;
    return true;
  });
}

export function rotuloRecorte(recorte: string | null, servico: string | null, atuacao?: string | null, cessionario?: string | null) {
  const nomes: Record<string, string> = {
    abertas: "Em aberto",
    atendimento: "Em atendimento",
    entrada: "Solicitação",
    solicitacao: "Solicitação",
    decisao: "Aprovação",
    aprovacao: "Aprovação",
    validacao: "Validação do cliente",
    concluidas: "Concluídas",
    alta: "Prioridade alta",
    "sem-alta": "Demais em aberto",
    encerramento: "Conclusão",
    conclusao: "Conclusão",
    avisos: "Com aviso",
  };
  return [recorte ? nomes[recorte] ?? recorte : "", atuacao ?? "", servico ?? "", cessionario ?? ""].filter(Boolean).join(" · ");
}

export function destinoRecorte(perfil: Perfil, itens: FilaItem[], recorte: string, servico?: string, atuacao?: string, cessionario?: string) {
  if (itens.length === 1) return `/demandas/${itens[0].id}`;
  const base = perfil === "Cessionário" ? "/minhas" : "/central";
  const params = new URLSearchParams();
  if (recorte) params.set("recorte", recorte);
  if (servico) params.set("servico", servico);
  if (atuacao) params.set("atuacao", atuacao);
  if (cessionario) params.set("cessionario", cessionario);
  const consulta = params.toString();
  return consulta ? `${base}?${consulta}` : base;
}
