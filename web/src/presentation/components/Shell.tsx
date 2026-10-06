import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSessao } from "../../application/session";
import { espacoPorEmail } from "../../domain/espacos";
import { fotoPorPessoa } from "../../domain/fotos";
import { GaleriaLightbox } from "./GaleriaLightbox";
import { AcoesRapidas, ProvedorAcoesRapidas } from "./AcoesRapidas";
import { Icone, type NomeIcone } from "./Icons";
import { CaixaMensagens } from "./CaixaMensagens";
import { QuadroAuditoria } from "./QuadroAuditoria";
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
  const [contaAberta, setContaAberta] = useState(false);
  const [fotoAberta, setFotoAberta] = useState(false);
  const contaRef = useRef<HTMLDivElement>(null);
  const [largo, setLargo] = useState(() => window.matchMedia("(min-width: 901px)").matches);
  const { pathname } = useLocation();
  const perfil = sessao?.usuario.perfil;
  const nome = sessao?.usuario.nome ?? "";
  const sigla = iniciais(nome) || "GL";
  const espaco = espacoPorEmail(sessao?.usuario.email ?? "");
  const foto = fotoPorPessoa(nome, sessao?.usuario.email, sessao?.usuario.foto);
  const links =
    perfil === "Cessionário"
      ? [
          ["/inicio", "Início", "casa"],
          ["/meu-espaco", "Meu espaço", "lista"],
          ["/minhas", "Minhas solicitações", "lista"],
          ["/comunicados", "Comunicados", "sino"],
        ]
      : perfil === "GL / Administrador"
        ? [
            ["/inicio", "Início", "casa"],
            ["/central", "Central operacional", "grade"],
            ["/comunicados", "Comunicados", "sino"],
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
    ?? (pathname.startsWith("/demandas") ? "Chamado" : pathname.startsWith("/abrir") ? "Abrir chamado" : pathname.startsWith("/comunicados") ? "Comunicados" : pathname.startsWith("/auditoria") ? "Auditoria" : "Início");

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
    if (!menuAberto && !contaAberta) return;
    const fechar = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuAberto(false);
      setContaAberta(false);
    };
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [menuAberto, contaAberta]);

  useEffect(() => {
    if (!contaAberta) return;
    const fechar = (event: MouseEvent) => {
      if (!contaRef.current?.contains(event.target as Node)) setContaAberta(false);
    };
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, [contaAberta]);

  useEffect(() => {
    setContaAberta(false);
  }, [pathname]);

  function alternarMenu() {
    if (window.matchMedia("(max-width: 900px)").matches) {
      setMenuAberto((atual) => !atual);
      return;
    }
    setRecolhido((atual) => !atual);
  }

  return (
    <div className={`page-container${recolhido ? " is-mini" : ""}${menuAberto ? " is-nav-open" : ""}`}>
      <ProvedorAcoesRapidas>
      <aside className="page-sidebar" inert={!largo && !menuAberto ? true : undefined}>
        <Link className="xn-logo" to="/inicio" aria-label="Ir para a página principal" onClick={() => setMenuAberto(false)}>
          <img src="/gl-events-logo.png" alt="" />
          <span className="xn-brand" aria-hidden="true">GL Events</span>
        </Link>
        <div className="xn-profile-wrap" ref={contaRef}>
          <button
            className="xn-profile"
            type="button"
            aria-expanded={contaAberta}
            aria-haspopup="menu"
            onClick={() => setContaAberta((atual) => !atual)}
          >
            {foto ? <img className="avatar foto" src={foto} alt="" onClick={(event) => { event.stopPropagation(); setFotoAberta(true); }} /> : <div className="avatar" aria-hidden="true">{sigla}</div>}
            <div className="xn-profile-data">
              <strong>{nome}</strong>
              <span>{perfil}</span>
            </div>
            <svg className="xn-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {contaAberta && (
            <div className="xn-menu" role="menu">
              {espaco && (
                <Link role="menuitem" to="/meu-espaco" onClick={() => setMenuAberto(false)}>
                  <Icone name="casa" />
                  Meu espaço
                </Link>
              )}
              {perfil === "GL / Administrador" ? (
                <Link role="menuitem" to="/comunicados" onClick={() => setMenuAberto(false)}>
                  <Icone name="sino" />
                  Comunicados
                </Link>
              ) : perfil === "Responsável da Área" ? (
                <Link role="menuitem" to="/central?visao=agenda" onClick={() => setMenuAberto(false)}>
                  <Icone name="agenda" />
                  Agenda
                </Link>
              ) : null}
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  sair();
                  navigate("/login");
                }}
              >
                Sair
              </button>
            </div>
          )}
        </div>
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
              <CaixaMensagens />
              <QuadroAuditoria />
              <SinoNotificacoes />
              {perfil === "Cessionário" ? (
                <Link className="btn" to="/abrir">Abrir chamado</Link>
              ) : (
                <Link className="btn" to="/central">Central</Link>
              )}
            </div>
          </header>
          <div className="page-content-wrap">
            <Outlet />
          </div>
        </div>
        <AcoesRapidas />
      </ProvedorAcoesRapidas>
      {foto && (
        <GaleriaLightbox
          fotos={[{ id: "eu", url: foto, legenda: nome || "Foto" }]}
          indice={fotoAberta ? 0 : null}
          onIndice={() => setFotoAberta(true)}
          onFechar={() => setFotoAberta(false)}
        />
      )}
    </div>
  );
}

