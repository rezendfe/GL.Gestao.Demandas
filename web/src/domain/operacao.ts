import { encerrada } from "./recorte";
import type { FilaItem, Perfil } from "./types";

export function emAtraso(item: FilaItem, agora = Date.now()) {
  if (encerrada(item.situacao)) return false;
  if (item.previsaoAtendimento) return new Date(item.previsaoAtendimento).getTime() < agora;
  if (!item.prazoCategoriaHoras || item.prazoCategoriaHoras < 1) return false;
  return new Date(item.abertoEm).getTime() + item.prazoCategoriaHoras * 3_600_000 < agora;
}

export function marcoAtraso(item: FilaItem) {
  if (item.previsaoAtendimento) return item.previsaoAtendimento;
  return new Date(new Date(item.abertoEm).getTime() + (item.prazoCategoriaHoras ?? 0) * 3_600_000).toISOString();
}

export function motivosAcao(item: FilaItem, perfil: Perfil) {
  if (encerrada(item.situacao)) return [];
  const motivos: string[] = [];
  if (emAtraso(item)) motivos.push("Em atraso");
  if (item.situacao === "Novo" || item.situacao === "Recebido") motivos.push("Ainda não iniciado");
  if (perfil === "GL / Administrador" && (item.situacao === "Aguardando aprovação" || item.situacao === "Aguardando ajuste")) {
    motivos.push("Decisão do GL");
  }
  if (item.prioridade === "Alta" && !item.previsaoAtendimento) motivos.push("Alta sem previsão");
  if (item.natureza === "Reclamação") motivos.push("Reclamação em aberto");
  return motivos;
}

export function motivosAtencao(item: FilaItem, perfil: Perfil) {
  const motivos = new Set(motivosAcao(item, perfil));
  if (!encerrada(item.situacao) && item.pendencias > 0) motivos.add("Complemento sem resposta");
  if (!encerrada(item.situacao) && item.prioridade === "Alta") motivos.add("Prioridade alta");
  if (!encerrada(item.situacao) && !item.previsaoAtendimento) {
    const horas = (Date.now() - new Date(item.abertoEm).getTime()) / 3600000;
    if (horas >= 24) motivos.add("Sem previsão há mais de um dia");
  }
  if (perfil === "Responsável da Área" && (item.situacao === "Aguardando aprovação" || item.situacao === "Aguardando ajuste")) {
    motivos.add("Aguarda decisão do GL");
  }
  return [...motivos];
}

export function ordenarPorMotivo(fila: FilaItem[], perfil: Perfil, motivosDe: (item: FilaItem, perfil: Perfil) => string[]) {
  return fila
    .map((item) => ({ item, motivos: motivosDe(item, perfil) }))
    .filter((linha) => linha.motivos.length > 0)
    .sort((a, b) => {
      const atrasoA = a.motivos.includes("Em atraso") ? 0 : 1;
      const atrasoB = b.motivos.includes("Em atraso") ? 0 : 1;
      if (atrasoA !== atrasoB) return atrasoA - atrasoB;
      return new Date(a.item.abertoEm).getTime() - new Date(b.item.abertoEm).getTime();
    });
}

export const COLUNAS_QUADRO = [
  { id: "solicitacao", nome: "Solicitação", detalhe: "Chegou e ainda vai começar", situacoes: ["Novo", "Recebido"] },
  { id: "aprovacao", nome: "Aprovação", detalhe: "Aguarda o GL / Administrador", situacoes: ["Aguardando aprovação", "Aguardando ajuste"] },
  { id: "atendimento", nome: "Atendimento", detalhe: "A área está executando", situacoes: ["Em andamento", "Liberado para execução"] },
  { id: "validacao", nome: "Validação do cliente", detalhe: "O Cessionário confirma o serviço", situacoes: ["Aguardando validação"] },
  { id: "encerramento", nome: "Conclusão", detalhe: "Já teve desfecho", situacoes: ["Concluído", "Reprovado", "Encerrada", "Cancelada"] },
];

export interface FaixaNps {
  nome: string;
  respostas: number;
  media: number | null;
  indice: number | null;
}

export interface ResumoNps {
  respostas: number;
  media: number | null;
  promotores: number;
  neutros: number;
  detratores: number;
  indice: number | null;
  porServico: FaixaNps[];
  comentarios: { id: string; protocolo: string; servico: string; nota: number; comentario: string }[];
}

function indiceDe(notas: number[]) {
  if (notas.length === 0) return null;
  const promotores = notas.filter((nota) => nota >= 9).length;
  const detratores = notas.filter((nota) => nota <= 6).length;
  return Math.round(((promotores - detratores) / notas.length) * 100);
}

function mediaDe(notas: number[]) {
  if (notas.length === 0) return null;
  return Math.round((notas.reduce((soma, nota) => soma + nota, 0) / notas.length) * 10) / 10;
}

export function resumirNps(fila: FilaItem[]): ResumoNps {
  const avaliados = fila.filter((item) => (item.situacao === "Concluído" || item.situacao === "Encerrada") && item.notaAvaliacao !== null);
  const notas = avaliados.map((item) => item.notaAvaliacao as number);
  const porNome = new Map<string, number[]>();
  for (const item of avaliados) {
    const grupo = porNome.get(item.servico) ?? [];
    grupo.push(item.notaAvaliacao as number);
    porNome.set(item.servico, grupo);
  }
  return {
    respostas: notas.length,
    media: mediaDe(notas),
    promotores: notas.filter((nota) => nota >= 9).length,
    neutros: notas.filter((nota) => nota >= 7 && nota <= 8).length,
    detratores: notas.filter((nota) => nota <= 6).length,
    indice: indiceDe(notas),
    porServico: [...porNome.entries()]
      .map(([nome, grupo]) => ({ nome, respostas: grupo.length, media: mediaDe(grupo), indice: indiceDe(grupo) }))
      .sort((a, b) => (a.indice ?? 0) - (b.indice ?? 0)),
    comentarios: avaliados
      .filter((item) => item.comentarioAvaliacao)
      .map((item) => ({
        id: item.id,
        protocolo: item.protocolo,
        servico: item.servico,
        nota: item.notaAvaliacao as number,
        comentario: item.comentarioAvaliacao as string,
      })),
  };
}

export function reclamacoesDe(fila: FilaItem[]) {
  return fila
    .filter((item) => item.natureza === "Reclamação")
    .sort((a, b) => {
      const abertaA = encerrada(a.situacao) ? 1 : 0;
      const abertaB = encerrada(b.situacao) ? 1 : 0;
      if (abertaA !== abertaB) return abertaA - abertaB;
      return new Date(a.abertoEm).getTime() - new Date(b.abertoEm).getTime();
    });
}
