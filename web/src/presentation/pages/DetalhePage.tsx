import { useState, type ReactNode } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useCatalogo, useCadeia, useDetalhe } from "../../application/hooks";
import { useSessao } from "../../application/session";
import { cadeiaDoTipo, proximaEtapa, proximoPassoDemanda, rotuloDoAvanco } from "../../domain/cadeia";
import { avisoSemAlteracao, encerrada } from "../../domain/recorte";
import { ACEITA_ARQUIVO, validarArquivo, validarTexto } from "../../domain/entrada";
import { espacoPorSala } from "../../domain/espacos";
import { hora, quandoAtende, relogioInformado, type Anexo } from "../../domain/types";
import { ApiError, api } from "../../infrastructure/api/client";
import { AcoesDoChamado } from "../components/AcoesDoChamado";
import { Badge } from "../components/Badge";
import { useAcoesDaPagina, type AcaoPagina } from "../components/AcoesRapidas";
import { ConversaChat } from "../components/ConversaChat";
import { LinhaDoTempoAtendimento } from "../components/LinhaDoTempoAtendimento";
import { ModalAvanco } from "../components/ModalAvanco";
import { Panel } from "../components/Panel";
import { PerguntaAtendimento } from "../components/PerguntaAtendimento";
import { VisualizadorArquivo } from "../components/VisualizadorArquivo";

export function DetalhePage() {
  const { id = "" } = useParams();
  const { dados, erro, carregando, recarregar } = useDetalhe(id);
  const { dados: catalogo } = useCatalogo();
  const { dados: cadeia } = useCadeia();
  const { sessao } = useSessao();
  const navigate = useNavigate();
  const perfil = sessao?.usuario.perfil;
  const [mensagem, setMensagem] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [parametros, setParametros] = useSearchParams();
  const responderId = parametros.get("responder");
  const mensagemId = parametros.get("mensagem");
  const aba = resolverAba(parametros.get("aba"), Boolean(responderId) || Boolean(mensagemId));
  const abas = abasDoChamado();
  const [falha, setFalha] = useState<string | null>(null);
  const [avancando, setAvancando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [anexoAberto, setAnexoAberto] = useState<Anexo | null>(null);

  const espaco = dados ? espacoPorSala(dados.cessionario.sala) : undefined;
  const destino = dados ? proximaEtapa(dados.situacao, cadeiaDoTipo(cadeia, dados.subcategoriaId)) : null;
  const fechado = dados ? encerrada(dados.situacao) : false;
  const passo = dados && perfil ? proximoPassoDemanda(perfil, dados.situacao, destino, dados.notaAvaliacao === null) : null;
  const acoes: AcaoPagina[] = [];
  if (dados && passo) {
    if (passo.acao === "avancar" && destino) {
      const rotulo = rotuloDoAvanco(dados.situacao, destino);
      acoes.push({ id: "avancar", rotulo, icone: "lista", executar: () => setAvancando(true) });
    } else if (passo.acao === "aprovar") {
      acoes.push({ id: "aprovar", rotulo: "Aprovar", icone: "documento", executar: () => executar(() => api.aprovar(dados.id, "Aprovar")) });
    } else if (passo.acao === "encerrar") {
      acoes.push({ id: "encerrar", rotulo: "Encerrar chamado", icone: "alerta", executar: () => executar(() => api.encerrar(dados.id)) });
    } else if (passo.acao === "avaliar") {
      acoes.push({ id: "avaliar", rotulo: "Avaliar o atendimento", icone: "sino", executar: irParaAvaliacao });
    }
    if (espaco) {
      acoes.push({
        id: "ver-espaco",
        rotulo: "Ver espaço do Cessionário",
        icone: "casa",
        executar: () => navigate(`/espacos/${espaco.chave}`),
      });
    }
    acoes.push({
      id: "pdf-protocolo",
      rotulo: "PDF do protocolo",
      rotuloOcupado: "Gerando PDF...",
      icone: "documento",
      executar: () => api.exportarProtocolo(dados.id, dados.protocolo),
    });
  }
  useAcoesDaPagina(acoes);

  async function executar(acao: () => Promise<unknown>) {
    setFalha(null);
    try {
      await acao();
      await recarregar();
    } catch (error) {
      setFalha(error instanceof ApiError ? error.message : "Não foi possível concluir a ação.");
    }
  }

  if (carregando) return <p>Carregando chamado...</p>;
  if (erro || !dados) return <p className="erro">{erro ?? "Chamado não encontrado."}</p>;

  function selecionarAba(proxima: AbaDetalhe) {
    setParametros((atuais) => {
      const proximos = new URLSearchParams(atuais);
      const padrao: AbaDetalhe = responderId || mensagemId ? "comunicacao" : "dados";
      if (proxima === padrao) proximos.delete("aba");
      else proximos.set("aba", proxima);
      return proximos;
    }, { replace: true });
  }

  function irParaAvaliacao() {
    selecionarAba("dados");
    window.setTimeout(() => document.getElementById("avaliacao")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  return (
    <>
      <header className="detail-head">
        <h1>{dados.servico}</h1>
      </header>
      {falha && !avancando && <p className="erro">{falha}</p>}
      <div className="visoes-centrais" role="tablist" aria-label="Chamado">
        {abas.map((item) => (
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
      <div role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`}>
        {aba === "dados" && (
          <>
          <Panel title="Dados do chamado" className="ficha-chamado-panel">
            <article className="ficha-chamado">
              <header className="ficha-topo">
                <span className="ficha-avatar" aria-hidden="true">{iniciais(dados.cessionario.nome)}</span>
                <div className="ficha-topo-texto">
                  <p className="protocol">{dados.protocolo}</p>
                  <p className="ficha-pessoa">
                    <strong>{dados.cessionario.empresa}</strong>
                    <span>{dados.cessionario.sala ?? "Sala não informada"}</span>
                    <span>{dados.cessionario.nome}</span>
                  </p>
                  {espaco?.telefone && <p className="note">Telefone da empresa: {espaco.telefone}</p>}
                </div>
                {dados.natureza === "Reclamação" && <Badge valor="Reclamação" />}
              </header>
              {passo && (
                <div className="ficha-status" aria-label="Situação e próximo passo">
                  <div>
                    <span>Situação</span>
                    <Badge valor={dados.situacao} />
                  </div>
                  <div>
                    <span>Próximo passo</span>
                    <strong>{passo.texto}</strong>
                  </div>
                </div>
              )}
              <p className="ficha-descricao">{dados.descricao}</p>
              <dl className="ficha-fatos">
                <Fato rotulo="Serviço" valor={`${dados.categoria} · ${dados.subcategoria}`} />
                {perfil !== "Cessionário" && <Fato rotulo="Área" valor={dados.area} />}
                {perfil !== "Cessionário" && <Fato rotulo="Destino" valor={dados.destino} />}
                {perfil !== "Cessionário" && <Fato rotulo="Confiança" valor={dados.confianca} />}
                {perfil !== "Cessionário" && <Fato rotulo="Classificação" valor={dados.classificacao} />}
                {perfil !== "Cessionário" && <Fato rotulo="Prioridade" valor={<Badge valor={dados.prioridade} />} />}
                <Fato rotulo="Quem atende" valor={dados.responsavel?.nome ?? "A definir"} vazio={!dados.responsavel} />
                <Fato rotulo="Quando" valor={quandoAtende(dados.previsaoAtendimento)} vazio={!dados.previsaoAtendimento} />
                <Fato rotulo="Ponto" valor={dados.ponto ?? "Não informado"} vazio={!dados.ponto} />
                <Fato rotulo="Aberto em" valor={hora(dados.abertoEm)} />
              </dl>
              {dados.notaAvaliacao !== null && (
                <p className="ficha-nota">
                  <span>Nota do atendimento</span>
                  <strong>{dados.notaAvaliacao}</strong>
                  {dados.comentarioAvaliacao && <em>{dados.comentarioAvaliacao}</em>}
                </p>
              )}
            </article>
          </Panel>
          {perfil === "Cessionário" && (dados.situacao === "Concluído" || dados.situacao === "Encerrada") && dados.notaAvaliacao === null && (
            <div id="avaliacao">
              <Panel title="Como foi o atendimento">
                <PerguntaAtendimento id={dados.id} protocolo={dados.protocolo} aoEnviar={recarregar} />
              </Panel>
            </div>
          )}
          </>
        )}
        {aba === "comunicacao" && (
          <ConversaChat
            demandaId={dados.id}
            mensagens={dados.mensagens}
            anexos={dados.anexos}
            mensagemDestacada={mensagemId}
            meuNome={sessao?.usuario.nome ?? ""}
            minhaFoto={sessao?.usuario.foto ?? null}
            nomeCessionario={dados.cessionario.nome}
            fotoCessionario={espaco?.foto ?? null}
            texto={mensagem}
            onTexto={setMensagem}
            arquivo={arquivo}
            onArquivo={setArquivo}
            onErro={setFalha}
            onAbrirAnexo={(anexoId) => {
              const anexo = dados.anexos.find((item) => item.id === anexoId);
              if (anexo) setAnexoAberto(anexo);
            }}
            onEnviar={() => void executar(enviarMensagem)}
            rotuloEnvio={responderId ? "Enviar para o chamado" : "Enviar mensagem"}
            encerrado={fechado}
            avisoEncerrado={avisoSemAlteracao(dados.situacao)}
          />
        )}
        {aba === "linha" && (
          <LinhaDoTempoAtendimento
            dados={dados}
            mensagem={mensagem}
            onMensagem={setMensagem}
            arquivo={arquivo}
            onArquivo={setArquivo}
            onErro={setFalha}
            onEnviar={() => void executar(async () => { await enviarMensagem(); })}
            encerrado={fechado}
          />
        )}
        {aba === "documentos" && (
          <Panel title="Documentos e evidências">
            {dados.anexos.length === 0 && <p className="note">Nenhum anexo ainda.</p>}
            {dados.anexos.map((anexo) => (
              <p key={anexo.id}>
                <button className="btn secondary" type="button" onClick={() => setAnexoAberto(anexo)}>
                  {anexo.finalidade === "obra" ? `Foto da obra · ${anexo.nome}` : anexo.nome}
                </button>
              </p>
            ))}
            {fechado ? <p className="note">{avisoSemAlteracao(dados.situacao)}</p> : (
            <label>
              Adicionar documento, planilha, foto ou áudio
              <input type="file" accept={ACEITA_ARQUIVO} onChange={(event) => {
                const arquivo = event.target.files?.[0];
                if (!arquivo) return;
                const invalido = validarArquivo(arquivo);
                if (invalido) {
                  setFalha(invalido);
                  event.target.value = "";
                  return;
                }
                void executar(() => api.anexar(dados.id, arquivo));
              }} />
            </label>
            )}
          </Panel>
        )}
        {aba === "historico" && (
          <Panel title="Histórico">
            <div className="timeline">
              {dados.historico.map((evento) => (
                <div key={evento.id} className="event">
                  <i />
                  <div>
                    <strong>{evento.comentario}</strong>
                    <p className="note">{evento.autor} · {hora(evento.eventoEm)}{evento.statusAnterior ? ` · ${evento.statusAnterior} → ${evento.statusNovo}` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}
        {aba === "acoes" && (
          <AcoesDoChamado
            perfil={perfil}
            dados={dados}
            etapas={cadeiaDoTipo(cadeia, dados.subcategoriaId)}
            catalogo={catalogo ?? null}
            onExecutar={executar}
            onAvancar={() => setAvancando(true)}
            onAvaliar={irParaAvaliacao}
            onComunicacao={() => selecionarAba("comunicacao")}
          />
        )}
      </div>
      {avancando && destino && (
        <ModalAvanco
          protocolo={dados.protocolo}
          demandaId={dados.id}
          situacao={dados.situacao}
          destino={destino}
          jaTemPrevisao={Boolean(dados.previsaoAtendimento)}
          podeDecidir={false}
          enviando={enviando}
          erro={falha}
          onCancelar={() => { setAvancando(false); setFalha(null); }}
          onConfirmar={(valor) => void confirmarAvanco(valor)}
        />
      )}
      <VisualizadorArquivo
        demandaId={dados.id}
        anexos={dados.anexos}
        alvo={anexoAberto}
        onAlvo={setAnexoAberto}
        onFechar={() => setAnexoAberto(null)}
      />
    </>
  );

  async function confirmarAvanco(valor: { comentario: string; previsao: string; confirmacao: boolean | null; fotos: File[] }) {
    setEnviando(true);
    setFalha(null);
    try {
      await api.anexarFotosDaObra(dados!.id, valor.fotos);
      await api.avancar(dados!.id, {
        comentario: valor.comentario || null,
        previsao: valor.previsao ? relogioInformado(valor.previsao) : null,
        confirmacao: valor.confirmacao,
      });
      setAvancando(false);
      await recarregar();
    } catch (error) {
      setFalha(error instanceof ApiError ? error.message : "Não foi possível mudar o status.");
    } finally {
      setEnviando(false);
    }
  }

  async function enviarMensagem() {
    if (encerrada(dados!.situacao)) throw new ApiError(avisoSemAlteracao(dados!.situacao), 400);
    if (arquivo) {
      const arquivoInvalido = validarArquivo(arquivo);
      if (arquivoInvalido) throw new ApiError(arquivoInvalido, 400);
      if (mensagem.trim()) {
        const invalida = validarTexto(mensagem, 1, 2000, "A mensagem tem no máximo 2000 caracteres.");
        if (invalida) throw new ApiError(invalida, 400);
      }
      await api.mensagemComAnexo(dados!.id, mensagem.trim(), arquivo);
    } else {
      const invalida = validarTexto(mensagem, 1, 2000, mensagem.trim() ? "A mensagem tem no máximo 2000 caracteres." : "Escreva a mensagem.");
      if (invalida) throw new ApiError(invalida, 400);
      if (responderId && perfil === "Cessionário") {
        await api.responderNotificacao(responderId, mensagem);
      } else {
        await api.mensagem(dados!.id, mensagem);
      }
    }
    setMensagem("");
    setArquivo(null);
  }
}

type AbaDetalhe = "dados" | "comunicacao" | "documentos" | "historico" | "acoes" | "linha";

function abasDoChamado(): { id: AbaDetalhe; rotulo: string }[] {
  return [
    { id: "dados", rotulo: "Dados do chamado" },
    { id: "linha", rotulo: "Linha do tempo" },
    { id: "comunicacao", rotulo: "Comunicação" },
    { id: "documentos", rotulo: "Documentos e evidências" },
    { id: "historico", rotulo: "Histórico" },
    { id: "acoes", rotulo: "Ações" },
  ];
}

function Fato({ rotulo, valor, vazio }: { rotulo: string; valor: ReactNode; vazio?: boolean }) {
  return (
    <div>
      <dt>{rotulo}</dt>
      <dd className={vazio ? "vazio" : undefined}>{valor}</dd>
    </div>
  );
}

function iniciais(nome: string) {
  return nome
    .split(/\s+/)
    .filter((parte) => parte.length > 1)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

function resolverAba(valor: string | null, responder: boolean): AbaDetalhe {
  if (valor === "dados" || valor === "linha" || valor === "comunicacao" || valor === "documentos" || valor === "historico" || valor === "acoes") return valor;
  return responder ? "comunicacao" : "dados";
}
