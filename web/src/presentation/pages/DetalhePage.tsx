import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useCatalogo, useCadeia, useDetalhe } from "../../application/hooks";
import { useLinhaDoTempo } from "../../application/preferenciaVisual";
import { useSessao } from "../../application/session";
import { cadeiaDoTipo, proximaEtapa } from "../../domain/cadeia";
import { validarArquivo, validarTexto } from "../../domain/entrada";
import { espacoPorSala } from "../../domain/espacos";
import { hora, quandoAtende } from "../../domain/types";
import { ApiError, api } from "../../infrastructure/api/client";
import { Badge } from "../components/Badge";
import { BotaoPdfProtocolo } from "../components/ExportarArquivo";
import { LinhaDoTempoAtendimento } from "../components/LinhaDoTempoAtendimento";
import { ModalAvanco } from "../components/ModalAvanco";
import { Panel } from "../components/Panel";
import { PerguntaAtendimento } from "../components/PerguntaAtendimento";

export function DetalhePage() {
  const { id = "" } = useParams();
  const { dados, erro, carregando, recarregar } = useDetalhe(id);
  const { dados: catalogo } = useCatalogo();
  const { dados: cadeia } = useCadeia();
  const { sessao } = useSessao();
  const perfil = sessao?.usuario.perfil;
  const [linhaDoTempo, definirLinhaDoTempo] = useLinhaDoTempo(sessao?.usuario.id);
  const [mensagem, setMensagem] = useState("");
  const [complemento, setComplemento] = useState(false);
  const [quando, setQuando] = useState("");
  const [parametros] = useSearchParams();
  const responderId = parametros.get("responder");
  const [motivo, setMotivo] = useState("");
  const [subcategoriaId, setSubcategoriaId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
  const [falha, setFalha] = useState<string | null>(null);
  const [avancando, setAvancando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (dados?.previsaoAtendimento) setQuando(paraLocal(dados.previsaoAtendimento));
  }, [dados?.previsaoAtendimento]);

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

  const espaco = espacoPorSala(dados.cessionario.sala);
  const destino = proximaEtapa(dados.situacao, cadeiaDoTipo(cadeia, dados.subcategoriaId));
  const subAtual = subcategoriaId || dados.subcategoriaId;
  const areaAtual = areaId || dados.areaId;

  return (
    <>
      <header className="detail-head">
        <div>
          <div className="protocol">{dados.protocolo}</div>
          <h1>{dados.servico}</h1>
          <p className="muted">{dados.cessionario.empresa} · {dados.cessionario.sala ?? "Sala não informada"} · {dados.cessionario.nome}</p>
          {espaco?.telefone && <p className="note">Telefone da empresa: {espaco.telefone}</p>}
          {espaco && (
            <Link className="btn secondary" to={`/espacos/${espaco.chave}`}>Ver espaço do Cessionário</Link>
          )}
        </div>
        <div className="detail-tools">
          <BotaoPdfProtocolo id={dados.id} protocolo={dados.protocolo} />
          <label className="preferencia-vista">
            <input
              type="checkbox"
              checked={linhaDoTempo}
              onChange={(event) => definirLinhaDoTempo(event.target.checked)}
            />
            <span>
              Linha do tempo
              <span className="preferencia-nota">Salva para o seu usuário</span>
            </span>
          </label>
          <Badge valor={dados.situacao} />
          {dados.natureza === "Reclamação" && <Badge valor="Reclamação" />}
        </div>
      </header>
      {falha && <p className="erro">{falha}</p>}
      {linhaDoTempo && (
        <LinhaDoTempoAtendimento
          dados={dados}
          mensagem={mensagem}
          onMensagem={setMensagem}
          onEnviar={() => void executar(async () => { await enviarMensagem(); })}
        />
      )}
      <div className="grid-2">
        <div>
          <Panel title="Dados do chamado">
            <p>{dados.descricao}</p>
            <p className="note">{dados.categoria} · {dados.subcategoria}{perfil === "Cessionário" ? "" : ` · ${dados.area}`}</p>
            {perfil !== "Cessionário" && <p className="note">Destino: {dados.destino} · Confiança {dados.confianca} · {dados.classificacao} · Prioridade {dados.prioridade}</p>}
            <p className="note">Quem atende: {dados.responsavel?.nome ?? "A definir"}</p>
            <p className="note">Quando: {quandoAtende(dados.previsaoAtendimento)}</p>
            <p className="note">Ponto: {dados.ponto ?? "Não informado"} · Aberto em {hora(dados.abertoEm)}</p>
            {dados.notaAvaliacao !== null && (
              <p className="note">Nota do atendimento: {dados.notaAvaliacao}{dados.comentarioAvaliacao ? ` · ${dados.comentarioAvaliacao}` : ""}</p>
            )}
          </Panel>
          {perfil === "Cessionário" && (dados.situacao === "Concluído" || dados.situacao === "Encerrada") && dados.notaAvaliacao === null && (
            <Panel title="Como foi o atendimento">
              <PerguntaAtendimento id={dados.id} protocolo={dados.protocolo} aoEnviar={recarregar} />
            </Panel>
          )}
          {!linhaDoTempo && <Panel title="Comunicação">
            <div className="timeline">
              {dados.mensagens.map((item) => (
                <article key={item.id} className={item.finalidade === "complemento" ? "msg complemento" : item.canal === "MENSAGERIA" ? "msg mensageria" : "msg"}>
                  <strong>{item.autor}</strong>
                  <p>{item.texto}</p>
                  <span className="note">{rotuloCanal(item.canal, item.finalidade)} · {hora(item.enviadaEm)}</span>
                </article>
              ))}
            </div>
            <label>
              {responderId ? "Resposta da notificação" : "Mensagem"}
              <textarea maxLength={2000} value={mensagem} onChange={(event) => setMensagem(event.target.value)} />
            </label>
            {perfil !== "Cessionário" && (
              <label className="preferencia-vista">
                <input type="checkbox" checked={complemento} onChange={(event) => setComplemento(event.target.checked)} />
                <span>Pedir complemento ao Cessionário</span>
              </label>
            )}
            <button className="btn secondary" type="button" onClick={() => void executar(enviarMensagem)}>
              {responderId ? "Enviar para o chamado" : "Enviar mensagem"}
            </button>
          </Panel>}
        </div>
        <div>
          <Panel title="Documentos e evidências">
            {dados.anexos.length === 0 && <p className="note">Nenhum anexo ainda.</p>}
            {dados.anexos.map((anexo) => (
              <p key={anexo.id}>
                <button className="btn secondary" type="button" onClick={() => void api.baixarAnexo(dados.id, anexo.id, anexo.nome)}>{anexo.nome}</button>
              </p>
            ))}
            <label>
              Adicionar documento ou foto
              <input type="file" accept="image/*,.pdf" capture="environment" onChange={(event) => {
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
          </Panel>
          {!linhaDoTempo && <Panel title="Histórico">
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
          </Panel>}
          <Panel title="Ações">
            {perfil === "GL / Administrador" && (
              <>
                <label>
                  Classificação
                  <select value={subAtual} onChange={(event) => setSubcategoriaId(event.target.value)}>
                    {catalogo?.categorias.flatMap((categoria) => categoria.ativa ? categoria.subcategorias.filter((sub) => sub.ativa).map((sub) => (
                      <option key={sub.id} value={sub.id}>{categoria.nome} · {sub.nome}</option>
                    )) : [])}
                  </select>
                </label>
                <button className="btn" type="button" onClick={() => void executar(() => api.classificar(dados.id, subAtual))}>Confirmar classificação</button>
                <label>
                  Direcionar para
                  <select value={areaAtual} onChange={(event) => setAreaId(event.target.value)}>
                    {catalogo?.areas.filter((area) => area.ativa !== false || area.id === areaAtual).map((area) => <option key={area.id} value={area.id}>{area.nome}</option>)}
                  </select>
                </label>
                <label>
                  Responsável
                  <select value={responsavelId} onChange={(event) => setResponsavelId(event.target.value)}>
                    <option value="">A definir</option>
                    {catalogo?.responsaveis.filter((pessoa) => (pessoa.ativo !== false || pessoa.id === responsavelId) && (!areaAtual || pessoa.areaId === areaAtual)).map((pessoa) => (
                      <option key={pessoa.id} value={pessoa.id}>{pessoa.nome}</option>
                    ))}
                  </select>
                </label>
                <button className="btn secondary" type="button" onClick={() => void executar(() => api.redirecionar(dados.id, areaAtual, responsavelId || null))}>
                  Redirecionar
                </button>
              </>
            )}
            {perfil !== "Cessionário" && (
              <>
                <label>
                  Quando será atendido
                  <input type="datetime-local" value={quando} onChange={(event) => setQuando(event.target.value)} />
                </label>
                <button
                  className="btn secondary"
                  type="button"
                  onClick={() => {
                    if (!quando) {
                      setFalha("Informe quando será atendido.");
                      return;
                    }
                    void executar(() => api.previsao(dados.id, new Date(quando).toISOString()));
                  }}
                >
                  Salvar previsão
                </button>
              </>
            )}
            {perfil === "Cessionário" && dados.situacao === "Aguardando validação" && destino && (
              <button className="btn" type="button" onClick={() => setAvancando(true)}>
                Validar atendimento
              </button>
            )}
            {perfil === "GL / Administrador" && dados.situacao === "Concluído" && (
              <button className="btn" type="button" onClick={() => void executar(() => api.encerrar(dados.id))}>
                Encerrar chamado
              </button>
            )}
            {perfil === "GL / Administrador" && dados.situacao !== "Aguardando aprovação" && !["Concluído", "Reprovado", "Encerrada", "Cancelada"].includes(dados.situacao) && (
              <>
                <label>
                  Motivo do cancelamento
                  <textarea maxLength={2000} value={motivo} onChange={(event) => setMotivo(event.target.value)} />
                </label>
                <button className="btn danger" type="button" onClick={() => {
                  const invalido = validarTexto(motivo, 1, 2000, motivo.trim() ? "O motivo tem no máximo 2000 caracteres." : "Informe o motivo.");
                  if (invalido) { setFalha(invalido); return; }
                  void executar(() => api.cancelar(dados.id, motivo));
                }}>Cancelar chamado</button>
              </>
            )}
            {perfil === "GL / Administrador" && dados.situacao === "Aguardando aprovação" && (
              <>
                <label>
                  Motivo, se houver ajuste, reprovação ou cancelamento
                  <textarea maxLength={2000} value={motivo} onChange={(event) => setMotivo(event.target.value)} />
                </label>
                <div className="row">
                  <button className="btn" type="button" onClick={() => void executar(() => api.aprovar(dados.id, "Aprovar"))}>Aprovar</button>
                  <button className="btn secondary" type="button" onClick={() => {
                    const invalido = validarTexto(motivo, 1, 2000, motivo.trim() ? "O motivo tem no máximo 2000 caracteres." : "Informe o motivo.");
                    if (invalido) { setFalha(invalido); return; }
                    void executar(() => api.aprovar(dados.id, "Solicitar ajuste", motivo));
                  }}>Solicitar ajuste</button>
                  <button className="btn danger" type="button" onClick={() => {
                    const invalido = validarTexto(motivo, 1, 2000, motivo.trim() ? "O motivo tem no máximo 2000 caracteres." : "Informe o motivo.");
                    if (invalido) { setFalha(invalido); return; }
                    void executar(() => api.aprovar(dados.id, "Reprovar", motivo));
                  }}>Reprovar</button>
                  <button className="btn danger" type="button" onClick={() => {
                    const invalido = validarTexto(motivo, 1, 2000, motivo.trim() ? "O motivo tem no máximo 2000 caracteres." : "Informe o motivo.");
                    if (invalido) { setFalha(invalido); return; }
                    void executar(() => api.cancelar(dados.id, motivo));
                  }}>Cancelar chamado</button>
                </div>
              </>
            )}
          </Panel>
        </div>
      </div>
      {avancando && destino && (
        <ModalAvanco
          protocolo={dados.protocolo}
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
    </>
  );

  async function confirmarAvanco(valor: { comentario: string; previsao: string; confirmacao: boolean | null }) {
    setEnviando(true);
    setFalha(null);
    try {
      await api.avancar(dados!.id, {
        comentario: valor.comentario || null,
        previsao: valor.previsao ? new Date(valor.previsao).toISOString() : null,
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
    const invalida = validarTexto(mensagem, 1, 2000, mensagem.trim() ? "A mensagem tem no máximo 2000 caracteres." : "Escreva a mensagem.");
    if (invalida) throw new ApiError(invalida, 400);
    if (responderId && perfil === "Cessionário") {
      await api.responderNotificacao(responderId, mensagem);
    } else {
      await api.mensagem(dados!.id, mensagem, complemento);
    }
    setMensagem("");
    setComplemento(false);
  }
}

function rotuloCanal(canal: string, finalidade: string) {
  if (finalidade === "complemento") return "Complemento";
  if (canal === "CELULAR") return "Celular";
  if (canal === "MENSAGERIA") return "Mensageria";
  return "Portal";
}

function paraLocal(iso: string) {
  const data = new Date(iso);
  const local = new Date(data.getTime() - data.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
