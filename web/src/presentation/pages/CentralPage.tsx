import { useSearchParams } from "react-router-dom";
import { useFila } from "../../application/hooks";
import { useSessao } from "../../application/session";
import { destinoRecorte, itensDoRecorte, rotuloRecorte } from "../../domain/recorte";
import { FilaExploravel } from "../components/FilaExploravel";
import { CartaoIndicador, RecorteAtivo } from "../components/PainelInterativo";
import { PageHeader } from "../components/PageHeader";
import { BotaoExportarFila } from "../components/ExportarArquivo";
import { OperacaoPage } from "./OperacaoPage";
import { QuadroPage } from "./QuadroPage";

type VisaoOperacional = "quadro" | "operacao" | "central";

export function CentralPage() {
  const { sessao } = useSessao();
  const [params, setParams] = useSearchParams();
  const perfil = sessao?.usuario.perfil ?? "GL / Administrador";
  const visaoParam = params.get("visao");
  const visao: VisaoOperacional = perfil === "Cessionário"
    ? "central"
    : visaoParam === "quadro" || visaoParam === "operacao" ? visaoParam : "central";

  function selecionarVisao(novaVisao: VisaoOperacional) {
    setParams((atuais) => {
      atuais.set("visao", novaVisao);
      return atuais;
    });
  }

  return (
    <>
      <PageHeader
        title="Central operacional"
        trail={["Início", "Central operacional"]}
        extra={<BotaoExportarFila />}
      />
      {perfil !== "Cessionário" && (
        <div className="visoes-centrais" role="group" aria-label="Visão operacional">
          {(["quadro", "operacao", "central"] as const).map((opcao) => {
            const rotulos: Record<VisaoOperacional, string> = {
              quadro: "Quadro",
              operacao: "Operação",
              central: "Central operacional",
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
      {visao === "quadro" ? <QuadroPage /> : visao === "operacao" ? <OperacaoPage /> : <FilaCentral />}
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
      <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>A fila é o centro da operação. A prioridade ilustra uma regra configurável. Grade, cartões ou pulso: a escolha fica salva para o seu usuário.</p>
      {erro && <p className="erro">{erro}</p>}
      {carregando && <p>Carregando a fila...</p>}
      <section className="kpis">
        <CartaoIndicador tom="tone-info" sigla="N" valor={entrada.length} rotulo="Novas" itens={entrada} para={destinoRecorte(perfil, entrada, "entrada")} />
        <CartaoIndicador tom="tone-amber" sigla="A" valor={atendimento.length} rotulo="Em andamento" itens={atendimento} para={destinoRecorte(perfil, atendimento, "atendimento")} />
        <CartaoIndicador tom="tone-wait" sigla="G" valor={decisao.length} rotulo="Aguardando ação" itens={decisao} para={destinoRecorte(perfil, decisao, "decisao")} />
        <CartaoIndicador tom="tone-ok" sigla="C" valor={concluidas.length} rotulo="Concluídas" itens={concluidas} para={destinoRecorte(perfil, concluidas, "concluidas")} />
      </section>
      <RecorteAtivo rotulo={rotuloRecorte(recorte, servico, atuacao, cessionario)} limpar="/central" />
      {!carregando && visiveis.length === 0 && <p className="dash-nota">Nenhum chamado neste recorte.</p>}
      {!carregando && visiveis.length > 0 && (
        <FilaExploravel titulo="Fila de demandas" itens={visiveis} usuarioId={sessao?.usuario.id} />
      )}
    </>
  );
}
