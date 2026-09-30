import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { Navigate } from "react-router-dom";
import { useCadeia } from "../../application/hooks";
import { useSessao } from "../../application/session";
import { CAMPOS_DA_ETAPA, tarefasDa } from "../../domain/cadeia";
import type { EtapaCadeia, TarefaCadeia } from "../../domain/types";
import { ApiError, api } from "../../infrastructure/api/client";
import { PageHeader } from "../components/PageHeader";
import { Panel } from "../components/Panel";

const TONS = ["#146c43", "#1f8a4d", "#2ea35c", "#3aaa62", "#176636"];

type Lado = "obrigatoria" | "opcional";

type Rascunho = {
  codigo: string;
  nome: string;
  fixa: boolean;
  obrigatoria: boolean;
  campos: string[];
  tarefas: TarefaCadeia[];
  texto: string;
  aviso: string | null;
};

function etapaFixa(codigo: string) {
  return codigo === "solicitacao" || codigo === "conclusao";
}

function campoPorTexto(codigo: string, texto: string) {
  const normal = texto.trim().toLocaleLowerCase("pt-BR");
  if (!normal) return null;
  return (CAMPOS_DA_ETAPA[codigo] ?? []).find((campo) =>
    campo.id === normal || campo.rotulo.toLocaleLowerCase("pt-BR") === normal) ?? null;
}

function SimboloEtapa({ codigo }: { codigo: string }) {
  const comum = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: 1.8, "aria-hidden": true } as const;
  if (codigo === "solicitacao") {
    return <svg {...comum}><path d="M12 3v12M8 11l4 4 4-4M5 21h14" /></svg>;
  }
  if (codigo === "aprovacao") {
    return <svg {...comum}><path d="M8 12.5 11 15.5 16.5 9M12 3l7 3v6c0 4.2-2.8 7.2-7 9-4.2-1.8-7-4.8-7-9V6l7-3z" /></svg>;
  }
  if (codigo === "atendimento") {
    return <svg {...comum}><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM12 3.5v2.2M12 18.3v2.2M4.8 6.2l1.6 1.6M17.6 16.2l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.8 17.8l1.6-1.6M17.6 7.8l1.6-1.6" /></svg>;
  }
  if (codigo === "validacao") {
    return <svg {...comum}><path d="M12 12a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 12 12zM6 19.2c.8-2.6 3-4 6-4s5.2 1.4 6 4" /></svg>;
  }
  return <svg {...comum}><path d="M5 19.5 12 4l7 15.5H5zM9.2 19.5V13h5.6v6.5" /></svg>;
}

export function CadeiaPage() {
  const { sessao } = useSessao();
  const { dados, erro, recarregar } = useCadeia();
  const [tipoId, setTipoId] = useState("");
  const [etapas, setEtapas] = useState<EtapaCadeia[]>([]);
  const [falha, setFalha] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<Lado | null>(null);
  const [rascunho, setRascunho] = useState<Rascunho | null>(null);
  const [textos, setTextos] = useState<Record<string, string>>({});
  const [avisos, setAvisos] = useState<Record<string, string | null>>({});
  const arraste = useRef<string | null>(null);
  const etapasRef = useRef(etapas);
  etapasRef.current = etapas;
  const perfil = sessao?.usuario.perfil;

  useEffect(() => {
    if (!dados?.length) return;
    setTipoId((atual) => atual || dados[0].subcategoriaId);
  }, [dados]);

  useEffect(() => {
    const escolhido = dados?.find((tipo) => tipo.subcategoriaId === tipoId);
    if (escolhido) setEtapas(escolhido.etapas);
  }, [dados, tipoId]);

  if (perfil !== "GL / Administrador") return <Navigate to="/inicio" replace />;

  function alterar(codigo: string, patch: Partial<EtapaCadeia>) {
    setOk(false);
    setEtapas((atual) => atual.map((etapa) => (etapa.codigo === codigo ? { ...etapa, ...patch } : etapa)));
  }

  function abrir(etapa: EtapaCadeia, opcional: boolean) {
    const fixa = etapaFixa(etapa.codigo);
    setRascunho({
      codigo: etapa.codigo,
      nome: etapa.nome,
      fixa,
      obrigatoria: fixa || !opcional,
      campos: tarefasDa(etapa).map((tarefa) => tarefa.codigo),
      tarefas: tarefasDa(etapa).map((tarefa) => ({ ...tarefa })),
      texto: "",
      aviso: null,
    });
  }

  function comecarArraste(event: ReactPointerEvent<HTMLButtonElement>, codigo: string) {
    if (event.button !== 0) return;
    const inicioX = event.clientX;
    const inicioY = event.clientY;
    let deslocou = false;
    arraste.current = codigo;
    event.currentTarget.setPointerCapture(event.pointerId);
    const mover = (ev: PointerEvent) => {
      if (!deslocou && Math.hypot(ev.clientX - inicioX, ev.clientY - inicioY) > 6) {
        deslocou = true;
        setArrastando(codigo);
        document.querySelector(".fluxo-destinos")?.scrollIntoView({ block: "nearest" });
      }
      const lado = document.elementFromPoint(ev.clientX, ev.clientY)?.closest("[data-lado]")?.getAttribute("data-lado");
      setSobre(lado === "obrigatoria" || lado === "opcional" ? lado : null);
    };
    const terminar = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", terminar);
      const lado = document.elementFromPoint(ev.clientX, ev.clientY)?.closest("[data-lado]")?.getAttribute("data-lado");
      const etapa = etapasRef.current.find((item) => item.codigo === codigo);
      arraste.current = null;
      setArrastando(null);
      setSobre(null);
      if (!etapa) return;
      if (deslocou && (lado === "obrigatoria" || lado === "opcional")) {
        abrir(etapa, lado === "opcional");
        return;
      }
      if (!deslocou) abrir(etapa, etapa.automatica);
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", terminar);
  }

  function incluirNoRascunho() {
    if (!rascunho) return;
    const campo = campoPorTexto(rascunho.codigo, rascunho.texto);
    const opcoes = CAMPOS_DA_ETAPA[rascunho.codigo] ?? [];
    if (!campo) {
      setRascunho({
        ...rascunho,
        aviso: opcoes.length === 0
          ? "Esta etapa não pede informação extra."
          : `Escreva: ${opcoes.map((item) => item.rotulo).join(" ou ")}.`,
      });
      return;
    }
    setRascunho({
      ...rascunho,
      texto: "",
      aviso: null,
      campos: rascunho.campos.includes(campo.id) ? rascunho.campos : [...rascunho.campos, campo.id],
      tarefas: rascunho.tarefas.some((tarefa) => tarefa.codigo === campo.id)
        ? rascunho.tarefas
        : [...rascunho.tarefas, { codigo: campo.id, obrigatoria: rascunho.obrigatoria }],
    });
  }

  function incluirNaEtapa(codigo: string) {
    const texto = textos[codigo] ?? "";
    const campo = campoPorTexto(codigo, texto);
    const opcoes = CAMPOS_DA_ETAPA[codigo] ?? [];
    if (!campo) {
      setAvisos((atual) => ({
        ...atual,
        [codigo]: opcoes.length === 0
          ? "Esta etapa não pede informação extra."
          : `Escreva: ${opcoes.map((item) => item.rotulo).join(" ou ")}.`,
      }));
      return;
    }
    setAvisos((atual) => ({ ...atual, [codigo]: null }));
    setTextos((atual) => ({ ...atual, [codigo]: "" }));
    setEtapas((atual) => atual.map((etapa) => (
      etapa.codigo === codigo && !tarefasDa(etapa).some((tarefa) => tarefa.codigo === campo.id)
        ? {
            ...etapa,
            tarefas: [...tarefasDa(etapa), { codigo: campo.id, obrigatoria: !etapa.automatica }],
            campos: [...tarefasDa(etapa).map((tarefa) => tarefa.codigo), campo.id],
          }
        : etapa
    )));
    setOk(false);
  }

  function confirmarRascunho() {
    if (!rascunho) return;
    alterar(rascunho.codigo, {
      automatica: rascunho.fixa ? false : !rascunho.obrigatoria,
      campos: rascunho.tarefas.map((tarefa) => tarefa.codigo),
      tarefas: rascunho.tarefas,
    });
    setRascunho(null);
  }

  async function salvar() {
    setEnviando(true);
    setFalha(null);
    setOk(false);
    try {
      const salva = await api.salvarCadeia(tipoId, etapas.map((etapa) => {
        const tarefas = tarefasDa(etapa);
        return {
          codigo: etapa.codigo,
          automatica: etapa.automatica,
          campos: tarefas.map((tarefa) => tarefa.codigo),
          tarefas,
        };
      }));
      setEtapas(salva);
      setOk(true);
      await recarregar();
    } catch (error) {
      setFalha(error instanceof ApiError ? error.message : "Não foi possível salvar a cadeia.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <PageHeader title="Cadeia de andamento" trail={["Início", "Quadro", "Cadeia"]} />
      <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>
        Cada tipo de atendimento tem a própria cadeia. Infraestrutura, refrigeração e os demais não precisam do mesmo caminho. A sequência permanece Solicitação, Aprovação, Atendimento, Validação do cliente e Conclusão.
      </p>
      {erro && <p className="erro">{erro}</p>}
      {falha && <p className="erro">{falha}</p>}
      {ok && <p className="note">Cadeia salva. Os próximos avanços desse tipo usam esta configuração.</p>}
      <Panel title="Workflow do tipo de atendimento" className="livre">
        <label className="fluxo-tipo">
          Tipo de atendimento
          <select
            value={tipoId}
            onChange={(event) => {
              setTipoId(event.target.value);
              setOk(false);
              setFalha(null);
              setTextos({});
              setAvisos({});
            }}
          >
            {(dados ?? []).map((tipo) => (
              <option key={tipo.subcategoriaId} value={tipo.subcategoriaId}>
                {tipo.categoria} — {tipo.tipo}
              </option>
            ))}
          </select>
        </label>
        {etapas.length === 0 && <p>Carregando a cadeia...</p>}
        <div className="fluxo-trilho">
          {etapas.map((etapa, indice) => {
            const tom = TONS[indice % TONS.length];
            const opcoes = CAMPOS_DA_ETAPA[etapa.codigo] ?? [];
            const tarefas = tarefasDa(etapa);
            const restantes = opcoes.filter((campo) => !tarefas.some((tarefa) => tarefa.codigo === campo.id));
            return (
              <article
                key={etapa.codigo}
                className={arrastando === etapa.codigo ? "fluxo-etapa arrastando" : "fluxo-etapa"}
                style={{ zIndex: indice + 1 }}
              >
                <div className="fluxo-circulo" style={{ background: etapa.automatica ? "#8fb89a" : tom }}>
                  <SimboloEtapa codigo={etapa.codigo} />
                </div>
                <button
                  type="button"
                  className="fluxo-seta"
                  style={{ background: etapa.automatica ? "#d7eadc" : tom, color: etapa.automatica ? "#146c43" : "#fff" }}
                  onPointerDown={(event) => comecarArraste(event, etapa.codigo)}
                >
                  {etapa.nome}
                </button>
                <div className="fluxo-corpo" style={{ borderLeftColor: tom }}>
                  <button type="button" className={etapa.automatica ? "fluxo-marca opcional" : "fluxo-marca"} onClick={() => abrir(etapa, etapa.automatica)}>
                    {etapa.automatica ? "Opcional" : "Obrigatória"}
                  </button>
                  <ul className="fluxo-itens">
                    {tarefas.length === 0 && <li className="fluxo-vazio">Sem informação extra.</li>}
                    {tarefas.map((tarefa) => {
                      const rotulo = opcoes.find((campo) => campo.id === tarefa.codigo)?.rotulo ?? tarefa.codigo;
                      return (
                        <li key={tarefa.codigo}>
                          <span className="fluxo-bolinha" style={{ borderColor: tom }} />
                          <span>{rotulo}</span>
                          <span className="fluxo-acoes">
                            <button
                              type="button"
                              className={tarefa.obrigatoria ? "fluxo-marca" : "fluxo-marca opcional"}
                              onClick={() => {
                                const novas = tarefas.map((item) => item.codigo === tarefa.codigo ? { ...item, obrigatoria: !item.obrigatoria } : item);
                                alterar(etapa.codigo, { tarefas: novas, campos: novas.map((item) => item.codigo) });
                              }}
                            >
                              {tarefa.obrigatoria ? "Obrigatória" : "Opcional"}
                            </button>
                            <button
                              type="button"
                              className="fluxo-tirar"
                              onClick={() => {
                                const novas = tarefas.filter((item) => item.codigo !== tarefa.codigo);
                                alterar(etapa.codigo, { tarefas: novas, campos: novas.map((item) => item.codigo) });
                              }}
                            >
                              Tirar
                            </button>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {restantes.length > 0 && (
                    <div className="fluxo-chips">
                      {restantes.map((campo) => (
                        <button key={campo.id} type="button" className="fluxo-chip" onClick={() => {
                          setTextos((atual) => ({ ...atual, [etapa.codigo]: campo.rotulo }));
                          setAvisos((atual) => ({ ...atual, [etapa.codigo]: null }));
                          setOk(false);
                          setEtapas((atual) => atual.map((item) => (
                            item.codigo === etapa.codigo && !tarefasDa(item).some((tarefa) => tarefa.codigo === campo.id)
                              ? {
                                  ...item,
                                  tarefas: [...tarefasDa(item), { codigo: campo.id, obrigatoria: !item.automatica }],
                                  campos: [...tarefasDa(item).map((tarefa) => tarefa.codigo), campo.id],
                                }
                              : item
                          )));
                        }}
                        >
                          {campo.rotulo}
                        </button>
                      ))}
                    </div>
                  )}
                  <form
                    className="fluxo-nova"
                    onSubmit={(event) => {
                      event.preventDefault();
                      incluirNaEtapa(etapa.codigo);
                    }}
                  >
                    <input
                      aria-label={`Informação de ${etapa.nome}`}
                      placeholder="Digite a informação"
                      list={`opcoes-${etapa.codigo}`}
                      value={textos[etapa.codigo] ?? ""}
                      onChange={(event) => setTextos((atual) => ({ ...atual, [etapa.codigo]: event.target.value }))}
                    />
                    <datalist id={`opcoes-${etapa.codigo}`}>
                      {restantes.map((campo) => <option key={campo.id} value={campo.rotulo} />)}
                    </datalist>
                    <button className="btn secondary" type="submit">Incluir</button>
                  </form>
                  {avisos[etapa.codigo] && <p className="fluxo-aviso">{avisos[etapa.codigo]}</p>}
                </div>
                <span className="fluxo-haste" style={{ background: tom }} />
                <span className="fluxo-ponto" style={{ background: etapa.automatica ? "#fff" : tom, borderColor: tom }} />
              </article>
            );
          })}
        </div>
        <p className="fluxo-andamento">
          {etapas.map((etapa, indice) => (
            <span key={etapa.codigo}>
              {indice > 0 && <span className="fluxo-seta-mini" aria-hidden="true">→</span>}
              <strong>{etapa.nome}</strong>
              {etapa.automatica ? " opcional" : ""}
            </span>
          ))}
        </p>
        <div className={arrastando ? "fluxo-destinos ativo" : "fluxo-destinos"}>
          <Destino
            lado="obrigatoria"
            titulo="Obrigatória"
            detalhe="O chamado para nesta etapa e alguém preenche o que ela pede."
            sobre={sobre}
          />
          <Destino
            lado="opcional"
            titulo="Opcional"
            detalhe="A etapa continua na cadeia, ocorre sozinha e o chamado segue."
            sobre={sobre}
          />
        </div>
        <button className="btn" type="button" disabled={enviando || etapas.length === 0} onClick={() => void salvar()}>
          {enviando ? "Salvando..." : "Salvar cadeia"}
        </button>
      </Panel>
      {rascunho && (
        <PerguntaEtapa
          rascunho={rascunho}
          onChange={setRascunho}
          onIncluir={incluirNoRascunho}
          onCancelar={() => setRascunho(null)}
          onConfirmar={confirmarRascunho}
        />
      )}
    </>
  );
}

function Destino({
  lado,
  titulo,
  detalhe,
  sobre,
}: {
  lado: Lado;
  titulo: string;
  detalhe: string;
  sobre: Lado | null;
}) {
  return (
    <section
      role="group"
      aria-label={titulo}
      data-lado={lado}
      className={sobre === lado ? `fluxo-destino ${lado} sobre` : `fluxo-destino ${lado}`}
    >
      <strong>{titulo}</strong>
      <span>{detalhe}</span>
    </section>
  );
}

function PerguntaEtapa({
  rascunho,
  onChange,
  onIncluir,
  onCancelar,
  onConfirmar,
}: {
  rascunho: Rascunho;
  onChange: (rascunho: Rascunho) => void;
  onIncluir: () => void;
  onCancelar: () => void;
  onConfirmar: () => void;
}) {
  const tituloId = useId();
  const opcoes = CAMPOS_DA_ETAPA[rascunho.codigo] ?? [];

  useEffect(() => {
    function fechar(event: KeyboardEvent) {
      if (event.key === "Escape") onCancelar();
    }
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [onCancelar]);

  return createPortal(
    <div className="modal-fundo" onClick={onCancelar}>
      <form
        className="modal modal-fluxo"
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          onConfirmar();
        }}
      >
        <h2 id={tituloId}>{rascunho.nome}</h2>
        <p>Esta etapa da cadeia é obrigatória ou opcional?</p>
        <fieldset className="escolha">
          <legend className="sr-only">Exigência da etapa</legend>
          <label>
            <input
              type="radio"
              name="exigencia"
              checked={rascunho.obrigatoria}
              onChange={() => onChange({ ...rascunho, obrigatoria: true, aviso: null })}
            />
            <span>
              <strong>Obrigatória</strong>
              O chamado para aqui e alguém preenche o que ela pede.
            </span>
          </label>
          <label>
            <input
              type="radio"
              name="exigencia"
              checked={!rascunho.obrigatoria}
              disabled={rascunho.fixa}
              onChange={() => onChange({
                ...rascunho,
                obrigatoria: false,
                tarefas: rascunho.tarefas.map((tarefa) => ({ ...tarefa, obrigatoria: false })),
                aviso: null,
              })}
            />
            <span>
              <strong>Opcional</strong>
              Ocorre sozinha. O chamado não permanece nesta etapa.
            </span>
          </label>
        </fieldset>
        {rascunho.fixa && <p className="note">Solicitação e Conclusão permanecem obrigatórias na cadeia.</p>}
        <div className="fluxo-bloco">
          <strong>Informações deste passo</strong>
          <ul className="fluxo-itens">
            {rascunho.campos.length === 0 && <li className="fluxo-vazio">Nada a preencher.</li>}
            {rascunho.campos.map((id) => (
              <li key={id}>
                <span className="fluxo-bolinha" />
                <span>{opcoes.find((campo) => campo.id === id)?.rotulo ?? id}</span>
                <button
                  type="button"
                  className="fluxo-tirar"
                  onClick={() => onChange({
                    ...rascunho,
                    campos: rascunho.campos.filter((item) => item !== id),
                    tarefas: rascunho.tarefas.filter((tarefa) => tarefa.codigo !== id),
                  })}
                >
                  Tirar
                </button>
              </li>
            ))}
          </ul>
          <div className="fluxo-nova">
            <input
              aria-label={`Informação de ${rascunho.nome}`}
              placeholder="Digite a informação"
              list={`modal-opcoes-${rascunho.codigo}`}
              value={rascunho.texto}
              onChange={(event) => onChange({ ...rascunho, texto: event.target.value, aviso: null })}
            />
            <datalist id={`modal-opcoes-${rascunho.codigo}`}>
              {opcoes.filter((campo) => !rascunho.campos.includes(campo.id)).map((campo) => (
                <option key={campo.id} value={campo.rotulo} />
              ))}
            </datalist>
            <button className="btn secondary" type="button" onClick={onIncluir}>Incluir</button>
          </div>
          {rascunho.aviso && <p className="fluxo-aviso">{rascunho.aviso}</p>}
        </div>
        <div className="row">
          <button className="btn" type="submit">Colocar na cadeia</button>
          <button className="btn secondary" type="button" onClick={onCancelar}>Cancelar</button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
