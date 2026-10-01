import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { tempoRelativo, type Notificacao } from "../../domain/types";
import { api } from "../../infrastructure/api/client";
import { aparelhoInscrito, ativarAvisosCelular, mostrarAvisoCelular, pararAvisosCelular, registrarWorker } from "../notificacaoCelular";
import { Icone } from "./Icons";

export function SinoNotificacoes() {
  const navigate = useNavigate();
  const caixa = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  const [notas, setNotas] = useState<Notificacao[]>([]);
  const [celular, setCelular] = useState(() => window.matchMedia("(max-width: 900px)").matches);
  const [permissao, setPermissao] = useState<NotificationPermission | "unsupported">(() =>
    "Notification" in window ? Notification.permission : "unsupported");
  const [inscrito, setInscrito] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const naoLidas = notas.filter((nota) => !nota.lida).length;

  useEffect(() => {
    const consulta = window.matchMedia("(max-width: 900px)");
    const atualizar = () => setCelular(consulta.matches);
    consulta.addEventListener("change", atualizar);
    return () => consulta.removeEventListener("change", atualizar);
  }, []);

  useEffect(() => {
    void registrarWorker();
    let ativo = true;

    async function olhar() {
      try {
        const lista = await api.notificacoes();
        if (!ativo) return;
        setNotas(lista);
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          for (const nota of lista.filter((item) => !item.lida)) {
            await mostrarAvisoCelular(nota.id, nota.protocolo, nota.texto, nota.demandaId);
          }
        }
      } catch {
        /* a lista do ícone continua disponível na próxima consulta */
      }
    }

    void olhar();
    const timer = window.setInterval(() => void olhar(), 12000);
    const aoMensagem = (event: MessageEvent) => {
      if (event.data?.tipo === "abrir-chamado" && typeof event.data.url === "string") {
        navigate(event.data.url);
      }
    };
    navigator.serviceWorker?.addEventListener("message", aoMensagem);
    return () => {
      ativo = false;
      window.clearInterval(timer);
      navigator.serviceWorker?.removeEventListener("message", aoMensagem);
    };
  }, [navigate]);

  useEffect(() => {
    if (!aberto) return;
    void aparelhoInscrito().then(setInscrito);
    const fechar = (event: MouseEvent) => {
      if (!caixa.current?.contains(event.target as Node)) setAberto(false);
    };
    const tecla = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAberto(false);
    };
    document.addEventListener("mousedown", fechar);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fechar);
      document.removeEventListener("keydown", tecla);
    };
  }, [aberto]);

  async function autorizar() {
    setOcupado(true);
    setMensagem(null);
    try {
      const resultado = await ativarAvisosCelular();
      setPermissao("Notification" in window ? Notification.permission : "unsupported");
      setInscrito(await aparelhoInscrito());
      if (resultado === "granted") setMensagem("Este celular passa a receber as notificações do portal.");
      else if (resultado === "denied") setMensagem("As notificações estão bloqueadas neste navegador. Libere o site nas configurações do celular.");
      else if (resultado === "unsupported") setMensagem("Este navegador não recebe notificações do site.");
      else if (resultado === "indisponivel") setMensagem("As notificações neste aparelho ainda não estão disponíveis.");
    } catch {
      setMensagem("Não foi possível autorizar este celular.");
    } finally {
      setOcupado(false);
    }
  }

  async function parar() {
    setOcupado(true);
    setMensagem(null);
    try {
      await pararAvisosCelular();
      setInscrito(false);
      setMensagem("Este celular deixou de receber as notificações do portal.");
    } catch {
      setMensagem("Não foi possível retirar a autorização deste celular.");
    }
    setOcupado(false);
  }

  async function abrirNota(nota: Notificacao) {
    setAberto(false);
    if (!nota.lida) {
      try {
        await api.marcarLida(nota.id);
      } catch {
        /* o chamado continua acessível */
      }
    }
    navigate(`/demandas/${nota.demandaId}${nota.lida ? "" : `?responder=${nota.id}`}`);
  }

  return (
    <div className="x-sino-wrap" ref={caixa}>
      <button
        className="x-sino"
        type="button"
        aria-expanded={aberto}
        aria-haspopup="dialog"
        aria-label={naoLidas > 0 ? `Notificações, ${naoLidas} sem leitura` : "Notificações"}
        onClick={() => setAberto((atual) => !atual)}
      >
        <Icone name="sino" />
        {naoLidas > 0 && <span className="x-sino-contagem">{naoLidas > 9 ? "9+" : naoLidas}</span>}
      </button>
      {aberto && (
        <div className="x-sino-painel" role="dialog" aria-label="Notificações">
          <strong>Notificações</strong>
          {celular && (
            <div className="x-sino-push">
              {permissao === "unsupported" ? (
                <p>Este navegador não recebe notificações do site.</p>
              ) : inscrito ? (
                <>
                  <p>Este celular recebe as notificações do portal, mesmo com o site fechado.</p>
                  <button className="x-sino-acao" type="button" disabled={ocupado} onClick={() => void parar()}>
                    Parar de receber neste celular
                  </button>
                </>
              ) : (
                <button className="x-sino-acao" type="button" disabled={ocupado} onClick={() => void autorizar()}>
                  Receber notificações neste celular
                </button>
              )}
              {mensagem && <p>{mensagem}</p>}
            </div>
          )}
          {notas.length === 0 ? (
            <p className="x-sino-vazio">Nenhuma notificação.</p>
          ) : (
            <ul>
              {notas.slice(0, 8).map((nota) => (
                <li key={nota.id}>
                  <button className={nota.lida ? "x-sino-item" : "x-sino-item pede-leitura"} type="button" onClick={() => void abrirNota(nota)}>
                    <span>
                      <strong>{nota.protocolo || "Chamado"}</strong>
                      <time dateTime={nota.criadaEm}>{tempoRelativo(nota.criadaEm)}</time>
                    </span>
                    <em>{nota.texto}</em>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
