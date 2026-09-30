import { useState } from "react";
import { Link } from "react-router-dom";
import type { FilaItem, Obra } from "../../domain/types";

export function Balao({ titulo, itens, para, vazio, aberta = false }: { titulo: string; itens: FilaItem[]; para: string; vazio: string; aberta?: boolean }) {
  return (
    <div className={aberta ? "dica-balao aberta" : "dica-balao"} role="tooltip">
      <strong>{titulo}</strong>
      {itens.length === 0 ? (
        <p>{vazio}</p>
      ) : (
        itens.slice(0, 5).map((item) => (
          <Link key={item.id} to={`/demandas/${item.id}`}>
            <b>{item.protocolo}</b>
            <span>{item.situacao} · {item.servico}</span>
          </Link>
        ))
      )}
      {itens.length > 1 && <Link className="dica-todos" to={para}>Abrir os {itens.length}</Link>}
      {itens.length > 5 && <em>e mais {itens.length - 5}</em>}
    </div>
  );
}

export function CartaoIndicador({
  tom,
  sigla,
  valor,
  rotulo,
  para,
  itens,
  aoAbrir,
}: {
  tom: string;
  sigla: string;
  valor: number;
  rotulo: string;
  para: string;
  itens: FilaItem[];
  aoAbrir?: () => void;
}) {
  return (
    <div className="dica">
      <Link
        className={`widget ${tom}`}
        to={para}
        aria-label={`${rotulo}: ${valor}. Abrir.`}
        onClick={(event) => {
          if (!aoAbrir) return;
          event.preventDefault();
          aoAbrir();
        }}
      >
        <div className="widget-icon">{sigla}</div>
        <div className="widget-data">
          <div className="widget-int">{valor}</div>
          <div className="widget-title">{rotulo}</div>
        </div>
      </Link>
      <Balao titulo={rotulo} itens={itens} para={para} vazio="Nenhum chamado neste recorte." />
    </div>
  );
}

export function MedidorFila({
  valor,
  legenda,
  destaque,
  complemento,
  paraDestaque,
  paraComplemento,
  rotuloDestaque,
  rotuloComplemento,
}: {
  valor: number;
  legenda: string;
  destaque: FilaItem[];
  complemento: FilaItem[];
  paraDestaque: string;
  paraComplemento: string;
  rotuloDestaque: string;
  rotuloComplemento: string;
}) {
  const [sobre, setSobre] = useState<"destaque" | "complemento" | null>(null);
  const largura = Math.max(0, Math.min(100, valor));
  const ativo = sobre === "destaque"
    ? { titulo: rotuloDestaque, itens: destaque, para: paraDestaque }
    : sobre === "complemento"
      ? { titulo: rotuloComplemento, itens: complemento, para: paraComplemento }
      : null;

  return (
    <div className="medidor dica" onMouseLeave={() => setSobre(null)}>
      <strong>{valor}%</strong>
      <div className="medidor-trilho" role="img" aria-label={legenda}>
        <Link
          className="cheio"
          style={{ width: `${largura}%` }}
          to={paraDestaque}
          aria-label={rotuloDestaque}
          onMouseEnter={() => setSobre("destaque")}
          onFocus={() => setSobre("destaque")}
        />
        <Link
          className="vazio"
          to={paraComplemento}
          aria-label={rotuloComplemento}
          onMouseEnter={() => setSobre("complemento")}
          onFocus={() => setSobre("complemento")}
        />
      </div>
      <div className="medidor-marcas"><span>25%</span><span>50%</span><span>75%</span></div>
      <p>{legenda}</p>
      {ativo && <Balao titulo={ativo.titulo} itens={ativo.itens} para={ativo.para} vazio="Nenhum chamado neste recorte." aberta />}
    </div>
  );
}

export function EtapaBotao({
  nome,
  detalhe,
  estado,
  itens,
  para,
}: {
  nome: string;
  detalhe: string;
  estado: string;
  itens: FilaItem[];
  para: string;
}) {
  return (
    <li className="dica">
      <Link to={para} aria-label={`${nome}, ${itens.length}`}>
        <div>
          <strong>{nome}</strong>
          <span>{detalhe}</span>
        </div>
        <div className="etapa-lado">
          <b>{itens.length}</b>
          <em className={estado === "Em curso" ? "em-curso" : estado === "Aguardando" ? "aguardando" : "feita"}>{estado}</em>
        </div>
      </Link>
      <Balao titulo={nome} itens={itens} para={para} vazio="Nenhum chamado nesta etapa." />
    </li>
  );
}

export function BarraServico({ nome, quantidade, largura, itens, para }: { nome: string; quantidade: number; largura: number; itens: FilaItem[]; para: string }) {
  return (
    <li className="dica">
      <Link to={para} aria-label={`${nome}, ${quantidade}`}>
        <span>{nome}</span>
        <em className="barra-trilho"><i style={{ ["--w" as string]: `${largura}%` }} /></em>
        <b>{quantidade}</b>
      </Link>
      <Balao titulo={nome} itens={itens} para={para} vazio="Nenhum chamado neste recorte." />
    </li>
  );
}

export function BarraObra({ nome, quantidade, largura, obras }: { nome: string; quantidade: number; largura: number; obras: Obra[] }) {
  return (
    <li className="dica">
      <Link to="/obras" aria-label={`${nome}, ${quantidade}`}>
        <span>{nome}</span>
        <em className="barra-trilho"><i style={{ ["--w" as string]: `${largura}%` }} /></em>
        <b>{quantidade}</b>
      </Link>
      <div className="dica-balao" role="tooltip">
        <strong>{nome}</strong>
        {obras.length === 0 ? (
          <p>Nenhuma obra nesta etapa.</p>
        ) : (
          obras.map((obra) => (
            <Link key={obra.id} to="/obras">
              <b>{obra.nome}</b>
              <span>{obra.local}</span>
            </Link>
          ))
        )}
      </div>
    </li>
  );
}

export function RecorteAtivo({ rotulo, limpar }: { rotulo: string; limpar: string }) {
  if (!rotulo) return null;
  return (
    <p className="recorte-ativo">
      Mostrando {rotulo}
      <Link to={limpar}>Limpar</Link>
    </p>
  );
}
