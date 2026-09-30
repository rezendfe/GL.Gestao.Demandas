import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sugerir, useFila } from "../../application/hooks";
import { useSessao } from "../../application/session";
import { tempoRelativo, type Sugestao } from "../../domain/types";
import { ApiError, api } from "../../infrastructure/api/client";
import { PageHeader } from "../components/PageHeader";
import { FichaLateral } from "./EspacoPage";

interface Bolha { autor: "sistema" | "eu"; texto: string }

export function MensageriaPage() {
  const { sessao } = useSessao();
  const navigate = useNavigate();
  const { dados: fila } = useFila();
  const [texto, setTexto] = useState("");
  const [passo, setPasso] = useState<"texto" | "foto" | "ponto" | "confirma">("texto");
  const [descricao, setDescricao] = useState("");
  const [ponto, setPonto] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [sugestao, setSugestao] = useState<Sugestao | null>(null);
  const [aba, setAba] = useState<"todas" | "novas">("todas");
  const [erro, setErro] = useState<string | null>(null);
  const [bolhas, setBolhas] = useState<Bolha[]>([
    { autor: "sistema", texto: "Canal simulado para a demonstração. O portal continua sendo o canal principal. O que está acontecendo?" },
  ]);

  function falar(autor: Bolha["autor"], mensagem: string) {
    setBolhas((atual) => [...atual, { autor, texto: mensagem }]);
  }

  async function enviar(event: FormEvent) {
    event.preventDefault();
    const mensagem = texto.trim();
    if (!mensagem && passo !== "foto") return;
    setTexto("");
    setErro(null);
    if (passo === "texto") {
      falar("eu", mensagem);
      setDescricao(mensagem);
      falar("sistema", "Pode enviar uma foto do local? Se preferir, escreva pular.");
      setPasso("foto");
      return;
    }
    if (passo === "foto") {
      falar("eu", mensagem || "Sem foto agora.");
      falar("sistema", "Onde está o ponto da ocorrência dentro da sala?");
      setPasso("ponto");
      return;
    }
    if (passo === "ponto") {
      falar("eu", mensagem);
      setPonto(mensagem);
      try {
        const resultado = await sugerir(descricao);
        setSugestao(resultado);
        falar("sistema", `Classificação sugerida: ${resultado.resumo}. Confiança ${resultado.confianca}. Responda confirmar ou corrigir.`);
        setPasso("confirma");
      } catch (error) {
        setErro(error instanceof ApiError ? error.message : "Não foi possível classificar.");
      }
    }
  }

  async function confirmar() {
    if (!sugestao) return;
    try {
      const detalhe = await api.abrir({
        descricao,
        sala: sessao?.usuario.sala ?? "Sala 205",
        ponto,
        subcategoriaId: sugestao.subcategoriaId,
        canal: "MENSAGERIA",
      });
      if (arquivo) await api.anexar(detalhe.id, arquivo);
      falar("sistema", `Chamado aberto. Protocolo ${detalhe.protocolo}. Acompanhe os detalhes no portal.`);
      navigate(`/demandas/${detalhe.id}`);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Não foi possível abrir o chamado.");
    }
  }

  return (
    <>
      <PageHeader title="Mensageria" trail={["Início", "Mensageria"]} />
      <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>Conversa simulada, no padrão do painel: lista, thread e ficha do espaço. A integração definitiva depende do provedor aprovado.</p>
      <section className="crm-chat">
        <div className="crm-chat-lista">
          <div className="crm-chat-abas">
            <button type="button" className={aba === "todas" ? "ativa" : ""} onClick={() => setAba("todas")}>Conversa</button>
            <button type="button" className={aba === "novas" ? "ativa" : ""} onClick={() => setAba("novas")}>Novas</button>
          </div>
          {aba === "todas" && (
          <Link className="conversa ativa" to="/mensageria">
            <span className="conversa-avatar">GL</span>
            <span>
              <strong>Atendimento GL</strong>
              <em>Canal de abertura</em>
            </span>
          </Link>
          )}
          {(fila ?? []).filter((item) => aba === "todas" || item.situacao === "Novo").map((item) => (
            <Link key={item.id} className="conversa" to={`/demandas/${item.id}`}>
              <span className="conversa-avatar">{item.protocolo.slice(-3)}</span>
              <span>
                <strong>{item.protocolo}</strong>
                <em>{item.servico}</em>
              </span>
              <time>{item.situacao === "Concluído" ? "ok" : tempoRelativo(item.abertoEm)}</time>
            </Link>
          ))}
        </div>
        <div className="crm-chat-thread">
          <header>
            <strong>Atendimento GL</strong>
            <span>Canal simulado</span>
          </header>
          <div className="thread">
            {bolhas.map((bolha, index) => (
              <div key={`${bolha.autor}-${index}`} className={bolha.autor === "eu" ? "bubble me" : "bubble"}>{bolha.texto}</div>
            ))}
            {passo === "foto" && (
              <label>
                Foto
                <input type="file" accept="image/*" capture="environment" onChange={(event) => setArquivo(event.target.files?.[0] ?? null)} />
              </label>
            )}
            {passo === "confirma" && (
              <div className="row">
                <button className="btn" type="button" onClick={() => void confirmar()}>Confirmar</button>
                <button className="btn secondary" type="button" onClick={() => navigate("/abrir")}>Corrigir no portal</button>
              </div>
            )}
            {erro && <p className="erro">{erro}</p>}
          </div>
          {passo !== "confirma" && (
            <form onSubmit={(event) => void enviar(event)}>
              <input value={texto} onChange={(event) => setTexto(event.target.value)} placeholder="Escreva a mensagem" />
              <button className="btn" type="submit">Enviar</button>
            </form>
          )}
        </div>
        {sessao?.usuario.email && <FichaLateral email={sessao.usuario.email} />}
      </section>
    </>
  );
}
