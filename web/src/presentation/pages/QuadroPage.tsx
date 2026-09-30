import { useState } from "react";
import { Link } from "react-router-dom";
import { useCadeia, useFila } from "../../application/hooks";
import { useSessao } from "../../application/session";
import { COLUNAS_CADEIA, cadeiaDoTipo, podeAvancar, proximaEtapa } from "../../domain/cadeia";
import { emAtraso } from "../../domain/operacao";
import { tempoRelativo, type EtapaCadeia, type FilaItem } from "../../domain/types";
import { ApiError, api } from "../../infrastructure/api/client";
import { Badge } from "../components/Badge";
import { ModalAvanco } from "../components/ModalAvanco";
import { Panel } from "../components/Panel";

export function QuadroPage() {
  const { sessao } = useSessao();
  const { dados, erro, carregando, recarregar } = useFila();
  const { dados: cadeia } = useCadeia();
  const [alvo, setAlvo] = useState<{ item: FilaItem; destino: EtapaCadeia } | null>(null);
  const [falha, setFalha] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [sobre, setSobre] = useState<string | null>(null);
  const fila = dados ?? [];
  const perfil = sessao?.usuario.perfil;
  const frase = perfil === "Responsável da Área"
    ? "A fila da sua área. A próxima etapa segue o tipo de atendimento do chamado."
    : "A fila da operação. A próxima etapa segue o tipo de atendimento do chamado.";

  function abrir(item: FilaItem, destino: EtapaCadeia | null) {
    if (!destino || !perfil || !podeAvancar(perfil, item.situacao, destino.codigo)) {
      setFalha(destino ? `A próxima ação de ${item.protocolo} é ${destino.nome}.` : `${item.protocolo} não tem próxima ação.`);
      return;
    }
    setFalha(null);
    setAlvo({ item, destino });
  }

  async function confirmar(valor: { comentario: string; previsao: string; confirmacao: boolean | null }) {
    if (!alvo) return;
    setEnviando(true);
    setFalha(null);
    try {
      await api.avancar(alvo.item.id, {
        comentario: valor.comentario || null,
        previsao: valor.previsao ? new Date(valor.previsao).toISOString() : null,
        confirmacao: valor.confirmacao,
      });
      setAlvo(null);
      await recarregar();
    } catch (error) {
      setFalha(error instanceof ApiError ? error.message : "Não foi possível mudar o status.");
    } finally {
      setEnviando(false);
    }
  }

  async function decidir(decisao: "Solicitar ajuste" | "Reprovar", motivo: string) {
    if (!alvo) return;
    setEnviando(true);
    setFalha(null);
    try {
      await api.aprovar(alvo.item.id, decisao, motivo);
      setAlvo(null);
      await recarregar();
    } catch (error) {
      setFalha(error instanceof ApiError ? error.message : "Não foi possível registrar a decisão.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>{frase}</p>
      {erro && <p className="erro">{erro}</p>}
      {falha && !alvo && <p className="erro">{falha}</p>}
      {carregando && <p>Carregando o quadro...</p>}
      {!carregando && (
        <Panel title="Etapas do atendimento" className="livre">
          <div className="kanban">
            {COLUNAS_CADEIA.map((coluna) => {
              const itens = fila.filter((item) => coluna.situacoes.includes(item.situacao));
              return (
                <section
                  key={coluna.codigo}
                  className={sobre === coluna.codigo ? "kanban-col sobre" : "kanban-col"}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setSobre(coluna.codigo);
                  }}
                  onDragLeave={() => setSobre((atual) => (atual === coluna.codigo ? null : atual))}
                  onDrop={(event) => {
                    event.preventDefault();
                    setSobre(null);
                    const id = event.dataTransfer.getData("text/plain");
                    const item = fila.find((candidato) => candidato.id === id);
                    if (!item) return;
                    const destino = proximaEtapa(item.situacao, cadeiaDoTipo(cadeia, item.subcategoriaId));
                    if (destino?.codigo !== coluna.codigo) {
                      setFalha(destino
                        ? `${item.protocolo} só pode ir para ${destino.nome}.`
                        : `${item.protocolo} não tem próxima ação.`);
                      return;
                    }
                    abrir(item, destino);
                  }}
                >
                  <header>
                    <strong>{coluna.nome}</strong>
                    <span>{itens.length}</span>
                  </header>
                  <p>{coluna.detalhe}</p>
                  {itens.length === 0 && <p className="kanban-vazio">Nenhum chamado.</p>}
                  {itens.map((item) => {
                    const destino = proximaEtapa(item.situacao, cadeiaDoTipo(cadeia, item.subcategoriaId));
                    const libera = destino && perfil ? podeAvancar(perfil, item.situacao, destino.codigo) : false;
                    return (
                      <article
                        key={item.id}
                        className={emAtraso(item) ? "kanban-card atraso" : "kanban-card"}
                        draggable={libera}
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", item.id);
                          event.dataTransfer.effectAllowed = "move";
                        }}
                      >
                        <Link to={`/demandas/${item.id}`}><strong>{item.protocolo}</strong></Link>
                        <span>{item.cessionario}</span>
                        <span>{item.servico}</span>
                        <span className="motivos">
                          <Badge valor={item.situacao} />
                          {emAtraso(item) && <Badge valor="Em atraso" />}
                          {item.natureza === "Reclamação" && <Badge valor="Reclamação" />}
                        </span>
                        <em>{emAtraso(item) && item.previsaoAtendimento ? `atrasado ${tempoRelativo(item.previsaoAtendimento)}` : tempoRelativo(item.abertoEm)}</em>
                        {!libera && item.situacao === "Aguardando validação" && <span className="note">Aguarda o Cessionário</span>}
                        {!libera && item.situacao === "Aguardando ajuste" && <span className="note">Aguarda o ajuste do Cessionário</span>}
                        {!libera && destino?.codigo === "aprovacao" && <span className="note">Aguarda o GL / Administrador</span>}
                      </article>
                    );
                  })}
                </section>
              );
            })}
          </div>
        </Panel>
      )}
      {alvo && (
        <ModalAvanco
          protocolo={alvo.item.protocolo}
          situacao={alvo.item.situacao}
          destino={alvo.destino}
          jaTemPrevisao={Boolean(alvo.item.previsaoAtendimento)}
          podeDecidir={perfil === "GL / Administrador" && alvo.item.situacao === "Aguardando aprovação"}
          enviando={enviando}
          erro={falha}
          onCancelar={() => { setAlvo(null); setFalha(null); }}
          onConfirmar={(valor) => void confirmar(valor)}
          onDecidir={(decisao, motivo) => void decidir(decisao, motivo)}
        />
      )}
    </>
  );
}
