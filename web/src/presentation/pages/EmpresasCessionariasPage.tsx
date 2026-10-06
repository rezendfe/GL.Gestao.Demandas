import { useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useSessao } from "../../application/session";
import { formatarContato, mascaraEmail, validarContato, validarEmail, validarLogo, validarTexto } from "../../domain/entrada";
import { fotoPorPessoa } from "../../domain/fotos";
import type { ContatoRepresentante, EmpresaCessionariaCadastro, FuncaoRepresentante, PermissaoCessionario, RepresentanteCessionario } from "../../domain/types";
import { acharPorNome, contatosDaPlanilha, DEFINICOES_CARGA, interpretarAtivo, PERMISSOES_CESSAO, permissoesDaPlanilha } from "../../domain/cargaCadastro";
import { ApiError, api } from "../../infrastructure/api/client";
import { useAcoesDaPagina } from "../components/AcoesRapidas";
import { CargaPlanilha } from "../components/CargaPlanilha";
import { ModalCadastro } from "../components/ModalCadastro";
import { PageHeader } from "../components/PageHeader";
import { Panel } from "../components/Panel";
import { GaleriaLightbox } from "../components/GaleriaLightbox";
import { AbasEspacos } from "./EspacoPage";

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
  const [carga, setCarga] = useState<"empresas" | "funcoes" | "representantes" | null>(null);
  const [editor, setEditor] = useState<"empresa" | "funcao" | "representante" | null>(null);
  const [fotoIndice, setFotoIndice] = useState<number | null>(null);

  function abrirCarga(tipo: "empresas" | "funcoes" | "representantes") {
    if (tipo !== "empresas" && !empresas.some((empresa) => empresa.id === empresaSelecionadaId)) {
      setMensagem(null);
      setErro(tipo === "funcoes" ? "Selecione a empresa antes de importar funções." : "Selecione a empresa antes de importar representantes.");
      return;
    }
    setEditor(null);
    setErro(null);
    setCarga(tipo);
  }

  function fecharEditor() {
    if (salvando) return;
    setEditor(null);
    setErro(null);
  }

  function novaEmpresa() {
    setCarga(null);
    setEmpresaForm(EMPRESA_VAZIA);
    setErro(null);
    setMensagem(null);
    setEditor("empresa");
  }

  function novaFuncao() {
    if (!empresas.some((empresa) => empresa.id === empresaSelecionadaId)) {
      setMensagem(null);
      setErro("Selecione a empresa antes de cadastrar uma função.");
      return;
    }
    setCarga(null);
    setErro(null);
    setFuncaoForm(FUNCAO_VAZIA);
    setEditor("funcao");
  }

  function novoRepresentante() {
    if (!empresas.some((empresa) => empresa.id === empresaSelecionadaId)) {
      setMensagem(null);
      setErro("Selecione a empresa antes de cadastrar um representante.");
      return;
    }
    setCarga(null);
    setErro(null);
    setRepresentanteForm(REPRESENTANTE_VAZIO);
    setEditor("representante");
  }

  useAcoesDaPagina([
    { id: "nova-empresa", rotulo: "Nova empresa", icone: "mais", executar: () => novaEmpresa() },
    { id: "importar-empresas", rotulo: "Importar empresas", icone: "importar", executar: () => abrirCarga("empresas") },
    { id: "nova-funcao", rotulo: "Nova função", icone: "mais", executar: () => novaFuncao() },
    { id: "importar-funcoes", rotulo: "Importar funções", icone: "importar", executar: () => abrirCarga("funcoes") },
    { id: "nova-representante", rotulo: "Novo representante", icone: "mais", executar: () => novoRepresentante() },
    { id: "importar-representantes", rotulo: "Importar representantes", icone: "importar", executar: () => abrirCarga("representantes") },
  ]);

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

  function selecionarEmpresa(empresa: EmpresaCessionariaCadastro) {
    setEmpresaSelecionadaId(empresa.id);
    setFuncaoForm(FUNCAO_VAZIA);
    setRepresentanteForm(REPRESENTANTE_VAZIO);
    setEditor(null);
    setErro(null);
    setMensagem(null);
  }

  function editarEmpresa(empresa: EmpresaCessionariaCadastro) {
    setCarga(null);
    setEmpresaSelecionadaId(empresa.id);
    setEmpresaForm({ id: empresa.id, nome: empresa.nome, ativa: empresa.ativa, logo: empresa.logo ?? "" });
    setErro(null);
    setMensagem(null);
    setEditor("empresa");
  }

  function editarFuncao(funcao: FuncaoRepresentante) {
    setCarga(null);
    setFuncaoForm({ id: funcao.id, nome: funcao.nome, ativa: funcao.ativa, permissoes: [...funcao.permissoes] });
    setErro(null);
    setMensagem(null);
    setEditor("funcao");
  }

  function editarRepresentante(representante: RepresentanteCessionario) {
    setRepresentanteForm({
      usuarioId: representante.usuarioId,
      nome: representante.nome,
      email: representante.email,
      ativo: representante.ativo,
      contatos: representante.contatos.map((contato) => ({ ...contato, valor: formatarContato(contato.canal, contato.valor) })),
      funcoes: representante.funcoes.map((funcao) => funcao.id),
    });
    setCarga(null);
    setErro(null);
    setMensagem(null);
    setEditor("representante");
  }

  async function salvarEmpresa(event: FormEvent) {
    event.preventDefault();
    const nomeInvalido = validarTexto(empresaForm.nome, 2, 200, "A razão social deve ter entre 2 e 200 caracteres.");
    const logoInvalido = validarLogo(empresaForm.logo);
    if (nomeInvalido || logoInvalido) {
      setErro(nomeInvalido ?? logoInvalido);
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const salvo = await api.salvarEmpresaCessionaria({ ...empresaForm, logo: empresaForm.logo || null });
      setMensagem("Empresa Cessionária salva.");
      setEditor(null);
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
    const nomeInvalido = validarTexto(funcaoForm.nome, 2, 100, "O nome da função deve ter entre 2 e 100 caracteres.");
    if (nomeInvalido) {
      setErro(nomeInvalido);
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      await api.salvarFuncaoCessionario(selecionada.id, { ...funcaoForm, permissoes: funcaoForm.permissoes });
      setMensagem("Função salva.");
      setEditor(null);
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
    const nomeInvalido = validarTexto(representanteForm.nome, 2, 200, "O nome do representante deve ter entre 2 e 200 caracteres.");
    const emailInvalido = validarEmail(representanteForm.email);
    const contatoInvalido = representanteForm.contatos.map((contato) => validarContato(contato.canal, contato.valor)).find((erro) => erro) ?? null;
    if (nomeInvalido || emailInvalido || contatoInvalido) {
      setErro(nomeInvalido ?? emailInvalido ?? contatoInvalido);
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      await api.salvarRepresentante(selecionada.id, {
        ...representanteForm,
        contatos: representanteForm.contatos.map((contato) => ({ ...contato, id: contato.id || null })),
      });
      setMensagem("Representante salvo.");
      setEditor(null);
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

  async function gravarEmpresas(linhas: { numero: number; valores: Record<string, string> }[]) {
    for (const linha of linhas) {
      const valores = linha.valores;
      try {
        await api.salvarEmpresaCessionaria({
          id: null,
          nome: valores.nome.trim(),
          ativa: interpretarAtivo(valores.ativa) === true,
          logo: valores.logo.trim() || null,
        });
      } catch (error) {
        await carregar();
        const texto = error instanceof ApiError ? error.message : "Não foi possível gravar a empresa.";
        throw new Error(`Linha ${linha.numero}: ${texto}`);
      }
    }
    setMensagem(linhas.length === 1 ? "1 empresa importada." : `${linhas.length} empresas importadas.`);
    setCarga(null);
    await carregar();
  }

  async function gravarFuncoes(linhas: { numero: number; valores: Record<string, string> }[]) {
    if (!selecionada) throw new Error("Selecione a empresa antes de importar funções.");
    const empresaId = selecionada.id;
    for (const linha of linhas) {
      const valores = linha.valores;
      try {
        const permissoes = permissoesDaPlanilha(valores.permissoes);
        if (permissoes.erro) throw new Error(permissoes.erro);
        await api.salvarFuncaoCessionario(empresaId, {
          id: null,
          nome: valores.nome.trim(),
          ativa: interpretarAtivo(valores.ativa) === true,
          permissoes: permissoes.ids,
        });
      } catch (error) {
        await carregar(empresaId);
        const texto = error instanceof ApiError ? error.message : error instanceof Error ? error.message : "Não foi possível gravar a função.";
        throw new Error(`Linha ${linha.numero}: ${texto}`);
      }
    }
    setMensagem(linhas.length === 1 ? "1 função importada." : `${linhas.length} funções importadas.`);
    setCarga(null);
    await carregar(empresaId);
  }

  async function gravarRepresentantes(linhas: { numero: number; valores: Record<string, string> }[]) {
    if (!selecionada) throw new Error("Selecione a empresa antes de importar representantes.");
    const empresaId = selecionada.id;
    const funcoes = selecionada.funcoes;
    for (const linha of linhas) {
      const valores = linha.valores;
      try {
        const ids = valores.funcoes.split("|").map((item) => item.trim()).filter(Boolean).map((nome) => {
          const funcao = acharPorNome(funcoes, nome);
          if (!funcao) throw new Error(`Função não encontrada nesta empresa: ${nome}.`);
          return funcao.id;
        });
        await api.salvarRepresentante(empresaId, {
          usuarioId: null,
          nome: valores.nome.trim(),
          email: valores.email.trim(),
          ativo: interpretarAtivo(valores.ativo) === true,
          contatos: contatosDaPlanilha(valores),
          funcoes: ids,
        });
      } catch (error) {
        await carregar(empresaId);
        const texto = error instanceof ApiError ? error.message : error instanceof Error ? error.message : "Não foi possível gravar o representante.";
        throw new Error(`Linha ${linha.numero}: ${texto}`);
      }
    }
    setMensagem(linhas.length === 1 ? "1 representante importado." : `${linhas.length} representantes importados.`);
    setCarga(null);
    await carregar(empresaId);
  }

  return (
    <>
      <PageHeader title="Empresas e acessos" trail={["Início", "Espaços", "Empresas e acessos"]} />
      {carga === "empresas" && (
        <CargaPlanilha
          tipo="empresas"
          definicao={DEFINICOES_CARGA.empresas}
          nomes={empresas.map((empresa) => empresa.nome)}
          onFechar={() => setCarga(null)}
          onGravar={gravarEmpresas}
        />
      )}
      {carga === "funcoes" && selecionada && (
        <CargaPlanilha
          tipo="funcoes"
          definicao={{ ...DEFINICOES_CARGA.funcoes, instrucao: `${DEFINICOES_CARGA.funcoes.instrucao} Empresa: ${selecionada.nome}.` }}
          nomes={selecionada.funcoes.map((funcao) => funcao.nome)}
          onFechar={() => setCarga(null)}
          onGravar={gravarFuncoes}
        />
      )}
      {carga === "representantes" && selecionada && (
        <CargaPlanilha
          tipo="representantes"
          definicao={{ ...DEFINICOES_CARGA.representantes, instrucao: `${DEFINICOES_CARGA.representantes.instrucao} Empresa: ${selecionada.nome}.` }}
          nomes={empresas.flatMap((empresa) => empresa.representantes.map((representante) => representante.email))}
          funcoes={selecionada.funcoes.map((funcao) => funcao.nome)}
          onFechar={() => setCarga(null)}
          onGravar={gravarRepresentantes}
        />
      )}
      <AbasEspacos ativa="empresas" />
      {erro && !editor && <p className="erro" role="alert">{erro}</p>}
      {mensagem && <p className="cadastro-ok" role="status">{mensagem}</p>}
      {carregando ? <p>Carregando empresas...</p> : <div className="empresas-admin" role="tabpanel" id="painel-empresas" aria-labelledby="aba-empresas">
        <Panel title="Empresas Cessionárias" className="livre">
          <div className="cadastro-lista-cabecalho">
            <span>{empresas.length} cadastradas</span>
          </div>
          <ul className="empresas-lista">
            {empresas.map((empresa) => <li className="empresa-linha" key={empresa.id}>
              <button className={empresa.id === empresaSelecionadaId ? "empresa-selecao ativa" : "empresa-selecao"} type="button" onClick={() => selecionarEmpresa(empresa)}>
                <span><strong>{empresa.nome}</strong><small>{empresa.representantes.length} representantes · {empresa.funcoes.length} funções</small></span>
                <span className={empresa.ativa ? "cadastro-status ativo" : "cadastro-status"}>{empresa.ativa ? "Ativa" : "Inativa"}</span>
              </button>
              <button className="cadastro-editar" type="button" onClick={() => editarEmpresa(empresa)}>Editar</button>
            </li>)}
            {empresas.length === 0 && <li>Nenhuma empresa cadastrada.</li>}
          </ul>
        </Panel>
        {selecionada && <>
          <Panel title={`Funções · ${selecionada.nome}`} className="livre">
            <div className="cadastro-lista-cabecalho"><span>{selecionada.funcoes.length} cadastradas</span></div>
            {selecionada.funcoes.length > 0 && <div className="empresas-funcoes">{selecionada.funcoes.map((funcao) => <button key={funcao.id} type="button" className="funcao-linha" onClick={() => editarFuncao(funcao)}><span><strong>{funcao.nome}</strong><small>{funcao.permissoes.length} permissões · {funcao.ativa ? "Ativa" : "Inativa"}</small></span><span className="cadastro-editar">Editar</span></button>)}</div>}
            {selecionada.funcoes.length === 0 && <p>Nenhuma função cadastrada.</p>}
          </Panel>
          <Panel title={`Representantes · ${selecionada.nome}`} className="livre">
            <div className="cadastro-lista-cabecalho"><span>{selecionada.representantes.length} cadastrados</span></div>
            {selecionada.representantes.length > 0 && <div className="representantes-lista">{selecionada.representantes.map((representante) => {
              const foto = fotoPorPessoa(representante.nome, representante.email);
              const fotos = selecionada.representantes.flatMap((item) => {
                const url = fotoPorPessoa(item.nome, item.email);
                return url ? [{ id: item.usuarioId, url, legenda: item.nome }] : [];
              });
              const indice = fotos.findIndex((item) => item.id === representante.usuarioId);
              return <div key={representante.usuarioId} className="funcao-linha pessoa-celula">
                {foto && <button type="button" className="pessoa-foto" onClick={() => setFotoIndice(indice)}><img src={foto} alt="" /></button>}
                <button type="button" className="funcao-linha" onClick={() => editarRepresentante(representante)}><span><strong>{representante.nome}</strong><small>{representante.email} · {representante.funcoes.map((funcao) => funcao.nome).join(", ") || "Sem funções"}</small></span><span className={representante.ativo ? "cadastro-status ativo" : "cadastro-status"}>{representante.ativo ? "Ativo" : "Inativo"}</span></button>
              </div>;
            })}</div>}
            {selecionada.representantes.length === 0 && <p>Nenhum representante cadastrado.</p>}
          </Panel>
        </>}
      </div>}
      {editor === "empresa" && (
        <ModalCadastro titulo={empresaForm.id ? "Editar empresa" : "Nova empresa"} onFechar={fecharEditor}>
          {erro && <p className="erro" role="alert">{erro}</p>}
          <form className="empresas-form" onSubmit={(event) => void salvarEmpresa(event)}>
            <label>Razão social<input required maxLength={200} value={empresaForm.nome} onChange={(event) => setEmpresaForm({ ...empresaForm, nome: event.target.value })} /></label>
            <label>Logo (URL ou caminho)<input maxLength={300} value={empresaForm.logo} onChange={(event) => setEmpresaForm({ ...empresaForm, logo: event.target.value })} /></label>
            <label className="cadastro-check"><input type="checkbox" checked={empresaForm.ativa} onChange={(event) => setEmpresaForm({ ...empresaForm, ativa: event.target.checked })} /><span>Empresa ativa</span></label>
            <div className="row">
              <button className="btn" type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar empresa"}</button>
              <button className="btn secondary" type="button" disabled={salvando} onClick={fecharEditor}>Cancelar</button>
            </div>
          </form>
        </ModalCadastro>
      )}
      {editor === "funcao" && selecionada && (
        <ModalCadastro titulo={funcaoForm.id ? "Editar função" : "Nova função"} onFechar={fecharEditor}>
          {erro && <p className="erro" role="alert">{erro}</p>}
          <form className="empresas-form" onSubmit={(event) => void salvarFuncao(event)}>
            <label>Nome da função<input required maxLength={100} value={funcaoForm.nome} onChange={(event) => setFuncaoForm({ ...funcaoForm, nome: event.target.value })} /></label>
            <div className="empresas-permissoes"><strong>Permissões</strong>{PERMISSOES_CESSAO.map((permissao) => <label className="cadastro-check" key={permissao.id}><input type="checkbox" checked={funcaoForm.permissoes.includes(permissao.id)} onChange={(event) => setFuncaoForm({ ...funcaoForm, permissoes: event.target.checked ? [...funcaoForm.permissoes, permissao.id] : funcaoForm.permissoes.filter((item) => item !== permissao.id) })} /><span>{permissao.nome}</span></label>)}</div>
            <label className="cadastro-check"><input type="checkbox" checked={funcaoForm.ativa} onChange={(event) => setFuncaoForm({ ...funcaoForm, ativa: event.target.checked })} /><span>Função ativa</span></label>
            <div className="row">
              <button className="btn" type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar função"}</button>
              <button className="btn secondary" type="button" disabled={salvando} onClick={fecharEditor}>Cancelar</button>
            </div>
          </form>
        </ModalCadastro>
      )}
      {editor === "representante" && selecionada && (
        <ModalCadastro titulo={representanteForm.usuarioId ? "Editar representante" : "Novo representante"} onFechar={fecharEditor}>
          {erro && <p className="erro" role="alert">{erro}</p>}
          <form className="empresas-form" onSubmit={(event) => void salvarRepresentante(event)}>
            <label>Nome<input required maxLength={200} value={representanteForm.nome} onChange={(event) => setRepresentanteForm({ ...representanteForm, nome: event.target.value })} /></label>
            <label>E-mail de login Entra<input type="email" inputMode="email" autoComplete="email" required maxLength={320} value={representanteForm.email} onChange={(event) => setRepresentanteForm({ ...representanteForm, email: mascaraEmail(event.target.value) })} /></label>
            <div className="empresas-permissoes"><strong>Funções</strong>{selecionada.funcoes.map((funcao) => <label className="cadastro-check" key={funcao.id}><input type="checkbox" checked={representanteForm.funcoes.includes(funcao.id)} onChange={(event) => setRepresentanteForm({ ...representanteForm, funcoes: event.target.checked ? [...representanteForm.funcoes, funcao.id] : representanteForm.funcoes.filter((id) => id !== funcao.id) })} /><span>{funcao.nome}{!funcao.ativa ? " (inativa)" : ""}</span></label>)}</div>
            <div className="empresas-permissoes"><div className="cadastro-lista-cabecalho"><strong>Contatos</strong><button className="cadastro-editar" type="button" onClick={adicionarContato}>Adicionar contato</button></div>{representanteForm.contatos.map((contato, indice) => <div className="contato-linha" key={contato.id || `novo-${indice}`}>
              <label>Canal<select value={contato.canal} onChange={(event) => {
                const canal = event.target.value as ContatoRepresentante["canal"];
                alterarContato(indice, { canal, valor: formatarContato(canal, contato.valor) });
              }}><option value="EMAIL">E-mail</option><option value="TELEFONE">Telefone</option><option value="WHATSAPP">WhatsApp</option></select></label>
              <label>Contato<input required inputMode={contato.canal === "EMAIL" ? "email" : "tel"} autoComplete={contato.canal === "EMAIL" ? "email" : "tel"} maxLength={contato.canal === "EMAIL" ? 320 : 20} placeholder={contato.canal === "EMAIL" ? "nome@empresa.com" : "(00) 00000-0000"} value={contato.valor} onChange={(event) => alterarContato(indice, { valor: formatarContato(contato.canal, event.target.value) })} /></label>
              <label className="cadastro-check"><input type="radio" name={`principal-${contato.canal}`} checked={contato.principal} onChange={() => alterarContato(indice, { principal: true })} /><span>Principal</span></label>
              <button className="cadastro-editar" type="button" onClick={() => setRepresentanteForm({ ...representanteForm, contatos: representanteForm.contatos.filter((_, itemIndice) => itemIndice !== indice) })}>Remover</button>
            </div>)}</div>
            <label className="cadastro-check"><input type="checkbox" checked={representanteForm.ativo} onChange={(event) => setRepresentanteForm({ ...representanteForm, ativo: event.target.checked })} /><span>Representante ativo</span></label>
            <div className="row">
              <button className="btn" type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar representante"}</button>
              <button className="btn secondary" type="button" disabled={salvando} onClick={fecharEditor}>Cancelar</button>
            </div>
          </form>
        </ModalCadastro>
      )}
      <GaleriaLightbox
        fotos={(selecionada?.representantes ?? []).flatMap((pessoa) => {
          const url = fotoPorPessoa(pessoa.nome, pessoa.email);
          return url ? [{ id: pessoa.usuarioId, url, legenda: pessoa.nome }] : [];
        })}
        indice={fotoIndice}
        onIndice={setFotoIndice}
        onFechar={() => setFotoIndice(null)}
      />
    </>
  );
}
