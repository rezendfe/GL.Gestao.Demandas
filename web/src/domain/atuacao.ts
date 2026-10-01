import type { FilaItem, Obra } from "./types";

export const AREAS_MANUTENCAO = [
  "Infiltração",
  "Elétrica",
  "Ar-condicionado",
  "Vaga",
  "Correspondência",
  "Liberação de área",
] as const;

export const ETAPAS_OBRA = ["Projeto", "Análise", "Documentação", "Aprovação", "Execução", "Conclusão"] as const;

const REGRAS: [string, (typeof AREAS_MANUTENCAO)[number]][] = [
  ["infiltracao", "Infiltração"],
  ["eletrica", "Elétrica"],
  ["ar-condicionado", "Ar-condicionado"],
  ["ar condicionado", "Ar-condicionado"],
  ["refrigeracao", "Ar-condicionado"],
  ["estacionamento", "Vaga"],
  ["vaga", "Vaga"],
  ["correspondencia", "Correspondência"],
  ["recepcao", "Correspondência"],
  ["liberacao", "Liberação de área"],
];

export type Faixa = {
  nome: string;
  itens: FilaItem[];
  quantidade: number;
  largura: number;
  atuacao: boolean;
};

function semAcento(valor: string) {
  return valor.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function areaManutencao(item: FilaItem) {
  const texto = semAcento(item.servico);
  return REGRAS.find(([termo]) => texto.includes(termo))?.[1] ?? null;
}

function faixas(grupos: [string, FilaItem[]][], atuacao: boolean): Faixa[] {
  const maior = Math.max(1, ...grupos.map(([, itens]) => itens.length));
  return grupos.map(([nome, itens]) => ({
    nome,
    itens,
    quantidade: itens.length,
    largura: itens.length === 0 ? 0 : Math.round((itens.length / maior) * 100),
    atuacao,
  }));
}

export function distribuirManutencao(fila: FilaItem[]) {
  const mapa = new Map<string, FilaItem[]>(AREAS_MANUTENCAO.map((nome) => [nome, []]));
  for (const item of fila) {
    const area = areaManutencao(item);
    if (!area) continue;
    mapa.get(area)?.push(item);
  }
  return faixas(AREAS_MANUTENCAO.map((nome) => [nome, mapa.get(nome) ?? []]), true);
}

export function porCessionario(fila: FilaItem[]) {
  const mapa = new Map<string, FilaItem[]>();
  for (const item of fila) {
    const grupo = mapa.get(item.cessionario) ?? [];
    grupo.push(item);
    mapa.set(item.cessionario, grupo);
  }
  const grupos = [...mapa.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "pt-BR")).slice(0, 5);
  return faixas(grupos, false);
}

export function oQueMaisVolta(fila: FilaItem[]) {
  const mapa = new Map<string, FilaItem[]>();
  for (const item of fila) {
    if (item.situacao === "Concluído" || item.situacao === "Reprovado" || item.situacao === "Encerrada" || item.situacao === "Cancelada") continue;
    const nome = areaManutencao(item) ?? item.servico;
    const grupo = mapa.get(nome) ?? [];
    grupo.push(item);
    mapa.set(nome, grupo);
  }
  const grupos = [...mapa.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "pt-BR"));
  return faixas(grupos, false).map((faixa) => ({ ...faixa, atuacao: areaManutencao(faixa.itens[0]) === faixa.nome }));
}

export function distribuirObras(obras: Obra[]) {
  const mapa = new Map<string, Obra[]>(ETAPAS_OBRA.map((nome) => [nome, []]));
  for (const obra of obras) {
    if (mapa.has(obra.etapaAtual)) mapa.get(obra.etapaAtual)?.push(obra);
  }
  const maior = Math.max(1, ...[...mapa.values()].map((grupo) => grupo.length));
  return ETAPAS_OBRA.map((nome) => {
    const grupo = mapa.get(nome) ?? [];
    return {
      nome,
      obras: grupo,
      quantidade: grupo.length,
      largura: grupo.length === 0 ? 0 : Math.round((grupo.length / maior) * 100),
    };
  });
}
