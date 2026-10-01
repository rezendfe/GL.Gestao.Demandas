import type {
  CadeiaTipo,
  Catalogo,
  DetalheDemanda,
  EmpresaCessionariaCadastro,
  EmpresaCessionariaOpcao,
  EspacoInventario,
  EtapaCadeia,
  FilaItem,
  ItemAgenda,
  Notificacao,
  Obra,
  Sessao,
  Preenchimento,
  Sugestao,
} from "../../domain/types";

const base = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:5090";
const TOKEN = "gl-poc-token";
const USUARIO = "gl-poc-usuario";

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export function lerSessao(): Sessao | null {
  const token = sessionStorage.getItem(TOKEN);
  const usuario = sessionStorage.getItem(USUARIO);
  if (!token || !usuario) return null;
  return { token, usuario: JSON.parse(usuario) };
}

export function guardarSessao(sessao: Sessao) {
  sessionStorage.setItem(TOKEN, sessao.token);
  sessionStorage.setItem(USUARIO, JSON.stringify(sessao.usuario));
}

export function limparSessao() {
  sessionStorage.removeItem(TOKEN);
  sessionStorage.removeItem(USUARIO);
}

async function request<T>(path: string, options: RequestInit = {}, timeoutMs = 15000): Promise<T> {
  const headers = new Headers(options.headers);
  const token = sessionStorage.getItem(TOKEN);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${base}${path}`, { ...options, headers, signal: AbortSignal.timeout(timeoutMs) });
  } catch {
    throw new ApiError("A API não respondeu. Verifique se o serviço está no ar.", 0);
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    if (response.status === 401) limparSessao();
    throw new ApiError(body?.mensagem ?? "Não foi possível concluir a ação.", response.status);
  }
  return body as T;
}

async function baixar(path: string, nome: string) {
  const headers = new Headers();
  const token = sessionStorage.getItem(TOKEN);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, { headers, signal: AbortSignal.timeout(15000) });
  } catch {
    throw new ApiError("A API não respondeu. Verifique se o serviço está no ar.", 0);
  }
  if (!response.ok) {
    const text = await response.text();
    let mensagem = "Não foi possível baixar o arquivo.";
    try {
      const body = text ? JSON.parse(text) : null;
      if (body?.mensagem) mensagem = body.mensagem;
    } catch {
      /* o corpo não é JSON */
    }
    throw new ApiError(mensagem, response.status);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.click();
  URL.revokeObjectURL(url);
}

export const api = {
  login: (email: string, senha: string) =>
    request<Sessao>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, senha }) }),
  fila: () => request<FilaItem[]>("/api/demandas"),
  agenda: () => request<ItemAgenda[]>("/api/agenda"),
  detalhe: (id: string) => request<DetalheDemanda>(`/api/demandas/${id}`),
  sugerir: (texto: string) => request<Sugestao>("/api/classificacao/sugerir", { method: "POST", body: JSON.stringify({ texto }) }),
  preencher: (texto: string) =>
    request<Preenchimento>("/api/solicitacoes/preencher", { method: "POST", body: JSON.stringify({ texto }) }, 40000),
  catalogo: () => request<Catalogo>("/api/catalogo"),
  salvarCategoria: (payload: { id: string | null; nome: string; ativa: boolean; prazoHoras: number | null }) =>
    request<Catalogo>("/api/catalogo/categorias", { method: "POST", body: JSON.stringify(payload) }),
  salvarTipoAtendimento: (payload: { id: string | null; categoriaId: string; areaId: string; nome: string; fluxo: string; ativo: boolean }) =>
    request<Catalogo>("/api/catalogo/tipos-atendimento", { method: "POST", body: JSON.stringify(payload) }),
  salvarArea: (payload: { id: string | null; nome: string; ativa: boolean }) =>
    request<Catalogo>("/api/catalogo/areas", { method: "POST", body: JSON.stringify(payload) }),
  salvarResponsavel: (payload: { id: string | null; nome: string; email: string; areaId: string; ativo: boolean }) =>
    request<Catalogo>("/api/catalogo/responsaveis", { method: "POST", body: JSON.stringify(payload) }),
  abrir: (payload: { descricao: string; sala: string; ponto?: string; subcategoriaId: string; canal: string; reclamacao?: boolean }) =>
    request<DetalheDemanda>("/api/demandas", { method: "POST", body: JSON.stringify(payload) }),
  classificar: (id: string, subcategoriaId: string) =>
    request<DetalheDemanda>(`/api/demandas/${id}/classificacao`, { method: "POST", body: JSON.stringify({ subcategoriaId }) }),
  redirecionar: (id: string, areaId: string, responsavelId: string | null) =>
    request<DetalheDemanda>(`/api/demandas/${id}/redirecionar`, { method: "POST", body: JSON.stringify({ areaId, responsavelId }) }),
  andamento: (id: string, comentario: string, situacao: string) =>
    request<DetalheDemanda>(`/api/demandas/${id}/andamento`, { method: "POST", body: JSON.stringify({ comentario, situacao }) }),
  mensagem: (id: string, texto: string, complemento = false) =>
    request<DetalheDemanda>(`/api/demandas/${id}/mensagens`, { method: "POST", body: JSON.stringify({ texto, complemento }) }),
  previsao: (id: string, quando: string) =>
    request<DetalheDemanda>(`/api/demandas/${id}/previsao`, { method: "POST", body: JSON.stringify({ quando }) }),
  avaliar: (id: string, nota: number, comentario: string) =>
    request<DetalheDemanda>(`/api/demandas/${id}/avaliacao`, { method: "POST", body: JSON.stringify({ nota, comentario }) }),
  responderNotificacao: (id: string, texto: string) =>
    request<DetalheDemanda>(`/api/notificacoes/${id}/resposta`, { method: "POST", body: JSON.stringify({ texto }) }),
  anexar: (id: string, arquivo: File) => {
    const form = new FormData();
    form.append("arquivo", arquivo);
    return request<DetalheDemanda>(`/api/demandas/${id}/anexos`, { method: "POST", body: form });
  },
  aprovar: (id: string, decisao: string, motivo?: string) =>
    request<DetalheDemanda>(`/api/demandas/${id}/aprovacao`, { method: "POST", body: JSON.stringify({ decisao, motivo }) }),
  encerrar: (id: string) =>
    request<DetalheDemanda>(`/api/demandas/${id}/encerramento`, { method: "POST" }),
  cancelar: (id: string, motivo: string) =>
    request<DetalheDemanda>(`/api/demandas/${id}/cancelamento`, { method: "POST", body: JSON.stringify({ motivo }) }),
  obras: () => request<Obra[]>("/api/obras"),
  obra: (id: string) => request<Obra>(`/api/obras/${id}`),
  inventarioEspacos: () => request<EspacoInventario[]>("/api/espacos"),
  empresasCessionarias: () => request<EmpresaCessionariaOpcao[]>("/api/empresas-cessionarias"),
  administracaoEmpresasCessionarias: () => request<EmpresaCessionariaCadastro[]>("/api/empresas-cessionarias/administracao"),
  salvarEmpresaCessionaria: (payload: { id: string | null; nome: string; ativa: boolean; logo: string | null }) => {
    const { id, ...dados } = payload;
    return request<EmpresaCessionariaCadastro>(id ? `/api/empresas-cessionarias/${id}` : "/api/empresas-cessionarias", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(dados),
    });
  },
  salvarRepresentante: (empresaId: string, payload: { usuarioId: string | null; nome: string; email: string; ativo: boolean; contatos: { id: string | null; canal: string; valor: string; principal: boolean }[]; funcoes: string[] }) => {
    const { usuarioId, ...dados } = payload;
    return request(`/api/empresas-cessionarias/${empresaId}/representantes${usuarioId ? `/${usuarioId}` : ""}`, {
      method: usuarioId ? "PUT" : "POST",
      body: JSON.stringify({ ...dados, usuarioId }),
    });
  },
  salvarFuncaoCessionario: (empresaId: string, payload: { id: string | null; nome: string; ativa: boolean; permissoes: string[] }) => {
    const { id, ...dados } = payload;
    return request(id ? `/api/empresas-cessionarias/${empresaId}/funcoes/${id}` : `/api/empresas-cessionarias/${empresaId}/funcoes`, {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(dados),
    });
  },
  salvarEspaco: (payload: { id: string | null; codigo: string; nome: string; localizacao: string; descricao: string; ativo: boolean }) => {
    const { id, ...dados } = payload;
    return request<EspacoInventario>(id ? `/api/espacos/${id}` : "/api/espacos", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(dados),
    });
  },
  iniciarLocacao: (espacoId: string, empresaId: string, inicio: string) =>
    request<EspacoInventario>(`/api/espacos/${espacoId}/locacoes`, {
      method: "POST",
      body: JSON.stringify({ empresaId, inicio }),
    }),
  encerrarLocacao: (espacoId: string, termino: string) =>
    request<EspacoInventario>(`/api/espacos/${espacoId}/locacao/encerramento`, {
      method: "POST",
      body: JSON.stringify({ termino }),
    }),
  cadeia: () => request<CadeiaTipo[]>("/api/cadeia"),
  salvarCadeia: (subcategoriaId: string, etapas: { codigo: string; automatica: boolean; campos: string[]; tarefas: { codigo: string; obrigatoria: boolean }[] }[]) =>
    request<EtapaCadeia[]>("/api/cadeia", { method: "PUT", body: JSON.stringify({ subcategoriaId, etapas }) }),
  avancar: (id: string, payload: { comentario?: string | null; previsao?: string | null; confirmacao?: boolean | null }) =>
    request<DetalheDemanda>(`/api/demandas/${id}/avancar`, { method: "POST", body: JSON.stringify(payload) }),
  notificacoes: () => request<Notificacao[]>("/api/notificacoes"),
  marcarLida: (id: string) => request<void>(`/api/notificacoes/${id}/leitura`, { method: "POST" }),
  chavePush: () => request<{ chavePublica: string }>("/api/notificacoes/push/chave"),
  inscreverPush: (inscricao: { endpoint: string; chaveP256dh: string; segredoAuth: string }) =>
    request<void>("/api/notificacoes/push", { method: "POST", body: JSON.stringify(inscricao) }),
  cancelarPush: (endpoint: string) =>
    request<void>("/api/notificacoes/push/cancelamento", { method: "POST", body: JSON.stringify({ endpoint }) }),
  exportarFila: () => baixar("/api/demandas/exportacao", "fila-demandas.csv"),
  exportarProtocolo: (id: string, protocolo: string) => baixar(`/api/demandas/${id}/protocolo`, `protocolo-${protocolo}.pdf`),
  baixarAnexo: async (demandaId: string, anexoId: string, nome: string) => {
    const token = sessionStorage.getItem(TOKEN);
    const response = await fetch(`${base}/api/demandas/${demandaId}/anexos/${anexoId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new ApiError("O arquivo não está disponível.", response.status);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nome;
    link.click();
    URL.revokeObjectURL(url);
  },
};
