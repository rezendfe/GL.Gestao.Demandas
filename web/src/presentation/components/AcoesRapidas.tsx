import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { ApiError } from "../../infrastructure/api/client";
import { Icone, type NomeIcone } from "./Icons";

export type AcaoPagina = {
  id: string;
  rotulo: string;
  rotuloOcupado?: string;
  icone: NomeIcone;
  executar: () => void | Promise<void>;
  preferencia?: { marcada: boolean; nota?: string };
  escolha?: { grupo: string; rotuloGrupo: string; marcada: boolean; nota?: string };
  estado?: string;
};

type Registro = { ler: () => AcaoPagina[]; chave: string };

type ApiAcoes = {
  publicar: (id: string, ler: () => AcaoPagina[], chave: string) => void;
  remover: (id: string) => void;
};

function gruposDeEscolha(acoes: AcaoPagina[]) {
  const grupos: { id: string; rotulo: string; nota?: string; acoes: AcaoPagina[] }[] = [];
  for (const acao of acoes) {
    if (!acao.escolha) continue;
    const existente = grupos.find((grupo) => grupo.id === acao.escolha?.grupo);
    if (existente) existente.acoes.push(acao);
    else grupos.push({ id: acao.escolha.grupo, rotulo: acao.escolha.rotuloGrupo, nota: acao.escolha.nota, acoes: [acao] });
  }
  return grupos;
}

const ApiContexto = createContext<ApiAcoes | null>(null);
const ListaContexto = createContext<AcaoPagina[]>([]);

export function ProvedorAcoesRapidas({ children }: { children: ReactNode }) {
  const mapa = useRef(new Map<string, Registro>());
  const [versao, setVersao] = useState(0);

  const publicar = useCallback((id: string, ler: () => AcaoPagina[], chave: string) => {
    const atual = mapa.current.get(id);
    mapa.current.set(id, { ler, chave });
    if (!atual || atual.chave !== chave) setVersao((valor) => valor + 1);
  }, []);

  const remover = useCallback((id: string) => {
    if (!mapa.current.delete(id)) return;
    setVersao((valor) => valor + 1);
  }, []);

  const acoes = useMemo(() => {
    void versao;
    return [...mapa.current.values()].flatMap((item) => item.ler());
  }, [versao]);

  const api = useMemo(() => ({ publicar, remover }), [publicar, remover]);

  return (
    <ApiContexto.Provider value={api}>
      <ListaContexto.Provider value={acoes}>{children}</ListaContexto.Provider>
    </ApiContexto.Provider>
  );
}

export function useAcoesDaPagina(acoes: AcaoPagina[]) {
  const api = useContext(ApiContexto);
  const id = useId();
  const ref = useRef(acoes);
  ref.current = acoes;
  const chave = acoes.map((acao) => `${acao.id}\0${acao.rotulo}\0${acao.icone}\0${acao.estado ?? ""}\0${acao.preferencia ? (acao.preferencia.marcada ? "1" : "0") : ""}\0${acao.escolha ? `${acao.escolha.grupo}:${acao.escolha.marcada ? "1" : "0"}` : ""}`).join("\n");

  useEffect(() => {
    if (!api) return;
    api.publicar(id, () => ref.current, chave);
    return () => api.remover(id);
  }, [api, id, chave]);
}

const TAMANHO = 52;
const MARGEM = 12;
const CHAVE_POSICAO = "gl-qa-posicao";

type Ponto = { x: number; y: number };

function limitar(ponto: Ponto) {
  return {
    x: Math.min(Math.max(MARGEM, ponto.x), Math.max(MARGEM, window.innerWidth - MARGEM - TAMANHO)),
    y: Math.min(Math.max(MARGEM, ponto.y), Math.max(MARGEM, window.innerHeight - MARGEM - TAMANHO)),
  };
}

function posicaoPadrao() {
  return limitar({ x: window.innerWidth - 20 - TAMANHO, y: window.innerHeight - 20 - TAMANHO });
}

function lerPosicao() {
  try {
    const bruto = localStorage.getItem(CHAVE_POSICAO);
    if (!bruto) return posicaoPadrao();
    const valor = JSON.parse(bruto) as Partial<Ponto>;
    if (typeof valor.x !== "number" || typeof valor.y !== "number") return posicaoPadrao();
    return limitar({ x: valor.x, y: valor.y });
  } catch {
    return posicaoPadrao();
  }
}

function estiloPainel(botao: Ponto): CSSProperties {
  const estreito = window.innerWidth <= 900;
  const largura = estreito ? window.innerWidth - 24 : Math.min(360, window.innerWidth - 24);
  const left = estreito ? 12 : Math.min(Math.max(12, botao.x + TAMANHO - largura), window.innerWidth - 12 - largura);
  const acima = botao.y >= window.innerHeight - (botao.y + TAMANHO);
  if (acima) return { left, width: largura, bottom: window.innerHeight - botao.y + 12 };
  return { left, width: largura, top: botao.y + TAMANHO + 12 };
}

export function AcoesRapidas() {
  const acoes = useContext(ListaContexto);
  const [aberto, setAberto] = useState(false);
  const [ocupada, setOcupada] = useState<string | null>(null);
  const [falha, setFalha] = useState<string | null>(null);
  const [posicao, setPosicao] = useState(lerPosicao);
  const [arrastando, setArrastando] = useState(false);
  const ignorarClique = useRef(false);
  const tituloId = useId();
  const painelId = useId();
  const assinatura = acoes.map((acao) => acao.id).join("|");

  useEffect(() => {
    setAberto(false);
    setFalha(null);
  }, [assinatura]);

  useEffect(() => {
    if (!aberto) return;
    const fechar = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [aberto]);

  useEffect(() => {
    const ajustar = () => setPosicao((atual) => limitar(atual));
    window.addEventListener("resize", ajustar);
    return () => window.removeEventListener("resize", ajustar);
  }, []);

  function aoPonte(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    const inicio = { x: event.clientX, y: event.clientY };
    const origem = posicao;
    const alvo = event.currentTarget;
    try { alvo.setPointerCapture(event.pointerId); } catch { /* o arraste segue pelos eventos da janela */ }
    let moveu = false;

    const mover = (ev: PointerEvent) => {
      const dx = ev.clientX - inicio.x;
      const dy = ev.clientY - inicio.y;
      if (!moveu && Math.hypot(dx, dy) < 8) return;
      moveu = true;
      setArrastando(true);
      setPosicao(limitar({ x: origem.x + dx, y: origem.y + dy }));
    };
    const soltar = () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      setArrastando(false);
      if (!moveu) return;
      ignorarClique.current = true;
      window.setTimeout(() => { ignorarClique.current = false; }, 0);
      setPosicao((atual) => {
        const limitado = limitar(atual);
        localStorage.setItem(CHAVE_POSICAO, JSON.stringify(limitado));
        return limitado;
      });
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
  }

  if (acoes.length === 0) return null;

  const comandos = acoes.filter((acao) => !acao.preferencia && !acao.escolha);
  const preferencias = acoes.filter((acao) => acao.preferencia);
  const grupos = gruposDeEscolha(acoes);

  async function executar(acao: AcaoPagina) {
    setAberto(false);
    setFalha(null);
    setOcupada(acao.id);
    try {
      await acao.executar();
    } catch (error) {
      setFalha(error instanceof ApiError ? error.message : "Não foi possível concluir a ação.");
    } finally {
      setOcupada(null);
    }
  }

  return (
    <>
      {aberto && (
        <>
          <button className="qa-fundo" type="button" aria-label="Fechar ações rápidas" onClick={() => setAberto(false)} />
          <section className="qa-painel" id={painelId} role="dialog" aria-modal="true" aria-labelledby={tituloId} style={estiloPainel(posicao)}>
            <header className="qa-topo">
              <h2 id={tituloId}>Ações rápidas</h2>
              <button className="qa-fechar" type="button" aria-label="Fechar" onClick={() => setAberto(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </header>
            {comandos.length > 0 && (
              <div className="qa-grade">
                {comandos.map((acao) => {
                  const ocupado = ocupada === acao.id;
                  return (
                    <button key={acao.id} className="qa-item" type="button" onClick={() => void executar(acao)} disabled={ocupada !== null}>
                      <Icone name={acao.icone} />
                      <span>{ocupado ? acao.rotuloOcupado ?? acao.rotulo : acao.rotulo}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {grupos.map((grupo) => (
              <fieldset key={grupo.id} className="qa-escolha">
                <legend>{grupo.rotulo}</legend>
                {grupo.nota && <small>{grupo.nota}</small>}
                {grupo.acoes.map((acao) => (
                  <label key={acao.id} className="qa-escolha-opcao">
                    <input
                      type="radio"
                      name={grupo.id}
                      checked={acao.escolha?.marcada ?? false}
                      onChange={() => void acao.executar()}
                    />
                    <span>{acao.rotulo}</span>
                  </label>
                ))}
              </fieldset>
            ))}
            {preferencias.map((acao) => (
              <label key={acao.id} className="qa-preferencia">
                <input
                  type="checkbox"
                  checked={acao.preferencia?.marcada ?? false}
                  onChange={() => void acao.executar()}
                />
                <span>
                  {acao.rotulo}
                  {acao.preferencia?.nota && <small>{acao.preferencia.nota}</small>}
                </span>
              </label>
            ))}
            {falha && <p className="erro" role="alert">{falha}</p>}
          </section>
        </>
      )}
      <button
        className={arrastando ? "qa-fab arrastando" : "qa-fab"}
        type="button"
        style={{ left: posicao.x, top: posicao.y }}
        aria-expanded={aberto}
        aria-controls={painelId}
        aria-label={aberto ? "Fechar ações rápidas" : "Abrir ações rápidas. Arraste para mover o ícone."}
        onPointerDown={aoPonte}
        onClick={() => {
          if (ignorarClique.current) {
            ignorarClique.current = false;
            return;
          }
          setAberto((atual) => !atual);
        }}
      >
        <Icone name="grade" />
      </button>
    </>
  );
}

