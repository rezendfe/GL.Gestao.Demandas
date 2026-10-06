import { formatarContato, mascaraCodigo, validarCodigo, validarContato, validarEmail, validarHoras, validarLogo, validarOpcional, validarTexto } from "./entrada";
import { PERIODOS_ABERTURA } from "./modeloAbertura";
import type { PermissaoCessionario } from "./types";

export type TipoCarga = "categorias" | "tipos" | "areas" | "responsaveis" | "espacos" | "empresas" | "funcoes" | "representantes";

export const PERMISSOES_CESSAO: { id: PermissaoCessionario; nome: string }[] = [
  { id: "ConsultarEmpresa", nome: "Consultar espaços e demandas" },
  { id: "AbrirDemanda", nome: "Abrir demandas" },
  { id: "ResponderComplementar", nome: "Responder e complementar" },
  { id: "AnexarDocumento", nome: "Anexar documentos" },
  { id: "ValidarServico", nome: "Validar serviço" },
  { id: "AvaliarAtendimento", nome: "Avaliar atendimento" },
];

export type ColunaCarga = { chave: string; titulo: string; exemplo: string };

export type DefinicaoCarga = {
  titulo: string;
  arquivo: string;
  instrucao: string;
  colunas: ColunaCarga[];
};

const FLUXOS = ["Atendimento", "Aprovação", "Obra"] as const;

export const DEFINICOES_CARGA: Record<TipoCarga, DefinicaoCarga> = {
  categorias: {
    titulo: "Carga de categorias",
    arquivo: "modelo-categorias.csv",
    instrucao: "Uma linha por categoria. Itens sugeridos separam-se com |. Período: Manhã, Tarde, Noite ou Qualquer horário.",
    colunas: [
      { chave: "nome", titulo: "Nome", exemplo: "Climatização" },
      { chave: "ativa", titulo: "Ativa", exemplo: "Sim" },
      { chave: "prazo", titulo: "Prazo em horas", exemplo: "48" },
      { chave: "assunto", titulo: "Assunto sugerido", exemplo: "Ar-condicionado sem refrigerar" },
      { chave: "ponto", titulo: "Ponto sugerido", exemplo: "Sala de reunião" },
      { chave: "periodo", titulo: "Período", exemplo: "Manhã" },
      { chave: "itens", titulo: "Itens", exemplo: "Filtro|Gás" },
    ],
  },
  tipos: {
    titulo: "Carga de tipos de atendimento",
    arquivo: "modelo-tipos-atendimento.csv",
    instrucao: "Categoria e área devem ser nomes já cadastrados. Fluxo: Atendimento, Aprovação ou Obra.",
    colunas: [
      { chave: "nome", titulo: "Nome", exemplo: "Reparo de ar-condicionado" },
      { chave: "categoria", titulo: "Categoria", exemplo: "Climatização" },
      { chave: "area", titulo: "Área", exemplo: "Manutenção" },
      { chave: "fluxo", titulo: "Fluxo", exemplo: "Atendimento" },
      { chave: "ativo", titulo: "Ativo", exemplo: "Sim" },
    ],
  },
  areas: {
    titulo: "Carga de áreas",
    arquivo: "modelo-areas.csv",
    instrucao: "Uma linha por área. Ativa aceita Sim ou Não.",
    colunas: [
      { chave: "nome", titulo: "Nome", exemplo: "Manutenção" },
      { chave: "ativa", titulo: "Ativa", exemplo: "Sim" },
    ],
  },
  responsaveis: {
    titulo: "Carga de responsáveis",
    arquivo: "modelo-responsaveis.csv",
    instrucao: "A área deve ser um nome já cadastrado. O perfil permanece Responsável da Área.",
    colunas: [
      { chave: "nome", titulo: "Nome", exemplo: "Ana Souza" },
      { chave: "email", titulo: "E-mail", exemplo: "ana.souza@gleventos.com.br" },
      { chave: "area", titulo: "Área", exemplo: "Manutenção" },
      { chave: "ativo", titulo: "Ativo", exemplo: "Sim" },
    ],
  },
  espacos: {
    titulo: "Carga de espaços",
    arquivo: "modelo-espacos.csv",
    instrucao: "O código usa letras, números e hífen. Uma linha por espaço.",
    colunas: [
      { chave: "codigo", titulo: "Código", exemplo: "SALA-101" },
      { chave: "nome", titulo: "Nome", exemplo: "Sala 101" },
      { chave: "localizacao", titulo: "Localização", exemplo: "Pavilhão A" },
      { chave: "descricao", titulo: "Descrição", exemplo: "Sala de reunião" },
      { chave: "ativo", titulo: "Ativo", exemplo: "Sim" },
    ],
  },
  empresas: {
    titulo: "Carga de empresas Cessionárias",
    arquivo: "modelo-empresas.csv",
    instrucao: "Uma linha por empresa. O logo é opcional: URL ou caminho. O nome não pode repetir.",
    colunas: [
      { chave: "nome", titulo: "Nome", exemplo: "Empresa Exemplo" },
      { chave: "ativa", titulo: "Ativa", exemplo: "Sim" },
      { chave: "logo", titulo: "Logo", exemplo: "" },
    ],
  },
  funcoes: {
    titulo: "Carga de funções",
    arquivo: "modelo-funcoes.csv",
    instrucao: "Uma linha por função da empresa selecionada. Permissões separam-se com | e usam os nomes do modelo. O nome não pode repetir nesta empresa.",
    colunas: [
      { chave: "nome", titulo: "Nome", exemplo: "Operação" },
      { chave: "ativa", titulo: "Ativa", exemplo: "Sim" },
      { chave: "permissoes", titulo: "Permissões", exemplo: "Consultar espaços e demandas|Abrir demandas" },
    ],
  },
  representantes: {
    titulo: "Carga de representantes",
    arquivo: "modelo-representantes.csv",
    instrucao: "Uma linha por representante da empresa selecionada. Funções separam-se com | e já devem existir nesta empresa. O e-mail de login não pode repetir.",
    colunas: [
      { chave: "nome", titulo: "Nome", exemplo: "Maria Souza" },
      { chave: "email", titulo: "E-mail", exemplo: "maria.souza@empresaexemplo.com.br" },
      { chave: "ativo", titulo: "Ativo", exemplo: "Sim" },
      { chave: "funcoes", titulo: "Funções", exemplo: "Operação" },
      { chave: "emailContato", titulo: "E-mail de contato", exemplo: "maria.souza@empresaexemplo.com.br" },
      { chave: "telefone", titulo: "Telefone", exemplo: "(21) 98888-0000" },
      { chave: "whatsapp", titulo: "WhatsApp", exemplo: "(21) 98888-0000" },
    ],
  },
};

export function normalizarCarga(valor: string) {
  return valor.normalize("NFD").replace(/\p{M}/gu, "").trim().toLowerCase();
}

export function interpretarAtivo(valor: string) {
  const texto = normalizarCarga(valor);
  if (!texto) return true;
  if (texto === "sim" || texto === "s" || texto === "ativa" || texto === "ativo") return true;
  if (texto === "nao" || texto === "n" || texto === "inativa" || texto === "inativo") return false;
  return null;
}

export function acharPorNome<T extends { nome: string }>(lista: T[], nome: string) {
  const alvo = normalizarCarga(nome);
  return lista.find((item) => normalizarCarga(item.nome) === alvo) ?? null;
}

export function baixarPlanilha(arquivo: string, colunas: string[], linhas: string[][]) {
  const separador = ";";
  const corpo = [colunas, ...linhas].map((linha) => linha.map((valor) => celula(valor)).join(separador)).join("\r\n");
  const blob = new Blob([`\uFEFF${corpo}\r\n`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = arquivo;
  link.click();
  URL.revokeObjectURL(url);
}

export function baixarModelo(definicao: DefinicaoCarga) {
  baixarPlanilha(
    definicao.arquivo,
    definicao.colunas.map((coluna) => coluna.titulo),
    [definicao.colunas.map((coluna) => coluna.exemplo)],
  );
}

export function lerPlanilha(texto: string, definicao: DefinicaoCarga) {
  const bruto = texto.replace(/^\uFEFF/, "").split(/\r?\n/).filter((linha) => linha.trim() !== "");
  if (bruto.length === 0) return { linhas: [] as { numero: number; valores: Record<string, string> }[], erro: "A planilha está vazia." };
  const separador = bruto[0].includes(";") ? ";" : ",";
  const cabecalho = dividir(bruto[0], separador).map((coluna) => normalizarCarga(coluna));
  const faltando = definicao.colunas.filter((coluna) => !cabecalho.includes(normalizarCarga(coluna.titulo)));
  if (faltando.length > 0) {
    return { linhas: [], erro: `Use o modelo. Colunas esperadas: ${definicao.colunas.map((coluna) => coluna.titulo).join(", ")}.` };
  }
  const linhas: { numero: number; valores: Record<string, string> }[] = [];
  for (let indice = 1; indice < bruto.length; indice += 1) {
    const celulas = dividir(bruto[indice], separador);
    const valores: Record<string, string> = {};
    for (const coluna of definicao.colunas) {
      const posicao = cabecalho.indexOf(normalizarCarga(coluna.titulo));
      valores[coluna.chave] = (celulas[posicao] ?? "").trim();
    }
    if (definicao.colunas.every((coluna) => valores[coluna.chave] === "")) continue;
    if (definicao.colunas.every((coluna) => valores[coluna.chave] === coluna.exemplo)) continue;
    linhas.push({ numero: indice + 1, valores });
  }
  return { linhas, erro: null as string | null };
}

export type ContextoCarga = {
  nomes: string[];
  categorias: string[];
  areas: string[];
  tipos?: { categoria: string; nome: string }[];
  funcoes?: string[];
};

export function validarLinhaCadastro(
  tipo: TipoCarga,
  valores: Record<string, string>,
  contexto: ContextoCarga,
  anteriores: Record<string, string>[],
) {
  if (tipo === "categorias" || tipo === "areas") {
    const nome = validarTexto(valores.nome, 2, 120, "O nome deve ter entre 2 e 120 caracteres.");
    if (nome) return nome;
    if (repetido(contexto.nomes, anteriores, valores.nome, "nome")) {
      return tipo === "categorias" ? "Já existe uma categoria com este nome." : "Já existe uma área com este nome.";
    }
    const ativa = interpretarAtivo(valores.ativa);
    if (ativa === null) return "Ativa aceita Sim ou Não.";
  }
  if (tipo === "empresas") {
    const nome = validarTexto(valores.nome, 2, 200, "A razão social deve ter entre 2 e 200 caracteres.");
    if (nome) return nome;
    if (repetido(contexto.nomes, anteriores, valores.nome, "nome")) return "Já existe uma empresa Cessionária com este nome.";
    const ativa = interpretarAtivo(valores.ativa);
    if (ativa === null) return "Ativa aceita Sim ou Não.";
  }
  if (tipo === "categorias") {
    const prazo = validarHoras(valores.prazo);
    if (prazo) return prazo;
    const assunto = validarOpcional(valores.assunto, 120, "O assunto sugerido tem no máximo 120 caracteres.");
    const ponto = validarOpcional(valores.ponto, 200, "O ponto sugerido tem no máximo 200 caracteres.");
    if (assunto || ponto) return assunto ?? ponto;
    if (valores.periodo.trim() && !canonico(valores.periodo, PERIODOS_ABERTURA)) {
      return "Período deve ser Manhã, Tarde, Noite ou Qualquer horário.";
    }
    const itens = valores.itens.split("|").map((item) => item.trim()).filter(Boolean);
    if (itens.length > 12 || itens.some((item) => item.length > 80)) return "Cada item sugerido tem no máximo 80 caracteres, até 12 itens.";
  }
  if (tipo === "empresas") {
    const logo = validarLogo(valores.logo);
    if (logo) return logo;
  }
  if (tipo === "tipos") {
    const nome = validarTexto(valores.nome, 2, 120, "O nome do tipo de atendimento deve ter entre 2 e 120 caracteres.");
    if (nome) return nome;
    if (!acharTexto(contexto.categorias, valores.categoria)) return "Categoria não encontrada. Cadastre a categoria antes.";
    if (!acharTexto(contexto.areas, valores.area)) return "Área não encontrada. Cadastre a área antes.";
    if (!canonico(valores.fluxo, FLUXOS)) return "Fluxo deve ser Atendimento, Aprovação ou Obra.";
    const ativo = interpretarAtivo(valores.ativo);
    if (ativo === null) return "Ativo aceita Sim ou Não.";
    const chave = `${normalizarCarga(valores.categoria)}|${normalizarCarga(valores.nome)}`;
    const jaExiste = (contexto.tipos ?? []).some((tipo) => `${normalizarCarga(tipo.categoria)}|${normalizarCarga(tipo.nome)}` === chave)
      || anteriores.some((linha) => `${normalizarCarga(linha.categoria)}|${normalizarCarga(linha.nome)}` === chave);
    if (jaExiste) return "Já existe um tipo com este nome nesta categoria.";
  }
  if (tipo === "responsaveis") {
    const nome = validarTexto(valores.nome, 2, 200, "O nome do responsável deve ter entre 2 e 200 caracteres.");
    const email = validarEmail(valores.email);
    if (nome || email) return nome ?? email;
    if (!acharTexto(contexto.areas, valores.area)) return "Área não encontrada. Cadastre a área antes.";
    const ativo = interpretarAtivo(valores.ativo);
    if (ativo === null) return "Ativo aceita Sim ou Não.";
    if (repetido(contexto.nomes, anteriores, valores.email, "email")) return "Já existe um responsável com este e-mail.";
  }
  if (tipo === "espacos") {
    const codigoInvalido = validarCodigo(mascaraCodigo(valores.codigo));
    const nome = validarTexto(valores.nome, 2, 120, "O nome do espaço deve ter entre 2 e 120 caracteres.");
    const local = validarTexto(valores.localizacao, 1, 240, "Informe a localização do espaço.");
    const descricao = validarOpcional(valores.descricao, 1000, "A descrição do espaço tem no máximo 1000 caracteres.");
    if (codigoInvalido || nome || local || descricao) return codigoInvalido ?? nome ?? local ?? descricao;
    const ativo = interpretarAtivo(valores.ativo);
    if (ativo === null) return "Ativo aceita Sim ou Não.";
    const codigo = mascaraCodigo(valores.codigo);
    const codigoRepetido = contexto.nomes.some((item) => normalizarCarga(item) === normalizarCarga(codigo))
      || anteriores.some((linha) => normalizarCarga(mascaraCodigo(linha.codigo ?? "")) === normalizarCarga(codigo));
    if (codigoRepetido) return "Já existe um espaço com esse código.";
  }
  if (tipo === "funcoes") {
    const nome = validarTexto(valores.nome, 2, 100, "O nome da função deve ter entre 2 e 100 caracteres.");
    if (nome) return nome;
    const ativa = interpretarAtivo(valores.ativa);
    if (ativa === null) return "Ativa aceita Sim ou Não.";
    const permissoes = permissoesDaPlanilha(valores.permissoes ?? "");
    if (permissoes.erro) return permissoes.erro;
    if (repetido(contexto.nomes, anteriores, valores.nome, "nome")) return "Já existe uma função com este nome nesta empresa.";
  }
  if (tipo === "representantes") {
    const nome = validarTexto(valores.nome, 2, 200, "O nome do representante deve ter entre 2 e 200 caracteres.");
    const email = validarEmail(valores.email);
    if (nome || email) return nome ?? email;
    const ativo = interpretarAtivo(valores.ativo);
    if (ativo === null) return "Ativo aceita Sim ou Não.";
    if (repetido(contexto.nomes, anteriores, valores.email, "email")) return "Já existe um representante com este e-mail.";
    const funcoes = listaConhecida(valores.funcoes ?? "", contexto.funcoes ?? [], "Função");
    if (funcoes) return funcoes;
    const contatoEmail = validarContatoOpcional("EMAIL", valores.emailContato ?? "");
    const telefone = validarContatoOpcional("TELEFONE", valores.telefone ?? "");
    const whatsapp = validarContatoOpcional("WHATSAPP", valores.whatsapp ?? "");
    if (contatoEmail || telefone || whatsapp) return contatoEmail ?? telefone ?? whatsapp;
  }
  return null;
}

export function permissoesDaPlanilha(valor: string) {
  const partes = valor.split("|").map((item) => item.trim()).filter(Boolean);
  const ids: PermissaoCessionario[] = [];
  const vistas = new Set<string>();
  for (const parte of partes) {
    const achou = PERMISSOES_CESSAO.find((permissao) => normalizarCarga(permissao.nome) === normalizarCarga(parte));
    if (!achou) return { ids, erro: `Permissão não reconhecida: ${parte}.` };
    if (vistas.has(achou.id)) return { ids, erro: `Permissão repetida: ${parte}.` };
    vistas.add(achou.id);
    ids.push(achou.id);
  }
  return { ids, erro: null as string | null };
}

export function contatosDaPlanilha(valores: Record<string, string>) {
  const contatos: { id: null; canal: "EMAIL" | "TELEFONE" | "WHATSAPP"; valor: string; principal: true }[] = [];
  const email = valores.emailContato ?? "";
  const telefone = valores.telefone ?? "";
  const whatsapp = valores.whatsapp ?? "";
  if (email.trim()) contatos.push({ id: null, canal: "EMAIL", valor: formatarContato("EMAIL", email), principal: true });
  if (telefone.trim()) contatos.push({ id: null, canal: "TELEFONE", valor: formatarContato("TELEFONE", telefone), principal: true });
  if (whatsapp.trim()) contatos.push({ id: null, canal: "WHATSAPP", valor: formatarContato("WHATSAPP", whatsapp), principal: true });
  return contatos;
}

export function periodoCanonico(valor: string) {
  return canonico(valor, PERIODOS_ABERTURA);
}

export function fluxoCanonico(valor: string) {
  return canonico(valor, FLUXOS);
}

function canonico(valor: string, opcoes: readonly string[]) {
  const alvo = normalizarCarga(valor);
  if (!alvo) return null;
  return opcoes.find((opcao) => normalizarCarga(opcao) === alvo) ?? null;
}

function acharTexto(lista: string[], nome: string) {
  const alvo = normalizarCarga(nome);
  return lista.some((item) => normalizarCarga(item) === alvo);
}

function validarContatoOpcional(canal: "EMAIL" | "TELEFONE" | "WHATSAPP", valor: string) {
  if (!valor.trim()) return null;
  return validarContato(canal, valor);
}

function listaConhecida(valor: string, existentes: string[], rotulo: string) {
  const partes = valor.split("|").map((item) => item.trim()).filter(Boolean);
  const vistas = new Set<string>();
  for (const parte of partes) {
    const chave = normalizarCarga(parte);
    if (vistas.has(chave)) return `${rotulo} repetida na mesma linha: ${parte}.`;
    vistas.add(chave);
    if (!existentes.some((item) => normalizarCarga(item) === chave)) return `${rotulo} não encontrada nesta empresa: ${parte}.`;
  }
  return null;
}

function repetido(existentes: string[], anteriores: Record<string, string>[], valor: string, chave: string) {
  const alvo = normalizarCarga(valor);
  if (!alvo) return false;
  if (existentes.some((item) => normalizarCarga(item) === alvo)) return true;
  return anteriores.some((linha) => normalizarCarga(linha[chave] ?? "") === alvo);
}

function celula(valor: string) {
  if (/[;"\n]/.test(valor)) return `"${valor.replaceAll('"', '""')}"`;
  return valor;
}

function dividir(linha: string, separador: string) {
  const saida: string[] = [];
  let atual = "";
  let aspas = false;
  for (let indice = 0; indice < linha.length; indice += 1) {
    const char = linha[indice];
    if (aspas) {
      if (char === '"' && linha[indice + 1] === '"') {
        atual += '"';
        indice += 1;
      } else if (char === '"') aspas = false;
      else atual += char;
    } else if (char === '"') aspas = true;
    else if (char === separador) {
      saida.push(atual);
      atual = "";
    } else atual += char;
  }
  saida.push(atual);
  return saida;
}
