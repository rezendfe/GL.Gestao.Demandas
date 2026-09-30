import { Link } from "react-router-dom";
import type { ResumoNps } from "../../domain/operacao";

function tomIndice(indice: number | null) {
  if (indice === null || indice === 0) return "neutro";
  return indice > 0 ? "ok" : "erro";
}

function tomNota(nota: number | null) {
  if (nota === null) return "neutro";
  if (nota >= 9) return "ok";
  if (nota >= 7) return "neutro";
  return "erro";
}

export function textoIndice(indice: number | null) {
  if (indice === null) return "—";
  if (indice > 0) return `+${indice}`;
  return String(indice).replace("-", "−");
}

function textoMedia(media: number | null) {
  if (media === null) return "—";
  return media.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function leitura(indice: number | null) {
  if (indice === null) return "Ainda não há nota suficiente para comparar elogios e críticas.";
  if (indice >= 50) return "A maioria elogiou o serviço.";
  if (indice > 0) return "Há mais elogios do que críticas.";
  if (indice === 0) return "Elogios e críticas estão empatados.";
  if (indice <= -50) return "A maioria criticou o serviço.";
  return "Há mais críticas do que elogios.";
}

function quantidade(valor: number, um: string, varios: string) {
  return `${valor} ${valor === 1 ? um : varios}`;
}

export function NotaServicos({ nps }: { nps: ResumoNps }) {
  if (nps.respostas === 0 || nps.indice === null) {
    return <p>Nenhum serviço concluído foi avaliado nesta visão.</p>;
  }

  const tom = tomIndice(nps.indice);
  const fatias = [
    { chave: "ok", rotulo: "Elogios", detalhe: "nota 9 ou 10", valor: nps.promotores },
    { chave: "neutro", rotulo: "Regulares", detalhe: "nota 7 ou 8", valor: nps.neutros },
    { chave: "erro", rotulo: "Críticas", detalhe: "nota 0 a 6", valor: nps.detratores },
  ];
  const comentarios = [...nps.comentarios].sort((a, b) => a.nota - b.nota || a.protocolo.localeCompare(b.protocolo));

  return (
    <div className="nota-servicos">
      <p className="dash-nota">
        O Cessionário avalia cada serviço concluído de 0 a 10. O índice vai de −100 a +100: é a diferença entre a fatia de elogios e a de críticas.
      </p>

      <div className={`nota-indice ${tom}`}>
        <div>
          <strong>{textoIndice(nps.indice)}</strong>
          <span>índice</span>
        </div>
        <div>
          <p>{leitura(nps.indice)}</p>
          <small>Média {textoMedia(nps.media)} de 10 · {quantidade(nps.respostas, "resposta", "respostas")}</small>
          <div className="nota-escala" aria-hidden="true">
            <i style={{ left: `${(nps.indice + 100) / 2}%` }} />
          </div>
          <div className="nota-escala-marcas" aria-hidden="true">
            <span>−100</span>
            <span>0</span>
            <span>+100</span>
          </div>
        </div>
      </div>

      <ul className="nota-fatias">
        {fatias.map((faixa) => (
          <li key={faixa.chave} className={faixa.chave}>
            <strong>{faixa.valor}</strong>
            <span>{faixa.rotulo}</span>
            <small>{faixa.detalhe}</small>
          </li>
        ))}
      </ul>
      <div className="nota-barra" aria-hidden="true">
        {fatias.map((faixa) =>
          faixa.valor > 0 ? <span key={faixa.chave} className={faixa.chave} style={{ flex: faixa.valor }} /> : null,
        )}
      </div>

      <h3>Por serviço</h3>
      <ul className="nota-por-servico">
        {nps.porServico.map((faixa) => (
          <li key={faixa.nome}>
            <div>
              <strong>{faixa.nome}</strong>
              <span className={tomNota(faixa.media)}>{textoMedia(faixa.media)}<small>/10</small></span>
            </div>
            <div className="nota-trilho" aria-hidden="true">
              <span className={tomNota(faixa.media)} style={{ width: `${((faixa.media ?? 0) / 10) * 100}%` }} />
            </div>
            <p>
              {quantidade(faixa.respostas, "resposta", "respostas")} · índice {textoIndice(faixa.indice)} · {leitura(faixa.indice).replace(/\.$/, "").toLowerCase()}
            </p>
          </li>
        ))}
      </ul>

      {comentarios.length > 0 && (
        <>
          <h3>Comentários</h3>
          <ul className="nota-comentarios">
            {comentarios.map((item) => (
              <li key={item.id}>
                <Link to={`/demandas/${item.id}`}>
                  <b className={tomNota(item.nota)}>{item.nota}</b>
                  <span>
                    <strong>{item.protocolo}</strong>
                    <em>{item.servico}</em>
                    {item.comentario}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
