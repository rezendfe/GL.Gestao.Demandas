import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAgenda } from "../../application/hooks";
import { useVistaAgenda, type VistaAgenda } from "../../application/preferenciaAgenda";
import { useSessao } from "../../application/session";
import type { ItemAgenda } from "../../domain/types";
import { useAcoesDaPagina } from "../components/AcoesRapidas";
import { Panel } from "../components/Panel";

const SEMANA = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
const MARCO: Record<ItemAgenda["marco"], string> = {
  previsao: "Previsão de atendimento",
  "data-desejada": "Data desejada",
  inicio: "Início previsto da obra",
  termino: "Término previsto da obra",
};
const VISTAS: { id: VistaAgenda; rotulo: string }[] = [
  { id: "mes", rotulo: "Mês" },
  { id: "semana", rotulo: "Semana" },
  { id: "dia", rotulo: "Dia" },
];

function iso(data: Date) {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

function dataDe(chave: string) {
  return new Date(`${chave}T12:00:00`);
}

function grade(ano: number, mes: number) {
  const primeiro = new Date(ano, mes, 1);
  const deslocamento = (primeiro.getDay() + 6) % 7;
  const inicio = new Date(ano, mes, 1 - deslocamento);
  return Array.from({ length: 42 }, (_, indice) => new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + indice));
}

function inicioSemana(data: Date) {
  const deslocamento = (data.getDay() + 6) % 7;
  return new Date(data.getFullYear(), data.getMonth(), data.getDate() - deslocamento);
}

function rotuloMes(ano: number, mes: number) {
  return new Date(ano, mes, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function rotuloDia(chave: string) {
  return dataDe(chave).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

function rotuloIntervalo(inicio: Date, fim: Date) {
  const a = inicio.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  const b = fim.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
  return `${a} – ${b}`;
}

function agrupar(itens: ItemAgenda[]) {
  const porDia = new Map<string, ItemAgenda[]>();
  for (const item of itens) {
    const lista = porDia.get(item.data) ?? [];
    lista.push(item);
    porDia.set(item.data, lista);
  }
  return porDia;
}

function destino(item: ItemAgenda) {
  return item.origem === "obra" ? "/obras" : `/demandas/${item.id}`;
}

function Evento({ item }: { item: ItemAgenda }) {
  return (
    <Link className={`agenda-evento marco-${item.marco}`} to={destino(item)} title={`${MARCO[item.marco]} · ${item.situacao}`}>
      <strong>{item.titulo}</strong>
      <span>{item.situacao}</span>
    </Link>
  );
}

export function AgendaPage() {
  const { sessao } = useSessao();
  const perfil = sessao?.usuario.perfil;
  const usuarioId = sessao?.usuario.id;
  const hoje = useMemo(() => iso(new Date()), []);
  const [vista, definirVista] = useVistaAgenda(usuarioId);
  const [escolhido, definirEscolhido] = useState(hoje);
  const { dados, erro, carregando } = useAgenda(perfil !== "Cessionário");

  useAcoesDaPagina(perfil === "Cessionário" ? [] : VISTAS.map((opcao) => ({
    id: `agenda-${opcao.id}`,
    rotulo: opcao.rotulo,
    icone: "agenda" as const,
    escolha: {
      grupo: "agenda-vista",
      rotuloGrupo: "Visão da agenda",
      marcada: vista === opcao.id,
      nota: opcao.id === "mes" ? "A escolha fica neste navegador." : undefined,
    },
    executar: () => definirVista(opcao.id),
  })));

  function mudar(delta: number) {
    const proximo = dataDe(escolhido);
    if (vista === "dia") proximo.setDate(proximo.getDate() + delta);
    else if (vista === "semana") proximo.setDate(proximo.getDate() + delta * 7);
    else proximo.setMonth(proximo.getMonth() + delta, 1);
    definirEscolhido(iso(proximo));
  }

  if (perfil === "Cessionário") return null;

  const itens = dados ?? [];
  const porDia = agrupar(itens);
  const foco = dataDe(escolhido);
  const ano = foco.getFullYear();
  const mes = foco.getMonth();
  const semana = Array.from({ length: 7 }, (_, indice) => {
    const dia = inicioSemana(foco);
    dia.setDate(dia.getDate() + indice);
    return dia;
  });
  const titulo = vista === "dia"
    ? rotuloDia(escolhido)
    : vista === "semana"
      ? rotuloIntervalo(semana[0], semana[6])
      : rotuloMes(ano, mes);
  const anterior = vista === "dia" ? "Dia anterior" : vista === "semana" ? "Semana anterior" : "Mês anterior";
  const seguinte = vista === "dia" ? "Próximo dia" : vista === "semana" ? "Próxima semana" : "Próximo mês";
  const noMes = itens.some((item) => item.data.startsWith(`${ano}-${String(mes + 1).padStart(2, "0")}`));
  const daSemana = semana.flatMap((dia) => porDia.get(iso(dia)) ?? []);
  const doDia = porDia.get(escolhido) ?? [];
  const hojeData = dataDe(hoje);
  const noHoje = vista === "dia"
    ? escolhido === hoje
    : vista === "semana"
      ? semana.some((dia) => iso(dia) === hoje)
      : ano === hojeData.getFullYear() && mes === hojeData.getMonth();

  return (
    <>
      {erro && <p className="erro">{erro}</p>}
      {carregando && <p>Carregando agenda...</p>}
      {!carregando && !erro && (
        <Panel className="agenda-painel">
          <p className="note">Datas que a demanda e a obra já têm: data desejada, previsão de atendimento e marco do cronograma.</p>
          <div className="agenda-toolbar">
            <div className="agenda-toolbar-esq">
              <div className="agenda-botoes" role="group" aria-label="Navegar no período">
                <button type="button" className="agenda-seta" aria-label={anterior} onClick={() => mudar(-1)}>‹</button>
                <button type="button" className="agenda-seta" aria-label={seguinte} onClick={() => mudar(1)}>›</button>
              </div>
              <button type="button" className="agenda-hoje" disabled={noHoje} onClick={() => definirEscolhido(hoje)}>Hoje</button>
            </div>
            <h2 className="agenda-titulo">{titulo}</h2>
            <div className="agenda-botoes agenda-vistas" role="group" aria-label="Visão da agenda">
              {VISTAS.map((opcao) => (
                <button
                  key={opcao.id}
                  type="button"
                  aria-pressed={vista === opcao.id}
                  onClick={() => definirVista(opcao.id)}
                >
                  {opcao.rotulo}
                </button>
              ))}
            </div>
          </div>
          {vista === "mes" && (
            <div className="agenda-grade" role="grid" aria-label={titulo}>
              {SEMANA.map((dia) => <span key={dia} className="agenda-semana">{dia}</span>)}
              {grade(ano, mes).map((dia) => {
                const chave = iso(dia);
                const lista = porDia.get(chave) ?? [];
                const fora = dia.getMonth() !== mes;
                return (
                  <div
                    key={chave + (fora ? "-fora" : "")}
                    role="gridcell"
                    className={`agenda-celula${chave === hoje ? " hoje" : ""}${escolhido === chave ? " ativo" : ""}${fora ? " fora" : ""}`}
                  >
                    <button
                      type="button"
                      className="agenda-numero"
                      aria-pressed={escolhido === chave}
                      aria-label={`${dia.toLocaleDateString("pt-BR")}${lista.length ? `, ${lista.length} compromisso${lista.length > 1 ? "s" : ""}` : ""}`}
                      onClick={() => definirEscolhido(chave)}
                    >
                      {dia.getDate()}
                    </button>
                    <div className="agenda-eventos">
                      {lista.slice(0, 2).map((item) => <Evento key={`${item.origem}-${item.id}-${item.marco}`} item={item} />)}
                      {lista.length > 2 && (
                        <button type="button" className="agenda-mais" onClick={() => definirEscolhido(chave)}>
                          +{lista.length - 2}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {vista === "semana" && (
            <div className="agenda-colunas" role="grid" aria-label={titulo}>
              {semana.map((dia, indice) => {
                const chave = iso(dia);
                const lista = porDia.get(chave) ?? [];
                return (
                  <section key={chave} role="gridcell" className={`agenda-coluna${chave === hoje ? " hoje" : ""}${escolhido === chave ? " ativo" : ""}`}>
                    <button
                      type="button"
                      className="agenda-col-cabeca"
                      aria-pressed={escolhido === chave}
                      onClick={() => definirEscolhido(chave)}
                    >
                      <small>{SEMANA[indice]}</small>
                      <strong>{dia.toLocaleDateString("pt-BR", { day: "numeric", month: "numeric" })}</strong>
                    </button>
                    <div className="agenda-eventos">
                      {lista.map((item) => <Evento key={`${item.origem}-${item.id}-${item.marco}`} item={item} />)}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
          {vista === "dia" && (
            <section className="agenda-so-dia" aria-label={titulo}>
              <header className={escolhido === hoje ? "hoje" : undefined}>
                {dataDe(escolhido).toLocaleDateString("pt-BR", { weekday: "long" })}
              </header>
              <div className="agenda-eventos">
                {doDia.map((item) => <Evento key={`${item.origem}-${item.id}-${item.marco}`} item={item} />)}
              </div>
            </section>
          )}
          {vista === "mes" && !noMes && <p className="agenda-vazio">Nenhum compromisso neste mês.</p>}
          {vista === "semana" && daSemana.length === 0 && <p className="agenda-vazio">Nenhum compromisso nesta semana.</p>}
          {vista === "dia" && doDia.length === 0 && <p className="agenda-vazio">Nenhum compromisso neste dia.</p>}
          {vista === "mes" && (
            <section className="agenda-dia-lista" aria-label="Compromissos do dia">
              <h3>{dataDe(escolhido).toLocaleDateString("pt-BR")}</h3>
              {doDia.length === 0 && <p>Nenhum compromisso neste dia.</p>}
              {doDia.map((item) => (
                <Link key={`${item.origem}-${item.id}-${item.marco}`} className="agenda-item" to={destino(item)}>
                  <strong>{item.titulo}</strong>
                  <span>{MARCO[item.marco]}</span>
                  <em>{item.situacao}</em>
                </Link>
              ))}
            </section>
          )}
        </Panel>
      )}
    </>
  );
}
