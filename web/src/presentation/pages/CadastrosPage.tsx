import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useSessao } from "../../application/session";
import type { Catalogo } from "../../domain/types";
import { apenasDigitos, mascaraEmail, validarEmail, validarHoras, validarOpcional, validarTexto } from "../../domain/entrada";
import { PERIODOS_ABERTURA } from "../../domain/modeloAbertura";
import { ApiError, api } from "../../infrastructure/api/client";
import { PageHeader } from "../components/PageHeader";
import { Panel } from "../components/Panel";

const FLUXOS = ["Atendimento", "Aprovação", "Obra"];
const ABAS = [
  { id: "categorias", rotulo: "Categorias" },
  { id: "tipos", rotulo: "Tipos de atendimento" },
  { id: "areas", rotulo: "Áreas" },
  { id: "responsaveis", rotulo: "Responsáveis" },
] as const;

type Aba = (typeof ABAS)[number]["id"];

const INTRO: Record<Aba, string> = {
  categorias: "A categoria agrupa os tipos de atendimento, pode ter uma meta de prazo e um modelo de abertura.",
  tipos: "Cada tipo direciona a demanda para uma área e um fluxo.",
  areas: "A área recebe as demandas do tipo de atendimento vinculado a ela.",
  responsaveis: "O responsável atua em uma área. O perfil permanece Responsável da Área.",
};

function abaValida(valor: string | null): Aba {
  return ABAS.some((aba) => aba.id === valor) ? (valor as Aba) : "categorias";
}

function normalizar(valor: string) {
  return valor.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function combina(termo: string, texto: string) {
  const busca = normalizar(termo.trim());
  return !busca || normalizar(texto).includes(busca);
}

export function CadastrosPage() {
  const { sessao } = useSessao();
  const [parametros, setParametros] = useSearchParams();
  const aba = abaValida(parametros.get("aba"));
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [busca, setBusca] = useState<Record<Aba, string>>({ categorias: "", tipos: "", areas: "", responsaveis: "" });
  const [categoriaId, setCategoriaId] = useState("");
  const [categoriaNome, setCategoriaNome] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState(true);
  const [categoriaPrazo, setCategoriaPrazo] = useState("");
  const [assuntoSugerido, setAssuntoSugerido] = useState("");
  const [pontoSugerido, setPontoSugerido] = useState("");
  const [periodoSugerido, setPeriodoSugerido] = useState("");
  const [itensSugeridos, setItensSugeridos] = useState("");
  const [tipoId, setTipoId] = useState("");
  const [tipoNome, setTipoNome] = useState("");
  const [tipoCategoriaId, setTipoCategoriaId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [fluxo, setFluxo] = useState(FLUXOS[0]);
  const [tipoAtivo, setTipoAtivo] = useState(true);
  const [areaCadastroId, setAreaCadastroId] = useState("");
  const [areaNome, setAreaNome] = useState("");
  const [areaAtiva, setAreaAtiva] = useState(true);
  const [responsavelId, setResponsavelId] = useState("");
  const [responsavelNome, setResponsavelNome] = useState("");
  const [responsavelEmail, setResponsavelEmail] = useState("");
  const [responsavelAreaId, setResponsavelAreaId] = useState("");
  const [responsavelAtivo, setResponsavelAtivo] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    void api.catalogo()
      .then((dados) => {
        setCatalogo(dados);
        const categoriaAtivaId = dados.categorias.find((categoria) => categoria.ativa)?.id ?? "";
        const areaAtivaId = dados.areas.find((area) => area.ativa)?.id ?? "";
        setTipoCategoriaId(categoriaAtivaId);
        setAreaId(areaAtivaId);
        setResponsavelAreaId(areaAtivaId);
      })
      .catch((error: unknown) => setErro(error instanceof ApiError ? error.message : "Não foi possível carregar os cadastros."))
      .finally(() => setCarregando(false));
  }, []);

  if (sessao?.usuario.perfil !== "GL / Administrador") return <Navigate to="/inicio" replace />;

  const tipos = catalogo?.categorias.flatMap((categoria) => categoria.subcategorias.map((tipo) => ({
    ...tipo,
    categoriaId: categoria.id,
    categoriaNome: categoria.nome,
  }))) ?? [];
  const termo = busca[aba];
  const categoriasVisiveis = catalogo?.categorias.filter((categoria) => combina(termo, `${categoria.nome} ${categoria.ativa ? "ativa" : "inativa"}`)) ?? [];
  const tiposVisiveis = tipos.filter((tipo) => combina(termo, `${tipo.nome} ${tipo.categoriaNome} ${catalogo?.areas.find((area) => area.id === tipo.areaId)?.nome ?? ""} ${tipo.fluxo} ${tipo.ativa ? "ativo" : "inativo"}`));
  const areasVisiveis = catalogo?.areas.filter((area) => combina(termo, `${area.nome} ${area.ativa ? "ativa" : "inativa"}`)) ?? [];
  const responsaveisVisiveis = catalogo?.responsaveis.filter((pessoa) => combina(termo, `${pessoa.nome} ${pessoa.email} ${catalogo.areas.find((area) => area.id === pessoa.areaId)?.nome ?? ""} ${pessoa.ativo ? "ativo" : "inativo"}`)) ?? [];

  function selecionarAba(proxima: Aba) {
    setParametros(proxima === "categorias" ? {} : { aba: proxima });
    setErro(null);
    setMensagem(null);
  }

  function limparAviso() {
    setErro(null);
    setMensagem(null);
  }

  function novaCategoria() {
    setCategoriaId("");
    setCategoriaNome("");
    setCategoriaAtiva(true);
    setCategoriaPrazo("");
    setAssuntoSugerido("");
    setPontoSugerido("");
    setPeriodoSugerido("");
    setItensSugeridos("");
    limparAviso();
  }

  function editarCategoria(categoria: NonNullable<Catalogo>["categorias"][number]) {
    setCategoriaId(categoria.id);
    setCategoriaNome(categoria.nome);
    setCategoriaAtiva(categoria.ativa);
    setCategoriaPrazo(categoria.prazoHoras ? String(categoria.prazoHoras) : "");
    setAssuntoSugerido(categoria.modelo?.assunto ?? "");
    setPontoSugerido(categoria.modelo?.ponto ?? "");
    setPeriodoSugerido(categoria.modelo?.periodo ?? "");
    setItensSugeridos(categoria.modelo?.itens?.join("\n") ?? "");
    limparAviso();
  }

  function novoTipo() {
    setTipoId("");
    setTipoNome("");
    setFluxo(FLUXOS[0]);
    setTipoAtivo(true);
    setTipoCategoriaId(catalogo?.categorias.find((categoria) => categoria.ativa)?.id ?? "");
    setAreaId(catalogo?.areas.find((area) => area.ativa)?.id ?? "");
    limparAviso();
  }

  function editarTipo(tipo: (typeof tipos)[number]) {
    setTipoId(tipo.id);
    setTipoNome(tipo.nome);
    setTipoCategoriaId(tipo.categoriaId);
    setAreaId(tipo.areaId);
    setFluxo(tipo.fluxo);
    setTipoAtivo(tipo.ativa);
    limparAviso();
  }

  function novaArea() {
    setAreaCadastroId("");
    setAreaNome("");
    setAreaAtiva(true);
    limparAviso();
  }

  function editarArea(area: NonNullable<Catalogo>["areas"][number]) {
    setAreaCadastroId(area.id);
    setAreaNome(area.nome);
    setAreaAtiva(area.ativa);
    limparAviso();
  }

  function novoResponsavel() {
    setResponsavelId("");
    setResponsavelNome("");
    setResponsavelEmail("");
    setResponsavelAtivo(true);
    setResponsavelAreaId(catalogo?.areas.find((area) => area.ativa)?.id ?? "");
    limparAviso();
  }

  function editarResponsavel(pessoa: NonNullable<Catalogo>["responsaveis"][number]) {
    setResponsavelId(pessoa.id);
    setResponsavelNome(pessoa.nome);
    setResponsavelEmail(pessoa.email);
    setResponsavelAreaId(pessoa.areaId ?? "");
    setResponsavelAtivo(pessoa.ativo);
    limparAviso();
  }

  async function enviarCategoria(event: FormEvent) {
    event.preventDefault();
    setSalvando(true);
    limparAviso();
    try {
      const prazoInvalido = validarHoras(categoriaPrazo);
      if (prazoInvalido) {
        setErro(prazoInvalido);
        setSalvando(false);
        return;
      }
      const nomeInvalido = validarTexto(categoriaNome, 2, 120, "O nome da categoria deve ter entre 2 e 120 caracteres.");
      if (nomeInvalido) {
        setErro(nomeInvalido);
        setSalvando(false);
        return;
      }
      const assuntoInvalido = validarOpcional(assuntoSugerido, 120, "O assunto sugerido tem no máximo 120 caracteres.");
      const pontoInvalido = validarOpcional(pontoSugerido, 200, "O ponto sugerido tem no máximo 200 caracteres.");
      const itens = itensSugeridos.split("\n").map((item) => item.trim()).filter(Boolean);
      const itemInvalido = itens.find((item) => item.length > 80);
      if (assuntoInvalido || pontoInvalido || itens.length > 12 || itemInvalido) {
        setErro(assuntoInvalido ?? pontoInvalido ?? "Cada item sugerido tem no máximo 80 caracteres, até 12 itens.");
        setSalvando(false);
        return;
      }
      const prazo = categoriaPrazo.trim();
      const prazoHoras = prazo === "" ? null : Number(prazo);
      const atualizado = await api.salvarCategoria({
        id: categoriaId || null,
        nome: categoriaNome,
        ativa: categoriaAtiva,
        prazoHoras,
        modelo: {
          assunto: assuntoSugerido.trim() || null,
          ponto: pontoSugerido.trim() || null,
          periodo: periodoSugerido || null,
          itens,
        },
      });
      setCatalogo(atualizado);
      setCategoriaId("");
      setCategoriaNome("");
      setCategoriaAtiva(true);
      setCategoriaPrazo("");
      setAssuntoSugerido("");
      setPontoSugerido("");
      setPeriodoSugerido("");
      setItensSugeridos("");
      setMensagem("Categoria salva.");
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Não foi possível salvar a categoria.");
    } finally {
      setSalvando(false);
    }
  }

  async function enviarTipo(event: FormEvent) {
    event.preventDefault();
    setSalvando(true);
    limparAviso();
    const nomeInvalido = validarTexto(tipoNome, 2, 120, "O nome do tipo de atendimento deve ter entre 2 e 120 caracteres.");
    if (nomeInvalido || !tipoCategoriaId || !areaId || !fluxo) {
      setErro(nomeInvalido ?? "Selecione categoria, área e fluxo.");
      setSalvando(false);
      return;
    }
    try {
      const atualizado = await api.salvarTipoAtendimento({
        id: tipoId || null,
        categoriaId: tipoCategoriaId,
        areaId,
        nome: tipoNome,
        fluxo,
        ativo: tipoAtivo,
      });
      setCatalogo(atualizado);
      setTipoId("");
      setTipoNome("");
      setTipoAtivo(true);
      setMensagem("Tipo de atendimento salvo.");
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Não foi possível salvar o tipo de atendimento.");
    } finally {
      setSalvando(false);
    }
  }

  async function enviarArea(event: FormEvent) {
    event.preventDefault();
    setSalvando(true);
    limparAviso();
    const nomeInvalido = validarTexto(areaNome, 2, 120, "O nome da área deve ter entre 2 e 120 caracteres.");
    if (nomeInvalido) {
      setErro(nomeInvalido);
      setSalvando(false);
      return;
    }
    try {
      const atualizado = await api.salvarArea({ id: areaCadastroId || null, nome: areaNome, ativa: areaAtiva });
      setCatalogo(atualizado);
      setAreaCadastroId("");
      setAreaNome("");
      setAreaAtiva(true);
      setMensagem("Área salva.");
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Não foi possível salvar a área.");
    } finally {
      setSalvando(false);
    }
  }

  async function enviarResponsavel(event: FormEvent) {
    event.preventDefault();
    setSalvando(true);
    limparAviso();
    const nomeInvalido = validarTexto(responsavelNome, 2, 200, "O nome do responsável deve ter entre 2 e 200 caracteres.");
    const emailInvalido = validarEmail(responsavelEmail);
    if (nomeInvalido || emailInvalido || !responsavelAreaId) {
      setErro(nomeInvalido ?? emailInvalido ?? "Selecione uma área responsável válida.");
      setSalvando(false);
      return;
    }
    try {
      const atualizado = await api.salvarResponsavel({
        id: responsavelId || null,
        nome: responsavelNome,
        email: responsavelEmail,
        areaId: responsavelAreaId,
        ativo: responsavelAtivo,
      });
      setCatalogo(atualizado);
      setResponsavelId("");
      setResponsavelNome("");
      setResponsavelEmail("");
      setResponsavelAtivo(true);
      setMensagem("Responsável salvo.");
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Não foi possível salvar o responsável.");
    } finally {
      setSalvando(false);
    }
  }

  const areasDoTipo = catalogo?.areas.filter((area) => area.ativa || area.id === areaId) ?? [];
  const areasDoResponsavel = catalogo?.areas.filter((area) => area.ativa || area.id === responsavelAreaId) ?? [];

  return (
    <>
      <PageHeader title="Cadastros de domínios" trail={["Início", "Cadastros"]} />
      <div className="visoes-centrais" role="tablist" aria-label="Domínios">
        {ABAS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`aba-${item.id}`}
            className={aba === item.id ? "visao-central ativa" : "visao-central"}
            aria-selected={aba === item.id}
            aria-controls={`painel-${item.id}`}
            onClick={() => selecionarAba(item.id)}
          >
            {item.rotulo}
          </button>
        ))}
      </div>
      <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>{INTRO[aba]}</p>
      {erro && <p className="erro" role="alert">{erro}</p>}
      {mensagem && <p className="cadastro-ok" role="status">{mensagem}</p>}
      {carregando ? <p>Carregando cadastros...</p> : catalogo && (
        <div className="cadastro-layout" role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`}>
          {aba === "categorias" && (
            <>
              <Panel title="Categorias" className="livre">
                <Pesquisa valor={termo} onChange={(valor) => setBusca({ ...busca, categorias: valor })} />
                <div className="cadastro-lista-cabecalho">
                  <span>{categoriasVisiveis.length} de {catalogo.categorias.length}</span>
                  <button className="btn secondary" type="button" onClick={novaCategoria}>Nova categoria</button>
                </div>
                <Tabela
                  colunas={["Categoria", "Meta", "Modelo", "Tipos", "Situação", "Ação"]}
                  vazio={catalogo.categorias.length === 0 ? "Nenhuma categoria cadastrada." : "Nenhuma categoria encontrada na pesquisa."}
                  linhas={categoriasVisiveis.map((categoria) => [
                    categoria.nome,
                    categoria.prazoHoras ? `${categoria.prazoHoras} h` : "Sem meta",
                    categoria.modelo?.assunto || categoria.modelo?.ponto || categoria.modelo?.periodo || (categoria.modelo?.itens.length ?? 0) > 0 ? "Com modelo" : "Em branco",
                    String(categoria.subcategorias.length),
                    <Situacao key={categoria.id} ativo={categoria.ativa} ativoTexto="Ativa" inativoTexto="Inativa" />,
                    <button key={`${categoria.id}-editar`} className="cadastro-editar" type="button" onClick={() => editarCategoria(categoria)}>Editar</button>,
                  ])}
                />
              </Panel>
              <Panel title={categoriaId ? "Editar categoria" : "Nova categoria"}>
                <form id="cadastro-form" onSubmit={(event) => void enviarCategoria(event)}>
                  <label>Nome da categoria<input value={categoriaNome} onChange={(event) => setCategoriaNome(event.target.value)} maxLength={120} required /></label>
                  <label>Meta de prazo (horas)
                    <input
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={4}
                      value={categoriaPrazo}
                      onChange={(event) => setCategoriaPrazo(apenasDigitos(event.target.value, 4))}
                      placeholder="Em branco, sem meta"
                    />
                  </label>
                  <p className="campo-ajuda">Chamado sem previsão entra em atraso quando passa dessa meta desde a abertura. Previsão ainda no futuro não marca atraso.</p>
                  <label>Assunto sugerido
                    <input value={assuntoSugerido} maxLength={120} onChange={(event) => setAssuntoSugerido(event.target.value)} placeholder="Em branco, a abertura não sugere assunto" />
                  </label>
                  <label>Ponto sugerido
                    <input value={pontoSugerido} maxLength={200} onChange={(event) => setPontoSugerido(event.target.value)} placeholder="Em branco, a abertura não sugere ponto" />
                  </label>
                  <label>Período sugerido
                    <select value={periodoSugerido} onChange={(event) => setPeriodoSugerido(event.target.value)}>
                      <option value="">Em branco</option>
                      {PERIODOS_ABERTURA.map((periodo) => <option key={periodo} value={periodo}>{periodo}</option>)}
                    </select>
                  </label>
                  <label>Itens sugeridos
                    <textarea value={itensSugeridos} rows={3} maxLength={1000} onChange={(event) => setItensSugeridos(event.target.value)} placeholder="Um item por linha" />
                  </label>
                  <p className="campo-ajuda">O Cessionário vê esse modelo ao escolher a categoria e pode alterar antes de abrir. Sem esses campos, o formulário segue em branco.</p>
                  <label className="cadastro-check"><input type="checkbox" checked={categoriaAtiva} onChange={(event) => setCategoriaAtiva(event.target.checked)} /><span>Categoria ativa</span></label>
                  <button className="btn" type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar categoria"}</button>
                </form>
              </Panel>
            </>
          )}

          {aba === "tipos" && (
            <>
              <Panel title="Tipos de atendimento" className="livre">
                <Pesquisa valor={termo} onChange={(valor) => setBusca({ ...busca, tipos: valor })} />
                <div className="cadastro-lista-cabecalho">
                  <span>{tiposVisiveis.length} de {tipos.length}</span>
                  <button className="btn secondary" type="button" onClick={novoTipo}>Novo tipo</button>
                </div>
                <Tabela
                  colunas={["Tipo", "Categoria", "Área", "Fluxo", "Situação", "Ação"]}
                  vazio={tipos.length === 0 ? "Nenhum tipo cadastrado." : "Nenhum tipo encontrado na pesquisa."}
                  linhas={tiposVisiveis.map((tipo) => [
                    tipo.nome,
                    tipo.categoriaNome,
                    catalogo.areas.find((area) => area.id === tipo.areaId)?.nome ?? "-",
                    tipo.fluxo,
                    <Situacao key={tipo.id} ativo={tipo.ativa} ativoTexto="Ativo" inativoTexto="Inativo" />,
                    <button key={`${tipo.id}-editar`} className="cadastro-editar" type="button" onClick={() => editarTipo(tipo)}>Editar</button>,
                  ])}
                />
              </Panel>
              <Panel title={tipoId ? "Editar tipo de atendimento" : "Novo tipo de atendimento"}>
                <form id="cadastro-form" onSubmit={(event) => void enviarTipo(event)}>
                  <label>Nome do tipo<input value={tipoNome} onChange={(event) => setTipoNome(event.target.value)} maxLength={120} required /></label>
                  <label>Categoria<select value={tipoCategoriaId} onChange={(event) => setTipoCategoriaId(event.target.value)} required>
                    <option value="">Selecione</option>
                    {catalogo.categorias.filter((categoria) => categoria.ativa || categoria.id === tipoCategoriaId).map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}
                  </select></label>
                  <label>Área responsável<select value={areaId} onChange={(event) => setAreaId(event.target.value)} required>
                    <option value="">Selecione</option>
                    {areasDoTipo.map((area) => <option key={area.id} value={area.id}>{area.nome}</option>)}
                  </select></label>
                  <label>Fluxo<select value={fluxo} onChange={(event) => setFluxo(event.target.value)} required>
                    {FLUXOS.map((opcao) => <option key={opcao} value={opcao}>{opcao}</option>)}
                  </select></label>
                  <label className="cadastro-check"><input type="checkbox" checked={tipoAtivo} onChange={(event) => setTipoAtivo(event.target.checked)} /><span>Tipo de atendimento ativo</span></label>
                  <button className="btn" type="submit" disabled={salvando || !tipoCategoriaId || !areaId}>{salvando ? "Salvando..." : "Salvar tipo"}</button>
                </form>
              </Panel>
            </>
          )}

          {aba === "areas" && (
            <>
              <Panel title="Áreas" className="livre">
                <Pesquisa valor={termo} onChange={(valor) => setBusca({ ...busca, areas: valor })} />
                <div className="cadastro-lista-cabecalho">
                  <span>{areasVisiveis.length} de {catalogo.areas.length}</span>
                  <button className="btn secondary" type="button" onClick={novaArea}>Nova área</button>
                </div>
                <Tabela
                  colunas={["Área", "Situação", "Ação"]}
                  vazio={catalogo.areas.length === 0 ? "Nenhuma área cadastrada." : "Nenhuma área encontrada na pesquisa."}
                  linhas={areasVisiveis.map((area) => [
                    area.nome,
                    <Situacao key={area.id} ativo={area.ativa} ativoTexto="Ativa" inativoTexto="Inativa" />,
                    <button key={`${area.id}-editar`} className="cadastro-editar" type="button" onClick={() => editarArea(area)}>Editar</button>,
                  ])}
                />
              </Panel>
              <Panel title={areaCadastroId ? "Editar área" : "Nova área"}>
                <form id="cadastro-form" onSubmit={(event) => void enviarArea(event)}>
                  <label>Nome da área<input value={areaNome} onChange={(event) => setAreaNome(event.target.value)} maxLength={120} required /></label>
                  <label className="cadastro-check"><input type="checkbox" checked={areaAtiva} onChange={(event) => setAreaAtiva(event.target.checked)} /><span>Área ativa</span></label>
                  <button className="btn" type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar área"}</button>
                </form>
              </Panel>
            </>
          )}

          {aba === "responsaveis" && (
            <>
              <Panel title="Responsáveis" className="livre">
                <Pesquisa valor={termo} onChange={(valor) => setBusca({ ...busca, responsaveis: valor })} />
                <div className="cadastro-lista-cabecalho">
                  <span>{responsaveisVisiveis.length} de {catalogo.responsaveis.length}</span>
                  <button className="btn secondary" type="button" onClick={novoResponsavel}>Novo responsável</button>
                </div>
                <Tabela
                  colunas={["Nome", "E-mail", "Área", "Situação", "Ação"]}
                  vazio={catalogo.responsaveis.length === 0 ? "Nenhum responsável cadastrado." : "Nenhum responsável encontrado na pesquisa."}
                  linhas={responsaveisVisiveis.map((pessoa) => [
                    pessoa.nome,
                    pessoa.email,
                    catalogo.areas.find((area) => area.id === pessoa.areaId)?.nome ?? "-",
                    <Situacao key={pessoa.id} ativo={pessoa.ativo} ativoTexto="Ativo" inativoTexto="Inativo" />,
                    <button key={`${pessoa.id}-editar`} className="cadastro-editar" type="button" onClick={() => editarResponsavel(pessoa)}>Editar</button>,
                  ])}
                />
              </Panel>
              <Panel title={responsavelId ? "Editar responsável" : "Novo responsável"}>
                <form id="cadastro-form" onSubmit={(event) => void enviarResponsavel(event)}>
                  <label>Nome<input value={responsavelNome} onChange={(event) => setResponsavelNome(event.target.value)} maxLength={200} required /></label>
                  <label>E-mail<input type="email" inputMode="email" autoComplete="email" value={responsavelEmail} onChange={(event) => setResponsavelEmail(mascaraEmail(event.target.value))} maxLength={320} required /></label>
                  <label>Área<select value={responsavelAreaId} onChange={(event) => setResponsavelAreaId(event.target.value)} required>
                    <option value="">Selecione</option>
                    {areasDoResponsavel.map((area) => <option key={area.id} value={area.id}>{area.nome}</option>)}
                  </select></label>
                  <label className="cadastro-check"><input type="checkbox" checked={responsavelAtivo} onChange={(event) => setResponsavelAtivo(event.target.checked)} /><span>Responsável ativo</span></label>
                  {!responsavelId && <p className="muted">Na demonstração, o acesso usa a senha já usada no portal.</p>}
                  <button className="btn" type="submit" disabled={salvando || !responsavelAreaId}>{salvando ? "Salvando..." : "Salvar responsável"}</button>
                </form>
              </Panel>
            </>
          )}
        </div>
      )}
    </>
  );
}

function Pesquisa({ valor, onChange }: { valor: string; onChange: (valor: string) => void }) {
  return (
    <label className="cadastro-pesquisa">
      Pesquisar
      <input value={valor} onChange={(event) => onChange(event.target.value)} placeholder="Nome, situação ou vínculo" />
    </label>
  );
}

function Situacao({ ativo, ativoTexto, inativoTexto }: { ativo: boolean; ativoTexto: string; inativoTexto: string }) {
  return <span className={ativo ? "cadastro-status ativo" : "cadastro-status"}>{ativo ? ativoTexto : inativoTexto}</span>;
}

function Tabela({ colunas, linhas, vazio }: { colunas: string[]; linhas: ReactNode[][]; vazio: string }) {
  return (
    <div className="cadastro-tabela-wrap">
      <table className="cadastro-tabela">
        <thead>
          <tr>{colunas.map((coluna) => <th key={coluna}>{coluna === "Ação" ? <span className="sr-only">Ação</span> : coluna}</th>)}</tr>
        </thead>
        <tbody>
          {linhas.map((celulas, indice) => (
            <tr key={indice}>
              {celulas.map((celula, coluna) => <td key={coluna}>{celula}</td>)}
            </tr>
          ))}
          {linhas.length === 0 && <tr><td colSpan={colunas.length}>{vazio}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
