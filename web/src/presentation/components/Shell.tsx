import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSessao } from "../../application/session";
import { espacoPorEmail } from "../../domain/espacos";
import { Icone, type NomeIcone } from "./Icons";
import { SinoNotificacoes } from "./SinoNotificacoes";

function iniciais(nome: string) {
  return nome
    .split(/\s+/)
    .filter((parte) => parte.length > 1)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

export function Shell() {
  const { sessao, sair } = useSessao();
  const navigate = useNavigate();
  const [recolhido, setRecolhido] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [largo, setLargo] = useState(() => window.matchMedia("(min-width: 901px)").matches);
  const { pathname } = useLocation();
  const perfil = sessao?.usuario.perfil;
  const nome = sessao?.usuario.nome ?? "";
  const sigla = iniciais(nome) || "GL";
  const espaco = espacoPorEmail(sessao?.usuario.email ?? "");
  const foto = sessao?.usuario.foto || espaco?.foto;
  const logo = sessao?.usuario.logoEmpresa;
  const links =
    perfil === "Cessionário"
      ? [
          ["/inicio", "Início", "casa"],
          ["/meu-espaco", "Meu espaço", "lista"],
          ["/minhas", "Minhas solicitações", "lista"],
          ["/abrir", "Abrir chamado", "mais"],
          ["/mensageria", "Mensageria", "mensagem"],
        ]
      : perfil === "GL / Administrador"
        ? [
            ["/inicio", "Início", "casa"],
            ["/central", "Central operacional", "grade"],
            ["/cadeia", "Cadeia", "grade"],
            ["/cadastros", "Cadastros", "configuracao"],
            ["/espacos", "Espaços", "lista"],
            ["/empresas-cessionarias", "Empresas e acessos", "lista"],
            ["/obras", "Obras", "obra"],
          ]
        : [
            ["/inicio", "Início", "casa"],
            ["/central", "Central operacional", "grade"],
          ];
  const nomeSessao =
    links
      .filter(([to]) => pathname === to || pathname.startsWith(`${to}/`))
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1]
    ?? (pathname.startsWith("/demandas") ? "Chamado" : "Início");

  useEffect(() => {
    const consulta = window.matchMedia("(min-width: 901px)");
    const atualizar = () => {
      setLargo(consulta.matches);
      if (consulta.matches) setMenuAberto(false);
    };
    consulta.addEventListener("change", atualizar);
    return () => consulta.removeEventListener("change", atualizar);
  }, []);

  useEffect(() => {
    if (!menuAberto) return;
    const fechar = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuAberto(false);
    };
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [menuAberto]);

  function alternarMenu() {
    if (window.matchMedia("(max-width: 900px)").matches) {
      setMenuAberto((atual) => !atual);
      return;
    }
    setRecolhido((atual) => !atual);
  }

  return (
    <div className={`page-container${recolhido ? " is-mini" : ""}${menuAberto ? " is-nav-open" : ""}`}>
      <aside className="page-sidebar" inert={!largo && !menuAberto ? true : undefined}>
        <div className="xn-logo">
          <img src="/gl-events-logo.png" alt="GL Events" />
          <span className="xn-brand" aria-hidden="true">GL Events</span>
        </div>
        <Link className="xn-profile" to="/inicio" onClick={() => setMenuAberto(false)}>
          {foto ? <img className="avatar foto" src={foto} alt="" /> : <div className="avatar" aria-hidden="true">{sigla}</div>}
          <div className="xn-profile-data">
            <strong>{nome}</strong>
            <span>{perfil}</span>
          </div>
        </Link>
        <div className="xn-title">Navegação</div>
        <nav>
          {links.map(([to, label, icone]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={() => setMenuAberto(false)}
            >
              <Icone name={icone as NomeIcone} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      {menuAberto && <button className="nav-backdrop" type="button" aria-label="Fechar menu" onClick={() => setMenuAberto(false)} />}
      <div className="page-content">
        <header className="x-bar">
          <button className="x-toggle" type="button" aria-label="Alternar menu" onClick={alternarMenu}>
            <Icone name="menu" />
          </button>
          <span className="x-context">{nomeSessao}</span>
          <div className="x-user">
            <SinoNotificacoes />
            {espaco ? (
              <Link className="x-espaco" to="/meu-espaco" aria-label={`Meu espaço, ${espaco.sala}`}>
                {logo && <img className="logo-empresa sm" src={logo} alt="" />}
                <img className="avatar sm foto" src={foto} alt="" />
                <span className="x-espaco-pop">
                  <span className="x-espaco-card">
                    <span className="x-espaco-titulo">Meu espaço</span>
                    <span className="espaco-mini">
                      <img src={espaco.foto} alt="" />
                      <strong>{espaco.sala}</strong>
                      <span>{espaco.local.titulo}</span>
                      <em>Vistoria {espaco.vistoria.data}</em>
                    </span>
                  </span>
                </span>
              </Link>
            ) : (
              <div className="avatar sm" aria-hidden="true">{sigla}</div>
            )}
            <div className="x-user-data">
              <strong>{nome}</strong>
              <span>{perfil}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                sair();
                navigate("/login");
              }}
            >
              Sair
            </button>
          </div>
        </header>
        <div className="page-content-wrap">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

