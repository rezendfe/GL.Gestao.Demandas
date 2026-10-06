export interface FotoVistoria {
  id: string;
  legenda: string;
  url: string;
}

export interface EspacoCessionario {
  chave: string;
  codigo: string;
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
    fachada: string;
    interior: string;
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

const vitrineVazia = cena("photo-1742715362429-93588588b6ea");
const corredorVazio = cena("photo-1748731268804-061cffd76797");
const salaoBranco = cena("photo-1641159930908-e9eb9ccdc002");
const salaoVidro = cena("photo-1753596109465-565b8fc96300");
const salaoClaro = cena("photo-1722604819704-78b6d9c26ea9");
const salaoCurvo = cena("photo-1687938627893-e181901fc7e0");

export const espacos: EspacoCessionario[] = [
  {
    chave: "sala-205",
    codigo: "SALA-205",
    email: "joao.silva@empresaexemplo.com.br",
    nome: "João Silva",
    empresa: "Empresa Exemplo",
    telefone: "(21) 99468-4864",
    sala: "Loja 205",
    foto: retrato("photo-1472099645785-5658abf4ff4e"),
    local: {
      titulo: "Loja 205 · Moda",
      endereco: "Shopping, 2º piso, loja 205, em frente ao corredor principal",
      descricao: "Loja de 86 m² disponível para locação. Vitrine e salão vazios, com provador e depósito livres, pé-direito livre e ponto de ar-condicionado no forro.",
      fachada: vitrineVazia,
      interior: salaoBranco,
    },
    entrega: {
      data: "12/03/2024",
      como: "Entrega com termo assinado, duas chaves e o laudo das instalações. Vitrine limpa, piso entregue sem avarias e o quadro elétrico testado.",
      observacao: "A loja foi recebida vazia, pronta para a montagem do Cessionário.",
      foto: salaoClaro,
    },
    vistoria: {
      data: "18/09/2026",
      resumo: "Vistoria periódica. A loja segue vazia e disponível para locação.",
      fotos: [
        { id: "v1", legenda: "Corredor com lojas vazias", url: corredorVazio },
        { id: "v2", legenda: "Salão vazio", url: salaoVidro },
        { id: "v3", legenda: "Vitrine sem exposição", url: salaoCurvo },
      ],
    },
  },
  {
    chave: "sala-118",
    codigo: "SALA-118",
    email: "joao.silva@empresaexemplo.com.br",
    nome: "João Silva",
    empresa: "Empresa Exemplo",
    telefone: "(21) 99468-4864",
    sala: "Loja 118",
    foto: retrato("photo-1472099645785-5658abf4ff4e"),
    local: {
      titulo: "Loja 118 · Vestuário",
      endereco: "Shopping, 1º piso, loja 118, vitrine para a praça interna",
      descricao: "Loja de 42 m² disponível para locação. Vitrine e salão vazios, com banheiro e copa. Acesso pelo corredor de lojas.",
      fachada: corredorVazio,
      interior: salaoVidro,
    },
    entrega: {
      data: "03/08/2025",
      como: "Entrega com uma chave e o termo de vistoria inicial. Pontos de luz da vitrine testados.",
      observacao: "O Cessionário recebeu a loja vazia, sem mobiliário do shopping.",
      foto: salaoBranco,
    },
    vistoria: {
      data: "18/09/2026",
      resumo: "Vistoria periódica. A loja segue vazia, sem mobiliário.",
      fotos: [
        { id: "j1", legenda: "Vitrine vazia", url: vitrineVazia },
        { id: "j2", legenda: "Salão vazio", url: salaoClaro },
      ],
    },
  },
  {
    chave: "sala-102",
    codigo: "SALA-102",
    email: "ana.costa@empresab.com.br",
    nome: "Ana Costa",
    empresa: "Empresa B",
    telefone: "(21) 98812-1102",
    sala: "Loja 102",
    foto: retrato("photo-1438761681033-6461ffad8d80"),
    local: {
      titulo: "Loja 102 · Café",
      endereco: "Shopping, térreo, loja 102, ao lado da praça de alimentação",
      descricao: "Loja de 54 m² disponível para locação. Fachada e salão vazios, com ponto de água, esgoto e coifa.",
      fachada: vitrineVazia,
      interior: salaoClaro,
    },
    entrega: {
      data: "02/06/2023",
      como: "Entrega com chave da loja e o manual da coifa. Piso e vitrine conferidos no ato.",
      observacao: "A loja foi entregue vazia. Havia uma marca no rodapé da vitrine, aceita no termo.",
      foto: salaoCurvo,
    },
    vistoria: {
      data: "04/09/2026",
      resumo: "Vistoria sem não conformidades. A loja segue vazia, com iluminação e fechadura em ordem.",
      fotos: [
        { id: "b1", legenda: "Corredor com lojas vazias", url: corredorVazio },
        { id: "b2", legenda: "Salão vazio", url: salaoBranco },
      ],
    },
  },
  {
    chave: "sala-014",
    codigo: "SALA-014",
    email: "carla.dias@empresac.com.br",
    nome: "Carla Dias",
    empresa: "Empresa C",
    telefone: "(21) 98700-0014",
    sala: "Loja 014",
    foto: retrato("photo-1544005313-94ddf0286df2"),
    local: {
      titulo: "Loja 014 · Mercado",
      endereco: "Shopping, piso de serviço, loja 014, com acesso de carga",
      descricao: "Loja de 32 m² disponível para locação, com acesso de carga. Salão e vitrine vazios, sem gôndolas nem estoque.",
      fachada: corredorVazio,
      interior: salaoCurvo,
    },
    entrega: {
      data: "19/11/2024",
      como: "Entrega com cadeado novo. Piso lavado e tomadas identificadas.",
      observacao: "A loja foi entregue vazia, sem mobiliário e sem estoque.",
      foto: salaoVidro,
    },
    vistoria: {
      data: "22/08/2026",
      resumo: "Vistoria de rotina. A loja segue vazia e o extintor está dentro da validade.",
      fotos: [
        { id: "c1", legenda: "Vitrine vazia", url: vitrineVazia },
        { id: "c2", legenda: "Salão vazio", url: salaoBranco },
      ],
    },
  },
  {
    chave: "acesso-norte",
    codigo: "ACESSO-NORTE",
    email: "diego.alves@empresad.com.br",
    nome: "Diego Alves",
    empresa: "Empresa D",
    telefone: "(21) 98620-4400",
    sala: "Loja Norte",
    foto: retrato("photo-1507003211169-0a1dd7228f2d"),
    local: {
      titulo: "Loja Norte · Restaurante",
      endereco: "Shopping, praça de alimentação, loja norte",
      descricao: "Loja de alimentação disponível para locação. Salão, cozinha de apoio e fachada estão vazios.",
      fachada: vitrineVazia,
      interior: salaoBranco,
    },
    entrega: {
      data: "08/01/2025",
      como: "Entrega com as chaves da cozinha. Salão e fachada sem mobiliário e sem comunicação visual.",
      observacao: "O Cessionário recebeu a loja vazia, disponível para montagem.",
      foto: salaoClaro,
    },
    vistoria: {
      data: "01/09/2026",
      resumo: "Vistoria de circulação. A loja segue vazia e o piso está conforme.",
      fotos: [
        { id: "d1", legenda: "Corredor com lojas vazias", url: corredorVazio },
        { id: "d2", legenda: "Salão vazio", url: salaoCurvo },
      ],
    },
  },
  {
    chave: "sala-310",
    codigo: "SALA-310",
    email: "marina.costa@empresaconecta.com.br",
    nome: "Marina Costa",
    empresa: "Empresa Conecta",
    telefone: "(21) 98510-0310",
    sala: "Loja 310",
    foto: retrato("photo-1580489944761-15a19d654956"),
    local: {
      titulo: "Loja 310 · Quiosque",
      endereco: "Shopping, 3º piso, loja 310, vitrine para o átrio",
      descricao: "Loja de 70 m² disponível para locação. Vitrine e salão vazios, com ponto de rede.",
      fachada: corredorVazio,
      interior: salaoVidro,
    },
    entrega: {
      data: "27/04/2025",
      como: "Entrega com a infraestrutura de rede identificada e o termo de aceite da vitrine vazia.",
      observacao: "Os pontos de dados ficaram testados no dia da entrega. A loja foi recebida sem mobiliário.",
      foto: salaoClaro,
    },
    vistoria: {
      data: "11/09/2026",
      resumo: "Vistoria técnica. A loja segue vazia e a iluminação está dentro do combinado.",
      fotos: [
        { id: "m1", legenda: "Vitrine vazia", url: vitrineVazia },
        { id: "m2", legenda: "Salão vazio", url: salaoCurvo },
      ],
    },
  },
];

export function fotosDaLoja(espaco: EspacoCessionario): FotoVistoria[] {
  return [
    { id: `${espaco.chave}-fachada`, legenda: `Fachada · ${espaco.local.titulo}`, url: espaco.local.fachada },
    { id: `${espaco.chave}-interior`, legenda: `Interior · ${espaco.local.titulo}`, url: espaco.local.interior },
    { id: `${espaco.chave}-entrega`, legenda: "Como foi entregue", url: espaco.entrega.foto },
    ...espaco.vistoria.fotos,
  ];
}

export function espacoPorChave(chave: string) {
  return espacos.find((item) => item.chave === chave);
}

export function espacosPorEmail(email: string) {
  return espacos.filter((item) => item.email === email);
}

export function espacoPorEmail(email: string) {
  return espacosPorEmail(email)[0];
}

export function espacoPorCodigo(codigo: string | null | undefined) {
  if (!codigo) return undefined;
  const alvo = codigo.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return espacos.find((item) => item.codigo.replace(/[^a-z0-9]/gi, "").toLowerCase() === alvo
    || item.chave.replace(/[^a-z0-9]/gi, "").toLowerCase() === alvo);
}

export function espacoPorSala(sala: string | null | undefined) {
  if (!sala) return undefined;
  const alvo = sala.trim().toLowerCase();
  return espacos.find((item) => item.sala.toLowerCase() === alvo);
}
