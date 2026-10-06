import { useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { sugerir, useCatalogo } from "../../application/hooks";
import { useSessao } from "../../application/session";
import { ACEITA_ARQUIVO, validarArquivo, validarDataOpcional, validarOpcional, validarTexto } from "../../domain/entrada";
import { modeloPreenchido, PERIODOS_ABERTURA } from "../../domain/modeloAbertura";
import { espacosPorEmail } from "../../domain/espacos";
import type { Sugestao } from "../../domain/types";
import { ApiError, api } from "../../infrastructure/api/client";
import { CampoDitado } from "../components/CampoDitado";
import { PageHeader } from "../components/PageHeader";
import { Panel } from "../components/Panel";

const ITENS_SUGERIDOS = ["Infiltração", "Elétrica", "Ar-condicionado", "Vaga", "Correspondência", "Liberação de área"];

function hojeIso() {
  const data = new Date();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split("-");
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
}

function textoClassificavel(assunto: string, descricao: string) {
  const titulo = assunto.trim();
  const corpo = descricao.trim();
  if (titulo && corpo) return `${titulo}. ${corpo}`;
  return corpo || titulo;
}

function complemento(dados: {
  itens: string[];
  telefone: string;
  dataDesejada: string;
  periodo: string;
  autorizaAcesso: boolean;
}) {
  const linhas: string[] = [];
  if (dados.itens.length > 0) linhas.push(`Itens: ${dados.itens.join(", ")}.`);
  if (dados.telefone.trim()) linhas.push(`Telefone da empresa: ${dados.telefone.trim()}.`);
  if (dados.dataDesejada) linhas.push(`Data desejada: ${formatarData(dados.dataDesejada)}.`);
  if (dados.periodo) linhas.push(`Período: ${dados.periodo}.`);
  if (dados.autorizaAcesso) linhas.push("Acesso à unidade: autorizado no horário combinado.");
  if (linhas.length === 0) return null;
  return ["Dados complementares da solicitação.", ...linhas].join("\n");
}

function CampoLinha({
  id,
  rotulo,
  ajuda,
  children,
  extra,
  className,
}: {
  id?: string;
  rotulo: string;
  ajuda?: string;
  children: ReactNode;
  extra?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className ? `campo-linha ${className}` : "campo-linha"}>
      {id ? <label htmlFor={id}>{rotulo}</label> : <span className="campo-rotulo">{rotulo}</span>}
      <div className="campo-controle">
        {children}
        {ajuda ? <p className="campo-ajuda">{ajuda}</p> : null}
        {extra}
      </div>
    </div>
  );
}

function Addon({ children }: { children: ReactNode }) {
  return <span className="campo-addon">{children}</span>;
}

function IconeLapis() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 20h4l10-10-4-4L4 16v4zM13 7l4 4" />
    </svg>
  );
}

function IconePin() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

function IconeAlvo() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
    </svg>
  );
}

function IconeCalendario() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="1.5" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  );
}

export function AbrirPage() {
  const { sessao } = useSessao();
  const locais = espacosPorEmail(sessao?.usuario.email ?? "");
  const variosLocais = locais.length > 1;
  const localUnico = locais.length === 1 ? locais[0].sala : locais.length === 0 ? (sessao?.usuario.sala ?? "") : "";
  const telefoneEmpresa = locais[0]?.telefone ?? "";
  const { dados: catalogo } = useCatalogo();
  const navigate = useNavigate();
  const [assunto, setAssunto] = useState("");
  const [descricao, setDescricao] = useState("");
  const [sala, setSala] = useState(localUnico);
  const [ponto, setPonto] = useState("");
  const [dataDesejada, setDataDesejada] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [itens, setItens] = useState<string[]>([]);
  const [rascunhoItem, setRascunhoItem] = useState("");
  const [autorizaAcesso, setAutorizaAcesso] = useState(false);
  const [reclamacao, setReclamacao] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [sugestao, setSugestao] = useState<Sugestao | null>(null);
  const [subcategoriaId, setSubcategoriaId] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [preenchendo, setPreenchendo] = useState(false);
  const [avisoPreenchimento, setAvisoPreenchimento] = useState<string | null>(null);
  const pedidoPreenchimento = useRef(0);

  function aplicarModelo(subId: string) {
    setSubcategoriaId(subId);
    const categoria = catalogo?.categorias.find((item) => item.subcategorias.some((sub) => sub.id === subId));
    const modelo = categoria?.modelo;
    if (!modeloPreenchido(modelo)) {
      setAssunto("");
      setPonto("");
      setPeriodo("");
      setItens([]);
      return;
    }
    setAssunto(modelo?.assunto ?? "");
    setPonto(modelo?.ponto ?? "");
    setPeriodo(modelo?.periodo ?? "");
    setItens(modelo?.itens ?? []);
  }

  function incluirItem(valor: string) {
    const item = valor.replace(/\s+/g, " ").trim();
    if (!item) return;
    setItens((atual) => (atual.some((existente) => existente.toLocaleLowerCase("pt-BR") === item.toLocaleLowerCase("pt-BR")) ? atual : [...atual, item]));
    setRascunhoItem("");
  }

  function incluirItens(novos: string[]) {
    setItens((atual) => {
      const juntos = [...atual];
      for (const item of novos) {
        const nome = item.replace(/\s+/g, " ").trim();
        if (!nome) continue;
        if (juntos.some((existente) => existente.toLocaleLowerCase("pt-BR") === nome.toLocaleLowerCase("pt-BR"))) continue;
        juntos.push(nome);
      }
      return juntos;
    });
  }

  async function preencher(texto: string) {
    const pedido = pedidoPreenchimento.current + 1;
    pedidoPreenchimento.current = pedido;
    setPreenchendo(true);
    setErro(null);
    setAvisoPreenchimento(null);
    try {
      const resultado = await api.preencher(texto);
      if (pedido !== pedidoPreenchimento.current) return;
      if (resultado.assunto) setAssunto(resultado.assunto);
      if (resultado.ponto) setPonto(resultado.ponto);
      if (resultado.dataDesejada) setDataDesejada(resultado.dataDesejada);
      if (resultado.periodo) setPeriodo(resultado.periodo);
      if (resultado.itens.length > 0) incluirItens(resultado.itens);
      if (resultado.autorizaAcesso) setAutorizaAcesso(true);
      if (resultado.sugestao) {
        setSugestao(resultado.sugestao);
        setSubcategoriaId(resultado.sugestao.subcategoriaId);
      }
      setAvisoPreenchimento(resultado.aviso);
    } catch (error) {
      if (pedido !== pedidoPreenchimento.current) return;
      setErro(error instanceof ApiError ? error.message : "Não foi possível preencher os campos.");
    } finally {
      if (pedido === pedidoPreenchimento.current) setPreenchendo(false);
    }
  }

  async function classificar() {
    setErro(null);
    try {
      const resultado = await sugerir(textoClassificavel(assunto, descricao));
      setSugestao(resultado);
      setSubcategoriaId(resultado.subcategoriaId);
    } catch (error) {
      setSugestao(null);
      setErro(error instanceof ApiError ? error.message : "Não foi possível classificar.");
    }
  }

  async function abrir() {
    const texto = textoClassificavel(assunto, descricao);
    const descricaoInvalida = texto.trim()
      ? validarTexto(texto, 1, 2000, "A descrição tem no máximo 2000 caracteres.")
      : "Descreva o que está acontecendo.";
    const assuntoInvalido = validarOpcional(assunto, 120, "O assunto tem no máximo 120 caracteres.");
    const pontoInvalido = validarOpcional(ponto, 200, "O ponto tem no máximo 200 caracteres.");
    const dataInvalida = validarDataOpcional(dataDesejada, hojeIso(), "A data desejada não pode ficar no passado.");
    const arquivoInvalido = arquivo ? validarArquivo(arquivo) : null;
    const localInvalido = sala.trim() ? validarTexto(sala, 1, 80, "O local tem no máximo 80 caracteres.") : "Informe a sala ou unidade.";
    const nota = complemento({ itens, telefone: telefoneEmpresa, dataDesejada, periodo, autorizaAcesso });
    const notaInvalida = nota && nota.length > 2000 ? "A mensagem tem no máximo 2000 caracteres." : null;
    if (!subcategoriaId || descricaoInvalida || assuntoInvalido || pontoInvalido || dataInvalida || arquivoInvalido || localInvalido || notaInvalida) {
      setErro(!subcategoriaId ? "Selecione uma categoria válida." : (descricaoInvalida ?? assuntoInvalido ?? pontoInvalido ?? dataInvalida ?? arquivoInvalido ?? localInvalido ?? notaInvalida));
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const detalhe = await api.abrir({
        descricao: textoClassificavel(assunto, descricao),
        sala,
        ponto,
        subcategoriaId,
        canal: "PORTAL",
        reclamacao,
      });
      const nota = complemento({ itens, telefone: telefoneEmpresa, dataDesejada, periodo, autorizaAcesso });
      if (nota) await api.mensagem(detalhe.id, nota);
      if (arquivo) await api.anexar(detalhe.id, arquivo);
      navigate(`/demandas/${detalhe.id}`);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Não foi possível abrir o chamado.");
    } finally {
      setEnviando(false);
    }
  }

  const podeAbrir = Boolean(subcategoriaId && descricao.trim() && sala.trim());

  return (
    <>
      <PageHeader title="Abrir chamado" trail={["Início", "Abrir chamado"]} />
      <Panel title="Nova solicitação" className="form-panel solicitacao-panel">
        <p className="muted solicitacao-intro">Descreva o que está acontecendo, por texto ou pelo microfone. O local vem do cadastro da empresa. Se houver mais de um aluguel, escolha-o na lista. Os demais campos ficam em branco para você preencher; o ditado só completa o que a fala indicar. A classificação é uma sugestão, não uma decisão automática.</p>
        <p className="note solicitacao-aviso" aria-live="polite">
          {preenchendo ? "Preenchendo os campos a partir da fala..." : (avisoPreenchimento ?? "")}
        </p>
        <form
          className="solicitacao"
          onSubmit={(event) => {
            event.preventDefault();
            if (podeAbrir && !enviando) void abrir();
          }}
        >
          <div className="solicitacao-corpo">
              <CampoLinha
                id="descricao"
                rotulo="O que eu preciso:"
                ajuda={preenchendo ? "Lendo a fala para preencher os outros campos." : "Digite ou dite o que está acontecendo. Ao parar o microfone, o restante do formulário é preenchido."}
                extra={(
                  <button className="btn secondary" type="button" onClick={() => void classificar()} disabled={!descricao.trim()}>
                    Ver classificação sugerida
                  </button>
                )}
              >
                <CampoDitado
                  id="descricao"
                  value={descricao}
                  onChange={setDescricao}
                  onConcluido={(texto) => void preencher(texto)}
                  placeholder="Descreva o que está acontecendo."
                />
              </CampoLinha>

              <CampoLinha id="assunto" rotulo="Assunto" ajuda="Título curto do que você está pedindo.">
                <div className="grupo-campo">
                  <Addon><IconeLapis /></Addon>
                  <input id="assunto" value={assunto} onChange={(event) => setAssunto(event.target.value)} maxLength={120} />
                </div>
              </CampoLinha>

              <CampoLinha
                id="categoria"
                rotulo="Categoria"
                ajuda="A sugestão preenche este campo. Você pode corrigir antes de enviar."
                extra={(
                  <>
                    {modeloPreenchido(catalogo?.categorias.find((item) => item.subcategorias.some((sub) => sub.id === subcategoriaId))?.modelo) && (
                      <p className="campo-ajuda">Modelo da categoria. Você pode alterar o assunto, o ponto, o período e os itens antes de abrir.</p>
                    )}
                    {sugestao && (
                      <div className="suggestion">
                        <strong>Classificação sugerida</strong>
                        <p>{sugestao.resumo}</p>
                        <p className="note">Confiança: {sugestao.confianca} · Destino: {sugestao.destinoSugerido}</p>
                      </div>
                    )}
                  </>
                )}
              >
                <select id="categoria" value={subcategoriaId} onChange={(event) => aplicarModelo(event.target.value)} disabled={!catalogo}>
                  <option value="">{catalogo ? "Selecione a categoria" : "Carregando categorias..."}</option>
                  {catalogo?.categorias.flatMap((categoria) =>
                    categoria.ativa ? categoria.subcategorias.filter((sub) => sub.ativa).map((sub) => (
                      <option key={sub.id} value={sub.id}>{categoria.nome} · {sub.nome}</option>
                    )) : [])}
                </select>
              </CampoLinha>

              <CampoLinha
                id="sala"
                rotulo="Local"
                ajuda={variosLocais
                  ? "Há mais de um aluguel no cadastro da empresa. Escolha onde o atendimento deve acontecer."
                  : (locais[0] ? `Do cadastro da empresa: ${locais[0].local.endereco}.` : "Sala, loja ou unidade do cadastro da empresa.")}
              >
                {variosLocais ? (
                  <select id="sala" value={sala} onChange={(event) => setSala(event.target.value)}>
                    <option value="">Selecione o local</option>
                    {locais.map((item) => (
                      <option key={item.chave} value={item.sala}>{item.local.titulo}</option>
                    ))}
                  </select>
                ) : (
                  <div className="grupo-campo">
                    <Addon><IconePin /></Addon>
                    <input id="sala" value={sala} readOnly />
                  </div>
                )}
              </CampoLinha>

              <CampoLinha id="ponto" rotulo="Ponto" ajuda="Onde, dentro do local: teto, quadro elétrico, vaga ou balcão.">
                <div className="grupo-campo">
                  <Addon><IconeAlvo /></Addon>
                  <input id="ponto" maxLength={200} value={ponto} onChange={(event) => setPonto(event.target.value)} />
                </div>
              </CampoLinha>

              <CampoLinha id="data" rotulo="Data desejada" ajuda="Quando você precisa que a equipe compareça.">
                <div className="grupo-campo">
                  <Addon><IconeCalendario /></Addon>
                  <input id="data" type="date" min={hojeIso()} value={dataDesejada} onChange={(event) => setDataDesejada(event.target.value)} />
                </div>
              </CampoLinha>

              <CampoLinha id="periodo" rotulo="Período" ajuda="Horário em que a equipe pode atender na unidade.">
                <select id="periodo" value={periodo} onChange={(event) => setPeriodo(event.target.value)}>
                  <option value="">Selecione o período</option>
                  {PERIODOS_ABERTURA.map((opcao) => <option key={opcao} value={opcao}>{opcao}</option>)}
                </select>
              </CampoLinha>

              <CampoLinha
                id="itens"
                rotulo="Itens"
                ajuda="Inclua o que faz parte do pedido. Enter confirma cada item."
                extra={(
                  <div className="atalhos-itens">
                    {ITENS_SUGERIDOS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className="atalho-item"
                        disabled={itens.some((existente) => existente.toLocaleLowerCase("pt-BR") === item.toLocaleLowerCase("pt-BR"))}
                        onClick={() => incluirItem(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              >
                <div className="grupo-tags">
                  {itens.map((item) => (
                    <span className="tag" key={item}>
                      <button type="button" aria-label={`Remover ${item}`} onClick={() => setItens((atual) => atual.filter((existente) => existente !== item))}>×</button>
                      {item}
                    </span>
                  ))}
                  <input
                    id="itens"
                    value={rascunhoItem}
                    maxLength={80}
                    placeholder="adicionar um item"
                    onChange={(event) => setRascunhoItem(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        incluirItem(rascunhoItem);
                      }
                    }}
                  />
                </div>
              </CampoLinha>

              <CampoLinha id="arquivo" rotulo="Arquivo" ajuda="Imagem, PDF, Word, Excel ou áudio, até 5 MB." extra={arquivo ? <p className="campo-ajuda">{arquivo.name}</p> : null}>
                <label className="arquivo-botao" htmlFor="arquivo">Escolher arquivo</label>
                <input
                  id="arquivo"
                  className="sr-only"
                  type="file"
                  accept={ACEITA_ARQUIVO}
                  onChange={(event) => setArquivo(event.target.files?.[0] ?? null)}
                />
              </CampoLinha>

              <div className="campo-linha">
                <span className="campo-rotulo">Reclamação</span>
                <div className="campo-controle">
                  <label className="check-titulo" htmlFor="reclamacao">
                    <input id="reclamacao" type="checkbox" checked={reclamacao} onChange={(event) => setReclamacao(event.target.checked)} />
                    Este chamado é uma reclamação do atendimento
                  </label>
                  <p className="campo-ajuda">A operação vê a reclamação junto com o que está em atraso e pede ação agora.</p>
                </div>
              </div>

              <div className="campo-linha">
                <span className="campo-rotulo">Acesso</span>
                <div className="campo-controle">
                  <label className="check-titulo" htmlFor="acesso">
                    <input id="acesso" type="checkbox" checked={autorizaAcesso} onChange={(event) => setAutorizaAcesso(event.target.checked)} />
                    Autorizo o acesso da equipe à unidade
                  </label>
                  <p className="campo-ajuda">A entrada ocorre somente no horário combinado.</p>
                </div>
              </div>

            {erro && <p className="erro solicitacao-erro">{erro}</p>}
          </div>
          <footer className="solicitacao-rodape">
            <button className="btn" type="submit" disabled={enviando || preenchendo || !podeAbrir}>
              {enviando ? "Abrindo..." : "Abrir chamado"}
            </button>
          </footer>
        </form>
      </Panel>
    </>
  );
}
