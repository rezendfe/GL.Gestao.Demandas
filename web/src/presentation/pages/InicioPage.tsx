import { useFila, useObras } from "../../application/hooks";
import { useSessao } from "../../application/session";
import { distribuirManutencao, porCessionario } from "../../domain/atuacao";
import { COLUNAS_CADEIA } from "../../domain/cadeia";
import { emAtraso, marcoAtraso } from "../../domain/operacao";
import { destinoRecorte, encerrada, itensDoRecorte } from "../../domain/recorte";
import { type FilaItem, type Obra } from "../../domain/types";
import { baixarPlanilha } from "../../domain/cargaCadastro";
import { useAcoesDaPagina } from "../components/AcoesRapidas";
import { type AtrasoModelo, type BarraModelo, type EtapaModelo, PainelModelo } from "../components/PainelModelo";
import { ResumoCessionario } from "./ResumoCessionario";

const ETAPAS = COLUNAS_CADEIA.map((coluna) => ({
  nome: coluna.nome,
  detalhe: coluna.detalhe,
  situacoes: coluna.situacoes,
  recorte: coluna.codigo,
}));

function diasAte(iso: string) {
  const alvo = new Date(iso);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  alvo.setHours(0, 0, 0, 0);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
}

function dataCurta(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function diasEmAberto(item: FilaItem) {
  const marco = marcoAtraso(item);
  return Math.max(1, Math.round((Date.now() - new Date(marco).getTime()) / 86400000));
}

export function InicioPage() {
  const { sessao } = useSessao();
  const { dados, erro, carregando, recarregar } = useFila();
  const { dados: obras } = useObras();
  const perfil = sessao?.usuario.perfil ?? "Cessionário";
  const fila = dados ?? [];
  useAcoesDaPagina(perfil === "Cessionário" ? [] : [
    {
      id: "exportar-planilha",
      rotulo: "Exportar planilha",
      rotuloOcupado: "Gerando planilha...",
      icone: "planilha",
      executar: () => exportarAtrasos(fila),
    },
  ]);

  if (perfil === "Cessionário") {
    return <ResumoCessionario fila={fila} carregando={carregando} erro={erro} aoMudar={recarregar} />;
  }

  const concluidas = itensDoRecorte(fila, "concluidas", null);
  const progresso = fila.length === 0 ? 0 : Math.round((concluidas.length / fila.length) * 100);
  const contagens = ETAPAS.map((etapa) => fila.filter((item) => etapa.situacoes.includes(item.situacao)).length);
  const etapas: EtapaModelo[] = ETAPAS.map((etapa, indice) => {
    const quantidade = contagens[indice];
    const posteriores = contagens.slice(indice + 1).some((valor) => valor > 0);
    const estado = quantidade === 0 && posteriores ? "feita" : quantidade > 0 && indice === ETAPAS.length - 1 ? "feita" : quantidade > 0 ? "curso" : "espera";
    const itens = fila.filter((item) => etapa.situacoes.includes(item.situacao));
    return {
      nome: etapa.nome.replace(" do cliente", ""),
      detalhe: estado === "feita" ? "Concluída" : estado === "curso" ? "Em curso" : "Aguardando",
      estado,
      percentual: fila.length === 0 ? 0 : Math.round((quantidade / fila.length) * 100),
      para: destinoRecorte(perfil, itens, etapa.recorte),
    };
  });
  const prazo = prazoDaFila(fila, perfil) ?? (perfil === "GL / Administrador" ? prazoDaObra(obras?.[0]) : null);
  const servicos = distribuirManutencao(fila).map((item) => ({
    nome: item.nome,
    quantidade: item.quantidade,
    largura: item.largura,
    para: destinoRecorte(perfil, item.itens, "", undefined, item.nome),
  }));
  const volumes: BarraModelo[] = perfil === "GL / Administrador"
    ? porCessionario(fila).map((item) => ({
        nome: item.nome,
        quantidade: item.quantidade,
        largura: item.largura,
        para: destinoRecorte(perfil, item.itens, "", undefined, undefined, item.nome),
      }))
    : ETAPAS.map((etapa) => {
        const itens = fila.filter((item) => etapa.situacoes.includes(item.situacao));
        const maior = Math.max(1, ...contagens);
        return {
          nome: etapa.nome.replace(" do cliente", ""),
          quantidade: itens.length,
          largura: Math.round((itens.length / maior) * 100),
          para: destinoRecorte(perfil, itens, etapa.recorte),
        };
      });
  const atrasos = fila
    .filter((item) => emAtraso(item))
    .sort((a, b) => diasEmAberto(b) - diasEmAberto(a))
    .slice(0, 5)
    .map((item) => linhaAtraso(item));

  return (
    <>
      {erro && <p className="erro">{erro}</p>}
      {carregando && <p>Carregando o painel...</p>}
      {!carregando && (
        <PainelModelo
          progresso={progresso}
          progressoPara={destinoRecorte(perfil, concluidas, "concluidas")}
          etapas={etapas}
          prazo={prazo}
          tituloServicos="Por serviço"
          servicos={servicos}
          tituloVolume={perfil === "GL / Administrador" ? "Por cessionário" : "Por etapa"}
          volumes={volumes}
          atrasos={atrasos}
          atrasoVazio="Nenhum chamado com o prazo vencido."
        />
      )}
    </>
  );
}

function prazoDaFila(fila: FilaItem[], perfil: InicioPerfil) {
  const comPrazo = fila
    .filter((item) => !encerrada(item.situacao) && item.previsaoAtendimento)
    .sort((a, b) => new Date(a.previsaoAtendimento ?? 0).getTime() - new Date(b.previsaoAtendimento ?? 0).getTime());
  const item = comPrazo[0];
  if (!item?.previsaoAtendimento) return null;
  const dias = diasAte(item.previsaoAtendimento);
  return {
    data: new Date(item.previsaoAtendimento).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }),
    dias: dias >= 0 ? `${dias} dias` : `${Math.abs(dias)} dias`,
    detalhe: dias >= 0 ? item.protocolo : `${item.protocolo} em atraso`,
    para: destinoRecorte(perfil, [item], ""),
  };
}

function prazoDaObra(obra: Obra | undefined) {
  if (!obra) return null;
  const dias = diasAte(obra.inicioPrevisto);
  return {
    data: new Date(`${obra.inicioPrevisto}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }),
    dias: `${Math.abs(dias)} dias`,
    detalhe: obra.nome,
    para: "/obras",
  };
}

function exportarAtrasos(fila: FilaItem[]) {
  const linhas = fila
    .filter((item) => emAtraso(item))
    .sort((a, b) => diasEmAberto(b) - diasEmAberto(a))
    .map((item) => linhaAtraso(item));
  baixarPlanilha(
    "em-atraso.csv",
    ["Atraso", "Chamado", "Prazo"],
    linhas.map((item) => [item.dias === 1 ? "1 dia" : `${item.dias} dias`, item.chamado, item.prazo]),
  );
}

function linhaAtraso(item: FilaItem): AtrasoModelo {
  return {
    id: item.id,
    dias: diasEmAberto(item),
    chamado: item.protocolo,
    prazo: dataCurta(marcoAtraso(item)),
    para: `/demandas/${item.id}`,
  };
}

type InicioPerfil = "GL / Administrador" | "Responsável da Área";
