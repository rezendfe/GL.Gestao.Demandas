import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVistaFila, type VistaFila } from "../../application/preferenciaFila";
import { emAtraso } from "../../domain/operacao";
import { encerrada } from "../../domain/recorte";
import { tempoRelativo, type FilaItem } from "../../domain/types";
import { Badge } from "./Badge";
import { Panel } from "./Panel";

const OPCOES: { id: VistaFila; rotulo: string; nota: string }[] = [
  { id: "grade", rotulo: "Grade", nota: "Tabela para comparar a fila" },
  { id: "cartoes", rotulo: "Cartões", nota: "Um chamado por cartão" },
  { id: "pulso", rotulo: "Pulso", nota: "A faixa cresce com o tempo em aberto" },
];

const FAIXAS = ["Alta", "Média", "Normal"];

interface Filtro {
  texto: string;
  situacao: string;
  prioridade: string;
  servico: string;
  responsavel: string;
  de: string;
  ate: string;
  atalho: "tudo" | "hoje" | "7" | "30" | null;
  abertos: boolean;
  atraso: boolean;
}

const FILTRO_INICIAL: Filtro = {
  texto: "",
  situacao: "",
  prioridade: "",
  servico: "",
  responsavel: "",
  de: "",
  ate: "",
  atalho: "tudo",
  abertos: false,
  atraso: false,
};

function isoData(data: Date) {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

function diaDoItem(iso: string) {
  return isoData(new Date(iso));
}

function normalizar(valor: string) {
  return valor.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function unicos(valores: string[]) {
  return [...new Set(valores.filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function periodoDe(atalho: Filtro["atalho"]) {
  if (!atalho || atalho === "tudo") return { de: "", ate: "" };
  const hoje = new Date();
  const ate = isoData(hoje);
  if (atalho === "hoje") return { de: ate, ate };
  const inicio = new Date(hoje);
  inicio.setDate(hoje.getDate() - (atalho === "7" ? 6 : 29));
  return { de: isoData(inicio), ate };
}

export function FilaExploravel({
  titulo,
  itens,
  usuarioId,
  destacar,
}: {
  titulo: string;
  itens: FilaItem[];
  usuarioId?: string;
  destacar?: Set<string>;
}) {
  const navigate = useNavigate();
  const [vista, definirVista] = useVistaFila(usuarioId);
  const [filtro, setFiltro] = useState<Filtro>(FILTRO_INICIAL);
  const situacoes = useMemo(() => unicos(itens.map((item) => item.situacao)), [itens]);
  const prioridades = useMemo(() => unicos(itens.map((item) => item.prioridade)), [itens]);
  const servicos = useMemo(() => unicos(itens.map((item) => item.servico)), [itens]);
  const responsaveis = useMemo(() => unicos(itens.map((item) => item.responsavel)), [itens]);
  const visiveis = useMemo(() => filtrar(itens, filtro), [itens, filtro]);
  const ativo = filtroAtivo(filtro);
  const opcao = OPCOES.find((item) => item.id === vista) ?? OPCOES[0];

  function patch(parcial: Partial<Filtro>) {
    setFiltro((atual) => ({ ...atual, ...parcial }));
  }

  function escolherPeriodo(atalho: Filtro["atalho"]) {
    const datas = periodoDe(atalho);
    patch({ atalho, de: datas.de, ate: datas.ate });
  }

  return (
    <Panel title={titulo} className="livre">
      <div className="fila-comandos">
        <div className="fila-filtros">
          <label>
            Buscar
            <input
              value={filtro.texto}
              placeholder="Protocolo, cessionário, serviço ou responsável"
              onChange={(event) => patch({ texto: event.target.value })}
            />
          </label>
          <label>
            Situação
            <select value={filtro.situacao} onChange={(event) => patch({ situacao: event.target.value })}>
              <option value="">Todas</option>
              {situacoes.map((valor) => <option key={valor} value={valor}>{valor}</option>)}
            </select>
          </label>
          <label>
            Prioridade
            <select value={filtro.prioridade} onChange={(event) => patch({ prioridade: event.target.value })}>
              <option value="">Todas</option>
              {prioridades.map((valor) => <option key={valor} value={valor}>{valor}</option>)}
            </select>
          </label>
          <label>
            Serviço
            <select value={filtro.servico} onChange={(event) => patch({ servico: event.target.value })}>
              <option value="">Todos</option>
              {servicos.map((valor) => <option key={valor} value={valor}>{valor}</option>)}
            </select>
          </label>
          <label>
            Responsável
            <select value={filtro.responsavel} onChange={(event) => patch({ responsavel: event.target.value })}>
              <option value="">Todos</option>
              {responsaveis.map((valor) => <option key={valor} value={valor}>{valor}</option>)}
            </select>
          </label>
        </div>
        <div className="fila-periodo">
          <div className="periodo-atalhos" role="group" aria-label="Período">
            {(["hoje", "7", "30", "tudo"] as const).map((atalho) => (
              <button
                key={atalho}
                type="button"
                className={filtro.atalho === atalho ? "periodo-atalho ativo" : "periodo-atalho"}
                onClick={() => escolherPeriodo(atalho)}
              >
                {atalho === "hoje" ? "Hoje" : atalho === "7" ? "7 dias" : atalho === "30" ? "30 dias" : "Tudo"}
              </button>
            ))}
          </div>
          <label>
            De
            <input
              type="date"
              value={filtro.de}
              onChange={(event) => patch({ de: event.target.value, atalho: null })}
            />
          </label>
          <label>
            Até
            <input
              type="date"
              value={filtro.ate}
              onChange={(event) => patch({ ate: event.target.value, atalho: null })}
            />
          </label>
          <label className="fila-check">
            <input type="checkbox" checked={filtro.abertos} onChange={(event) => patch({ abertos: event.target.checked })} />
            <span>Só em aberto</span>
          </label>
          <label className="fila-check">
            <input type="checkbox" checked={filtro.atraso} onChange={(event) => patch({ atraso: event.target.checked })} />
            <span>Em atraso</span>
          </label>
          {ativo && (
            <button type="button" className="periodo-atalho" onClick={() => setFiltro(FILTRO_INICIAL)}>
              Limpar
            </button>
          )}
        </div>
        <div className="fila-vistas">
          <fieldset className="vistas">
            <legend className="sr-only">Visualização da fila</legend>
            {OPCOES.map((item) => (
              <label key={item.id} className="vista-opcao">
                <input
                  type="radio"
                  name="vista-fila"
                  checked={vista === item.id}
                  onChange={() => definirVista(item.id)}
                />
                <span>{item.rotulo}</span>
              </label>
            ))}
          </fieldset>
          <p className="fila-vista-nota">
            {opcao.nota}. <span>Salva para o seu usuário.</span>
          </p>
          <p className="fila-contagem">
            {ativo ? `${visiveis.length} de ${itens.length}` : `${itens.length}`} {itens.length === 1 ? "chamado" : "chamados"}
          </p>
        </div>
      </div>
      {visiveis.length === 0 ? (
        <p className="fila-vazio">Nenhum chamado com esses filtros.</p>
      ) : (
        <div className={`fila-vista vista-${vista}`}>
          {vista === "grade" && <Grade itens={visiveis} destacar={destacar} onAbrir={(id) => navigate(`/demandas/${id}`)} />}
          {vista === "cartoes" && <Cartoes itens={visiveis} destacar={destacar} onAbrir={(id) => navigate(`/demandas/${id}`)} />}
          {vista === "pulso" && <Pulso itens={visiveis} destacar={destacar} onAbrir={(id) => navigate(`/demandas/${id}`)} />}
        </div>
      )}
    </Panel>
  );
}

function filtrar(itens: FilaItem[], filtro: Filtro) {
  const texto = normalizar(filtro.texto.trim());
  return itens.filter((item) => {
    if (filtro.situacao && item.situacao !== filtro.situacao) return false;
    if (filtro.prioridade && item.prioridade !== filtro.prioridade) return false;
    if (filtro.servico && item.servico !== filtro.servico) return false;
    if (filtro.responsavel && item.responsavel !== filtro.responsavel) return false;
    if (filtro.abertos && encerrada(item.situacao)) return false;
    if (filtro.atraso && !emAtraso(item)) return false;
    const dia = diaDoItem(item.abertoEm);
    if (filtro.de && dia < filtro.de) return false;
    if (filtro.ate && dia > filtro.ate) return false;
    if (!texto) return true;
    const alvo = normalizar(`${item.protocolo} ${item.cessionario} ${item.servico} ${item.responsavel} ${item.situacao} ${item.prioridade}`);
    return alvo.includes(texto);
  });
}

function filtroAtivo(filtro: Filtro) {
  return Boolean(
    filtro.texto.trim()
    || filtro.situacao
    || filtro.prioridade
    || filtro.servico
    || filtro.responsavel
    || filtro.de
    || filtro.ate
    || filtro.abertos
    || filtro.atraso,
  );
}

function Grade({ itens, destacar, onAbrir }: { itens: FilaItem[]; destacar?: Set<string>; onAbrir: (id: string) => void }) {
  return (
    <>
    <table>
      <thead>
        <tr>
          <th>Prioridade</th>
          <th>Protocolo</th>
          <th>Cessionário</th>
          <th>Serviço</th>
          <th>Situação</th>
          <th>Responsável</th>
          <th>Tempo</th>
        </tr>
      </thead>
      <tbody>
        {itens.map((item) => (
          <tr key={item.id} className="clickable" onClick={() => onAbrir(item.id)}>
            <td><Badge valor={item.prioridade} /></td>
            <td>{item.protocolo}{destacar?.has(item.id) && <span className="dot" />}</td>
            <td>{item.cessionario}</td>
            <td>{item.servico}</td>
            <td><Badge valor={item.situacao} />{emAtraso(item) && <> <Badge valor="Em atraso" /></>}</td>
            <td>{item.responsavel}</td>
            <td>{item.situacao === "Concluído" ? "—" : tempoRelativo(item.abertoEm)}</td>
          </tr>
        ))}
      </tbody>
    </table>
    </>
  );
}

function Cartoes({ itens, destacar, onAbrir }: { itens: FilaItem[]; destacar?: Set<string>; onAbrir: (id: string) => void }) {
  return (
    <div className="cards">
      {itens.map((item) => (
        <a
          key={item.id}
          className={emAtraso(item) ? "demand-card atraso" : "demand-card"}
          href={`/demandas/${item.id}`}
          onClick={(event) => {
            event.preventDefault();
            onAbrir(item.id);
          }}
        >
          <strong>{item.protocolo}{destacar?.has(item.id) && <span className="dot" />}</strong>
          <span>{item.cessionario} · {item.servico}</span>
          <span className="motivos">
            <Badge valor={item.prioridade} />
            <Badge valor={item.situacao} />
            {emAtraso(item) && <Badge valor="Em atraso" />}
          </span>
          <span className="note">{item.responsavel} · {item.situacao === "Concluído" ? "Concluído" : tempoRelativo(item.abertoEm)}</span>
        </a>
      ))}
    </div>
  );
}

function Pulso({ itens, destacar, onAbrir }: { itens: FilaItem[]; destacar?: Set<string>; onAbrir: (id: string) => void }) {
  const agora = Date.now();
  const idades = itens
    .filter((item) => item.situacao !== "Concluído")
    .map((item) => agora - new Date(item.abertoEm).getTime());
  const maior = Math.max(1, ...idades);
  const conhecidas = new Set(FAIXAS);
  const grupos = [
    ...FAIXAS.map((nome) => ({ nome, itens: itens.filter((item) => item.prioridade === nome) })),
    { nome: "Outras", itens: itens.filter((item) => !conhecidas.has(item.prioridade)) },
  ].filter((grupo) => grupo.itens.length > 0);

  return (
    <div className="pulso">
      {grupos.map((grupo) => (
        <section key={grupo.nome} className="pulso-faixa-grupo">
          <header>
            <h3>{grupo.nome}</h3>
            <span>{grupo.itens.length}</span>
          </header>
          <ul>
            {grupo.itens
              .slice()
              .sort((a, b) => new Date(a.abertoEm).getTime() - new Date(b.abertoEm).getTime())
              .map((item) => {
                const idade = item.situacao === "Concluído" ? 0 : Math.max(0, agora - new Date(item.abertoEm).getTime());
                const largura = item.situacao === "Concluído" ? 100 : Math.max(12, Math.round((idade / maior) * 100));
                const tom = item.situacao === "Concluído" ? "encerrado" : item.prioridade === "Alta" ? "alta" : item.prioridade === "Média" ? "media" : "normal";
                return (
                  <li key={item.id}>
                    <a
                      className={`pulso-item ${tom}`}
                      href={`/demandas/${item.id}`}
                      style={{ ["--idade" as string]: `${largura}%` }}
                      onClick={(event) => {
                        event.preventDefault();
                        onAbrir(item.id);
                      }}
                    >
                      <span className="pulso-trilho" aria-hidden="true" />
                      <span className="pulso-corpo">
                        <strong>{item.protocolo}{destacar?.has(item.id) && <span className="dot" />}</strong>
                        <span>{item.cessionario} · {item.servico}</span>
                      </span>
                      <span className="pulso-meta">
                        <Badge valor={item.situacao} />
                        {emAtraso(item) && <Badge valor="Em atraso" />}
                        <span className="note">{item.responsavel} · {item.situacao === "Concluído" ? "Concluído" : tempoRelativo(item.abertoEm)}</span>
                      </span>
                    </a>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}
