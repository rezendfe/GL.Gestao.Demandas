import { Link } from "react-router-dom";

export type EtapaModelo = {
  nome: string;
  detalhe: string;
  estado: "feita" | "curso" | "espera";
  percentual: number;
  para: string;
};

export type BarraModelo = {
  nome: string;
  quantidade: number;
  largura: number;
  para: string;
};

export type AtrasoModelo = {
  id: string;
  dias: number;
  chamado: string;
  prazo: string;
  para: string;
};

const CORES_BARRA = ["#3d7eff", "#f5a524", "#e25b7a", "#7047ee"];

export function PainelModelo({
  progresso,
  progressoPara,
  etapas,
  prazo,
  tituloServicos,
  servicos,
  tituloVolume,
  volumes,
  atrasos,
  atrasoVazio,
}: {
  progresso: number;
  progressoPara: string;
  etapas: EtapaModelo[];
  prazo: { data: string; dias: string; detalhe: string; para: string } | null;
  tituloServicos: string;
  servicos: BarraModelo[];
  tituloVolume: string;
  volumes: BarraModelo[];
  atrasos: AtrasoModelo[];
  atrasoVazio: string;
}) {
  const faixa = Math.max(0, Math.min(100, progresso));
  return (
    <div className="modelo">
      <section className="modelo-card">
        <h2>Andamento geral</h2>
        <Link className="gauge" to={progressoPara} aria-label={`Andamento geral, ${faixa} por cento`}>
          <svg viewBox="0 0 180 108" role="img">
            <path d="M18 92 A72 72 0 0 1 162 92" fill="none" stroke="#e6e8ee" strokeWidth="16" strokeLinecap="round" />
            <path
              d="M18 92 A72 72 0 0 1 162 92"
              fill="none"
              stroke="#f5a524"
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={`${(faixa / 100) * Math.PI * 72} ${Math.PI * 72}`}
            />
            <text x="90" y="88" textAnchor="middle">{faixa}%</text>
          </svg>
        </Link>
      </section>

      <section className="modelo-card">
        <div className="etapa-faixa" role="img" aria-label={`${faixa} por cento concluído`}>
          <i style={{ width: `${faixa}%` }} />
        </div>
        <ol className="etapas-modelo">
          {etapas.map((etapa, indice) => (
            <li key={etapa.nome}>
              <Link to={etapa.para}>
                <span className={`etapa-circulo ${etapa.estado}${indice % 2 === 1 ? " alternada" : ""}`} style={{ ["--p" as string]: etapa.percentual }}>
                  {etapa.estado === "curso" ? <em>{etapa.percentual}%</em> : etapa.estado === "espera" ? <Relogio /> : <Check />}
                </span>
                <strong>{etapa.nome}</strong>
                <span>{etapa.detalhe}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="modelo-card modelo-prazo">
        <h2>Próximo prazo</h2>
        {prazo ? (
          <Link to={prazo.para}>
            <Bandeira />
            <span>{prazo.data}</span>
            <strong>{prazo.dias}</strong>
            <em>{prazo.detalhe}</em>
          </Link>
        ) : (
          <p>Nenhum prazo previsto nesta visão.</p>
        )}
      </section>

      <section className="modelo-card">
        <h2>{tituloServicos}</h2>
        {servicos.length === 0 ? (
          <p>Nenhum chamado nesta visão.</p>
        ) : (
          <ul className="modelo-servicos">
            {servicos.map((item) => (
              <li key={item.nome}>
                <Link to={item.para}>
                  <span>{item.nome}</span>
                  <i style={{ width: `${item.largura}%` }} />
                  <b>{item.quantidade}</b>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="modelo-card">
        <h2>{tituloVolume}</h2>
        {volumes.length === 0 ? (
          <p>Nenhum volume nesta visão.</p>
        ) : (
          <ul className="modelo-colunas" aria-label={tituloVolume}>
            {volumes.map((item, indice) => (
              <li key={item.nome}>
                <Link to={item.para} aria-label={`${item.nome}, ${item.quantidade}`}>
                  <i style={{ ["--h" as string]: Math.max(8, item.largura), background: CORES_BARRA[indice % CORES_BARRA.length] }} />
                  <b>{item.quantidade}</b>
                  <span>{item.nome}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="modelo-card modelo-tabela">
        <h2>Em atraso</h2>
        {atrasos.length === 0 ? (
          <p>{atrasoVazio}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Atraso</th>
                <th>Chamado</th>
                <th>Prazo</th>
              </tr>
            </thead>
            <tbody>
              {atrasos.map((item) => (
                <tr key={item.id}>
                  <td className={item.dias >= 10 ? "atraso-alto" : item.dias >= 4 ? "atraso-medio" : "atraso-baixo"}>
                    {item.dias === 1 ? "1 dia" : `${item.dias} dias`}
                  </td>
                  <td><Link to={item.para}>{item.chamado}</Link></td>
                  <td>{item.prazo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Check() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="M5 12.5 10 17l9-10" />
    </svg>
  );
}

function Relogio() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" />
    </svg>
  );
}

function Bandeira() {
  return (
    <svg className="modelo-bandeira" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 21V4M6 4h11l-2 4 2 4H6" />
    </svg>
  );
}
