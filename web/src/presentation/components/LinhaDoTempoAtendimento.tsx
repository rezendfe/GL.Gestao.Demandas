import { useState } from "react";
import type { Anexo, DetalheDemanda, Historico, Mensagem } from "../../domain/types";
import { hora } from "../../domain/types";
import { avisoSemAlteracao } from "../../domain/recorte";
import { MidiaAnexo, SeletorAnexo } from "./ConversaChat";
import { VisualizadorArquivo } from "./VisualizadorArquivo";

const VERBOS: Record<string, string> = {
  ABERTURA: "abriu o chamado",
  CLASSIFICACAO: "classificou o atendimento",
  REDIRECIONAMENTO: "direcionou o atendimento",
  ANDAMENTO: "atualizou o andamento",
  MENSAGEM: "enviou uma mensagem",
  ANEXO: "anexou um documento",
  APROVACAO: "registrou uma decisão",
  NOTIFICACAO: "registrou uma notificação",
};

const CORES = ["#1b1d24", "#1d4e89", "#9f1d24", "#0f6b4c", "#8a4b08", "#3d4a63"];
const MESES = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];

interface Cartao {
  id: string;
  demandaId: string;
  quando: string;
  autor: string;
  tipo: string;
  titulo: string | null;
  texto: string;
  fala: boolean;
  etiquetas: string[];
  anexo: Anexo | null;
  anexoId: string | null;
}

export function LinhaDoTempoAtendimento({
  dados,
  mensagem,
  onMensagem,
  arquivo,
  onArquivo,
  onErro,
  onEnviar,
  encerrado = false,
}: {
  dados: DetalheDemanda;
  mensagem: string;
  onMensagem: (valor: string) => void;
  arquivo: File | null;
  onArquivo: (arquivo: File | null) => void;
  onErro: (mensagem: string | null) => void;
  onEnviar: () => void;
  encerrado?: boolean;
}) {
  const cartoes = montarCartoes(dados);
  const [anexoAberto, setAnexoAberto] = useState<Anexo | null>(null);
  let anoAnterior: number | null = null;

  return (
    <section className="linha-tempo-bloco" aria-label="Atendimento em linha do tempo">
      <h2>Atendimento</h2>
      <ol className="linha-tempo-feed">
        {cartoes.length === 0 && (
          <li className="lt-item">
            <div className="lt-quando" />
            <div className="lt-eixo">
              <span className="lt-no" aria-hidden="true"><Icone tipo="ANDAMENTO" /></span>
            </div>
            <article className="lt-card">
              <p className="lt-vazio">Ainda não há registros deste atendimento.</p>
            </article>
          </li>
        )}
        {cartoes.map((cartao) => {
          const ano = new Date(cartao.quando).getFullYear();
          const mostraAno = ano !== anoAnterior;
          anoAnterior = ano;
          return (
            <ItemAno key={cartao.id} cartao={cartao} ano={mostraAno ? ano : null} onAbrirAnexo={setAnexoAberto} />
          );
        })}
        <li className="lt-item lt-escrever">
          <div className="lt-quando" />
          <div className="lt-eixo">
            <span className="lt-no" aria-hidden="true">
              <Icone tipo="MENSAGEM" />
            </span>
          </div>
          {encerrado ? (
            <article className="lt-card">
              <p className="note">{avisoSemAlteracao(dados.situacao)}</p>
            </article>
          ) : (
          <form
            className="lt-card"
            onSubmit={(event) => {
              event.preventDefault();
              onEnviar();
            }}
          >
            <label className="lt-campo">
              Escreva uma mensagem
              <textarea
                maxLength={2000}
                value={mensagem}
                onChange={(event) => onMensagem(event.target.value)}
                placeholder="Escreva uma mensagem"
              />
            </label>
            <SeletorAnexo arquivo={arquivo} onArquivo={onArquivo} onErro={onErro}>
              <button className="btn" type="submit" disabled={mensagem.trim().length === 0 && !arquivo}>
                Enviar mensagem
              </button>
            </SeletorAnexo>
          </form>
          )}
        </li>
      </ol>
      <VisualizadorArquivo
        demandaId={dados.id}
        anexos={dados.anexos}
        alvo={anexoAberto}
        onAlvo={setAnexoAberto}
        onFechar={() => setAnexoAberto(null)}
      />
    </section>
  );
}

function ItemAno({ cartao, ano, onAbrirAnexo }: { cartao: Cartao; ano: number | null; onAbrirAnexo: (anexo: Anexo) => void }) {
  return (
    <>
      {ano !== null && (
        <li className="lt-item lt-ano">
          <div className="lt-quando">
            <span className="lt-chip lt-chip-ano">{ano}</span>
          </div>
          <div className="lt-eixo" />
        </li>
      )}
      <li className="lt-item">
        <div className="lt-quando">
          <time className="lt-chip" dateTime={cartao.quando}>
            {rotuloDia(cartao.quando)}
          </time>
        </div>
        <div className="lt-eixo">
          <span className="lt-no" aria-hidden="true">
            <Icone tipo={cartao.tipo} />
          </span>
        </div>
        <article className="lt-card">
          <div className="lt-corpo">
            <span className="lt-avatar" style={{ background: corAvatar(cartao.autor) }} aria-hidden="true">
              {iniciais(cartao.autor)}
            </span>
            <div>
              <p className="lt-acao">
                <strong>{cartao.autor}</strong> {VERBOS[cartao.tipo] ?? "registrou um evento"}
                {cartao.titulo ? <> <strong>{cartao.titulo}</strong></> : null}
              </p>
              <p className="note">{hora(cartao.quando)}</p>
              {cartao.anexoId && cartao.anexo && (
                <MidiaAnexo demandaId={cartao.demandaId} anexo={cartao.anexo} onAbrir={() => onAbrirAnexo(cartao.anexo!)} />
              )}
              {cartao.texto && (
                cartao.fala ? <p className="lt-fala">{cartao.texto}</p> : <TextoLongo texto={cartao.texto} />
              )}
            </div>
          </div>
          {cartao.etiquetas.length > 0 && (
            <div className="lt-tags">
              {cartao.etiquetas.map((etiqueta) => (
                <span key={etiqueta} className="lt-tag">{etiqueta}</span>
              ))}
            </div>
          )}
          {cartao.anexo && !cartao.anexoId && (
            <div className="lt-rodape">
              <button
                className="btn secondary"
                type="button"
                onClick={() => onAbrirAnexo(cartao.anexo!)}
              >
                {cartao.anexo.nome}
              </button>
            </div>
          )}
        </article>
      </li>
    </>
  );
}

function TextoLongo({ texto }: { texto: string }) {
  const [aberto, setAberto] = useState(false);
  const longo = texto.length > 280;
  const visivel = longo && !aberto ? `${texto.slice(0, 280).trimEnd()}…` : texto;
  return (
    <>
      <p className="lt-texto">{visivel}</p>
      {longo && (
        <button className="lt-mais" type="button" onClick={() => setAberto((valor) => !valor)}>
          {aberto ? "Recolher" : "Ler mais"}
        </button>
      )}
    </>
  );
}

function montarCartoes(dados: DetalheDemanda): Cartao[] {
  const usadas = new Set<string>();
  const cartoes = [...dados.historico]
    .sort((a, b) => new Date(b.eventoEm).getTime() - new Date(a.eventoEm).getTime())
    .map((evento) => cartaoDeEvento(evento, dados, usadas));

  for (const item of dados.mensagens) {
    if (usadas.has(item.id)) continue;
    cartoes.push(cartaoDeMensagem(item, dados));
  }

  return cartoes.sort((a, b) => new Date(b.quando).getTime() - new Date(a.quando).getTime());
}

function cartaoDeEvento(evento: Historico, dados: DetalheDemanda, usadas: Set<string>): Cartao {
  const mensagem = consumirMensagem(evento, dados.mensagens, usadas);
  if (evento.tipo === "ABERTURA" && mensagem) usadas.add(mensagem.id);

  const etiquetas: string[] = [];
  if (evento.tipo === "ABERTURA") {
    etiquetas.push(dados.categoria, dados.subcategoria);
  }
  if (evento.statusAnterior && evento.statusAnterior !== evento.statusNovo) {
    etiquetas.push(`${evento.statusAnterior} → ${evento.statusNovo}`);
  } else if (evento.tipo === "ABERTURA") {
    etiquetas.push(evento.statusNovo);
  }
  if (mensagem && evento.tipo === "MENSAGEM") etiquetas.push(mensagem.canal);

  const imagem = evento.tipo === "MENSAGEM" ? anexoDaMensagem(mensagem, dados.anexos) : null;
  const anexo = evento.tipo === "ANEXO"
    ? dados.anexos.find((item) => evento.comentario.includes(item.nome)) ?? null
    : imagem;

  const texto = evento.tipo === "ABERTURA"
    ? dados.descricao
    : evento.tipo === "MENSAGEM"
      ? (mensagem?.texto ?? evento.comentario)
      : evento.comentario;

  const titulo = evento.tipo === "ABERTURA"
    ? dados.servico
    : evento.tipo === "ANDAMENTO" || evento.tipo === "APROVACAO" || evento.tipo === "CLASSIFICACAO" || evento.tipo === "REDIRECIONAMENTO"
      ? evento.statusNovo
      : null;

  return {
    id: evento.id,
    demandaId: dados.id,
    quando: evento.eventoEm,
    autor: evento.autor,
    tipo: evento.tipo,
    titulo,
    texto: texto === "Chamado aberto." ? dados.descricao : texto,
    fala: evento.tipo === "MENSAGEM",
    etiquetas,
    anexo,
    anexoId: imagem?.id ?? null,
  };
}

function cartaoDeMensagem(item: Mensagem, dados: DetalheDemanda): Cartao {
  const imagem = anexoDaMensagem(item, dados.anexos);
  return {
    id: item.id,
    demandaId: dados.id,
    quando: item.enviadaEm,
    autor: item.autor,
    tipo: "MENSAGEM",
    titulo: null,
    texto: item.texto,
    fala: true,
    etiquetas: [item.canal],
    anexo: imagem,
    anexoId: imagem?.id ?? null,
  };
}

function anexoDaMensagem(item: Mensagem | null, anexos: Anexo[]) {
  if (!item?.anexoId) return null;
  return anexos.find((anexo) => anexo.id === item.anexoId) ?? null;
}

function consumirMensagem(evento: Historico, mensagens: Mensagem[], usadas: Set<string>): Mensagem | null {
  const quando = new Date(evento.eventoEm).getTime();
  let melhor: Mensagem | null = null;
  let menor = Number.POSITIVE_INFINITY;
  for (const item of mensagens) {
    if (usadas.has(item.id) || item.autor !== evento.autor) continue;
    const delta = Math.abs(new Date(item.enviadaEm).getTime() - quando);
    if (delta <= 120_000 && delta < menor) {
      menor = delta;
      melhor = item;
    }
  }
  if (melhor && evento.tipo === "MENSAGEM") usadas.add(melhor.id);
  return melhor;
}

function rotuloDia(iso: string): string {
  const data = new Date(iso);
  const hoje = new Date();
  const inicio = (valor: Date) => new Date(valor.getFullYear(), valor.getMonth(), valor.getDate()).getTime();
  const dias = Math.round((inicio(hoje) - inicio(data)) / 86_400_000);
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Ontem";
  return `${data.getDate()} ${MESES[data.getMonth()]} ${data.getFullYear()}`;
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

function corAvatar(nome: string): string {
  const soma = [...nome].reduce((total, letra) => total + letra.charCodeAt(0), 0);
  return CORES[soma % CORES.length];
}

function Icone({ tipo }: { tipo: string }) {
  const comum = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 } as const;
  if (tipo === "MENSAGEM" || tipo === "NOTIFICACAO") {
    return <svg {...comum}><path d="M5 6h14v9H8l-3 3V6z" /></svg>;
  }
  if (tipo === "ANEXO") {
    return <svg {...comum}><path d="M8 13l6.5-6.5a3 3 0 1 1 4.2 4.2L10 19.4a4.5 4.5 0 0 1-6.4-6.4L12 4.6" /></svg>;
  }
  if (tipo === "ABERTURA") {
    return <svg {...comum}><path d="M12 5v14M5 12h14" /></svg>;
  }
  if (tipo === "APROVACAO") {
    return <svg {...comum}><path d="M5 12l5 5L20 7" /></svg>;
  }
  if (tipo === "REDIRECIONAMENTO" || tipo === "CLASSIFICACAO") {
    return <svg {...comum}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
  }
  return <svg {...comum}><circle cx="12" cy="12" r="3" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" /></svg>;
}
