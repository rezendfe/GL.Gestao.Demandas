import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useSessao } from "../../application/session";
import type { ContatoRepresentante, EmpresaCessionariaCadastro, FuncaoRepresentante, PermissaoCessionario, RepresentanteCessionario } from "../../domain/types";
import { ApiError, api } from "../../infrastructure/api/client";
import { PageHeader } from "../components/PageHeader";
import { Panel } from "../components/Panel";

const PERMISSOES: { id: PermissaoCessionario; nome: string }[] = [
  { id: "ConsultarEmpresa", nome: "Consultar espaços e demandas" },
  { id: "AbrirDemanda", nome: "Abrir demandas" },
  { id: "ResponderComplementar", nome: "Responder e complementar" },
  { id: "AnexarDocumento", nome: "Anexar documentos" },
  { id: "ValidarServico", nome: "Validar serviço" },
  { id: "AvaliarAtendimento", nome: "Avaliar atendimento" },
];

interface EmpresaForm { id: string | null; nome: string; ativa: boolean; logo: string }
interface FuncaoForm { id: string | null; nome: string; ativa: boolean; permissoes: PermissaoCessionario[] }
interface RepresentanteForm { usuarioId: string | null; nome: string; email: string; ativo: boolean; contatos: ContatoRepresentante[]; funcoes: string[] }

const EMPRESA_VAZIA: EmpresaForm = { id: null, nome: "", ativa: true, logo: "" };
const FUNCAO_VAZIA: FuncaoForm = { id: null, nome: "", ativa: true, permissoes: [] };
const REPRESENTANTE_VAZIO: RepresentanteForm = { usuarioId: null, nome: "", email: "", ativo: true, contatos: [], funcoes: [] };

export function EmpresasCessionariasPage() {
  const { sessao } = useSessao();
  const [empresas, setEmpresas] = useState<EmpresaCessionariaCadastro[]>([]);
  const [empresaSelecionadaId, setEmpresaSelecionadaId] = useState("");
  const [empresaForm, setEmpresaForm] = useState<EmpresaForm>(EMPRESA_VAZIA);
  const [funcaoForm, setFuncaoForm] = useState<FuncaoForm>(FUNCAO_VAZIA);
  const [representanteForm, setRepresentanteForm] = useState<RepresentanteForm>(REPRESENTANTE_VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function carregar(selecionarId?: string) {
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await api.administracaoEmpresasCessionarias();
      setEmpresas(resultado);
      const id = selecionarId ?? empresaSelecionadaId;
      setEmpresaSelecionadaId(resultado.some((empresa) => empresa.id === id) ? id : resultado[0]?.id ?? "");
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Não foi possível carregar as empresas Cessionárias.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { void carregar(); }, []);

  if (sessao?.usuario.perfil !== "GL / Administrador") return <Navigate to="/inicio" replace />;

  const selecionada = empresas.find((empresa) => empresa.id === empresaSelecionadaId) ?? null;

  function editarEmpresa(empresa: EmpresaCessionariaCadastro) {
    setEmpresaSelecionadaId(empresa.id);
    setEmpresaForm({ id: empresa.id, nome: empresa.nome, ativa: empresa.ativa, logo: empresa.logo ?? "" });
    setFuncaoForm(FUNCAO_VAZIA);
    setRepresentanteForm(REPRESENTANTE_VAZIO);
    setErro(null);
    setMensagem(null);
  }

  function editarFuncao(funcao: FuncaoRepresentante) {
    setFuncaoForm({ id: funcao.id, nome: funcao.nome, ativa: funcao.ativa, permissoes: [...funcao.permissoes] });
    setMensagem(null);
  }

  function editarRepresentante(representante: RepresentanteCessionario) {
    setRepresentanteForm({
      usuarioId: representante.usuarioId,
      nome: representante.nome,
      email: representante.email,
      ativo: representante.ativo,
      contatos: representante.contatos.map((contato) => ({ ...contato })),
      funcoes: representante.funcoes.map((funcao) => funcao.id),
    });
    setMensagem(null);
  }

  async function salvarEmpresa(event: FormEvent) {
    event.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const salvo = await api.salvarEmpresaCessionaria({ ...empresaForm, logo: empresaForm.logo || null });
      setMensagem("Empresa Cessionária salva.");
      setEmpresaForm({ id: salvo.id, nome: salvo.nome, ativa: salvo.ativa, logo: salvo.logo ?? "" });
      await carregar(salvo.id);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Não foi possível salvar a empresa.");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarFuncao(event: FormEvent) {
    event.preventDefault();
    if (!selecionada) return;
    setSalvando(true);
    setErro(null);
    try {
      await api.salvarFuncaoCessionario(selecionada.id, { ...funcaoForm, permissoes: funcaoForm.permissoes });
      setMensagem("Função salva.");
      setFuncaoForm(FUNCAO_VAZIA);
      await carregar(selecionada.id);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Não foi possível salvar a função.");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarRepresentante(event: FormEvent) {
    event.preventDefault();
    if (!selecionada) return;
    setSalvando(true);
    setErro(null);
    try {
      await api.salvarRepresentante(selecionada.id, {
        ...representanteForm,
        contatos: representanteForm.contatos.map((contato) => ({ ...contato, id: contato.id || null })),
      });
      setMensagem("Representante salvo.");
      setRepresentanteForm(REPRESENTANTE_VAZIO);
      await carregar(selecionada.id);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Não foi possível salvar o representante.");
    } finally {
      setSalvando(false);
    }
  }

  function adicionarContato() {
    setRepresentanteForm((atual) => ({
      ...atual,
      contatos: [...atual.contatos, { id: "", canal: "EMAIL", valor: "", principal: !atual.contatos.some((contato) => contato.canal === "EMAIL" && contato.principal) }],
    }));
  }

  function alterarContato(indice: number, parcial: Partial<ContatoRepresentante>) {
    setRepresentanteForm((atual) => {
      const contatos = atual.contatos.map((contato, atualIndice) => atualIndice === indice ? { ...contato, ...parcial } : contato);
      if (parcial.principal) {
        const canal = parcial.canal ?? contatos[indice].canal;
        return { ...atual, contatos: contatos.map((contato, atualIndice) => atualIndice !== indice && contato.canal === canal ? { ...contato, principal: false } : contato) };
      }
      return { ...atual, contatos };
    });
  }

  return (
    <>
      <PageHeader title="Empresas e acessos" trail={["Início", "Espaços", "Empresas e acessos"]} extra={<Link className="btn secondary" to="/espacos">Inventário de espaços</Link>} />
      {erro && <p className="erro" role="alert">{erro}</p>}
      {mensagem && <p className="cadastro-ok" role="status">{mensagem}</p>}
      {carregando ? <p>Carregando empresas...</p> : <div className="empresas-admin">
        <Panel title="Empresas Cessionárias" className="livre">
          <div className="cadastro-lista-cabecalho">
            <span>{empresas.length} cadastradas</span>
            <button className="btn secondary" type="button" onClick={() => { setEmpresaSelecionadaId(""); setEmpresaForm(EMPRESA_VAZIA); setFuncaoForm(FUNCAO_VAZIA); setRepresentanteForm(REPRESENTANTE_VAZIO); }}>Nova empresa</button>
          </div>
          <ul className="empresas-lista">
            {empresas.map((empresa) => <li key={empresa.id}>
              <button className={empresa.id === empresaSelecionadaId ? "empresa-selecao ativa" : "empresa-selecao"} type="button" onClick={() => editarEmpresa(empresa)}>
                <span><strong>{empresa.nome}</strong><small>{empresa.representantes.length} representantes · {empresa.funcoes.length} funções</small></span>
                <span className={empresa.ativa ? "cadastro-status ativo" : "cadastro-status"}>{empresa.ativa ? "Ativa" : "Inativa"}</span>
              </button>
            </li>)}
            {empresas.length === 0 && <li>Nenhuma empresa cadastrada.</li>}
          </ul>
        </Panel>
        <Panel title={empresaForm.id ? "Editar empresa" : "Nova empresa"}>
          <form className="empresas-form" onSubmit={(event) => void salvarEmpresa(event)}>
            <label>Razão social<input required maxLength={200} value={empresaForm.nome} onChange={(event) => setEmpresaForm({ ...empresaForm, nome: event.target.value })} /></label>
            <label>Logo (URL ou caminho)<input maxLength={300} value={empresaForm.logo} onChange={(event) => setEmpresaForm({ ...empresaForm, logo: event.target.value })} /></label>
            <label className="cadastro-check"><input type="checkbox" checked={empresaForm.ativa} onChange={(event) => setEmpresaForm({ ...empresaForm, ativa: event.target.checked })} /><span>Empresa ativa</span></label>
            <button className="btn" type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar empresa"}</button>
          </form>
        </Panel>
        {selecionada && <>
          <Panel title={`Funções · ${selecionada.nome}`} className="livre">
            <div className="cadastro-lista-cabecalho"><span>{selecionada.funcoes.length} cadastradas</span><button className="btn secondary" type="button" onClick={() => setFuncaoForm(FUNCAO_VAZIA)}>Nova função</button></div>
            {selecionada.funcoes.length > 0 && <div className="empresas-funcoes">{selecionada.funcoes.map((funcao) => <button key={funcao.id} type="button" className="funcao-linha" onClick={() => editarFuncao(funcao)}><span><strong>{funcao.nome}</strong><small>{funcao.permissoes.length} permissões · {funcao.ativa ? "Ativa" : "Inativa"}</small></span><span className="cadastro-editar">Editar</span></button>)}</div>}
            <form className="empresas-form" onSubmit={(event) => void salvarFuncao(event)}>
              <label>Nome da função<input required maxLength={100} value={funcaoForm.nome} onChange={(event) => setFuncaoForm({ ...funcaoForm, nome: event.target.value })} /></label>
              <div className="empresas-permissoes"><strong>Permissões</strong>{PERMISSOES.map((permissao) => <label className="cadastro-check" key={permissao.id}><input type="checkbox" checked={funcaoForm.permissoes.includes(permissao.id)} onChange={(event) => setFuncaoForm({ ...funcaoForm, permissoes: event.target.checked ? [...funcaoForm.permissoes, permissao.id] : funcaoForm.permissoes.filter((item) => item !== permissao.id) })} /><span>{permissao.nome}</span></label>)}</div>
              <label className="cadastro-check"><input type="checkbox" checked={funcaoForm.ativa} onChange={(event) => setFuncaoForm({ ...funcaoForm, ativa: event.target.checked })} /><span>Função ativa</span></label>
              <button className="btn" type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar função"}</button>
            </form>
          </Panel>
          <Panel title={`Representantes · ${selecionada.nome}`} className="livre">
            <div className="cadastro-lista-cabecalho"><span>{selecionada.representantes.length} cadastrados</span><button className="btn secondary" type="button" onClick={() => setRepresentanteForm(REPRESENTANTE_VAZIO)}>Novo representante</button></div>
            {selecionada.representantes.length > 0 && <div className="representantes-lista">{selecionada.representantes.map((representante) => <button key={representante.usuarioId} type="button" className="funcao-linha" onClick={() => editarRepresentante(representante)}><span><strong>{representante.nome}</strong><small>{representante.email} · {representante.funcoes.map((funcao) => funcao.nome).join(", ") || "Sem funções"}</small></span><span className={representante.ativo ? "cadastro-status ativo" : "cadastro-status"}>{representante.ativo ? "Ativo" : "Inativo"}</span></button>)}</div>}
            <form className="empresas-form" onSubmit={(event) => void salvarRepresentante(event)}>
              <label>Nome<input required maxLength={200} value={representanteForm.nome} onChange={(event) => setRepresentanteForm({ ...representanteForm, nome: event.target.value })} /></label>
              <label>E-mail de login Entra<input type="email" required maxLength={320} value={representanteForm.email} onChange={(event) => setRepresentanteForm({ ...representanteForm, email: event.target.value })} /></label>
              <div className="empresas-permissoes"><strong>Funções</strong>{selecionada.funcoes.map((funcao) => <label className="cadastro-check" key={funcao.id}><input type="checkbox" checked={representanteForm.funcoes.includes(funcao.id)} onChange={(event) => setRepresentanteForm({ ...representanteForm, funcoes: event.target.checked ? [...representanteForm.funcoes, funcao.id] : representanteForm.funcoes.filter((id) => id !== funcao.id) })} /><span>{funcao.nome}{!funcao.ativa ? " (inativa)" : ""}</span></label>)}</div>
              <div className="empresas-permissoes"><div className="cadastro-lista-cabecalho"><strong>Contatos</strong><button className="cadastro-editar" type="button" onClick={adicionarContato}>Adicionar contato</button></div>{representanteForm.contatos.map((contato, indice) => <div className="contato-linha" key={contato.id || `novo-${indice}`}>
                <label>Canal<select value={contato.canal} onChange={(event) => alterarContato(indice, { canal: event.target.value as ContatoRepresentante["canal"] })}><option value="EMAIL">E-mail</option><option value="TELEFONE">Telefone</option><option value="WHATSAPP">WhatsApp</option></select></label>
                <label>Contato<input required value={contato.valor} onChange={(event) => alterarContato(indice, { valor: event.target.value })} /></label>
                <label className="cadastro-check"><input type="radio" name={`principal-${contato.canal}`} checked={contato.principal} onChange={() => alterarContato(indice, { principal: true })} /><span>Principal</span></label>
                <button className="cadastro-editar" type="button" onClick={() => setRepresentanteForm({ ...representanteForm, contatos: representanteForm.contatos.filter((_, itemIndice) => itemIndice !== indice) })}>Remover</button>
              </div>)}</div>
              <label className="cadastro-check"><input type="checkbox" checked={representanteForm.ativo} onChange={(event) => setRepresentanteForm({ ...representanteForm, ativo: event.target.checked })} /><span>Representante ativo</span></label>
              <button className="btn" type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar representante"}</button>
            </form>
          </Panel>
        </>}
      </div>}
    </>
  );
}
