import type { CadeiaTipo, EtapaCadeia, Perfil, TarefaCadeia } from "./types";

export const COLUNAS_CADEIA = [
  { codigo: "solicitacao", nome: "Solicitação", detalhe: "Chegou e ainda vai começar", situacoes: ["Novo", "Recebido"] },
  { codigo: "aprovacao", nome: "Aprovação", detalhe: "Aguarda o GL / Administrador", situacoes: ["Aguardando aprovação", "Aguardando ajuste"] },
  { codigo: "atendimento", nome: "Atendimento", detalhe: "A área está executando", situacoes: ["Em andamento", "Liberado para execução"] },
  { codigo: "validacao", nome: "Validação do cliente", detalhe: "O Cessionário confirma o serviço", situacoes: ["Aguardando validação"] },
  { codigo: "conclusao", nome: "Conclusão", detalhe: "Já teve desfecho", situacoes: ["Concluído", "Reprovado"] },
];

export const CAMPOS_DA_ETAPA: Record<string, { id: string; rotulo: string }[]> = {
  solicitacao: [],
  aprovacao: [
    { id: "comentario", rotulo: "Observação" },
    { id: "anexo", rotulo: "Anexo" },
  ],
  atendimento: [
    { id: "comentario", rotulo: "Registro do atendimento" },
    { id: "previsao", rotulo: "Previsão de atendimento" },
    { id: "anexo", rotulo: "Anexo" },
  ],
  validacao: [
    { id: "comentario", rotulo: "O que foi feito" },
    { id: "anexo", rotulo: "Anexo" },
  ],
  conclusao: [
    { id: "comentario", rotulo: "Registro da conclusão" },
    { id: "anexo", rotulo: "Anexo" },
  ],
};

const CAMPOS_PADRAO: Record<string, string[]> = {
  solicitacao: [],
  aprovacao: ["comentario"],
  atendimento: ["comentario", "previsao"],
  validacao: ["comentario"],
  conclusao: [],
};

export function tarefasDa(etapa: EtapaCadeia): TarefaCadeia[] {
  if (etapa.tarefas?.length) return etapa.tarefas;
  return (etapa.campos ?? []).map((codigo) => ({ codigo, obrigatoria: true }));
}

export function etapasPadrao(): EtapaCadeia[] {
  return COLUNAS_CADEIA.map((coluna, indice) => {
    const campos = CAMPOS_PADRAO[coluna.codigo] ?? [];
    return {
      codigo: coluna.codigo,
      nome: coluna.nome,
      ordem: indice + 1,
      automatica: false,
      campos,
      tarefas: campos.map((codigo) => ({ codigo, obrigatoria: true })),
    };
  });
}

export function cadeiaDoTipo(cadeias: CadeiaTipo[] | null, subcategoriaId: string) {
  return cadeias?.find((item) => item.subcategoriaId === subcategoriaId)?.etapas ?? etapasPadrao();
}

export function colunaDe(situacao: string) {
  return COLUNAS_CADEIA.find((coluna) => coluna.situacoes.includes(situacao))?.codigo ?? null;
}

export function proximaEtapa(situacao: string, etapas: EtapaCadeia[]) {
  if (situacao === "Concluído" || situacao === "Reprovado" || situacao === "Aguardando ajuste") return null;
  const codigo = colunaDe(situacao);
  const atual = etapas.find((etapa) => etapa.codigo === codigo);
  if (!atual) return null;
  return etapas
    .filter((etapa) => etapa.ordem > atual.ordem && !etapa.automatica)
    .sort((a, b) => a.ordem - b.ordem)[0] ?? null;
}

export function podeAvancar(perfil: Perfil, situacao: string, destino: string) {
  if (situacao === "Aguardando validação" && destino === "conclusao") return perfil === "Cessionário";
  if (destino === "aprovacao" || situacao === "Aguardando aprovação") return perfil === "GL / Administrador";
  return perfil === "GL / Administrador" || perfil === "Responsável da Área";
}

export function rotuloCampo(destino: string, campo: string) {
  if (destino === "aprovacao" && campo === "comentario") return "Observação da aprovação";
  if (destino === "atendimento" && campo === "comentario") return "O que será feito";
  if (destino === "validacao" && campo === "comentario") return "O que foi feito";
  if (destino === "conclusao" && campo === "comentario") return "Registro da conclusão";
  return CAMPOS_DA_ETAPA[destino]?.find((item) => item.id === campo)?.rotulo ?? campo;
}
