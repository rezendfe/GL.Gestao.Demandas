export interface FotoVistoria {
  id: string;
  legenda: string;
  url: string;
}

export interface EspacoCessionario {
  chave: string;
  email: string;
  nome: string;
  empresa: string;
  telefone: string;
  sala: string;
  foto: string;
  local: {
    titulo: string;
    endereco: string;
    descricao: string;
    foto: string;
  };
  entrega: {
    data: string;
    como: string;
    observacao: string;
    foto: string;
  };
  vistoria: {
    data: string;
    resumo: string;
    fotos: FotoVistoria[];
  };
}

const retrato = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=640&q=80`;
const cena = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`;

export const espacos: EspacoCessionario[] = [
  {
    chave: "sala-205",
    email: "joao.silva@empresaexemplo.com.br",
    nome: "João Silva",
    empresa: "Empresa Exemplo",
    telefone: "(21) 99468-4864",
    sala: "Sala 205",
    foto: retrato("photo-1472099645785-5658abf4ff4e"),
    local: {
      titulo: "Sala 205 · Pavilhão 2",
      endereco: "Riocentro, Pavilhão 2, 2º piso, Sala 205",
      descricao: "Sala comercial de 86 m², com duas salas de reunião, copa e dois banheiros. Face norte, vista para o pátio interno.",
      foto: cena("photo-1497366216548-37526070297c"),
    },
    entrega: {
      data: "12/03/2024",
      como: "Entrega com termo assinado, duas chaves e o laudo de instalações. Pintura nova, pontos elétricos testados e ar-condicionado em funcionamento.",
      observacao: "O Cessionário recebeu o espaço limpo, com piso entregue sem avarias e a lista de pendências zerada.",
      foto: cena("photo-1497366811353-6870744d04b2"),
    },
    vistoria: {
      data: "18/09/2026",
      resumo: "Vistoria periódica. Infiltração no teto próxima à janela, registrada para manutenção hidráulica. Demais itens conformes.",
      fotos: [
        { id: "v1", legenda: "Teto próximo à janela", url: cena("photo-1503387762-592deb58ef4e") },
        { id: "v2", legenda: "Quadro elétrico da sala", url: cena("photo-1621905251189-08b45d6a269e") },
        { id: "v3", legenda: "Piso da recepção", url: cena("photo-1497366754035-f200968a6e72") },
      ],
    },
  },
  {
    chave: "sala-118",
    email: "joao.silva@empresaexemplo.com.br",
    nome: "João Silva",
    empresa: "Empresa Exemplo",
    telefone: "(21) 99468-4864",
    sala: "Sala 118",
    foto: retrato("photo-1472099645785-5658abf4ff4e"),
    local: {
      titulo: "Sala 118 · Pavilhão 1",
      endereco: "Riocentro, Pavilhão 1, 1º piso, Sala 118",
      descricao: "Sala comercial de 42 m², com copa e um banheiro. Face sul, acesso pelo corredor de serviço.",
      foto: cena("photo-1497366754035-f200968a6e72"),
    },
    entrega: {
      data: "03/08/2025",
      como: "Entrega com uma chave e o termo de vistoria inicial. Pontos elétricos testados.",
      observacao: "O Cessionário recebeu o espaço vazio, sem mobiliário do Riocentro.",
      foto: cena("photo-1497366811353-6870744d04b2"),
    },
    vistoria: {
      data: "18/09/2026",
      resumo: "Vistoria periódica sem não conformidades.",
      fotos: [
        { id: "j2", legenda: "Sala de trabalho", url: cena("photo-1497366216548-37526070297c") },
        { id: "j3", legenda: "Copa", url: cena("photo-1497366754035-f200968a6e72") },
      ],
    },
  },
  {
    chave: "sala-102",
    email: "ana.costa@empresab.com.br",
    nome: "Ana Costa",
    empresa: "Empresa B",
    telefone: "(21) 98812-1102",
    sala: "Sala 102",
    foto: retrato("photo-1438761681033-6461ffad8d80"),
    local: {
      titulo: "Sala 102 · Pavilhão 1",
      endereco: "Riocentro, Pavilhão 1, térreo, Sala 102",
      descricao: "Sala de 54 m² com acesso direto ao corredor de serviço.",
      foto: cena("photo-1497366754035-f200968a6e72"),
    },
    entrega: {
      data: "02/06/2023",
      como: "Entrega com chave única e manual de uso do ar-condicionado. Persiana e iluminação revisadas no ato.",
      observacao: "Havia uma marca no rodapé, aceita no termo de entrega.",
      foto: cena("photo-1497366216548-37526070297c"),
    },
    vistoria: {
      data: "04/09/2026",
      resumo: "Vistoria sem não conformidades. Iluminação e fechaduras em ordem.",
      fotos: [
        { id: "b1", legenda: "Porta de acesso", url: cena("photo-1497366811353-6870744d04b2") },
        { id: "b2", legenda: "Área de trabalho", url: cena("photo-1497366754035-f200968a6e72") },
      ],
    },
  },
  {
    chave: "sala-014",
    email: "carla.dias@empresac.com.br",
    nome: "Carla Dias",
    empresa: "Empresa C",
    telefone: "(21) 98700-0014",
    sala: "Sala 014",
    foto: retrato("photo-1544005313-94ddf0286df2"),
    local: {
      titulo: "Sala 014 · Térreo",
      endereco: "Riocentro, acesso de serviço, Sala 014",
      descricao: "Sala de apoio de 32 m², usada como depósito operacional.",
      foto: cena("photo-1581094794329-c8112a89af12"),
    },
    entrega: {
      data: "19/11/2024",
      como: "Entrega com cadeado novo e inventário de prateleiras. Piso lavado e tomadas identificadas.",
      observacao: "O espaço foi entregue vazio, sem mobiliário do Riocentro.",
      foto: cena("photo-1503387762-592deb58ef4e"),
    },
    vistoria: {
      data: "22/08/2026",
      resumo: "Vistoria de rotina. Extintor dentro da validade.",
      fotos: [
        { id: "c1", legenda: "Extintor", url: cena("photo-1581094794329-c8112a89af12") },
        { id: "c2", legenda: "Prateleiras", url: cena("photo-1621905251189-08b45d6a269e") },
      ],
    },
  },
  {
    chave: "acesso-norte",
    email: "diego.alves@empresad.com.br",
    nome: "Diego Alves",
    empresa: "Empresa D",
    telefone: "(21) 98620-4400",
    sala: "Acesso norte",
    foto: retrato("photo-1507003211169-0a1dd7228f2d"),
    local: {
      titulo: "Acesso norte",
      endereco: "Riocentro, portaria norte, box de credenciamento",
      descricao: "Ponto de credenciamento com balcão e duas posições de atendimento.",
      foto: cena("photo-1497366216548-37526070297c"),
    },
    entrega: {
      data: "08/01/2025",
      como: "Entrega com crachás de acesso e o layout do balcão aprovado. Comunicação visual instalada.",
      observacao: "O Cessionário recebeu o ponto montado para operação imediata.",
      foto: cena("photo-1497366811353-6870744d04b2"),
    },
    vistoria: {
      data: "01/09/2026",
      resumo: "Vistoria de circulação. Sinalização e piso antiderrapante conformes.",
      fotos: [
        { id: "d1", legenda: "Balcão", url: cena("photo-1497366754035-f200968a6e72") },
        { id: "d2", legenda: "Piso de acesso", url: cena("photo-1503387762-592deb58ef4e") },
      ],
    },
  },
  {
    chave: "sala-310",
    email: "marina.costa@empresaconecta.com.br",
    nome: "Marina Costa",
    empresa: "Empresa Conecta",
    telefone: "(21) 98510-0310",
    sala: "Sala 310",
    foto: retrato("photo-1580489944761-15a19d654956"),
    local: {
      titulo: "Sala 310 · Pavilhão 3",
      endereco: "Riocentro, Pavilhão 3, 3º piso, Sala 310",
      descricao: "Sala de 70 m² preparada para operação de rede e atendimento.",
      foto: cena("photo-1497366811353-6870744d04b2"),
    },
    entrega: {
      data: "27/04/2025",
      como: "Entrega com infraestrutura de rede identificada, quatro pontos de dados e o termo de aceite da fibra.",
      observacao: "O rack ficou energizado e testado no dia da entrega.",
      foto: cena("photo-1621905251189-08b45d6a269e"),
    },
    vistoria: {
      data: "11/09/2026",
      resumo: "Vistoria técnica. Climatização do rack dentro da faixa combinada.",
      fotos: [
        { id: "m1", legenda: "Rack", url: cena("photo-1621905251189-08b45d6a269e") },
        { id: "m2", legenda: "Sala de atendimento", url: cena("photo-1497366216548-37526070297c") },
      ],
    },
  },
];

export function espacoPorChave(chave: string) {
  return espacos.find((item) => item.chave === chave);
}

export function espacosPorEmail(email: string) {
  return espacos.filter((item) => item.email === email);
}

export function espacoPorEmail(email: string) {
  return espacosPorEmail(email)[0];
}

export function espacoPorSala(sala: string | null | undefined) {
  if (!sala) return undefined;
  const alvo = sala.trim().toLowerCase();
  return espacos.find((item) => item.sala.toLowerCase() === alvo);
}
