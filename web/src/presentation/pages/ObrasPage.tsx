import { Link } from "react-router-dom";
import { useObras } from "../../application/hooks";
import { Badge } from "../components/Badge";
import { EstadoAcao } from "../components/EstadoAcao";
import { PageHeader } from "../components/PageHeader";
import { Panel } from "../components/Panel";

export function ObrasPage() {
  const { dados, erro, carregando, recarregar } = useObras();
  const obra = dados?.[0];
  const pendente = obra?.documentos.find((documento) => documento.situacao !== "Recebido" && documento.situacao !== "Aprovado");

  return (
    <>
      <PageHeader title="Obras" trail={["Início", "Obras"]} />
      <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>Fluxo próprio, separado do atendimento pontual. O projeto inicia a análise; os demais documentos entram por etapa.</p>
      {erro && <p className="erro">{erro} <button className="btn secondary" type="button" onClick={() => void recarregar()}>Tentar de novo</button></p>}
      {carregando && <p>Carregando obra... <Link className="btn secondary" to="/inicio">Voltar ao início</Link></p>}
      {!carregando && !erro && !obra && (
        <p className="fila-vazio">Nenhuma obra cadastrada. <Link className="btn secondary" to="/inicio">Voltar ao início</Link></p>
      )}
      {obra && (
        <Panel title={obra.nome}>
          <EstadoAcao
            situacao={obra.etapaAtual}
            proximo={pendente ? `Enviar ${pendente.nome}` : "Acompanhar a etapa"}
            acao={<a className="btn" href="#documentacao-obra">Ver documentação</a>}
          />
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
            <div id="documentacao-obra">
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
