import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { avisoSemAlteracao, encerrada } from "../../domain/recorte";
import { espacoPorSala } from "../../domain/espacos";
import { validarArquivo, validarTexto } from "../../domain/entrada";
import type { Anexo, DetalheDemanda, FilaItem } from "../../domain/types";
import { ApiError, api } from "../../infrastructure/api/client";
import { useSessao } from "../../application/session";
import { ConversaChat } from "./ConversaChat";
import { faixaAviso, LinhaAviso } from "./LinhaAviso";
import { Icone } from "./Icons";
import { VisualizadorArquivo } from "./VisualizadorArquivo";

export function CaixaMensagens() {
  const { sessao } = useSessao();
  const [aberto, setAberto] = useState(false);
  const [temas, setTemas] = useState<FilaItem[]>([]);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<DetalheDemanda | null>(null);
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [carregandoConversa, setCarregandoConversa] = useState(false);
  const [texto, setTexto] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [falha, setFalha] = useState<string | null>(null);
  const [anexoAberto, setAnexoAberto] = useState<Anexo | null>(null);
  const tituloId = useId();

  useEffect(() => {
    if (!aberto) return;
    let ativo = true;
    setCarregandoLista(true);
    setFalha(null);
    api.fila()
      .then((lista) => {
        if (!ativo) return;
        setTemas(ordenar(lista.filter((item) => item.ultimaMensagemEm)));
      })
      .catch((error: unknown) => {
        if (!ativo) return;
        setFalha(error instanceof ApiError ? error.message : "Não foi possível carregar as mensagens.");
      })
      .finally(() => {
        if (ativo) setCarregandoLista(false);
      });
    return () => {
      ativo = false;
    };
  }, [aberto]);

  useEffect(() => {
    if (!selecionado) {
      setDetalhe(null);
      return;
    }
    let ativo = true;
    setCarregandoConversa(true);
    setFalha(null);
    setTexto("");
    setArquivo(null);
    api.detalhe(selecionado)
      .then((dados) => {
        if (ativo) setDetalhe(dados);
      })
      .catch((error: unknown) => {
        if (!ativo) return;
        setDetalhe(null);
        setFalha(error instanceof ApiError ? error.message : "Não foi possível abrir a mensagem.");
      })
      .finally(() => {
        if (ativo) setCarregandoConversa(false);
      });
    return () => {
      ativo = false;
    };
  }, [selecionado]);

  useEffect(() => {
    if (!aberto) return;
    const fechar = (event: KeyboardEvent) => {
      if (event.key === "Escape") fecharCaixa();
    };
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [aberto]);

  function fecharCaixa() {
    setAberto(false);
    setSelecionado(null);
    setFalha(null);
    setAnexoAberto(null);
  }

  async function enviar() {
    if (!detalhe) return;
    if (encerrada(detalhe.situacao)) throw new ApiError(avisoSemAlteracao(detalhe.situacao), 400);
    if (arquivo) {
      const arquivoInvalido = validarArquivo(arquivo);
      if (arquivoInvalido) throw new ApiError(arquivoInvalido, 400);
      if (texto.trim()) {
        const invalida = validarTexto(texto, 1, 2000, "A mensagem tem no máximo 2000 caracteres.");
        if (invalida) throw new ApiError(invalida, 400);
      }
      return api.mensagemComAnexo(detalhe.id, texto.trim(), arquivo);
    }
    const invalida = validarTexto(texto, 1, 2000, texto.trim() ? "A mensagem tem no máximo 2000 caracteres." : "Escreva a mensagem.");
    if (invalida) throw new ApiError(invalida, 400);
    return api.mensagem(detalhe.id, texto);
  }

  async function confirmarEnvio() {
    setFalha(null);
    try {
      const atualizado = await enviar();
      if (!atualizado) return;
      setDetalhe(atualizado);
      setTexto("");
      setArquivo(null);
      const quando = atualizado.mensagens.reduce((maior, item) => (item.enviadaEm > maior ? item.enviadaEm : maior), "");
      setTemas((atual) => ordenar(atual.map((item) => (item.id === atualizado.id ? { ...item, ultimaMensagemEm: quando || item.ultimaMensagemEm } : item))));
    } catch (error) {
      setFalha(error instanceof ApiError ? error.message : "Não foi possível enviar a mensagem.");
    }
  }

  const espaco = detalhe ? espacoPorSala(detalhe.cessionario.sala) : undefined;
  const painel = aberto ? (
    <>
      <button className="caixa-fundo" type="button" aria-label="Fechar mensagens" onClick={fecharCaixa} />
      <section className={`caixa-painel${selecionado ? " tem-conversa" : ""}`} role="dialog" aria-modal="true" aria-labelledby={tituloId}>
        <header className="qa-topo marca">
          <h2 id={tituloId}>Mensagens</h2>
          <button className="qa-fechar" type="button" aria-label="Fechar" onClick={fecharCaixa}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>
        {falha && <p className="erro" role="alert">{falha}</p>}
        <div className="caixa-corpo">
          <div className="caixa-temas" role="listbox" aria-label="Temas">
            {carregandoLista && <p className="caixa-espera">Carregando mensagens...</p>}
            {!carregandoLista && temas.length === 0 && <p className="caixa-espera">Nenhuma mensagem.</p>}
            <ul className="aviso-lista">
              {temas.map((tema, indice) => (
                <li key={tema.id}>
                  <LinhaAviso
                    iso={tema.ultimaMensagemEm ?? tema.abertoEm}
                    texto={tema.protocolo}
                    complemento={`por ${tema.cessionario}`}
                    cor={faixaAviso(indice)}
                    ativo={selecionado === tema.id}
                    role="option"
                    aria-selected={selecionado === tema.id}
                    onClick={() => setSelecionado(tema.id)}
                  />
                </li>
              ))}
            </ul>
          </div>
          <div className="caixa-conversa">
            {selecionado && (
              <button className="caixa-voltar" type="button" onClick={() => setSelecionado(null)}>
                Voltar
              </button>
            )}
            {carregandoConversa && <p className="caixa-espera">Abrindo a mensagem...</p>}
            {!carregandoConversa && !detalhe && <p className="caixa-espera">Escolha uma mensagem para ler a conversa.</p>}
            {!carregandoConversa && detalhe && (
              <ConversaChat
                demandaId={detalhe.id}
                mensagens={detalhe.mensagens}
                anexos={detalhe.anexos}
                meuNome={sessao?.usuario.nome ?? ""}
                minhaFoto={sessao?.usuario.foto ?? null}
                nomeCessionario={detalhe.cessionario.nome}
                fotoCessionario={espaco?.foto ?? null}
                texto={texto}
                onTexto={setTexto}
                arquivo={arquivo}
                onArquivo={setArquivo}
                onErro={setFalha}
                onAbrirAnexo={(anexoId) => {
                  const anexo = detalhe.anexos.find((item) => item.id === anexoId);
                  if (anexo) setAnexoAberto(anexo);
                }}
                onEnviar={() => void confirmarEnvio()}
                rotuloEnvio="Enviar mensagem"
                encerrado={encerrada(detalhe.situacao)}
                avisoEncerrado={avisoSemAlteracao(detalhe.situacao)}
              />
            )}
          </div>
        </div>
      </section>
      {detalhe && (
        <VisualizadorArquivo
          demandaId={detalhe.id}
          anexos={detalhe.anexos}
          alvo={anexoAberto}
          onAlvo={setAnexoAberto}
          onFechar={() => setAnexoAberto(null)}
        />
      )}
    </>
  ) : null;

  return (
    <>
      <button
        className="x-caixa"
        type="button"
        aria-expanded={aberto}
        aria-haspopup="dialog"
        aria-label="Mensagens"
        onClick={() => {
          if (aberto) fecharCaixa();
          else setAberto(true);
        }}
      >
        <Icone name="mensagem" />
      </button>
      {painel && createPortal(painel, document.body)}
    </>
  );
}

function ordenar(itens: FilaItem[]) {
  return [...itens].sort((a, b) => new Date(b.ultimaMensagemEm ?? 0).getTime() - new Date(a.ultimaMensagemEm ?? 0).getTime());
}
