import { Link, useNavigate } from "react-router-dom";
import { useFila, useNotificacoes, useObras } from "../../application/hooks";
import { useSessao } from "../../application/session";
import { distribuirManutencao, distribuirObras, oQueMaisVolta, porCessionario } from "../../domain/atuacao";
import { COLUNAS_CADEIA } from "../../domain/cadeia";
import { emAtraso, motivosAcao, ordenarPorMotivo } from "../../domain/operacao";
import { destinoRecorte, encerrada, itensDoRecorte } from "../../domain/recorte";
import { tempoRelativo, type FilaItem, type Notificacao, type Obra, type Perfil } from "../../domain/types";
import { api } from "../../infrastructure/api/client";
import { Badge } from "../components/Badge";
import { Icone, type NomeIcone } from "../components/Icons";
import { BarraObra, BarraServico, CartaoIndicador, EtapaBotao, MedidorFila } from "../components/PainelInterativo";
import { ListaOperacao } from "../components/ListaOperacao";
import { PageHeader } from "../components/PageHeader";
import { Panel } from "../components/Panel";
import { ResumoCessionario } from "./ResumoCessionario";

const ETAPAS = COLUNAS_CADEIA.map((coluna) => ({
  nome: coluna.nome,
  detalhe: coluna.detalhe,
  situacoes: coluna.situacoes,
  recorte: coluna.codigo,
}));

function dataHoje() {
  return new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}

function diasAte(iso: string) {
  const alvo = new Date(`${iso}T00:00:00`);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
}

function maisAntigos(fila: FilaItem[]) {
  return fila
    .filter((item) => !encerrada(item.situacao))
    .sort((a, b) => new Date(a.abertoEm).getTime() - new Date(b.abertoEm).getTime());
}

export function InicioPage() {
  const { sessao } = useSessao();
  const { dados, erro, carregando, recarregar } = useFila();
  const { dados: notas, recarregar: recarregarNotas } = useNotificacoes();
  const { dados: obras } = useObras();
  const navigate = useNavigate();
  const perfil = sessao?.usuario.perfil ?? "Cessionário";
  const fila = dados ?? [];
  const avisos = notas ?? [];
  const obra = obras?.[0];
  const total = fila.length;
  const abertos = itensDoRecorte(fila, "abertas", null);
  const emAtendimentoItens = itensDoRecorte(fila, "atendimento", null);
  const naDecisaoItens = itensDoRecorte(fila, "decisao", null);
  const concluidasItens = itensDoRecorte(fila, "concluidas", null);
  const entradaItens = itensDoRecorte(fila, "entrada", null);
  const altas = itensDoRecorte(fila, "alta", null);
  const avisoIds = new Set(avisos.filter((nota) => !nota.lida).map((nota) => nota.demandaId));
  const avisosItens = itensDoRecorte(fila, "avisos", null, avisoIds);
  const progresso = total === 0 ? 0 : Math.round((concluidasItens.length / total) * 100);
  const atencao = maisAntigos(fila).slice(0, 6);
  const manutencao = distribuirManutencao(fila);
  const etapasObra = distribuirObras(obras ?? []);
  const cessionarios = porCessionario(fila);
  const recorrencias = oQueMaisVolta(fila);
  const acao = ordenarPorMotivo(fila, perfil, motivosAcao);
  const atrasados = fila.filter((item) => emAtraso(item));
  const titulo = perfil === "Cessionário" ? "Meu dia" : perfil === "GL / Administrador" ? "Operação" : "Minha área";
  const terceiro =
    perfil === "Responsável da Área"
      ? { itens: entradaItens, rotulo: "Para iniciar", tom: "tone-wait", sigla: "D", recorte: "entrada" }
      : perfil === "Cessionário"
        ? { itens: avisosItens, rotulo: "Avisos", tom: "tone-wait", sigla: "D", recorte: "avisos" }
        : { itens: naDecisaoItens, rotulo: "Na aprovação", tom: "tone-wait", sigla: "D", recorte: "aprovacao" };
  const paraTerceiro = terceiro.recorte === "avisos" && terceiro.itens.length === 0
    ? "/mensageria"
    : destinoRecorte(perfil, terceiro.itens, terceiro.recorte);
  const avisoUnico = terceiro.recorte === "avisos" && avisosItens.length === 1
    ? avisos.find((nota) => nota.demandaId === avisosItens[0]?.id && !nota.lida)
    : undefined;
  const etapasPainel = (
    <Panel title="Etapas" className="livre">
      <ol className="etapas">
        {ETAPAS.map((etapa, index) => {
          const itens = fila.filter((item) => etapa.situacoes.includes(item.situacao));
          const recorte = etapa.recorte;
          return (
            <EtapaBotao
              key={etapa.nome}
              nome={etapa.nome}
              detalhe={etapa.detalhe}
              estado={estadoEtapa(itens.length, index)}
              itens={itens}
              para={destinoRecorte(perfil, itens, recorte)}
            />
          );
        })}
      </ol>
    </Panel>
  );

  async function abrirAviso(nota: Notificacao) {
    if (!nota.lida) {
      try {
        await api.marcarLida(nota.id);
      } catch {
        /* o detalhe continua acessível */
      }
    }
    navigate(`/demandas/${nota.demandaId}`);
  }

  if (perfil === "Cessionário") {
    return (
      <ResumoCessionario
        fila={fila}
        avisos={avisos}
        carregando={carregando}
        erro={erro}
        aoMudar={async () => {
          await recarregar();
          await recarregarNotas();
        }}
      />
    );
  }

  return (
    <>
      <PageHeader title={titulo} trail={["Início", titulo]} extra={<span className="note dash-data">{dataHoje()}</span>} />
      {erro && <p className="erro">{erro}</p>}
      {carregando && <p>Carregando o painel...</p>}
      {!carregando && (
        <div className="dash">
          <div className="dash-main">
            <section className="kpis" aria-label="Indicadores">
              <CartaoIndicador tom="tone-info" sigla="A" valor={abertos.length} rotulo="Em aberto" itens={abertos} para={destinoRecorte(perfil, abertos, "abertas")} />
              <CartaoIndicador tom="tone-amber" sigla="E" valor={emAtendimentoItens.length} rotulo="Em atendimento" itens={emAtendimentoItens} para={destinoRecorte(perfil, emAtendimentoItens, "atendimento")} />
              <CartaoIndicador
                tom={terceiro.tom}
                sigla={terceiro.sigla}
                valor={terceiro.itens.length}
                rotulo={terceiro.rotulo}
                itens={terceiro.itens}
                para={paraTerceiro}
                aoAbrir={avisoUnico ? () => void abrirAviso(avisoUnico) : undefined}
              />
              <CartaoIndicador tom="tone-ok" sigla="C" valor={concluidasItens.length} rotulo="Concluídas" itens={concluidasItens} para={destinoRecorte(perfil, concluidasItens, "concluidas")} />
            </section>

            <Panel title="O que fazer agora">
              <p className="dash-nota">
                {atrasados.length === 0 ? "Nenhum chamado com a previsão vencida. " : `${atrasados.length} com a previsão vencida. `}
                {perfil === "GL / Administrador"
                  ? "A lista reúne atraso, entrada ainda não iniciada, reclamação em aberto e decisão do GL / Administrador. "
                  : "A lista reúne atraso, entrada ainda não iniciada e reclamação em aberto. "}
                <Link to="/central?visao=operacao">Operação completa</Link>
                {" · "}
                <Link to="/central?visao=quadro">Quadro</Link>
              </p>
              <ListaOperacao linhas={acao} />
            </Panel>

            <div className={perfil === "GL / Administrador" ? "dash-areas" : "dash-hero"}>
              <Panel title="Manutenção" className="livre">
                <ul className="barras">
                  {manutencao.map((item) => (
                    <BarraServico
                      key={item.nome}
                      nome={item.nome}
                      quantidade={item.quantidade}
                      largura={item.largura}
                      itens={item.itens}
                      para={destinoRecorte(perfil, item.itens, "", undefined, item.nome)}
                    />
                  ))}
                </ul>
                <p className="dash-nota">Passe o cursor na barra para ver os protocolos.</p>
              </Panel>
              {perfil === "GL / Administrador" ? (
                <Panel title="Obras" className="livre">
                  <ul className="barras">
                    {etapasObra.map((item) => (
                      <BarraObra key={item.nome} nome={item.nome} quantidade={item.quantidade} largura={item.largura} obras={item.obras} />
                    ))}
                  </ul>
                  <p className="dash-nota">Cada obra entra na etapa em que está.</p>
                </Panel>
              ) : etapasPainel}
            </div>
            {perfil === "GL / Administrador" && etapasPainel}

            <div className="dash-medidores">
              <Panel title="Conclusão" className="livre">
                <MedidorFila
                  valor={progresso}
                  legenda={`${concluidasItens.length} de ${total || 0}`}
                  destaque={concluidasItens}
                  complemento={abertos}
                  paraDestaque={destinoRecorte(perfil, concluidasItens, "concluidas")}
                  paraComplemento={destinoRecorte(perfil, abertos, "abertas")}
                  rotuloDestaque="Concluídas"
                  rotuloComplemento="Ainda em aberto"
                />
              </Panel>
              <Panel title="Prioridade alta em aberto" className="livre">
                <MedidorFila
                  valor={abertos.length === 0 ? 0 : Math.round((altas.length / abertos.length) * 100)}
                  legenda={`${altas.length} de ${abertos.length} em aberto`}
                  destaque={altas}
                  complemento={abertos.filter((item) => item.prioridade !== "Alta")}
                  paraDestaque={destinoRecorte(perfil, altas, "alta")}
                  paraComplemento={destinoRecorte(perfil, abertos.filter((item) => item.prioridade !== "Alta"), "sem-alta")}
                  rotuloDestaque="Prioridade alta"
                  rotuloComplemento="Demais em aberto"
                />
              </Panel>
            </div>

            <div className="dash-medidores">
                <Panel title="Cessionários com maior demanda" className="livre">
                  {cessionarios.length === 0 ? (
                    <p>Nenhum chamado nesta visão.</p>
                  ) : (
                    <ul className="barras">
                      {cessionarios.map((item) => (
                        <BarraServico
                          key={item.nome}
                          nome={item.nome}
                          quantidade={item.quantidade}
                          largura={item.largura}
                          itens={item.itens}
                          para={destinoRecorte(perfil, item.itens, "", undefined, undefined, item.nome)}
                        />
                      ))}
                    </ul>
                  )}
                  <p className="dash-nota">Volume de chamados na fila visível, do maior para o menor.</p>
                </Panel>
              <Panel title="O que mais volta" className="livre">
                {recorrencias.length === 0 ? (
                  <p>Nada em aberto nesta visão.</p>
                ) : (
                  <ul className="barras">
                    {recorrencias.map((item) => (
                      <BarraServico
                        key={item.nome}
                        nome={item.nome}
                        quantidade={item.quantidade}
                        largura={item.largura}
                        itens={item.itens}
                        para={destinoRecorte(perfil, item.itens, "", item.atuacao ? undefined : item.nome, item.atuacao ? item.nome : undefined)}
                      />
                    ))}
                  </ul>
                )}
                <p className="dash-nota">Chamados ainda em aberto. A barra maior é onde o problema aparece mais vezes.</p>
              </Panel>
            </div>

            <Panel title="Pedem atenção">
              <p className="dash-nota">Do mais antigo ao mais recente. Passar de um dia em aberto só destaca o item; o prazo oficial entra na parametrização.</p>
              {atencao.length === 0 ? (
                <p>Nada em aberto nesta visão.</p>
              ) : (
                <>
                  <table>
                    <thead>
                      <tr>
                        <th>Em aberto</th>
                        <th>Protocolo</th>
                        <th>Cessionário</th>
                        <th>Serviço</th>
                        <th>Situação</th>
                        <th>Responsável</th>
                      </tr>
                    </thead>
                    <tbody>
                      {atencao.map((item) => {
                        const antigo = Date.now() - new Date(item.abertoEm).getTime() > 86400000;
                        return (
                          <tr key={item.id} className="clickable" onClick={() => navigate(`/demandas/${item.id}`)}>
                            <td>{tempoRelativo(item.abertoEm)}{antigo ? " · atenção" : ""}</td>
                            <td>{item.protocolo}</td>
                            <td>{item.cessionario}</td>
                            <td>{item.servico}</td>
                            <td><Badge valor={item.situacao} /></td>
                            <td>{item.responsavel}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="cards">
                    {atencao.map((item) => (
                      <Link key={item.id} className="demand-card" to={`/demandas/${item.id}`}>
                        <strong>{item.protocolo}</strong>
                        <span>{item.servico}</span>
                        <Badge valor={item.situacao} />
                        <span className="note">{tempoRelativo(item.abertoEm)}</span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </Panel>

          </div>

          <aside className="dash-rail">
            <Panel title="Atalhos">
              <div className="atalhos">
                {atalhosDe(perfil, fila).map((atalho) => (
                  <Link key={atalho.para} to={atalho.para}>
                    <Icone name={atalho.icone} />
                    {atalho.rotulo}
                  </Link>
                ))}
              </div>
            </Panel>

            <Panel title="Atualizações">
              {avisos.length === 0 ? (
                <ul className="movimento">
                  {[...fila].sort((a, b) => new Date(b.abertoEm).getTime() - new Date(a.abertoEm).getTime()).slice(0, 4).map((item) => (
                    <li key={item.id}>
                      <Link to={`/demandas/${item.id}`}>
                        <strong>{item.protocolo}</strong>
                        <span>{item.servico}</span>
                      </Link>
                      <time>{tempoRelativo(item.abertoEm)}</time>
                    </li>
                  ))}
                  {fila.length === 0 && <li><span>Sem movimento nesta visão.</span></li>}
                </ul>
              ) : (
                <ul className="movimento">
                  {avisos.slice(0, 4).map((nota) => (
                    <li key={nota.id}>
                      <button type="button" onClick={() => void abrirAviso(nota)}>
                        <strong>{nota.protocolo || "Aviso"}</strong>
                        <span>{nota.texto}</span>
                      </button>
                      {!nota.lida && <i className="dot" />}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            {perfil === "GL / Administrador" && obra && <CartaoObra obra={obra} />}
            {perfil === "Responsável da Área" && (
              <Panel title="Como seguir">
                <p>Abra o chamado e registre o andamento. A situação disponível nesta demonstração segue o ciclo já implantado: recebido, em andamento e concluído.</p>
              </Panel>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

function CartaoObra({ obra }: { obra: Obra }) {
  const recebidos = obra.documentos.filter((documento) => documento.situacao !== "Pendente").length;
  const inicio = diasAte(obra.inicioPrevisto);
  return (
    <Panel title="Obra em análise">
      <Link className="obra-mini" to="/obras">
        <strong>{obra.nome}</strong>
        <span>{obra.local}</span>
        <div className="medidor-trilho" role="img" aria-label={`${recebidos} de ${obra.documentos.length} documentos recebidos`}>
          <i style={{ width: `${obra.documentos.length === 0 ? 0 : (recebidos / obra.documentos.length) * 100}%` }} />
        </div>
        <em>{recebidos} de {obra.documentos.length} documentos · etapa {obra.etapaAtual}</em>
        <em>{inicio >= 0 ? `Início previsto em ${inicio} dias` : "Início previsto já passou"}</em>
      </Link>
    </Panel>
  );
}

function estadoEtapa(quantidade: number, indice: number) {
  if (quantidade > 0 && indice < ETAPAS.length - 1) return "Em curso";
  if (quantidade > 0) return "Registrado";
  return "Aguardando";
}

function atalhosDe(perfil: Perfil, fila: FilaItem[]): { rotulo: string; para: string; icone: NomeIcone }[] {
  const antigo = maisAntigos(fila)[0];
  if (perfil === "Cessionário") {
    return [
      { rotulo: "Abrir chamado", para: "/abrir", icone: "mais" },
      { rotulo: "Mensageria", para: "/mensageria", icone: "mensagem" },
      { rotulo: "Meu espaço", para: "/meu-espaco", icone: "lista" },
      { rotulo: "Solicitações", para: "/minhas", icone: "caixa" },
    ];
  }
  if (perfil === "GL / Administrador") {
    return [
      { rotulo: "Quadro", para: "/central?visao=quadro", icone: "quadro" },
      { rotulo: "Operação", para: "/central?visao=operacao", icone: "alerta" },
      { rotulo: "Central", para: "/central?visao=central", icone: "grade" },
      { rotulo: "Obras", para: "/obras", icone: "obra" },
    ];
  }
  return [
    { rotulo: "Quadro", para: "/central?visao=quadro", icone: "quadro" },
    { rotulo: "Operação", para: "/central?visao=operacao", icone: "alerta" },
    { rotulo: "Minha área", para: "/central?visao=central", icone: "caixa" },
    antigo
      ? { rotulo: "Mais antigo", para: `/demandas/${antigo.id}`, icone: "grade" }
      : { rotulo: "Fila", para: "/central?visao=central", icone: "grade" },
  ];
}
