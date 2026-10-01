export function normalizarBusca(valor: string) {
  return valor.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function correspondeBusca(protocolo: string, empresa: string, local: string, termo: string) {
  const texto = normalizarBusca(termo.trim());
  if (!texto) return true;
  return normalizarBusca(`${protocolo} ${empresa} ${local}`).includes(texto);
}
