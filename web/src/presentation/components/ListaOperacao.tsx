import { Link } from "react-router-dom";
import { emAtraso } from "../../domain/operacao";
import { tempoRelativo, type FilaItem } from "../../domain/types";
import { Badge } from "./Badge";

export function ListaOperacao({ linhas }: { linhas: { item: FilaItem; motivos: string[] }[] }) {
  if (linhas.length === 0) return <p>Nada neste recorte.</p>;
  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Por quê</th>
            <th>Protocolo</th>
            <th>Cessionário</th>
            <th>Serviço</th>
            <th>Situação</th>
            <th>Quando</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map(({ item, motivos }) => (
            <tr key={item.id}>
              <td>{motivos.map((motivo) => <Badge key={motivo} valor={motivo} />)}</td>
              <td><Link to={`/demandas/${item.id}`}>{item.protocolo}</Link></td>
              <td>{item.cessionario}</td>
              <td>{item.servico}</td>
              <td><Badge valor={item.situacao} /></td>
              <td>{emAtraso(item) && item.previsaoAtendimento ? `atrasado ${tempoRelativo(item.previsaoAtendimento)}` : item.previsaoAtendimento ? "no prazo" : "sem previsão"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="cards">
        {linhas.map(({ item, motivos }) => (
          <Link key={item.id} className={emAtraso(item) ? "demand-card atraso" : "demand-card"} to={`/demandas/${item.id}`}>
            <strong>{item.protocolo}</strong>
            <span>{item.cessionario} · {item.servico}</span>
            <span className="motivos">{motivos.map((motivo) => <Badge key={motivo} valor={motivo} />)}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
