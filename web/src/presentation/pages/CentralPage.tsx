import { useSearchParams } from "react-router-dom";
import { useFila } from "../../application/hooks";
import { useSessao } from "../../application/session";
import { destinoRecorte, itensDoRecorte, rotuloRecorte } from "../../domain/recorte";
import { api } from "../../infrastructure/api/client";
import { useAcoesDaPagina } from "../components/AcoesRapidas";
import { FilaExploravel } from "../components/FilaExploravel";
import { CartaoIndicador, RecorteAtivo } from "../components/PainelInterativo";
import { PageHeader } from "../components/PageHeader";
import { Panel } from "../components/Panel";
import { AgendaPage } from "./AgendaPage";
import { OperacaoPage } from "./OperacaoPage";
import { QuadroPage } from "./QuadroPage";

type VisaoOperacional = "quadro" | "operacao" | "central" | "agenda";

export function CentralPage() {
  const { sessao } = useSessao();
  const [params, setParams] = useSearchParams();
  const perfil = sessao?.usuario.perfil ?? "GL / Administrador";
  const visaoParam = params.get("visao");
  const visao: VisaoOperacional = perfil === "Cessionário"
    ? "central"
    : visaoParam === "quadro" || visaoParam === "operacao" || visaoParam === "agenda" ? visaoParam : "central";

  useAcoesDaPagina([
    {
      id: "exportar-planilha",
      rotulo: "Exportar planilha",
      rotuloOcupado: "Gerando planilha...",
      icone: "planilha",
      executar: () => api.exportarFila(),
    },
  ]);

  function selecionarVisao(novaVisao: VisaoOperacional) {
    setParams((atuais) => {
      atuais.set("visao", novaVisao);
      return atuais;
    });
  }

  return (
    <>
      <PageHeader title="Central operacional" trail={["Início", "Central operacional"]} />
      {perfil !== "Cessionário" && (
        <div className="visoes-centrais" role="group" aria-label="Visão operacional">
          {(["quadro", "operacao", "central", "agenda"] as const).map((opcao) => {
            const rotulos: Record<VisaoOperacional, string> = {
              quadro: "Quadro",
              operacao: "Operação",
              central: "Central operacional",
              agenda: "Agenda",
            };
            return (
              <button
                key={opcao}
                type="button"
                className={visao === opcao ? "visao-central ativa" : "visao-central"}
                aria-pressed={visao === opcao}
                onClick={() => selecionarVisao(opcao)}
              >
                {rotulos[opcao]}
              </button>
            );
          })}
        </div>
      )}
      {visao === "quadro" ? <QuadroPage /> : visao === "operacao" ? <OperacaoPage /> : visao === "agenda" ? <AgendaPage /> : <FilaCentral />}
    </>
  );
}

function FilaCentral() {
  const { sessao } = useSessao();
  const { dados, erro, carregando } = useFila();
  const [params] = useSearchParams();
  const fila = dados ?? [];
  const recorte = params.get("recorte");
  const servico = params.get("servico");
  const atuacao = params.get("atuacao");
  const cessionario = params.get("cessionario");
  const visiveis = itensDoRecorte(fila, recorte, servico, undefined, atuacao, cessionario);
  const entrada = itensDoRecorte(fila, "entrada", null);
  const atendimento = itensDoRecorte(fila, "atendimento", null);
  const decisao = itensDoRecorte(fila, "decisao", null);
  const concluidas = itensDoRecorte(fila, "concluidas", null);
  const perfil = sessao?.usuario.perfil ?? "GL / Administrador";

  return (
    <>
      {erro && <p className="erro">{erro}</p>}
      {carregando && <p>Carregando a fila...</p>}
      <section className="kpis">
        <CartaoIndicador tom="tone-info" sigla="N" valor={entrada.length} rotulo="Novas" itens={entrada} para={destinoRecorte(perfil, entrada, "entrada")} />
        <CartaoIndicador tom="tone-amber" sigla="A" valor={atendimento.length} rotulo="Em andamento" itens={atendimento} para={destinoRecorte(perfil, atendimento, "atendimento")} />
        <CartaoIndicador tom="tone-wait" sigla="G" valor={decisao.length} rotulo="Aguardando ação" itens={decisao} para={destinoRecorte(perfil, decisao, "decisao")} />
        <CartaoIndicador tom="tone-ok" sigla="C" valor={concluidas.length} rotulo="Concluídas" itens={concluidas} para={destinoRecorte(perfil, concluidas, "concluidas")} />
      </section>
      <RecorteAtivo rotulo={rotuloRecorte(recorte, servico, atuacao, cessionario)} limpar="/central" />
      {!carregando && !erro && visiveis.length === 0 && (
        <Panel title="Fila de demandas">
          <p className="note">A fila é o centro da operação. A prioridade ilustra uma regra configurável. Grade, cartões ou pulso: a escolha fica salva para o seu usuário.</p>
          <p>Nenhum chamado neste recorte.</p>
        </Panel>
      )}
      {!carregando && visiveis.length > 0 && (
        <FilaExploravel
          titulo="Fila de demandas"
          itens={visiveis}
          usuarioId={sessao?.usuario.id}
          nota="A fila é o centro da operação. A prioridade ilustra uma regra configurável. Grade, cartões ou pulso: a escolha fica salva para o seu usuário."
        />
      )}
    </>
  );
}
