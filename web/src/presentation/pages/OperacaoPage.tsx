import { Link } from "react-router-dom";
import { useFila } from "../../application/hooks";
import { useSessao } from "../../application/session";
import { emAtraso, motivosAcao, motivosAtencao, ordenarPorMotivo, reclamacoesDe, resumirNps } from "../../domain/operacao";
import { encerrada } from "../../domain/recorte";
import { Badge } from "../components/Badge";
import { ListaOperacao } from "../components/ListaOperacao";
import { NotaServicos, textoIndice } from "../components/NotaServicos";
import { Panel } from "../components/Panel";

export function OperacaoPage() {
  const { sessao } = useSessao();
  const { dados, erro, carregando } = useFila();
  const perfil = sessao?.usuario.perfil ?? "GL / Administrador";
  const fila = dados ?? [];
  const acao = ordenarPorMotivo(fila, perfil, motivosAcao);
  const atrasados = acao.filter((linha) => linha.motivos.includes("Em atraso"));
  const atencao = ordenarPorMotivo(fila, perfil, motivosAtencao);
  const reclamacoes = reclamacoesDe(fila);
  const nps = resumirNps(fila);

  return (
    <>
      <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>
        O que fazer agora, o que está em atraso, as reclamações, os pontos de atenção e a nota dos serviços já executados.
      </p>
      {erro && <p className="erro">{erro}</p>}
      {carregando && <p>Carregando a operação...</p>}
      {!carregando && (
        <>
          <nav className="ancoras-operacao" aria-label="Seções da operação">
            <a href="#acao">Ação agora ({acao.length})</a>
            <a href="#atraso">Em atraso ({atrasados.length})</a>
            <a href="#reclamacoes">Reclamações ({reclamacoes.filter((item) => !encerrada(item.situacao)).length})</a>
            <a href="#atencao">Pontos de atenção ({atencao.length})</a>
            <a href="#nps">Nota dos serviços {nps.indice === null ? "" : `(${textoIndice(nps.indice)})`}</a>
          </nav>

          <section id="acao">
            <Panel title="Ação agora">
              <p className="dash-nota">
                {perfil === "GL / Administrador"
                  ? "Atraso, entrada ainda não iniciada, prioridade alta sem previsão, reclamação em aberto e decisão do GL / Administrador."
                  : "Atraso, entrada ainda não iniciada, prioridade alta sem previsão e reclamação em aberto."}
              </p>
              <ListaOperacao linhas={acao} />
            </Panel>
          </section>

          <section id="atraso">
            <Panel title="Em atraso">
              <p className="dash-nota">Previsão de atendimento já passou e o chamado continua em aberto.</p>
              <ListaOperacao linhas={atrasados} />
            </Panel>
          </section>

          <section id="reclamacoes">
            <Panel title="Reclamações">
              <p className="dash-nota">Chamados que o Cessionário abriu como reclamação. Os ainda em aberto vêm primeiro.</p>
              {reclamacoes.length === 0 ? (
                <p>Nenhuma reclamação nesta visão.</p>
              ) : (
                <ul className="lista-reclama">
                  {reclamacoes.map((item) => (
                    <li key={item.id}>
                      <Link to={`/demandas/${item.id}`}>
                        <strong>{item.protocolo}</strong>
                        <span>{item.cessionario} · {item.servico}</span>
                      </Link>
                      <Badge valor={item.situacao} />
                      {emAtraso(item) && <Badge valor="Em atraso" />}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </section>

          <section id="atencao">
            <Panel title="Pontos de atenção">
              <p className="dash-nota">Inclui complemento sem resposta, prioridade alta e chamado sem previsão há mais de um dia.</p>
              <ListaOperacao linhas={atencao} />
            </Panel>
          </section>

          <section id="nps">
            <Panel title="Nota dos serviços executados">
              <NotaServicos nps={nps} />
            </Panel>
          </section>
        </>
      )}
    </>
  );
}
