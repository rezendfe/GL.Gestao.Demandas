export type Perfil = "Cessionário" | "GL / Administrador" | "Responsável da Área";

export interface UsuarioSessao {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  areaId: string | null;
  empresa: string | null;
  sala: string | null;
  logoEmpresa: string | null;
  foto: string | null;
}

export interface Sessao {
  token: string;
  usuario: UsuarioSessao;
}

export interface FilaItem {
  id: string;
  protocolo: string;
  cessionario: string;
  servico: string;
  situacao: string;
  responsavel: string;
  prioridade: string;
  abertoEm: string;
  fluxo: string;
  previsaoAtendimento: string | null;
  pendencias: number;
  complementos: string[];
  natureza: string;
  notaAvaliacao: number | null;
  comentarioAvaliacao: string | null;
  subcategoriaId: string;
  prazoCategoriaHoras: number | null;
}

export interface Pessoa {
  id: string;
  nome: string;
  empresa: string | null;
  sala: string | null;
}

export interface Mensagem {
  id: string;
  autor: string;
  texto: string;
  canal: string;
  enviadaEm: string;
  finalidade: string;
}

export interface Anexo {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
}

export interface Historico {
  id: string;
  autor: string;
  statusAnterior: string | null;
  statusNovo: string;
  comentario: string;
  tipo: string;
  eventoEm: string;
}

export interface DetalheDemanda {
  id: string;
  protocolo: string;
  cessionario: Pessoa;
  descricao: string;
  ponto: string | null;
  categoriaId: string;
  categoria: string;
  subcategoriaId: string;
  subcategoria: string;
  areaId: string;
  area: string;
  servico: string;
  destino: string;
  situacao: string;
  prioridade: string;
  confianca: string;
  classificacao: string;
  fluxo: string;
  responsavel: Pessoa | null;
  abertoEm: string;
  atualizadoEm: string;
  previsaoAtendimento: string | null;
  mensagens: Mensagem[];
  anexos: Anexo[];
  historico: Historico[];
  naoLidas: number;
  natureza: string;
  notaAvaliacao: number | null;
  comentarioAvaliacao: string | null;
}

export interface Preenchimento {
  assunto: string | null;
  sala: string | null;
  ponto: string | null;
  dataDesejada: string | null;
  periodo: string | null;
  telefone: string | null;
  itens: string[];
  autorizaAcesso: boolean | null;
  sugestao: Sugestao | null;
  origem: "modelo" | "leitura-local";
  aviso: string;
}

export interface Sugestao {
  categoriaId: string;
  categoria: string;
  subcategoriaId: string;
  subcategoria: string;
  areaId: string;
  servico: string;
  destinoSugerido: string;
  confianca: string;
  prioridade: string;
  fluxo: string;
  resumo: string;
}

export interface Catalogo {
  categorias: { id: string; nome: string; ativa: boolean; prazoHoras: number | null; subcategorias: { id: string; nome: string; areaId: string; fluxo: string; ativa: boolean }[] }[];
  areas: { id: string; nome: string; ativa: boolean }[];
  responsaveis: { id: string; nome: string; email: string; areaId: string | null; ativo: boolean }[];
}

export interface ItemAgenda {
  origem: "demanda" | "obra";
  id: string;
  titulo: string;
  situacao: string;
  marco: "previsao" | "data-desejada" | "inicio" | "termino";
  data: string;
}

export interface Obra {
  id: string;
  nome: string;
  local: string;
  descricao: string;
  inicioPrevisto: string;
  terminoPrevisto: string;
  empresaExecutora: string;
  responsavel: string;
  contato: string;
  etapaAtual: string;
  etapas: string[];
  documentos: { id: string; nome: string; situacao: string; ordem: number }[];
}

export interface EmpresaCessionariaOpcao {
  id: string;
  nome: string;
  ativa: boolean;
}

export interface LocacaoResumo {
  id: string;
  empresaId: string;
  empresa: string;
  inicio: string;
  termino: string | null;
}

export interface EspacoInventario {
  id: string;
  codigo: string;
  nome: string;
  localizacao: string;
  descricao: string;
  situacao: "Disponível" | "Locado" | "Inativo";
  empresaLocataria: EmpresaCessionariaOpcao | null;
  historico: LocacaoResumo[];
}

export type PermissaoCessionario =
  | "ConsultarEmpresa"
  | "AbrirDemanda"
  | "ResponderComplementar"
  | "AnexarDocumento"
  | "ValidarServico"
  | "AvaliarAtendimento";

export interface ContatoRepresentante {
  id: string;
  canal: "EMAIL" | "TELEFONE" | "WHATSAPP";
  valor: string;
  principal: boolean;
}

export interface FuncaoRepresentante {
  id: string;
  nome: string;
  ativa: boolean;
  permissoes: PermissaoCessionario[];
}

export interface RepresentanteCessionario {
  usuarioId: string;
  nome: string;
  email: string;
  ativo: boolean;
  contatos: ContatoRepresentante[];
  funcoes: FuncaoRepresentante[];
}

export interface EmpresaCessionariaCadastro {
  id: string;
  nome: string;
  ativa: boolean;
  logo: string | null;
  representantes: RepresentanteCessionario[];
  funcoes: FuncaoRepresentante[];
}

export interface Notificacao {
  id: string;
  demandaId: string;
  protocolo: string;
  texto: string;
  lida: boolean;
  criadaEm: string;
}

export interface TarefaCadeia {
  codigo: string;
  obrigatoria: boolean;
}

export interface EtapaCadeia {
  codigo: string;
  nome: string;
  ordem: number;
  automatica: boolean;
  campos: string[];
  tarefas: TarefaCadeia[];
}

export interface CadeiaTipo {
  subcategoriaId: string;
  categoria: string;
  tipo: string;
  etapas: EtapaCadeia[];
}

export function tempoRelativo(iso: string): string {
  const minutos = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutos < 1) return "agora";
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas < 24) return resto ? `${horas}h${String(resto).padStart(2, "0")}` : `${horas}h`;
  return `${Math.floor(horas / 24)}d`;
}

export function hora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function quandoAtende(iso: string | null): string {
  if (!iso) return "Ainda sem data";
  return new Date(iso).toLocaleString("pt-BR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
