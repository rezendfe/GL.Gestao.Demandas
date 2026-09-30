import { Link, useSearchParams } from "react-router-dom";
import { useFila, useNotificacoes } from "../../application/hooks";
import { useSessao } from "../../application/session";
import { itensDoRecorte, rotuloRecorte } from "../../domain/recorte";
import { FilaExploravel } from "../components/FilaExploravel";
import { RecorteAtivo } from "../components/PainelInterativo";
import { PageHeader } from "../components/PageHeader";
import { Panel } from "../components/Panel";

export function MinhasPage() {
  const { sessao } = useSessao();
  const { dados, erro, carregando } = useFila();
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
        extra={<Link className="btn" to="/abrir">Abrir chamado</Link>}
      />
      <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>Aqui ficam somente os chamados abertos por você.</p>
      {erro && <p className="erro">{erro}</p>}
      {carregando && <p>Carregando...</p>}
      <RecorteAtivo rotulo={rotuloRecorte(recorte, servico, atuacao, cessionario)} limpar="/minhas" />
      {!carregando && visiveis.length === 0 && (
        <p>{recorte || servico || atuacao || cessionario ? "Nenhum chamado neste recorte." : "Você ainda não abriu solicitações."}</p>
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
