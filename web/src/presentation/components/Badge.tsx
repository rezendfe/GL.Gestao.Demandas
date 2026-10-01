const tomDe = (valor: string) => {
  if (valor === "Concluído" || valor === "Encerrada" || valor === "Liberado para execução") return "ok";
  if (valor === "Reprovado" || valor === "Cancelada" || valor === "Em atraso" || valor === "Reclamação" || valor === "Decisão do GL") return "erro";
  if (valor === "Em andamento" || valor === "Pendente" || valor.startsWith("Aguardando") || valor === "Alta" || valor === "Média") return "amber";
  return "";
};

export function Badge({ valor }: { valor: string }) {
  return <span className={`badge ${tomDe(valor)}`}>{valor}</span>;
}
