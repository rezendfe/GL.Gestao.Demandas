import { useObras } from "../../application/hooks";
import { Badge } from "../components/Badge";
import { PageHeader } from "../components/PageHeader";
import { Panel } from "../components/Panel";

export function ObrasPage() {
  const { dados, erro, carregando } = useObras();
  const obra = dados?.[0];

  return (
    <>
      <PageHeader title="Obras" trail={["Início", "Obras"]} />
      <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>Fluxo próprio, separado do atendimento pontual. O projeto inicia a análise; os demais documentos entram por etapa.</p>
      {erro && <p className="erro">{erro}</p>}
      {carregando && <p>Carregando obra...</p>}
      {obra && (
        <Panel title={obra.nome}>
          <div className="protocol">OBRA</div>
          <p>{obra.descricao}</p>
          <div className="steps">
            {obra.etapas.map((etapa) => {
              const atual = obra.etapas.indexOf(obra.etapaAtual);
              const indice = obra.etapas.indexOf(etapa);
              const classe = indice < atual ? "step done" : indice === atual ? "step on" : "step";
              return <span key={etapa} className={classe}>{etapa}</span>;
            })}
          </div>
          <div className="grid-2">
            <div>
              <p><strong>Local</strong><br />{obra.local}</p>
              <p><strong>Período previsto</strong><br />{obra.inicioPrevisto} a {obra.terminoPrevisto}</p>
              <p><strong>Empresa executora</strong><br />{obra.empresaExecutora}</p>
              <p><strong>Responsável</strong><br />{obra.responsavel}<br /><span className="note">{obra.contato}</span></p>
            </div>
            <div>
              <h3>Documentação por etapas</h3>
              {obra.documentos.map((documento) => (
                <div key={documento.id} className="check">
                  <span>{documento.nome}</span>
                  <Badge valor={documento.situacao} />
                </div>
              ))}
              <p className="note">Projeto Executivo recebido. ART, seguro e cronograma seguem pendentes.</p>
            </div>
          </div>
        </Panel>
      )}
    </>
  );
}
