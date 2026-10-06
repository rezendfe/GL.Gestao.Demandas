import { useEffect, useState } from "react";
import { useComunicados, useNotificacoes } from "../../application/hooks";
import { distribuirManutencao } from "../../domain/atuacao";
import { COLUNAS_CADEIA } from "../../domain/cadeia";
import { emAtraso, marcoAtraso } from "../../domain/operacao";
import { destinoRecorte, encerrada, itensDoRecorte } from "../../domain/recorte";
import { destinoDaNotificacao, type FilaItem } from "../../domain/types";
import { PainelModelo, type AtrasoModelo, type EtapaModelo } from "../components/PainelModelo";
import { PerguntaAtendimento } from "../components/PerguntaAtendimento";
import { faixaAviso, LinhaAviso } from "../components/LinhaAviso";
import { Panel } from "../components/Panel";
import { useAcoesDaPagina } from "../components/AcoesRapidas";
import { ativarAvisosCelular, avisosCelularHabilitados, textoResultadoAviso } from "../notificacaoCelular";

interface Props {
  fila: FilaItem[];
  carregando: boolean;
  erro: string | null;
  aoMudar: () => Promise<void>;
}

const ETAPAS = COLUNAS_CADEIA.map((coluna) => ({
  nome: coluna.nome,
  detalhe: coluna.detalhe,
  situacoes: coluna.situacoes,
  recorte: coluna.codigo,
}));

export function ResumoCessionario({ fila, carregando, erro, aoMudar }: Props) {
  const { dados: notas, recarregar: recarregarNotas } = useNotificacoes();
  const avisos = notas ?? [];
  const abertos = itensDoRecorte(fila, "abertas", null);
  const concluidas = itensDoRecorte(fila, "concluidas", null);
  const paraAvaliar = concluidas.filter((item) => item.notaAvaliacao === null);
  const recentes = [...avisos].sort((a, b) => new Date(b.criadaEm).getTime() - new Date(a.criadaEm).getTime());
  const semResposta = recentes.filter((nota) => !nota.lida);
  const visiveis = recentes.slice(0, 4);
  const { dados: comunicados } = useComunicados();
  const avisosComunicado = (comunicados ?? []).filter((item) => !item.lido);
  const [celular, setCelular] = useState(() => window.matchMedia("(max-width: 900px)").matches);
  const [celularHabilitado, setCelularHabilitado] = useState<boolean | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [avisoAtivacao, setAvisoAtivacao] = useState<string | null>(null);
  const pedirHabilitacao = celularHabilitado === false;
  const mostrarMensagens = visiveis.length > 0 || pedirHabilitacao || avisosComunicado.length > 0;

  useEffect(() => {
    const consulta = window.matchMedia("(max-width: 900px)");
    const atualizar = () => setCelular(consulta.matches);
    consulta.addEventListener("change", atualizar);
    return () => consulta.removeEventListener("change", atualizar);
  }, []);

  useEffect(() => {
    let ativo = true;
    void avisosCelularHabilitados()
      .then((habilitado) => {
        if (ativo) setCelularHabilitado(habilitado);
      })
      .catch(() => {
        if (ativo) setCelularHabilitado(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  async function habilitarCelular() {
    setOcupado(true);
    setAvisoAtivacao(null);
    try {
      const resultado = await ativarAvisosCelular();
      if (resultado === "granted") setCelularHabilitado(true);
      setAvisoAtivacao(textoResultadoAviso(resultado, celular));
    } catch {
      setAvisoAtivacao("Não foi possível ativar o alerta neste aparelho.");
    } finally {
      setOcupado(false);
    }
  }

  useAcoesDaPagina(pedirHabilitacao ? [{
    id: "alerta-aparelho",
    rotulo: ocupado ? "Ativando..." : celular ? "Ativar alerta neste celular" : "Ativar alerta neste computador",
    rotuloOcupado: "Ativando...",
    icone: "sino",
    executar: () => habilitarCelular(),
  }] : []);

  return (
    <>
      {erro && <p className="erro">{erro}</p>}
      {carregando && <p>Carregando o painel...</p>}
      {!carregando && (
        <>
          <PainelModelo
            progresso={fila.length === 0 ? 0 : Math.round((concluidas.length / fila.length) * 100)}
            progressoPara={destinoRecorte("Cessionário", concluidas, "concluidas")}
            etapas={etapasDe(fila)}
            prazo={prazoDe(fila)}
            tituloServicos="Por serviço"
            servicos={distribuirManutencao(fila).map((item) => ({
              nome: item.nome,
              quantidade: item.quantidade,
              largura: item.largura,
              para: destinoRecorte("Cessionário", item.itens, "", undefined, item.nome),
            }))}
            tituloVolume="Minha fila"
            volumes={volumesDe(fila, abertos, concluidas)}
            atrasos={fila.filter((item) => emAtraso(item)).slice(0, 5).map(linhaAtraso)}
            atrasoVazio="Nenhum chamado com o prazo vencido."
          />
          {paraAvaliar.length > 0 && (
            <Panel title="Como foi o atendimento">
              <p className="dash-nota">Cada serviço concluído pede a sua nota, de 0 a 10. Isso orienta o tratamento da operação.</p>
              <div className="lista-chamados">
                {paraAvaliar.map((item) => (
                  <PerguntaAtendimento
                    key={item.id}
                    id={item.id}
                    protocolo={item.protocolo}
                    aoEnviar={async () => {
                      await aoMudar();
                      await recarregarNotas();
                    }}
                  />
                ))}
              </div>
            </Panel>
          )}
          {mostrarMensagens && (
            <Panel title="Mensagens">
              {visiveis.length === 0 ? (
                <p>Nenhuma mensagem recente.</p>
              ) : (
                <>
                  {semResposta.length > 0 && (
                    <p className="pedido-atencao">
                      {semResposta.length === 1
                        ? "1 mensagem pede a sua atenção e uma resposta."
                        : `${semResposta.length} mensagens pedem a sua atenção e uma resposta.`}
                    </p>
                  )}
                  <ul className="aviso-lista">
                    {visiveis.map((nota, indice) => (
                      <li key={nota.id}>
                        <LinhaAviso
                          iso={nota.criadaEm}
                          texto={nota.texto}
                          complemento={nota.protocolo || "Chamado"}
                          cor={faixaAviso(indice)}
                          destaque={!nota.lida}
                          para={destinoDaNotificacao(nota)}
                        />
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {avisosComunicado.length > 0 && (
                <ul className="aviso-lista">
                  {avisosComunicado.map((item, indice) => (
                    <li key={item.id}>
                      <LinhaAviso
                        iso={item.publicadoEm}
                        texto={item.titulo}
                        complemento="Comunicado"
                        cor={faixaAviso(visiveis.length + indice)}
                        destaque
                        para={`/comunicados/${item.id}`}
                      />
                    </li>
                  ))}
                </ul>
              )}
              {avisoAtivacao && <p className="note">{avisoAtivacao}</p>}
            </Panel>
          )}
        </>
      )}
    </>
  );
}

function etapasDe(fila: FilaItem[]): EtapaModelo[] {
  const contagens = ETAPAS.map((etapa) => fila.filter((item) => etapa.situacoes.includes(item.situacao)).length);
  return ETAPAS.map((etapa, indice) => {
    const quantidade = contagens[indice];
    const posteriores = contagens.slice(indice + 1).some((valor) => valor > 0);
    const estado = quantidade === 0 && posteriores ? "feita" : quantidade > 0 && indice === ETAPAS.length - 1 ? "feita" : quantidade > 0 ? "curso" : "espera";
    const itens = fila.filter((item) => etapa.situacoes.includes(item.situacao));
    return {
      nome: etapa.nome.replace(" do cliente", ""),
      detalhe: estado === "feita" ? "Concluída" : estado === "curso" ? "Em curso" : "Aguardando",
      estado,
      percentual: fila.length === 0 ? 0 : Math.round((quantidade / fila.length) * 100),
      para: destinoRecorte("Cessionário", itens, etapa.recorte),
    };
  });
}

function volumesDe(fila: FilaItem[], abertos: FilaItem[], concluidas: FilaItem[]) {
  const grupos = [
    { nome: "Em aberto", itens: abertos, recorte: "abertas" },
    { nome: "Em atendimento", itens: itensDoRecorte(fila, "atendimento", null), recorte: "atendimento" },
    { nome: "Concluídas", itens: concluidas, recorte: "concluidas" },
  ];
  const maior = Math.max(1, ...grupos.map((grupo) => grupo.itens.length));
  return grupos.map((grupo) => ({
    nome: grupo.nome,
    quantidade: grupo.itens.length,
    largura: Math.round((grupo.itens.length / maior) * 100),
    para: destinoRecorte("Cessionário", grupo.itens, grupo.recorte),
  }));
}

function prazoDe(fila: FilaItem[]) {
  const item = fila
    .filter((atual) => !encerrada(atual.situacao) && atual.previsaoAtendimento)
    .sort((a, b) => new Date(a.previsaoAtendimento ?? 0).getTime() - new Date(b.previsaoAtendimento ?? 0).getTime())[0];
  if (!item?.previsaoAtendimento) return null;
  const alvo = new Date(item.previsaoAtendimento);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  alvo.setHours(0, 0, 0, 0);
  const dias = Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
  return {
    data: new Date(item.previsaoAtendimento).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }),
    dias: `${Math.abs(dias)} dias`,
    detalhe: dias >= 0 ? item.protocolo : `${item.protocolo} em atraso`,
    para: `/demandas/${item.id}`,
  };
}

function linhaAtraso(item: FilaItem): AtrasoModelo {
  const dias = Math.max(1, Math.round((Date.now() - new Date(marcoAtraso(item)).getTime()) / 86400000));
  return {
    id: item.id,
    dias,
    chamado: item.protocolo,
    prazo: new Date(marcoAtraso(item)).toLocaleDateString("pt-BR"),
    para: `/demandas/${item.id}`,
  };
}
