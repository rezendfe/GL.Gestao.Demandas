import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useSessao } from "../../application/session";
import { corAcao, destinoAuditoria, detalheAuditoria, horaAuditoria, rotuloAcao } from "../../domain/auditoria";
import type { EventoAuditoria } from "../../domain/types";
import { ApiError, api } from "../../infrastructure/api/client";
import { Icone } from "./Icons";

export function ListaAuditoria({
  itens,
  mostrarAutor,
  onAbrir,
}: {
  itens: EventoAuditoria[];
  mostrarAutor?: boolean;
  onAbrir?: () => void;
}) {
  return (
    <ul className="audit-lista">
      {itens.map((evento) => {
        const para = destinoAuditoria(evento);
        const corpo = (
          <>
            <span className="audit-icone" style={{ background: corAcao(evento.tipo) }} aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M8 3h8v3H8z" />
                <path d="M7 4H6a1 1 0 0 0-1 1v15h14V5a1 1 0 0 0-1-1h-1" />
                <path d="M9 12h6M9 16h4" />
              </svg>
            </span>
            <span className="audit-texto">
              <strong>{mostrarAutor ? `${evento.autor} · ${rotuloAcao(evento.tipo)}` : rotuloAcao(evento.tipo)}</strong>
              <span>{detalheAuditoria(evento)}</span>
            </span>
            <time dateTime={evento.eventoEm}>{horaAuditoria(evento.eventoEm)}</time>
          </>
        );
        return (
          <li key={`${evento.origem}-${evento.id}`}>
            {para ? (
              <Link className="audit-linha" to={para} onClick={onAbrir}>
                {corpo}
              </Link>
            ) : (
              <div className="audit-linha">{corpo}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function QuadroAuditoria() {
  const { sessao } = useSessao();
  const gl = sessao?.usuario.perfil === "GL / Administrador";
  const [aberto, setAberto] = useState(false);
  const [itens, setItens] = useState<EventoAuditoria[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const fecharRef = useRef<HTMLButtonElement>(null);
  const tituloId = useId();

  useEffect(() => {
    if (!aberto) return;
    let ativo = true;
    setCarregando(true);
    setErro(null);
    api.auditoriaDoDia()
      .then((lista) => {
        if (ativo) setItens(lista);
      })
      .catch((error: unknown) => {
        if (!ativo) return;
        setItens([]);
        setErro(error instanceof ApiError ? error.message : "Não foi possível carregar a auditoria.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    fecharRef.current?.focus();
    const tecla = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [aberto]);

  const painel = aberto
    ? createPortal(
        <>
          <button className="audit-fundo" type="button" aria-label="Fechar auditoria" onClick={() => setAberto(false)} />
          <aside className="audit-quadro" role="dialog" aria-modal="true" aria-labelledby={tituloId}>
            <header className="qa-topo marca">
              <h2 id={tituloId}>Auditoria</h2>
              <button ref={fecharRef} className="qa-fechar" type="button" aria-label="Fechar" onClick={() => setAberto(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </header>
            {gl && (
              <Link className="audit-pesquisa" to="/auditoria" onClick={() => setAberto(false)}>
                Pesquisar outros usuários
              </Link>
            )}
            <h3 className="audit-secao">O que executei hoje</h3>
            {erro && <p className="erro" role="alert">{erro}</p>}
            {carregando && <p className="audit-vazio">Carregando as ações de hoje...</p>}
            {!carregando && !erro && itens.length === 0 && <p className="audit-vazio">Nenhuma ação registrada hoje.</p>}
            {!carregando && itens.length > 0 && <ListaAuditoria itens={itens} onAbrir={() => setAberto(false)} />}
          </aside>
        </>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        className="x-audit"
        type="button"
        aria-expanded={aberto}
        aria-haspopup="dialog"
        aria-label="Auditoria do dia"
        onClick={() => setAberto((atual) => {
          if (!atual) setCarregando(true);
          return !atual;
        })}
      >
        <Icone name="auditoria" />
      </button>
      {painel}
    </>
  );
}
