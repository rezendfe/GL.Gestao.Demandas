import { Link } from "react-router-dom";
import { useSessao } from "../../application/session";
import { destinoRecorte, itensDoRecorte } from "../../domain/recorte";
import { quandoAtende, tempoRelativo, type FilaItem, type Notificacao } from "../../domain/types";
import { Badge } from "../components/Badge";
import { Icone } from "../components/Icons";
import { CartaoIndicador } from "../components/PainelInterativo";
import { PerguntaAtendimento } from "../components/PerguntaAtendimento";
import { PageHeader } from "../components/PageHeader";
import { Panel } from "../components/Panel";
import { ativarAvisosCelular } from "../notificacaoCelular";

interface Props {
  fila: FilaItem[];
  avisos: Notificacao[];
  carregando: boolean;
  erro: string | null;
  aoMudar: () => Promise<void>;
}

export function ResumoCessionario({ fila, avisos, carregando, erro, aoMudar }: Props) {
  const { sessao } = useSessao();
  const usuario = sessao?.usuario;
  const empresa = usuario?.empresa ?? "Empresa";
  const pessoa = usuario?.nome ?? "";
  const abertos = itensDoRecorte(fila, "abertas", null);
  const emAtendimento = itensDoRecorte(fila, "atendimento", null);
  const concluidas = itensDoRecorte(fila, "concluidas", null);
  const pendentes = abertos.filter((item) => item.pendencias > 0);
  const paraAvaliar = concluidas.filter((item) => item.notaAvaliacao === null);
  const recentes = [...avisos].sort((a, b) => new Date(b.criadaEm).getTime() - new Date(a.criadaEm).getTime());
  const semResposta = recentes.filter((nota) => !nota.lida);
  const visiveis = recentes.slice(0, 4);
  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  return (
    <>
      <PageHeader title="Meu dia" trail={["Início", "Meu dia"]} extra={<span className="note dash-data">{hoje}</span>} />
      {erro && <p className="erro">{erro}</p>}
      {carregando && <p>Carregando o painel...</p>}
      {!carregando && (
        <div className="dash">
          <div className="dash-main">
            <section className="kpis" aria-label="Indicadores">
              <CartaoIndicador tom="tone-info" sigla="A" valor={abertos.length} rotulo="Em aberto" itens={abertos} para={destinoRecorte("Cessionário", abertos, "abertas")} />
              <CartaoIndicador tom="tone-amber" sigla="E" valor={emAtendimento.length} rotulo="Em atendimento" itens={emAtendimento} para={destinoRecorte("Cessionário", emAtendimento, "atendimento")} />
              <CartaoIndicador tom="tone-wait" sigla="P" valor={pendentes.length} rotulo="Pendências" itens={pendentes} para={destinoRecorte("Cessionário", pendentes, "abertas")} />
              <CartaoIndicador tom="tone-ok" sigla="C" valor={concluidas.length} rotulo="Concluídas" itens={concluidas} para={destinoRecorte("Cessionário", concluidas, "concluidas")} />
            </section>
            <Panel title="Em aberto">
              {abertos.length === 0 ? (
                <p>Nenhum chamado em aberto.</p>
              ) : (
                <div className="grade-chamados">
                  {abertos.map((item) => (
                    <article key={item.id} className="chamado-resumo">
                      <Link to={`/demandas/${item.id}`}>
                        <strong>{item.protocolo}</strong>
                        <span>{item.servico}</span>
                        <Badge valor={item.situacao} />
                      </Link>
                      <dl>
                        <div>
                          <dt>Quem atende</dt>
                          <dd>{item.responsavel}</dd>
                        </div>
                        <div>
                          <dt>Quando</dt>
                          <dd>{quandoAtende(item.previsaoAtendimento)}</dd>
                        </div>
                        <div>
                          <dt>Pendências</dt>
                          <dd>{item.pendencias === 0 ? "Nenhuma" : `${item.pendencias} para responder`}</dd>
                        </div>
                      </dl>
                      {item.complementos.length > 0 && (
                        <div className="complementos">
                          <p>Para complementar o chamado</p>
                          <ul>
                            {item.complementos.map((texto) => <li key={texto}>{texto}</li>)}
                          </ul>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </Panel>
            {paraAvaliar.length > 0 && (
              <Panel title="Como foi o atendimento">
                <p className="dash-nota">Cada serviço concluído pede a sua nota, de 0 a 10. Isso orienta o tratamento da operação.</p>
                <div className="lista-chamados">
                  {paraAvaliar.map((item) => (
                    <PerguntaAtendimento key={item.id} id={item.id} protocolo={item.protocolo} aoEnviar={aoMudar} />
                  ))}
                </div>
              </Panel>
            )}
          </div>
          <aside className="dash-rail">
            <section className="identidade-cessionario" aria-label="Empresa">
              {usuario?.logoEmpresa ? (
                <img className="logo-empresa" src={usuario.logoEmpresa} alt="" />
              ) : (
                <span className="logo-empresa marca">{iniciais(empresa)}</span>
              )}
              {usuario?.foto ? (
                <img className="avatar foto" src={usuario.foto} alt="" />
              ) : (
                <span className="avatar" aria-hidden="true">{iniciais(pessoa)}</span>
              )}
              <div>
                <strong>{empresa}</strong>
                <span>{pessoa}{usuario?.sala ? ` · ${usuario.sala}` : ""}</span>
              </div>
            </section>
            <Panel title="Atalhos">
              <div className="atalhos">
                <Link to="/abrir"><Icone name="mais" />Abrir chamado</Link>
                <Link to="/minhas"><Icone name="caixa" />Solicitações</Link>
                <Link to="/mensageria"><Icone name="mensagem" />Mensageria</Link>
                <Link to="/meu-espaco"><Icone name="lista" />Meu espaço</Link>
              </div>
            </Panel>
            <Panel title="Mensagens">
              {visiveis.length === 0 ? (
                <p>Nenhuma mensagem recente.</p>
              ) : (
                <>
                  {semResposta.length > 0 && (
                    <p className="pedido-atencao">
                      {semResposta.length === 1
                        ? "1 mensagem pede a sua atenção e uma resposta."
                        : `${semResposta.length} mensagens pedem a sua atenção e uma resposta.`}
                    </p>
                  )}
                  <ul className="ultimas-mensagens">
                    {visiveis.map((nota) => (
                      <li key={nota.id}>
                        <Link
                          className={nota.lida ? undefined : "pede-resposta"}
                          to={`/demandas/${nota.demandaId}${nota.lida ? "" : `?responder=${nota.id}`}`}
                        >
                          <span className="ultimas-topo">
                            <strong>{nota.protocolo || "Chamado"}</strong>
                            <time dateTime={nota.criadaEm}>{tempoRelativo(nota.criadaEm)}</time>
                          </span>
                          <span className="ultimas-texto">{nota.texto}</span>
                          {!nota.lida && <span className="ultimas-pedido">Responder no chamado</span>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <button className="btn secondary" type="button" onClick={() => void ativarAvisosCelular()}>
                Ativar avisos no celular
              </button>
            </Panel>
          </aside>
        </div>
      )}
    </>
  );
}

function iniciais(nome: string) {
  return nome
    .split(/\s+/)
    .filter((parte) => parte.length > 1)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("") || "GL";
}
