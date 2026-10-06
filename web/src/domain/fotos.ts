const retrato = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=640&q=80`;

const FOTOS_EMAIL: Record<string, string> = {
  "joao.silva@empresaexemplo.com.br": retrato("photo-1472099645785-5658abf4ff4e"),
  "ana.costa@empresab.com.br": retrato("photo-1438761681033-6461ffad8d80"),
  "carla.dias@empresac.com.br": retrato("photo-1544005313-94ddf0286df2"),
  "diego.alves@empresad.com.br": retrato("photo-1507003211169-0a1dd7228f2d"),
  "marina.costa@empresaconecta.com.br": retrato("photo-1580489944761-15a19d654956"),
  "patricia.lima@gleventos.com.br": retrato("photo-1573496359142-b8d87734a5a2"),
  "responsavel.01@gleventos.com.br": retrato("photo-1560250097-0b93528c311a"),
  "responsavel.02@gleventos.com.br": retrato("photo-1573497019940-1c28c88b4f3e"),
  "responsavel.03@gleventos.com.br": retrato("photo-1519085360753-af0119f7cbe7"),
};

const FOTOS_NOME: Record<string, string> = {
  "joao silva": FOTOS_EMAIL["joao.silva@empresaexemplo.com.br"],
  "ana costa": FOTOS_EMAIL["ana.costa@empresab.com.br"],
  "carla dias": FOTOS_EMAIL["carla.dias@empresac.com.br"],
  "diego alves": FOTOS_EMAIL["diego.alves@empresad.com.br"],
  "marina costa": FOTOS_EMAIL["marina.costa@empresaconecta.com.br"],
  "patricia lima": FOTOS_EMAIL["patricia.lima@gleventos.com.br"],
  "responsavel 01": FOTOS_EMAIL["responsavel.01@gleventos.com.br"],
  "responsavel 02": FOTOS_EMAIL["responsavel.02@gleventos.com.br"],
  "responsavel 03": FOTOS_EMAIL["responsavel.03@gleventos.com.br"],
};

function chave(valor: string) {
  return valor.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

export function fotoPorPessoa(nome: string, email?: string | null, cadastrada?: string | null) {
  if (cadastrada) return cadastrada;
  const porEmail = email ? FOTOS_EMAIL[email.trim().toLowerCase()] : undefined;
  if (porEmail) return porEmail;
  return FOTOS_NOME[chave(nome)] ?? null;
}
