import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAgenda } from "../../application/hooks";
import { useSessao } from "../../application/session";
import type { ItemAgenda } from "../../domain/types";
import { PageHeader } from "../components/PageHeader";

const SEMANA = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
const MARCO: Record<ItemAgenda["marco"], string> = {
  previsao: "Previsão de atendimento",
  "data-desejada": "Data desejada",
  inicio: "Início previsto da obra",
  termino: "Término previsto da obra",
};

function iso(data: Date) {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

function grade(ano: number, mes: number) {
  const primeiro = new Date(ano, mes, 1);
  const deslocamento = (primeiro.getDay() + 6) % 7;
  const inicio = new Date(ano, mes, 1 - deslocamento);
  return Array.from({ length: 42 }, (_, indice) => new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + indice));
}

function rotuloMes(ano: number, mes: number) {
  return new Date(ano, mes, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function AgendaPage() {
  const { sessao } = useSessao();
  const perfil = sessao?.usuario.perfil;
  const hoje = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [escolhido, setEscolhido] = useState(() => iso(hoje));
  const { dados, erro, carregando, recarregar } = useAgenda(perfil !== "Cessionário");

  function mudar(delta: number) {
    const proximo = new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1);
    setCursor(proximo);
    setEscolhido(iso(proximo));
  }

  if (perfil === "Cessionário") return <Navigate to="/inicio" replace />;

  const ano = cursor.getFullYear();
  const mes = cursor.getMonth();
  const dias = grade(ano, mes);
  const itens = dados ?? [];
  const porDia = new Map<string, ItemAgenda[]>();
  for (const item of itens) {
    const lista = porDia.get(item.data) ?? [];
    lista.push(item);
    porDia.set(item.data, lista);
  }
  const doDia = porDia.get(escolhido) ?? [];
  const noMes = itens.some((item) => item.data.startsWith(`${ano}-${String(mes + 1).padStart(2, "0")}`));

  return (
    <>
      <PageHeader title="Agenda" trail={["Início", "Agenda"]} />
      <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>
        Datas que a demanda e a obra já têm: data desejada, previsão de atendimento e marco do cronograma.
      </p>
      {erro && (
        <p className="erro">
          {erro}{" "}
          <button className="btn secondary" type="button" onClick={() => void recarregar()}>Tentar de novo</button>
        </p>
      )}
      {carregando && <p>Carregando agenda...</p>}
      {!carregando && !erro && (
        <>
          <div className="agenda-nav">
            <button className="btn secondary" type="button" onClick={() => mudar(-1)}>Mês anterior</button>
            <strong>{rotuloMes(ano, mes)}</strong>
            <button className="btn secondary" type="button" onClick={() => mudar(1)}>Próximo mês</button>
          </div>
          <div className="agenda-grade" role="grid" aria-label={rotuloMes(ano, mes)}>
            {SEMANA.map((dia) => <span key={dia} className="agenda-semana">{dia}</span>)}
            {dias.map((dia) => {
              const chave = iso(dia);
              const quantidade = porDia.get(chave)?.length ?? 0;
              const fora = dia.getMonth() !== mes;
              return (
                <button
                  key={chave}
                  type="button"
                  role="gridcell"
                  className={`agenda-dia${escolhido === chave ? " ativo" : ""}${fora ? " fora" : ""}`}
                  aria-pressed={escolhido === chave}
                  aria-label={`${dia.toLocaleDateString("pt-BR")}${quantidade ? `, ${quantidade} compromisso${quantidade > 1 ? "s" : ""}` : ""}`}
                  onClick={() => setEscolhido(chave)}
                >
                  <span>{dia.getDate()}</span>
                  {quantidade > 0 && <em>{quantidade}</em>}
                </button>
              );
            })}
          </div>
          {!noMes && <p>Nenhum compromisso neste mês.</p>}
          <section className="agenda-dia-lista" aria-label="Compromissos do dia">
            <h2>{new Date(`${escolhido}T12:00:00`).toLocaleDateString("pt-BR")}</h2>
            {doDia.length === 0 && <p>Nenhum compromisso neste dia.</p>}
            {doDia.map((item) => (
              <Link key={`${item.origem}-${item.id}-${item.marco}`} className="agenda-item" to={item.origem === "obra" ? "/obras" : `/demandas/${item.id}`}>
                <strong>{item.titulo}</strong>
                <span>{MARCO[item.marco]}</span>
                <em>{item.situacao}</em>
              </Link>
            ))}
          </section>
        </>
      )}
    </>
  );
}
