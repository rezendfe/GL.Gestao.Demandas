import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

export interface FotoItem {
  id: string;
  url: string;
  legenda: string;
}

export function GaleriaLightbox({
  fotos,
  indice,
  onIndice,
  onFechar,
}: {
  fotos: FotoItem[];
  indice: number | null;
  onIndice: (indice: number) => void;
  onFechar: () => void;
}) {
  const rolo = useRef<HTMLDivElement>(null);
  const aberta = indice !== null && fotos.length > 0;
  const atual = aberta ? fotos[Math.min(indice, fotos.length - 1)] : null;

  useEffect(() => {
    if (!aberta) return;
    function tecla(event: KeyboardEvent) {
      if (event.key === "Escape") onFechar();
      if (event.key === "ArrowRight") onIndice((indice! + 1) % fotos.length);
      if (event.key === "ArrowLeft") onIndice((indice! - 1 + fotos.length) % fotos.length);
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [aberta, fotos.length, indice, onFechar, onIndice]);

  useEffect(() => {
    if (!atual || !rolo.current) return;
    rolo.current.querySelector<HTMLButtonElement>(`[data-foto="${atual.id}"]`)?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [atual]);

  if (!aberta || !atual) return null;

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={atual.legenda}>
      <header className="lightbox-topo">
        <strong>{atual.legenda}</strong>
        <span>{indice! + 1} de {fotos.length}</span>
        <button className="lightbox-fechar" type="button" onClick={onFechar}>Fechar</button>
      </header>
      <div className="lightbox-palco">
        <button className="lightbox-seta" type="button" aria-label="Foto anterior" onClick={() => onIndice((indice! - 1 + fotos.length) % fotos.length)}>‹</button>
        <FotoAmpliavel url={atual.url} legenda={atual.legenda} />
        <button className="lightbox-seta" type="button" aria-label="Próxima foto" onClick={() => onIndice((indice! + 1) % fotos.length)}>›</button>
      </div>
      <div className="lightbox-rolo" ref={rolo} role="listbox" aria-label="Rolo de fotos">
        {fotos.map((foto, posicao) => (
          <button
            key={foto.id}
            type="button"
            data-foto={foto.id}
            className={posicao === indice ? "ativa" : ""}
            aria-label={foto.legenda}
            aria-current={posicao === indice ? "true" : undefined}
            onClick={() => onIndice(posicao)}
          >
            <img src={foto.url} alt="" />
          </button>
        ))}
      </div>
    </div>
  );
}

function FotoAmpliavel({ url, legenda }: { url: string; legenda: string }) {
  const quadro = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(1);
  const [posicao, setPosicao] = useState({ x: 0, y: 0 });
  const [arrastando, setArrastando] = useState(false);
  const escalaAtual = useRef(1);
  const posicaoAtual = useRef({ x: 0, y: 0 });
  const ponteiros = useRef(new Map<number, { x: number; y: number }>());
  const gesto = useRef<{ modo: "arraste" | "pinca"; x: number; y: number; ox: number; oy: number; distancia: number; escala: number; moveu: boolean } | null>(null);
  const ultimoToque = useRef(0);

  escalaAtual.current = escala;
  posicaoAtual.current = posicao;

  useEffect(() => {
    setEscala(1);
    setPosicao({ x: 0, y: 0 });
    escalaAtual.current = 1;
    posicaoAtual.current = { x: 0, y: 0 };
  }, [url]);

  useEffect(() => {
    const el = quadro.current;
    if (!el) return;
    function roda(event: WheelEvent) {
      event.preventDefault();
      const fator = event.deltaY < 0 ? 1.2 : 1 / 1.2;
      definirEscala(escalaAtual.current * fator);
    }
    el.addEventListener("wheel", roda, { passive: false });
    return () => el.removeEventListener("wheel", roda);
  }, []);

  function definirEscala(proxima: number) {
    const valor = limitarEscala(proxima);
    const lugar = valor <= 1 ? { x: 0, y: 0 } : limitarPosicao(posicaoAtual.current.x, posicaoAtual.current.y, valor, quadro.current);
    escalaAtual.current = valor;
    posicaoAtual.current = lugar;
    setEscala(valor);
    setPosicao(lugar);
  }

  function definirPosicao(x: number, y: number) {
    const lugar = limitarPosicao(x, y, escalaAtual.current, quadro.current);
    posicaoAtual.current = lugar;
    setPosicao(lugar);
  }

  function iniciar(event: ReactPointerEvent<HTMLDivElement>) {
    quadro.current?.setPointerCapture(event.pointerId);
    ponteiros.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (ponteiros.current.size === 2) {
      const [a, b] = [...ponteiros.current.values()];
      gesto.current = {
        modo: "pinca",
        x: event.clientX,
        y: event.clientY,
        ox: posicaoAtual.current.x,
        oy: posicaoAtual.current.y,
        distancia: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        escala: escalaAtual.current,
        moveu: false,
      };
      return;
    }
    gesto.current = {
      modo: "arraste",
      x: event.clientX,
      y: event.clientY,
      ox: posicaoAtual.current.x,
      oy: posicaoAtual.current.y,
      distancia: 0,
      escala: escalaAtual.current,
      moveu: false,
    };
  }

  function mover(event: ReactPointerEvent<HTMLDivElement>) {
    if (!ponteiros.current.has(event.pointerId) || !gesto.current) return;
    ponteiros.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (gesto.current.modo === "pinca" && ponteiros.current.size >= 2) {
      const [a, b] = [...ponteiros.current.values()];
      const distancia = Math.hypot(a.x - b.x, a.y - b.y);
      gesto.current.moveu = true;
      definirEscala(gesto.current.escala * (distancia / gesto.current.distancia));
      return;
    }
    const dx = event.clientX - gesto.current.x;
    const dy = event.clientY - gesto.current.y;
    if (Math.hypot(dx, dy) > 6) gesto.current.moveu = true;
    if (gesto.current.modo === "arraste" && escalaAtual.current > 1) {
      setArrastando(true);
      definirPosicao(gesto.current.ox + dx, gesto.current.oy + dy);
    }
  }

  function encerrar(event: ReactPointerEvent<HTMLDivElement>) {
    const foiToque = event.pointerType === "touch";
    const moveu = gesto.current?.moveu ?? false;
    ponteiros.current.delete(event.pointerId);
    if (ponteiros.current.size === 0) {
      gesto.current = null;
      setArrastando(false);
      if (foiToque && !moveu) {
        const agora = Date.now();
        if (agora - ultimoToque.current < 300) {
          ultimoToque.current = 0;
          definirEscala(escalaAtual.current > 1 ? 1 : 2);
        } else {
          ultimoToque.current = agora;
        }
      }
      return;
    }
    const restante = [...ponteiros.current.values()][0];
    gesto.current = {
      modo: "arraste",
      x: restante.x,
      y: restante.y,
      ox: posicaoAtual.current.x,
      oy: posicaoAtual.current.y,
      distancia: 0,
      escala: escalaAtual.current,
      moveu: true,
    };
  }

  const ampliada = escala > 1;

  return (
    <div className="lightbox-foto">
      <div
        className={arrastando ? "lightbox-zoom arrastando" : ampliada ? "lightbox-zoom ampliada" : "lightbox-zoom"}
        ref={quadro}
        onPointerDown={iniciar}
        onPointerMove={mover}
        onPointerUp={encerrar}
        onPointerCancel={encerrar}
        onDoubleClick={() => definirEscala(ampliada ? 1 : 2)}
      >
        <img
          src={url}
          alt={legenda}
          draggable={false}
          style={{ transform: `translate(${posicao.x}px, ${posicao.y}px) scale(${escala})` }}
        />
      </div>
      <div className="lightbox-zoom-botoes">
        <button type="button" aria-label="Diminuir" title="Diminuir" disabled={!ampliada} onClick={() => definirEscala(escala / 1.25)}>−</button>
        <button type="button" aria-label="Aumentar" title="Aumentar" disabled={escala >= 4} onClick={() => definirEscala(escala * 1.25)}>+</button>
      </div>
    </div>
  );
}

function limitarEscala(valor: number) {
  return Math.min(4, Math.max(1, Math.round(valor * 100) / 100));
}

function limitarPosicao(x: number, y: number, escala: number, quadro: HTMLDivElement | null) {
  if (!quadro || escala <= 1) return { x: 0, y: 0 };
  const maxX = (quadro.clientWidth * (escala - 1)) / 2;
  const maxY = (quadro.clientHeight * (escala - 1)) / 2;
  return {
    x: Math.min(maxX, Math.max(-maxX, x)),
    y: Math.min(maxY, Math.max(-maxY, y)),
  };
}
