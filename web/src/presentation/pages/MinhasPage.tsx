import { useSearchParams } from "react-router-dom";
import { useFila, useNotificacoes } from "../../application/hooks";
import { useSessao } from "../../application/session";
import { destinoDaNotificacao } from "../../domain/types";
import { itensDoRecorte, rotuloRecorte } from "../../domain/recorte";
import { api } from "../../infrastructure/api/client";
import { useAcoesDaPagina } from "../components/AcoesRapidas";
import { FilaExploravel } from "../components/FilaExploravel";
import { RecorteAtivo } from "../components/PainelInterativo";
import { faixaAviso, LinhaAviso } from "../components/LinhaAviso";
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
  useAcoesDaPagina([
    {
      id: "exportar-planilha",
      rotulo: "Exportar planilha",
      rotuloOcupado: "Gerando planilha...",
      icone: "planilha",
      executar: () => api.exportarFila(),
    },
  ]);

  return (
    <>
      <PageHeader title="Minhas solicitações" trail={["Início", "Minhas solicitações"]} />
      {erro && <p className="erro">{erro}</p>}
      {carregando && <p>Carregando...</p>}
      <RecorteAtivo rotulo={rotuloRecorte(recorte, servico, atuacao, cessionario)} limpar="/minhas" />
      {!carregando && !erro && visiveis.length === 0 && (
        <Panel title="Solicitações">
          <p className="note">Aqui ficam somente os chamados abertos por você.</p>
          <p>{recorte || servico || atuacao || cessionario ? "Nenhum chamado neste recorte." : "Você ainda não abriu solicitações."}</p>
        </Panel>
      )}
      {!carregando && visiveis.length > 0 && (
        <FilaExploravel titulo="Solicitações" itens={visiveis} usuarioId={sessao?.usuario.id} destacar={naoLidas} nota="Aqui ficam somente os chamados abertos por você." />
      )}
      {(notas ?? []).some((nota) => !nota.lida) && (
        <Panel title="Notificações">
          <ul className="aviso-lista">
            {notas?.filter((nota) => !nota.lida).map((nota, indice) => (
              <li key={nota.id}>
                <LinhaAviso
                  iso={nota.criadaEm}
                  texto={nota.texto}
                  complemento={nota.protocolo || "Chamado"}
                  cor={faixaAviso(indice)}
                  destaque
                  para={destinoDaNotificacao(nota)}
                />
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
