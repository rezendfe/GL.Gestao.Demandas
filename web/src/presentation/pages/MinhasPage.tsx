import { Link, useSearchParams } from "react-router-dom";
import { useFila, useNotificacoes } from "../../application/hooks";
import { useSessao } from "../../application/session";
import { itensDoRecorte, rotuloRecorte } from "../../domain/recorte";
import { FilaExploravel } from "../components/FilaExploravel";
import { RecorteAtivo } from "../components/PainelInterativo";
import { PageHeader } from "../components/PageHeader";
import { Panel } from "../components/Panel";
import { BotaoExportarFila } from "../components/ExportarArquivo";

export function MinhasPage() {
  const { sessao } = useSessao();
  const { dados, erro, carregando, recarregar } = useFila();
  const { dados: notas } = useNotificacoes();
  const [params] = useSearchParams();
  const naoLidas = new Set((notas ?? []).filter((nota) => !nota.lida).map((nota) => nota.demandaId));
  const recorte = params.get("recorte");
  const servico = params.get("servico");
  const atuacao = params.get("atuacao");
  const cessionario = params.get("cessionario");
  const visiveis = itensDoRecorte(dados ?? [], recorte, servico, naoLidas, atuacao, cessionario);

  return (
    <>
      <PageHeader
        title="Minhas solicitações"
        trail={["Início", "Minhas solicitações"]}
        extra={<span className="acoes-topo"><BotaoExportarFila /><Link className="btn" to="/abrir">Abrir chamado</Link></span>}
      />
      <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>Aqui ficam somente os chamados abertos por você.</p>
      {erro && <p className="erro">{erro} <button className="btn secondary" type="button" onClick={() => void recarregar()}>Tentar de novo</button></p>}
      {carregando && <p>Carregando... <Link className="btn secondary" to="/inicio">Voltar ao início</Link></p>}
      <RecorteAtivo rotulo={rotuloRecorte(recorte, servico, atuacao, cessionario)} limpar="/minhas" />
      {!carregando && !erro && visiveis.length === 0 && (
        <p className="fila-vazio">
          {recorte || servico || atuacao || cessionario ? "Nenhum chamado neste recorte." : "Você ainda não abriu solicitações."}
          {recorte || servico || atuacao || cessionario
            ? <Link className="btn secondary" to="/minhas">Limpar filtro</Link>
            : <Link className="btn" to="/abrir">Abrir chamado</Link>}
        </p>
      )}
      {!carregando && visiveis.length > 0 && (
        <FilaExploravel titulo="Solicitações" itens={visiveis} usuarioId={sessao?.usuario.id} destacar={naoLidas} />
      )}
      {(notas ?? []).some((nota) => !nota.lida) && (
        <Panel title="Notificações">
          {notas?.filter((nota) => !nota.lida).map((nota) => (
            <p key={nota.id}><Link to={`/demandas/${nota.demandaId}`}><span className="dot" /> {nota.texto}</Link></p>
          ))}
        </Panel>
      )}
    </>
  );
}
