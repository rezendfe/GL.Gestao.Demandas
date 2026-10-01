import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useSessao } from "../../application/session";
import { mascaraCodigo, validarCodigo, validarData, validarOpcional, validarTexto } from "../../domain/entrada";
import { espacoPorChave, espacoPorEmail, type EspacoCessionario } from "../../domain/espacos";
import type { EmpresaCessionariaOpcao, EspacoInventario } from "../../domain/types";
import { ApiError, api } from "../../infrastructure/api/client";
import { PageHeader } from "../components/PageHeader";
import { Panel } from "../components/Panel";

type Secao = "perfil" | "local" | "entrega" | "vistoria";

const ABAS_ESPACOS = [
  { id: "espacos", rotulo: "Espaços", destino: "/espacos" },
  { id: "empresas", rotulo: "Empresas e acessos", destino: "/empresas-cessionarias" },
] as const;

export function AbasEspacos({ ativa }: { ativa: (typeof ABAS_ESPACOS)[number]["id"] }) {
  const navigate = useNavigate();
  return (
    <div className="visoes-centrais" role="tablist" aria-label="Espaços">
      {ABAS_ESPACOS.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          id={`aba-${item.id}`}
          className={ativa === item.id ? "visao-central ativa" : "visao-central"}
          aria-selected={ativa === item.id}
          aria-controls={`painel-${item.id}`}
          onClick={() => {
            if (ativa !== item.id) navigate(item.destino);
          }}
        >
          {item.rotulo}
        </button>
      ))}
    </div>
  );
}

function podeVer(perfil: string | undefined, email: string | undefined, espaco: EspacoCessionario) {
  if (perfil === "GL / Administrador" || perfil === "Responsável da Área") return true;
  return perfil === "Cessionário" && email === espaco.email;
}

export function MeuEspacoPage() {
  const { sessao } = useSessao();
  const espaco = espacoPorEmail(sessao?.usuario.email ?? "");
  if (!espaco) {
    return <p className="erro">Não há espaço associado a este login na demonstração.</p>;
  }
  return <Navigate to={`/espacos/${espaco.chave}`} replace />;
}

export function EspacosListaPage() {
  const { sessao } = useSessao();
  const [itens, setItens] = useState<EspacoInventario[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaCessionariaOpcao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [situacao, setSituacao] = useState("");
  const [vista, setVista] = useState<"cartoes" | "grade">("cartoes");
  const [formulario, setFormulario] = useState<{ id: string | null; codigo: string; nome: string; localizacao: string; descricao: string; ativo: boolean } | null>(null);
  const [locacaoEspacoId, setLocacaoEspacoId] = useState("");
  const [locacaoEmpresaId, setLocacaoEmpresaId] = useState("");
  const [locacaoInicio, setLocacaoInicio] = useState(new Date().toISOString().slice(0, 10));
  const [encerramentoEspacoId, setEncerramentoEspacoId] = useState("");
  const [locacaoTermino, setLocacaoTermino] = useState(new Date().toISOString().slice(0, 10));

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const [inventario, empresasDisponiveis] = await Promise.all([api.inventarioEspacos(), api.empresasCessionarias()]);
      setItens(inventario);
      setEmpresas(empresasDisponiveis);
      setLocacaoEmpresaId((atual) => atual || empresasDisponiveis.find((empresa) => empresa.ativa)?.id || "");
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Não foi possível carregar o inventário.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { void carregar(); }, []);

  if (sessao?.usuario.perfil !== "GL / Administrador") return <Navigate to="/inicio" replace />;

  const textoBusca = normalizarEspacos(busca.trim());
  const visiveis = itens.filter((item) => {
    if (situacao && item.situacao !== situacao) return false;
    return !textoBusca || normalizarEspacos(`${item.codigo} ${item.nome} ${item.localizacao} ${item.empresaLocataria?.nome ?? ""}`).includes(textoBusca);
  });

  function novoEspaco() {
    setFormulario({ id: null, codigo: "", nome: "", localizacao: "", descricao: "", ativo: true });
    setErro(null);
    setMensagem(null);
  }

  function editarEspaco(item: EspacoInventario) {
    setFormulario({
      id: item.id,
      codigo: item.codigo,
      nome: item.nome,
      localizacao: item.localizacao,
      descricao: item.descricao,
      ativo: item.situacao !== "Inativo",
    });
    setErro(null);
    setMensagem(null);
  }

  async function salvarEspaco(event: FormEvent) {
    event.preventDefault();
    if (!formulario) return;
    const codigoInvalido = validarCodigo(formulario.codigo);
    const nomeInvalido = validarTexto(formulario.nome, 2, 120, "O nome do espaço deve ter entre 2 e 120 caracteres.");
    const localInvalido = validarTexto(formulario.localizacao, 1, 240, "Informe a localização do espaço.");
    const descricaoInvalida = validarOpcional(formulario.descricao, 1000, "A descrição do espaço tem no máximo 1000 caracteres.");
    if (codigoInvalido || nomeInvalido || localInvalido || descricaoInvalida) {
      setErro(codigoInvalido ?? nomeInvalido ?? localInvalido ?? descricaoInvalida);
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      await api.salvarEspaco(formulario);
      setFormulario(null);
      setMensagem("Espaço salvo.");
      await carregar();
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Não foi possível salvar o espaço.");
    } finally {
      setSalvando(false);
    }
  }

  async function iniciarLocacao(event: FormEvent) {
    event.preventDefault();
    const dataInvalida = validarData(locacaoInicio);
    if (!locacaoEmpresaId || dataInvalida) {
      setErro(dataInvalida ?? "Selecione uma empresa Cessionária ativa.");
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      await api.iniciarLocacao(locacaoEspacoId, locacaoEmpresaId, locacaoInicio);
      setLocacaoEspacoId("");
      setMensagem("Locação iniciada.");
      await carregar();
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Não foi possível iniciar a locação.");
    } finally {
      setSalvando(false);
    }
  }

  async function encerrarLocacao(event: FormEvent) {
    event.preventDefault();
    const inicioVigente = itens.find((item) => item.id === encerramentoEspacoId)?.historico.find((locacao) => !locacao.termino)?.inicio.slice(0, 10);
    const dataInvalida = validarData(locacaoTermino, inicioVigente, "A data de término não pode ser anterior ao início da locação.");
    if (dataInvalida) {
      setErro(dataInvalida);
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      await api.encerrarLocacao(encerramentoEspacoId, locacaoTermino);
      setEncerramentoEspacoId("");
      setMensagem("Locação encerrada; histórico preservado.");
      await carregar();
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Não foi possível encerrar a locação.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <PageHeader title="Espaços" trail={["Início", "Espaços"]} />
      <AbasEspacos ativa="espacos" />
      {erro && <p className="erro" role="alert">{erro}</p>}
      {mensagem && <p className="cadastro-ok" role="status">{mensagem}</p>}
      <div role="tabpanel" id="painel-espacos" aria-labelledby="aba-espacos">
      <Panel title="Inventário" className="livre">
        <div className="cadastro-lista-cabecalho">
          <span>{visiveis.length} de {itens.length}</span>
          <button className="btn secondary" type="button" onClick={novoEspaco}>Novo espaço</button>
        </div>
        <div className="espacos-toolbar">
          <label>Buscar<input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Código, espaço, localização ou empresa" /></label>
          <label>Situação<select value={situacao} onChange={(event) => setSituacao(event.target.value)}>
            <option value="">Todas</option><option>Disponível</option><option>Locado</option><option>Inativo</option>
          </select></label>
          <fieldset className="espacos-vistas"><legend>Visualização</legend>
            <label><input type="radio" name="vista-espacos" checked={vista === "cartoes"} onChange={() => setVista("cartoes")} />Cartões</label>
            <label><input type="radio" name="vista-espacos" checked={vista === "grade"} onChange={() => setVista("grade")} />Grade</label>
          </fieldset>
        </div>
        {carregando ? <p>Carregando inventário...</p> : visiveis.length === 0 ? <p>Nenhum espaço corresponde aos filtros.</p> : vista === "cartoes" ? (
          <div className="espacos-cartoes">
            {visiveis.map((item) => <article className="espaco-admin" key={item.id}>
              <div className="espaco-admin-topo"><span className={`espaco-situacao ${classeSituacao(item.situacao)}`}>{item.situacao}</span><span className="note">{item.codigo}</span></div>
              <h2>{item.nome}</h2><p>{item.localizacao}</p>
              {item.empresaLocataria && <p><strong>{item.empresaLocataria.nome}</strong><span className="note"> · locatária atual</span></p>}
              {item.descricao && <p className="note">{item.descricao}</p>}
              <div className="espaco-admin-acoes">
                <button className="btn secondary" type="button" onClick={() => editarEspaco(item)}>Editar</button>
                {item.situacao === "Disponível" && <button className="btn secondary" type="button" onClick={() => setLocacaoEspacoId(item.id)}>Locar</button>}
                {item.situacao === "Locado" && <button className="btn secondary" type="button" onClick={() => setEncerramentoEspacoId(item.id)}>Encerrar locação</button>}
              </div>
              <details className="espaco-historico"><summary>Histórico de locações ({item.historico.length})</summary>
                {item.historico.length === 0 ? <p>Nenhuma locação registrada.</p> : <ol>{item.historico.map((locacao) => <li key={locacao.id}><strong>{locacao.empresa}</strong><span>{formatarData(locacao.inicio)} – {locacao.termino ? formatarData(locacao.termino) : "Vigente"}</span></li>)}</ol>}
              </details>
            </article>)}
          </div>
        ) : (
          <div className="espacos-grade-wrap"><table className="espacos-grade"><thead><tr><th>Espaço</th><th>Localização</th><th>Empresa locatária</th><th>Situação</th><th>Ações</th></tr></thead>
            <tbody>{visiveis.map((item) => <tr key={item.id}><td><strong>{item.nome}</strong><small>{item.codigo}</small></td><td>{item.localizacao}</td><td>{item.empresaLocataria?.nome ?? "—"}</td><td><span className={`espaco-situacao ${classeSituacao(item.situacao)}`}>{item.situacao}</span></td><td className="espaco-admin-acoes"><button type="button" className="cadastro-editar" onClick={() => editarEspaco(item)}>Editar</button>{item.situacao === "Disponível" && <button type="button" className="cadastro-editar" onClick={() => setLocacaoEspacoId(item.id)}>Locar</button>}{item.situacao === "Locado" && <button type="button" className="cadastro-editar" onClick={() => setEncerramentoEspacoId(item.id)}>Encerrar</button>}</td></tr>)}</tbody>
          </table></div>
        )}
      </Panel>
      {formulario && <Panel title={formulario.id ? "Editar espaço" : "Novo espaço"}>
        <form className="espacos-form" onSubmit={(event) => void salvarEspaco(event)}>
          <label>Código<input required maxLength={40} autoComplete="off" value={formulario.codigo} onChange={(event) => setFormulario({ ...formulario, codigo: mascaraCodigo(event.target.value) })} /></label>
          <label>Nome<input required maxLength={120} value={formulario.nome} onChange={(event) => setFormulario({ ...formulario, nome: event.target.value })} /></label>
          <label>Localização<input required maxLength={240} value={formulario.localizacao} onChange={(event) => setFormulario({ ...formulario, localizacao: event.target.value })} /></label>
          <label>Descrição<textarea maxLength={1000} rows={3} value={formulario.descricao} onChange={(event) => setFormulario({ ...formulario, descricao: event.target.value })} /></label>
          <label className="cadastro-check"><input type="checkbox" checked={formulario.ativo} onChange={(event) => setFormulario({ ...formulario, ativo: event.target.checked })} /><span>Espaço ativo</span></label>
          <div className="row"><button className="btn" type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar espaço"}</button><button className="btn secondary" type="button" onClick={() => setFormulario(null)}>Cancelar</button></div>
        </form>
      </Panel>}
      {locacaoEspacoId && <Panel title="Iniciar locação">
        <form className="espacos-form" onSubmit={(event) => void iniciarLocacao(event)}>
          <label>Empresa Cessionária<select required value={locacaoEmpresaId} onChange={(event) => setLocacaoEmpresaId(event.target.value)}><option value="">Selecione</option>{empresas.filter((empresa) => empresa.ativa).map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>)}</select></label>
          <label>Início<input type="date" required value={locacaoInicio} onChange={(event) => setLocacaoInicio(event.target.value)} /></label>
          <div className="row"><button className="btn" type="submit" disabled={salvando || !locacaoEmpresaId}>{salvando ? "Salvando..." : "Confirmar locação"}</button><button className="btn secondary" type="button" onClick={() => setLocacaoEspacoId("")}>Cancelar</button></div>
        </form>
      </Panel>}
      {encerramentoEspacoId && <Panel title="Encerrar locação">
        <form className="espacos-form" onSubmit={(event) => void encerrarLocacao(event)}>
          <label>Término<input type="date" required min={itens.find((item) => item.id === encerramentoEspacoId)?.historico.find((locacao) => !locacao.termino)?.inicio.slice(0, 10)} value={locacaoTermino} onChange={(event) => setLocacaoTermino(event.target.value)} /></label>
          <div className="row"><button className="btn" type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Confirmar encerramento"}</button><button className="btn secondary" type="button" onClick={() => setEncerramentoEspacoId("")}>Cancelar</button></div>
        </form>
      </Panel>}
      </div>
    </>
  );
}

function normalizarEspacos(valor: string) {
  return valor.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function classeSituacao(situacao: EspacoInventario["situacao"]) {
  return situacao === "Disponível" ? "disponivel" : situacao === "Locado" ? "locado" : "inativo";
}

function formatarData(valor: string) {
  return new Date(`${valor.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR");
}

export function EspacoPage() {
  const { chave = "", secao } = useParams();
  const { sessao } = useSessao();
  const espaco = espacoPorChave(chave);
  if (!espaco) return <p className="erro">Espaço não encontrado.</p>;
  if (!podeVer(sessao?.usuario.perfil, sessao?.usuario.email, espaco)) {
    return <p className="erro">Esta ficha pertence a outro Cessionário.</p>;
  }

  const ativa = (secao ?? "") as Secao;
  if (ativa === "perfil" || ativa === "local" || ativa === "entrega" || ativa === "vistoria") {
    return <DetalheSecao espaco={espaco} secao={ativa} />;
  }

  return (
    <>
      <PageHeader title={espaco.sala} trail={["Início", "Espaço", espaco.nome]} />
      <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>
        Ficha de demonstração. Cada cartão abre o detalhe. O cadastro definitivo de entrega e vistoria ainda depende do cliente.
      </p>
      <section className="ficha-hero">
        <img src={espaco.foto} alt={`Foto de ${espaco.nome}`} />
        <div>
          <h2>{espaco.nome}</h2>
          <p>{espaco.empresa}</p>
          <p className="note">{espaco.sala}</p>
        </div>
      </section>
      <div className="cards cards-always">
        <Link className="profile-card" to={`/espacos/${espaco.chave}/perfil`}>
          <img src={espaco.foto} alt="" />
          <strong>Perfil</strong>
          <span>Foto de quem está logado neste espaço</span>
        </Link>
        <Link className="profile-card" to={`/espacos/${espaco.chave}/local`}>
          <img src={espaco.local.foto} alt="" />
          <strong>Local</strong>
          <span>{espaco.local.titulo}</span>
        </Link>
        <Link className="profile-card" to={`/espacos/${espaco.chave}/entrega`}>
          <img src={espaco.entrega.foto} alt="" />
          <strong>Como foi entregue</strong>
          <span>{espaco.entrega.data}</span>
        </Link>
        <Link className="profile-card" to={`/espacos/${espaco.chave}/vistoria`}>
          <img src={espaco.vistoria.fotos[0]?.url} alt="" />
          <strong>Última vistoria</strong>
          <span>{espaco.vistoria.data} · {espaco.vistoria.fotos.length} fotos</span>
        </Link>
      </div>
    </>
  );
}

function DetalheSecao({ espaco, secao }: { espaco: EspacoCessionario; secao: Secao }) {
  const titulos: Record<Secao, string> = {
    perfil: "Perfil",
    local: "Local",
    entrega: "Como foi entregue",
    vistoria: "Última vistoria",
  };
  return (
    <>
      <PageHeader title={titulos[secao]} trail={["Início", espaco.sala, titulos[secao]]} extra={<Link className="btn secondary" to={`/espacos/${espaco.chave}`}>Voltar à ficha</Link>} />
      {secao === "perfil" && (
        <article className="detalhe-espaco">
          <img className="detalhe-capa" src={espaco.foto} alt={`Foto de ${espaco.nome}`} />
          <h2>{espaco.nome}</h2>
          <p>{espaco.empresa}</p>
          <p className="note">{espaco.email}</p>
          <p>Telefone da empresa: {espaco.telefone}</p>
          <p>Esta é a foto do Cessionário associada ao login deste espaço.</p>
        </article>
      )}
      {secao === "local" && (
        <article className="detalhe-espaco">
          <img className="detalhe-capa" src={espaco.local.foto} alt={espaco.local.titulo} />
          <h2>{espaco.local.titulo}</h2>
          <p>{espaco.local.endereco}</p>
          <p>{espaco.local.descricao}</p>
        </article>
      )}
      {secao === "entrega" && (
        <article className="detalhe-espaco">
          <img className="detalhe-capa" src={espaco.entrega.foto} alt="Registro da entrega" />
          <h2>Entrega em {espaco.entrega.data}</h2>
          <p>{espaco.entrega.como}</p>
          <p>{espaco.entrega.observacao}</p>
        </article>
      )}
      {secao === "vistoria" && (
        <article className="detalhe-espaco">
          <h2>Vistoria de {espaco.vistoria.data}</h2>
          <p>{espaco.vistoria.resumo}</p>
          <div className="galeria">
            {espaco.vistoria.fotos.map((foto) => (
              <figure key={foto.id}>
                <img src={foto.url} alt={foto.legenda} />
                <figcaption>{foto.legenda}</figcaption>
              </figure>
            ))}
          </div>
        </article>
      )}
    </>
  );
}

export function FichaLateral({ email }: { email: string }) {
  const espaco = espacoPorEmail(email);
  if (!espaco) return null;
  return (
    <aside className="ficha-lateral">
      <img src={espaco.foto} alt="" />
      <strong>{espaco.nome}</strong>
      <span className="note">{espaco.empresa}</span>
      <Link to={`/espacos/${espaco.chave}/perfil`}>Perfil</Link>
      <Link to={`/espacos/${espaco.chave}/local`}>{espaco.sala}</Link>
      <Link to={`/espacos/${espaco.chave}/entrega`}>Entrega em {espaco.entrega.data}</Link>
      <Link to={`/espacos/${espaco.chave}/vistoria`}>Vistoria {espaco.vistoria.data}</Link>
    </aside>
  );
}
