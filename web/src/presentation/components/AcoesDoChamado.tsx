import { useEffect, useState } from "react";
import { proximaEtapa, proximoPassoDemanda, rotuloDoAvanco, tarefasDa, trilhaDoChamado } from "../../domain/cadeia";
import { validarTexto } from "../../domain/entrada";
import { quandoAtende, relogioInformado, type Catalogo, type DetalheDemanda, type EtapaCadeia, type Perfil } from "../../domain/types";
import { ApiError, api } from "../../infrastructure/api/client";
import { Badge } from "./Badge";
import { Panel } from "./Panel";

const FECHADAS = ["Concluído", "Reprovado", "Encerrada", "Cancelada"];

export function AcoesDoChamado({
  perfil,
  dados,
  etapas,
  catalogo,
  onExecutar,
  onAvancar,
  onAvaliar,
  onComunicacao,
}: {
  perfil: Perfil | undefined;
  dados: DetalheDemanda;
  etapas: EtapaCadeia[];
  catalogo: Catalogo | null;
  onExecutar: (acao: () => Promise<unknown>) => Promise<void>;
  onAvancar: () => void;
  onAvaliar: () => void;
  onComunicacao: () => void;
}) {
  const passos = trilhaDoChamado(dados.situacao, etapas);
  const destino = proximaEtapa(dados.situacao, etapas);
  const etapaAtual = passos.find((passo) => passo.marco === "atual")?.etapa ?? null;
  const seguintes = passos.filter((passo) => passo.marco === "proxima" || passo.marco === "futura");
  const fechado = FECHADAS.includes(dados.situacao);
  const pendente = dados.classificacao !== "Confirmada";
  const faltaPrevisao = Boolean(
    etapaAtual?.codigo === "atendimento"
    && tarefasDa(etapaAtual).some((tarefa) => tarefa.codigo === "previsao" && tarefa.obrigatoria)
    && !dados.previsaoAtendimento
    && perfil
    && perfil !== "Cessionário",
  );
  const passo = perfil
    ? proximoPassoDemanda(perfil, dados.situacao, destino, dados.notaAvaliacao === null)
    : null;
  const [subcategoriaId, setSubcategoriaId] = useState("");
  const [alterandoClasse, setAlterandoClasse] = useState(false);
  const [areaId, setAreaId] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
  const [editandoDirecao, setEditandoDirecao] = useState(false);
  const [quando, setQuando] = useState("");
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    setSubcategoriaId("");
    setAlterandoClasse(false);
    setAreaId("");
    setResponsavelId("");
    setEditandoDirecao(false);
    setMotivo("");
  }, [dados.id, dados.subcategoriaId, dados.classificacao, dados.areaId, dados.responsavel?.id]);

  useEffect(() => {
    setQuando(dados.previsaoAtendimento ? paraLocal(dados.previsaoAtendimento) : "");
  }, [dados.id, dados.previsaoAtendimento]);

  const subAtual = subcategoriaId || dados.subcategoriaId;
  const classeAlterada = subAtual !== dados.subcategoriaId;
  const areaAtual = areaId || dados.areaId;
  const responsavelAtual = editandoDirecao ? responsavelId : (dados.responsavel?.id ?? "");
  const direcaoAlterada = editandoDirecao && (
    areaAtual !== dados.areaId || responsavelAtual !== (dados.responsavel?.id ?? "")
  );
  const quandoSalvo = dados.previsaoAtendimento ? paraLocal(dados.previsaoAtendimento) : "";
  const previsaoAlterada = quando !== quandoSalvo && quando !== "";
  const confirmarClasse = perfil === "GL / Administrador" && (pendente || classeAlterada);

  function exigirMotivo() {
    const invalido = validarTexto(motivo, 1, 2000, motivo.trim() ? "O motivo tem no máximo 2000 caracteres." : "Informe o motivo.");
    if (invalido) throw new ApiError(invalido, 400);
    return motivo;
  }

  const texto = pendente && perfil === "GL / Administrador"
    ? "A classificação ainda é sugestão. Confirme o tipo para o chamado seguir a cadeia."
    : faltaPrevisao
      ? "Informe quando o atendimento acontece. Essa tarefa da cadeia é obrigatória."
      : textoDoPasso(dados.situacao, perfil, passo?.texto ?? "Acompanhe o histórico do chamado.", Boolean(dados.notaAvaliacao === null));

  return (
    <Panel title="Cadeia do chamado">
      <p className="trilha-tipo">
        {pendente ? "Sugestão" : "Cadeia"} de {dados.categoria} · {dados.subcategoria}
      </p>
      <ol className="trilha" aria-label="Por onde o chamado já passou e o que vem depois">
        {passos.map((passoTrilha, indice) => (
          <li
            key={passoTrilha.etapa.codigo}
            className={`trilha-passo ${passoTrilha.marco}`}
            aria-current={passoTrilha.marco === "atual" ? "step" : undefined}
          >
            <div className="trilha-eixo">
              <span className="trilha-marca" aria-hidden="true">
                {passoTrilha.marco === "feita" ? "✓" : passoTrilha.etapa.ordem}
              </span>
              {indice < passos.length - 1 && <span className="trilha-linha" />}
            </div>
            <div className="trilha-corpo">
              <strong>{passoTrilha.etapa.nome}</strong>
              <span>{passoTrilha.estado}</span>
            </div>
          </li>
        ))}
      </ol>

      <div className="trilha-agora">
        <p className="trilha-kicker">
          {pendente && perfil === "GL / Administrador" ? "Antes de seguir" : "Agora"}
          {!(pendente && perfil === "GL / Administrador") && <> <Badge valor={dados.situacao} /></>}
        </p>
        <h3>{pendente && perfil === "GL / Administrador" ? "Confirmar classificação" : etapaAtual?.nome ?? "Chamado"}</h3>
        <p>{texto}</p>
        {pendente && perfil === "GL / Administrador" && (
          <SeletorClassificacao catalogo={catalogo} valor={subAtual} onChange={setSubcategoriaId} />
        )}
        {confirmarClasse && pendente && (
          <button className="btn" type="button" onClick={() => void onExecutar(() => api.classificar(dados.id, subAtual))}>
            Confirmar classificação
          </button>
        )}
        {!pendente && faltaPrevisao && (
          <CampoQuando quando={quando} onChange={setQuando} />
        )}
        {!pendente && faltaPrevisao && previsaoAlterada && (
          <button className="btn" type="button" onClick={() => void onExecutar(() => api.previsao(dados.id, relogioInformado(quando)))}>
            Salvar previsão
          </button>
        )}
        {!pendente && !faltaPrevisao && dados.previsaoAtendimento && etapaAtual?.codigo === "atendimento" && (
          <p className="trilha-fato">Previsto para {quandoAtende(dados.previsaoAtendimento)}</p>
        )}
        {!pendente && !faltaPrevisao && passo?.acao === "aprovar" && perfil === "GL / Administrador" && (
          <DecisaoAprovacao
            motivo={motivo}
            onMotivo={setMotivo}
            onAprovar={() => void onExecutar(() => api.aprovar(dados.id, "Aprovar"))}
            onAjuste={() => void onExecutar(async () => api.aprovar(dados.id, "Solicitar ajuste", exigirMotivo()))}
            onReprovar={() => void onExecutar(async () => api.aprovar(dados.id, "Reprovar", exigirMotivo()))}
            onCancelar={() => void onExecutar(async () => api.cancelar(dados.id, exigirMotivo()))}
          />
        )}
        {!pendente && !faltaPrevisao && passo?.acao === "avancar" && destino && (
          <button className="btn" type="button" onClick={onAvancar}>
            {rotuloDoAvanco(dados.situacao, destino)}
          </button>
        )}
        {!pendente && !faltaPrevisao && passo?.acao === "encerrar" && (
          <button className="btn" type="button" onClick={() => void onExecutar(() => api.encerrar(dados.id))}>
            Encerrar chamado
          </button>
        )}
        {!pendente && !faltaPrevisao && passo?.acao === "avaliar" && (
          <button className="btn" type="button" onClick={onAvaliar}>Avaliar o atendimento</button>
        )}
        {!pendente && !faltaPrevisao && dados.situacao === "Aguardando ajuste" && perfil === "Cessionário" && (
          <button className="btn" type="button" onClick={onComunicacao}>Enviar o ajuste</button>
        )}
      </div>

      {seguintes.length > 0 && (
        <p className="trilha-depois">
          Próximos passos: {seguintes.map((item) => item.etapa.automatica ? `${item.etapa.nome} (passa sozinha)` : item.etapa.nome).join(" → ")}
        </p>
      )}

      {perfil === "GL / Administrador" && !fechado && !pendente && (
        <details className="trilha-ajustes">
          <summary>
            Ajustes do chamado
            {!dados.responsavel ? " · responsável a definir" : ""}
          </summary>
          <div className="trilha-ajuste">
            <p className="trilha-fato">{dados.categoria} · {dados.subcategoria}</p>
            {!alterandoClasse && (
              <button className="btn secondary" type="button" onClick={() => setAlterandoClasse(true)}>
                Alterar classificação
              </button>
            )}
            {alterandoClasse && (
              <SeletorClassificacao catalogo={catalogo} valor={subAtual} onChange={setSubcategoriaId} />
            )}
            {confirmarClasse && (
              <button className="btn" type="button" onClick={() => void onExecutar(() => api.classificar(dados.id, subAtual))}>
                Confirmar classificação
              </button>
            )}
          </div>
          <div className="trilha-ajuste">
            {!editandoDirecao && (
              <>
                <p className="trilha-fato">
                  {dados.area} · {dados.responsavel?.nome ?? "Responsável a definir"}
                </p>
                <button
                  className="btn secondary"
                  type="button"
                  onClick={() => {
                    setAreaId(dados.areaId);
                    setResponsavelId(dados.responsavel?.id ?? "");
                    setEditandoDirecao(true);
                  }}
                >
                  Alterar direcionamento
                </button>
              </>
            )}
            {editandoDirecao && (
              <>
                <label>
                  Direcionar para
                  <select value={areaAtual} onChange={(event) => {
                    const proxima = event.target.value;
                    setAreaId(proxima);
                    const pessoa = catalogo?.responsaveis.find((item) => item.id === responsavelId);
                    if (pessoa && pessoa.areaId !== proxima) setResponsavelId("");
                  }}>
                    {catalogo?.areas.filter((area) => area.ativa !== false || area.id === areaAtual).map((area) => (
                      <option key={area.id} value={area.id}>{area.nome}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Responsável
                  <select value={responsavelId} onChange={(event) => setResponsavelId(event.target.value)}>
                    <option value="">A definir</option>
                    {catalogo?.responsaveis.filter((pessoa) => (pessoa.ativo !== false || pessoa.id === responsavelId) && pessoa.areaId === areaAtual).map((pessoa) => (
                      <option key={pessoa.id} value={pessoa.id}>{pessoa.nome}</option>
                    ))}
                  </select>
                </label>
              </>
            )}
            {direcaoAlterada && (
              <button className="btn" type="button" onClick={() => void onExecutar(() => api.redirecionar(dados.id, areaAtual, responsavelId || null))}>
                Redirecionar
              </button>
            )}
          </div>
          {!faltaPrevisao && (
            <div className="trilha-ajuste">
              <CampoQuando quando={quando} onChange={setQuando} />
              {previsaoAlterada && (
                <button className="btn" type="button" onClick={() => void onExecutar(() => api.previsao(dados.id, relogioInformado(quando)))}>
                  Salvar previsão
                </button>
              )}
            </div>
          )}
          {dados.situacao !== "Aguardando aprovação" && (
            <div className="trilha-ajuste">
              <label>
                Motivo do cancelamento
                <textarea maxLength={2000} value={motivo} onChange={(event) => setMotivo(event.target.value)} />
              </label>
              {motivo.trim() && (
                <button className="btn danger" type="button" onClick={() => void onExecutar(async () => api.cancelar(dados.id, exigirMotivo()))}>
                  Cancelar chamado
                </button>
              )}
            </div>
          )}
        </details>
      )}

      {perfil === "Responsável da Área" && !fechado && !faltaPrevisao && (
        <details className="trilha-ajustes">
          <summary>Ajustar a previsão</summary>
          <div className="trilha-ajuste">
            <CampoQuando quando={quando} onChange={setQuando} />
            {previsaoAlterada && (
              <button className="btn" type="button" onClick={() => void onExecutar(() => api.previsao(dados.id, relogioInformado(quando)))}>
                Salvar previsão
              </button>
            )}
          </div>
        </details>
      )}
    </Panel>
  );
}

function textoDoPasso(situacao: string, perfil: Perfil | undefined, texto: string, semNota: boolean) {
  if (situacao === "Aguardando aprovação" && perfil === "GL / Administrador") return "Decida se o chamado segue na cadeia.";
  if (situacao === "Aguardando aprovação") return "Aguardando a decisão do GL / Administrador.";
  if (situacao === "Aguardando ajuste" && perfil === "Cessionário") return "O GL / Administrador pediu um ajuste. Envie na comunicação.";
  if (situacao === "Aguardando ajuste") return "Aguardando o ajuste do Cessionário.";
  if ((situacao === "Em andamento" || situacao === "Liberado para execução") && perfil === "Cessionário") {
    return "Aguardando o atendimento do Responsável da Área.";
  }
  if ((situacao === "Em andamento" || situacao === "Liberado para execução") && texto === "Validação do cliente") {
    return "Registre o atendimento desta área. O Cessionário valida em seguida.";
  }
  if (situacao === "Aguardando validação" && perfil === "Cessionário") return "Confirme se o serviço foi realizado.";
  if (situacao === "Aguardando validação") return "Aguardando a validação do Cessionário.";
  if (situacao === "Encerrada" && perfil === "Cessionário" && semNota) return "O chamado está encerrado. Avalie o atendimento.";
  if (situacao === "Encerrada" || situacao === "Cancelada" || situacao === "Reprovado") {
    return "Status final. Não é possível enviar mensagem, documento ou alterar o atendimento.";
  }
  if (situacao === "Concluído" && perfil === "GL / Administrador") return "O serviço foi concluído. Encerre o chamado.";
  if (situacao === "Concluído" && perfil === "Cessionário" && semNota) return "O serviço foi concluído. Avalie o atendimento.";
  if (situacao === "Concluído" && perfil === "Cessionário") return "Você já avaliou este atendimento.";
  if (texto.startsWith("Aguardar") || texto.startsWith("Acompanhar")) return texto;
  return `O próximo passo da cadeia é ${texto}.`;
}

function SeletorClassificacao({
  catalogo,
  valor,
  onChange,
}: {
  catalogo: Catalogo | null;
  valor: string;
  onChange: (valor: string) => void;
}) {
  return (
    <label>
      Classificação
      <select value={valor} onChange={(event) => onChange(event.target.value)}>
        {catalogo?.categorias.flatMap((categoria) => categoria.ativa ? categoria.subcategorias.filter((sub) => sub.ativa).map((sub) => (
          <option key={sub.id} value={sub.id}>{categoria.nome} · {sub.nome}</option>
        )) : [])}
      </select>
    </label>
  );
}

function CampoQuando({ quando, onChange }: { quando: string; onChange: (valor: string) => void }) {
  return (
    <label>
      Quando será atendido
      <input type="datetime-local" value={quando} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function DecisaoAprovacao({
  motivo,
  onMotivo,
  onAprovar,
  onAjuste,
  onReprovar,
  onCancelar,
}: {
  motivo: string;
  onMotivo: (valor: string) => void;
  onAprovar: () => void;
  onAjuste: () => void;
  onReprovar: () => void;
  onCancelar: () => void;
}) {
  return (
    <>
      <label>
        Motivo, se houver ajuste, reprovação ou cancelamento
        <textarea maxLength={2000} value={motivo} onChange={(event) => onMotivo(event.target.value)} />
      </label>
      <div className="row">
        <button className="btn" type="button" onClick={onAprovar}>Aprovar</button>
        <button className="btn secondary" type="button" onClick={onAjuste}>Solicitar ajuste</button>
        <button className="btn danger" type="button" onClick={onReprovar}>Reprovar</button>
        {motivo.trim() && (
          <button className="btn danger" type="button" onClick={onCancelar}>Cancelar chamado</button>
        )}
      </div>
    </>
  );
}

function paraLocal(iso: string) {
  const data = new Date(iso);
  const local = new Date(data.getTime() - data.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
