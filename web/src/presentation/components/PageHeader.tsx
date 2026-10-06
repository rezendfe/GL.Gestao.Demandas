import { Link } from "react-router-dom";

export type Trilha = string | { rotulo: string; para?: string };

const rotas: Record<string, string> = {
  "Início": "/inicio",
  "Comunicados": "/comunicados",
  "Minhas solicitações": "/minhas",
  "Cadastros": "/cadastros",
  "Espaços": "/espacos",
  "Obras": "/obras",
  "Abrir chamado": "/abrir",
  "Central operacional": "/central",
  "Quadro": "/quadro",
  "Cadeia": "/cadeia",
  "Empresas e acessos": "/empresas-cessionarias",
  "Auditoria": "/auditoria",
};

function passo(item: Trilha) {
  if (typeof item === "string") return { rotulo: item, para: rotas[item] };
  return item;
}

export function PageHeader({ title, trail }: { title: string; trail: Trilha[] }) {
  return (
    <header className="page-head">
      <h1>{title}</h1>
      <nav className="crumbs" aria-label="Trilha">
        <ol>
          {trail.map((item, index) => {
            const { rotulo, para } = passo(item);
            const atual = index === trail.length - 1;
            return (
              <li key={`${rotulo}-${index}`} aria-current={atual ? "page" : undefined}>
                {atual || !para ? <span className={atual ? "current" : undefined}>{rotulo}</span> : <Link to={para}>{rotulo}</Link>}
              </li>
            );
          })}
        </ol>
      </nav>
    </header>
  );
}
