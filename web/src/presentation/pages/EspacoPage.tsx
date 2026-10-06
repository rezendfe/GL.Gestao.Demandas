import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useSessao } from "../../application/session";
import { mascaraCodigo, validarCodigo, validarData, validarOpcional, validarTexto } from "../../domain/entrada";
import { espacoPorChave, espacoPorCodigo, espacoPorEmail, fotosDaLoja, type EspacoCessionario, type FotoVistoria } from "../../domain/espacos";
import { GaleriaLightbox } from "../components/GaleriaLightbox";
import type { EmpresaCessionariaOpcao, EspacoInventario } from "../../domain/types";
import { baixarPlanilha, DEFINICOES_CARGA, interpretarAtivo } from "../../domain/cargaCadastro";
import { ApiError, api } from "../../infrastructure/api/client";
import { useAcoesDaPagina } from "../components/AcoesRapidas";
import { CargaPlanilha } from "../components/CargaPlanilha";
import { ModalCadastro } from "../components/ModalCadastro";
import { EstadoAcao } from "../components/EstadoAcao";
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
    return <p className="erro">Não há espaço associado a este login na demonstração. <Link className="btn secondary" to="/inicio">Voltar ao início</Link></p>;
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
  const [cargaAberta, setCargaAberta] = useState(false);
  const [galeria, setGaleria] = useState<{ fotos: FotoVistoria[]; indice: number } | null>(null);

  useAcoesDaPagina([
    { id: "nova", rotulo: "Novo espaço", icone: "mais", executar: () => { setCargaAberta(false); novoEspaco(); } },
    { id: "importar", rotulo: "Importar espaços", icone: "importar", executar: () => { setFormulario(null); setLocacaoEspacoId(""); setEncerramentoEspacoId(""); setCargaAberta(true); } },
    { id: "exportar-planilha", rotulo: "Exportar planilha", rotuloOcupado: "Gerando planilha...", icone: "planilha", executar: () => exportarEspacos() },
    ...(erro && !formulario && !locacaoEspacoId && !encerramentoEspacoId ? [{
      id: "tentar",
      rotulo: "Tentar de novo",
      icone: "alerta" as const,
      executar: () => carregar(),
    }] : []),
  ]);

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

  function exportarEspacos() {
    baixarPlanilha(
      "espacos.csv",
      ["Código", "Espaço", "Localização", "Empresa locatária", "Situação"],
      visiveis.map((item) => [item.codigo, item.nome, item.localizacao, item.empresaLocataria?.nome ?? "", item.situacao]),
    );
  }

  function novoEspaco() {
    setCargaAberta(false);
    setFormulario({ id: null, codigo: "", nome: "", localizacao: "", descricao: "", ativo: true });
    setErro(null);
    setMensagem(null);
  }

  function editarEspaco(item: EspacoInventario) {
    setCargaAberta(false);
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

  async function gravarEspacos(linhas: { numero: number; valores: Record<string, string> }[]) {
    for (const linha of linhas) {
      const valores = linha.valores;
      try {
        await api.salvarEspaco({
          id: null,
          codigo: mascaraCodigo(valores.codigo),
          nome: valores.nome.trim(),
          localizacao: valores.localizacao.trim(),
          descricao: valores.descricao.trim(),
          ativo: interpretarAtivo(valores.ativo) === true,
        });
      } catch (error) {
        await carregar();
        const texto = error instanceof ApiError ? error.message : "Não foi possível gravar o espaço.";
        throw new Error(`Linha ${linha.numero}: ${texto}`);
      }
    }
    setMensagem(linhas.length === 1 ? "1 espaço importado." : `${linhas.length} espaços importados.`);
    setCargaAberta(false);
    await carregar();
  }

  return (
    <>
      <PageHeader title="Espaços" trail={["Início", "Espaços"]} />
      {cargaAberta && (
        <CargaPlanilha
          tipo="espacos"
          definicao={DEFINICOES_CARGA.espacos}
          nomes={itens.map((item) => item.codigo)}
          onFechar={() => setCargaAberta(false)}
          onGravar={gravarEspacos}
        />
      )}
      <AbasEspacos ativa="espacos" />
      {erro && !formulario && !locacaoEspacoId && !encerramentoEspacoId && (
        <p className="erro">{erro}</p>
      )}
      {mensagem && <p className="cadastro-ok" role="status">{mensagem}</p>}
      <div role="tabpanel" id="painel-espacos" aria-labelledby="aba-espacos">
      <Panel title="Inventário" className="livre">
        <div className="cadastro-lista-cabecalho">
          <span>{visiveis.length} de {itens.length}</span>
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
        {carregando ? <p>Carregando inventário...</p> : visiveis.length === 0 ? (
          <p className="fila-vazio">
            {itens.length === 0 ? "Nenhum espaço cadastrado." : "Nenhum espaço corresponde aos filtros."}
          </p>
        ) : vista === "cartoes" ? (
          <div className="espacos-cartoes">
            {visiveis.map((item) => {
              const loja = espacoPorCodigo(item.codigo);
              const nome = loja?.sala ?? item.nome;
              const localizacao = loja?.local.endereco ?? item.localizacao;
              const fotos = loja ? fotosDaLoja(loja) : [];
              return <article className="espaco-admin" key={item.id}>
              <div className="espaco-admin-topo"><span className={`espaco-situacao ${classeSituacao(item.situacao)}`}>{item.situacao}</span><span className="note">{item.codigo}</span></div>
              {fotos.length > 0 && (
                <div className="loja-par">
                  <button type="button" className="foto-botao" onClick={() => setGaleria({ fotos, indice: 0 })}>
                    <img src={loja!.local.fachada} alt="" />
                    <span>Fachada</span>
                  </button>
                  <button type="button" className="foto-botao" onClick={() => setGaleria({ fotos, indice: 1 })}>
                    <img src={loja!.local.interior} alt="" />
                    <span>Interior</span>
                  </button>
                </div>
              )}
              <h2>{nome}</h2><p>{localizacao}</p>
              <p className="note">Próximo passo: {item.situacao === "Disponível" ? "Locar" : item.situacao === "Locado" ? "Encerrar locação" : "Editar"}</p>
              {item.empresaLocataria && <p><strong>{item.empresaLocataria.nome}</strong><span className="note"> · locatária atual</span></p>}
              {(loja?.local.descricao || item.descricao) && <p className="note">{loja?.local.descricao ?? item.descricao}</p>}
              <div className="espaco-admin-acoes">
                <button className="btn secondary" type="button" onClick={() => editarEspaco(item)}>Editar</button>
                {item.situacao === "Disponível" && <button className="btn" type="button" onClick={() => { setCargaAberta(false); setLocacaoEspacoId(item.id); }}>Locar</button>}
                {item.situacao === "Locado" && <button className="btn" type="button" onClick={() => setEncerramentoEspacoId(item.id)}>Encerrar locação</button>}
              </div>
              <details className="espaco-historico"><summary>Histórico de locações ({item.historico.length})</summary>
                {item.historico.length === 0 ? <p>Nenhuma locação registrada.</p> : <ol>{item.historico.map((locacao) => <li key={locacao.id}><strong>{locacao.empresa}</strong><span>{formatarData(locacao.inicio)} – {locacao.termino ? formatarData(locacao.termino) : "Vigente"}</span></li>)}</ol>}
              </details>
            </article>;
            })}
          </div>
        ) : (
          <div className="espacos-grade-wrap"><table className="espacos-grade"><thead><tr><th>Espaço</th><th>Localização</th><th>Empresa locatária</th><th>Situação</th><th>Ações</th></tr></thead>
            <tbody>{visiveis.map((item) => {
              const loja = espacoPorCodigo(item.codigo);
              return <tr key={item.id}><td><strong>{loja?.sala ?? item.nome}</strong><small>{item.codigo}</small></td><td>{loja?.local.endereco ?? item.localizacao}</td><td>{item.empresaLocataria?.nome ?? "—"}</td><td><span className={`espaco-situacao ${classeSituacao(item.situacao)}`}>{item.situacao}</span></td><td className="espaco-admin-acoes"><button type="button" className="cadastro-editar" onClick={() => editarEspaco(item)}>Editar</button>{item.situacao === "Disponível" && <button type="button" className="cadastro-editar" onClick={() => { setCargaAberta(false); setLocacaoEspacoId(item.id); }}>Locar</button>}{item.situacao === "Locado" && <button type="button" className="cadastro-editar" onClick={() => { setCargaAberta(false); setEncerramentoEspacoId(item.id); }}>Encerrar</button>}</td></tr>;
            })}</tbody>
          </table></div>
        )}
      </Panel>
      {formulario && <ModalCadastro titulo={formulario.id ? "Editar espaço" : "Novo espaço"} onFechar={() => { if (!salvando) { setFormulario(null); setErro(null); } }}>
        {erro && <p className="erro" role="alert">{erro}</p>}
        <form className="espacos-form" onSubmit={(event) => void salvarEspaco(event)}>
          <label>Código<input required maxLength={40} autoComplete="off" value={formulario.codigo} onChange={(event) => setFormulario({ ...formulario, codigo: mascaraCodigo(event.target.value) })} /></label>
          <label>Nome<input required maxLength={120} value={formulario.nome} onChange={(event) => setFormulario({ ...formulario, nome: event.target.value })} /></label>
          <label>Localização<input required maxLength={240} value={formulario.localizacao} onChange={(event) => setFormulario({ ...formulario, localizacao: event.target.value })} /></label>
          <label>Descrição<textarea maxLength={1000} rows={3} value={formulario.descricao} onChange={(event) => setFormulario({ ...formulario, descricao: event.target.value })} /></label>
          <label className="cadastro-check"><input type="checkbox" checked={formulario.ativo} onChange={(event) => setFormulario({ ...formulario, ativo: event.target.checked })} /><span>Espaço ativo</span></label>
          <div className="row"><button className="btn" type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar espaço"}</button><button className="btn secondary" type="button" disabled={salvando} onClick={() => { setFormulario(null); setErro(null); }}>Cancelar</button></div>
        </form>
      </ModalCadastro>}
      {locacaoEspacoId && <ModalCadastro titulo="Iniciar locação" onFechar={() => { if (!salvando) { setLocacaoEspacoId(""); setErro(null); } }}>
        {erro && <p className="erro" role="alert">{erro}</p>}
        <form className="espacos-form" onSubmit={(event) => void iniciarLocacao(event)}>
          <label>Empresa Cessionária<select required value={locacaoEmpresaId} onChange={(event) => setLocacaoEmpresaId(event.target.value)}><option value="">Selecione</option>{empresas.filter((empresa) => empresa.ativa).map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>)}</select></label>
          <label>Início<input type="date" required value={locacaoInicio} onChange={(event) => setLocacaoInicio(event.target.value)} /></label>
          <div className="row"><button className="btn" type="submit" disabled={salvando || !locacaoEmpresaId}>{salvando ? "Salvando..." : "Confirmar locação"}</button><button className="btn secondary" type="button" disabled={salvando} onClick={() => { setLocacaoEspacoId(""); setErro(null); }}>Cancelar</button></div>
        </form>
      </ModalCadastro>}
      {encerramentoEspacoId && <ModalCadastro titulo="Encerrar locação" onFechar={() => { if (!salvando) { setEncerramentoEspacoId(""); setErro(null); } }}>
        {erro && <p className="erro" role="alert">{erro}</p>}
        <form className="espacos-form" onSubmit={(event) => void encerrarLocacao(event)}>
          <label>Término<input type="date" required min={itens.find((item) => item.id === encerramentoEspacoId)?.historico.find((locacao) => !locacao.termino)?.inicio.slice(0, 10)} value={locacaoTermino} onChange={(event) => setLocacaoTermino(event.target.value)} /></label>
          <div className="row"><button className="btn" type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Confirmar encerramento"}</button><button className="btn secondary" type="button" disabled={salvando} onClick={() => { setEncerramentoEspacoId(""); setErro(null); }}>Cancelar</button></div>
        </form>
      </ModalCadastro>}
      </div>
      <GaleriaLightbox
        fotos={galeria?.fotos ?? []}
        indice={galeria?.indice ?? null}
        onIndice={(indice) => setGaleria((atual) => atual ? { ...atual, indice } : atual)}
        onFechar={() => setGaleria(null)}
      />
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
  const navigate = useNavigate();
  const { sessao } = useSessao();
  const espaco = espacoPorChave(chave);
  const ativa = (secao ?? "") as Secao;
  const secaoValida = ativa === "perfil" || ativa === "local" || ativa === "entrega" || ativa === "vistoria";
  const [galeria, setGaleria] = useState<{ fotos: FotoVistoria[]; indice: number } | null>(null);
  useAcoesDaPagina(!espaco ? [] : secaoValida ? [{
    id: "voltar-ficha",
    rotulo: "Voltar à ficha",
    icone: "casa",
    executar: () => navigate(`/espacos/${espaco.chave}`),
  }] : [{
    id: "ver-local",
    rotulo: "Ver o local",
    icone: "casa",
    executar: () => navigate(`/espacos/${espaco.chave}/local`),
  }]);
  if (!espaco) {
    return <p className="erro">Espaço não encontrado.</p>;
  }
  if (!podeVer(sessao?.usuario.perfil, sessao?.usuario.email, espaco)) {
    return <p className="erro">Esta ficha pertence a outro Cessionário.</p>;
  }

  const fotosLoja = fotosDaLoja(espaco);
  const fotoPessoa: FotoVistoria[] = [{ id: `${espaco.chave}-pessoa`, legenda: espaco.nome, url: espaco.foto }];

  if (secaoValida) {
    return <DetalheSecao espaco={espaco} secao={ativa} />;
  }

  return (
    <>
      <PageHeader
        title={espaco.sala}
        trail={["Início", { rotulo: "Espaço", para: sessao?.usuario.perfil === "GL / Administrador" ? "/espacos" : undefined }, espaco.nome]}
      />
      <Panel title={espaco.nome}>
        <button type="button" className="foto-botao capa" onClick={() => setGaleria({ fotos: fotoPessoa, indice: 0 })}>
          <img className="detalhe-capa" src={espaco.foto} alt={`Foto de ${espaco.nome}`} />
        </button>
        <p className="note">Loja para locação no shopping. A foto abre em tela cheia.</p>
        <EstadoAcao situacao="Ficha do espaço" proximo="Conferir o local" />
        <p>{espaco.empresa}</p>
        <p className="note">{espaco.sala}</p>
      </Panel>
      <Panel title="Conteúdo do espaço">
      <div className="cards cards-always">
        <article className="profile-card">
          <button type="button" className="foto-botao" onClick={() => setGaleria({ fotos: fotoPessoa, indice: 0 })}>
            <img src={espaco.foto} alt="" />
          </button>
          <Link to={`/espacos/${espaco.chave}/perfil`}>
            <strong>Perfil</strong>
            <span>Foto de quem está logado neste espaço</span>
          </Link>
        </article>
        <article className="profile-card">
          <button type="button" className="foto-botao" onClick={() => setGaleria({ fotos: fotosLoja, indice: 0 })}>
            <img src={espaco.local.fachada} alt="" />
          </button>
          <Link to={`/espacos/${espaco.chave}/local`}>
            <strong>Local</strong>
            <span>{espaco.local.titulo}</span>
          </Link>
        </article>
        <article className="profile-card">
          <button type="button" className="foto-botao" onClick={() => setGaleria({ fotos: fotosLoja, indice: 2 })}>
            <img src={espaco.entrega.foto} alt="" />
          </button>
          <Link to={`/espacos/${espaco.chave}/entrega`}>
            <strong>Como foi entregue</strong>
            <span>{espaco.entrega.data}</span>
          </Link>
        </article>
        <article className="profile-card">
          <button type="button" className="foto-botao" onClick={() => setGaleria({ fotos: fotosLoja, indice: 3 })}>
            <img src={espaco.vistoria.fotos[0]?.url} alt="" />
          </button>
          <Link to={`/espacos/${espaco.chave}/vistoria`}>
            <strong>Última vistoria</strong>
            <span>{espaco.vistoria.data} · {espaco.vistoria.fotos.length} fotos</span>
          </Link>
        </article>
      </div>
      </Panel>
      <GaleriaLightbox
        fotos={galeria?.fotos ?? []}
        indice={galeria?.indice ?? null}
        onIndice={(indice) => setGaleria((atual) => atual ? { ...atual, indice } : atual)}
        onFechar={() => setGaleria(null)}
      />
    </>
  );
}

function DetalheSecao({ espaco, secao }: { espaco: EspacoCessionario; secao: Secao }) {
  const [indice, setIndice] = useState<number | null>(null);
  const fotos = fotosDaLoja(espaco);
  const pessoa: FotoVistoria[] = [{ id: `${espaco.chave}-pessoa`, legenda: espaco.nome, url: espaco.foto }];
  const titulos: Record<Secao, string> = {
    perfil: "Perfil",
    local: "Local",
    entrega: "Como foi entregue",
    vistoria: "Última vistoria",
  };
  const abertas = secao === "perfil" ? pessoa : fotos;
  return (
    <>
      <PageHeader title={titulos[secao]} trail={["Início", { rotulo: espaco.sala, para: `/espacos/${espaco.chave}` }, titulos[secao]]} />
      {secao === "perfil" && (
        <article className="detalhe-espaco">
          <button type="button" className="foto-botao capa" onClick={() => setIndice(0)}>
            <img className="detalhe-capa" src={espaco.foto} alt={`Foto de ${espaco.nome}`} />
          </button>
          <h2>{espaco.nome}</h2>
          <p>{espaco.empresa}</p>
          <p className="note">{espaco.email}</p>
          <p>Telefone da empresa: {espaco.telefone}</p>
          <p>Esta é a foto do Cessionário associada ao login deste espaço.</p>
        </article>
      )}
      {secao === "local" && (
        <article className="detalhe-espaco">
          <div className="loja-par">
            <button type="button" className="foto-botao" onClick={() => setIndice(0)}>
              <img src={espaco.local.fachada} alt="" />
              <span>Fachada</span>
            </button>
            <button type="button" className="foto-botao" onClick={() => setIndice(1)}>
              <img src={espaco.local.interior} alt="" />
              <span>Interior</span>
            </button>
          </div>
          <h2>{espaco.local.titulo}</h2>
          <p>{espaco.local.endereco}</p>
          <p>{espaco.local.descricao}</p>
        </article>
      )}
      {secao === "entrega" && (
        <article className="detalhe-espaco">
          <button type="button" className="foto-botao capa" onClick={() => setIndice(2)}>
            <img className="detalhe-capa" src={espaco.entrega.foto} alt="Registro da entrega" />
          </button>
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
            {espaco.vistoria.fotos.map((foto, posicao) => (
              <figure key={foto.id}>
                <button type="button" className="foto-botao" onClick={() => setIndice(3 + posicao)}>
                  <img src={foto.url} alt={foto.legenda} />
                </button>
                <figcaption>{foto.legenda}</figcaption>
              </figure>
            ))}
          </div>
        </article>
      )}
      <GaleriaLightbox fotos={abertas} indice={indice} onIndice={setIndice} onFechar={() => setIndice(null)} />
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
