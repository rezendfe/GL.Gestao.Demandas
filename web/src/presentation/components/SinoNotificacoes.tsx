import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSessao } from "../../application/session";
import { destinoDaNotificacao, type ComunicadoResumo, type Notificacao } from "../../domain/types";
import { api } from "../../infrastructure/api/client";
import { aparelhoInscrito, ativarAvisosCelular, mostrarAvisoCelular, pararAvisosCelular, registrarWorker, textoResultadoAviso } from "../notificacaoCelular";
import { Icone } from "./Icons";
import { faixaAviso, LinhaAviso } from "./LinhaAviso";

interface ItemSino {
  id: string;
  titulo: string;
  texto: string;
  criadaEm: string;
  lida: boolean;
  url: string;
  tipo: "chamado" | "comunicado";
}

export function SinoNotificacoes() {
  const navigate = useNavigate();
  const { sessao } = useSessao();
  const cessionario = sessao?.usuario.perfil === "Cessionário";
  const caixa = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  const [itens, setItens] = useState<ItemSino[]>([]);
  const [celular, setCelular] = useState(() => window.matchMedia("(max-width: 900px)").matches);
  const [permissao, setPermissao] = useState<NotificationPermission | "unsupported">(() =>
    "Notification" in window ? Notification.permission : "unsupported");
  const [inscrito, setInscrito] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const naoLidas = itens.filter((item) => !item.lida).length;

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
        const [lista, comunicados] = await Promise.all([
          api.notificacoes(),
          cessionario ? api.comunicados().catch(() => [] as ComunicadoResumo[]) : Promise.resolve([] as ComunicadoResumo[]),
        ]);
        if (!ativo) return;
        const chamados = lista.map(itemDeChamado);
        const avisos = comunicados.filter((item) => !item.lido).map(itemDeComunicado);
        const juntos = [...avisos, ...chamados].sort((a, b) => new Date(b.criadaEm).getTime() - new Date(a.criadaEm).getTime());
        setItens(juntos);
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          for (const item of juntos.filter((atual) => !atual.lida)) {
            await mostrarAvisoCelular(item.id, item.titulo, item.texto, item.url);
          }
        }
      } catch {
        /* a lista do ícone continua disponível na próxima consulta */
      }
    }

    void olhar();
    const timer = window.setInterval(() => void olhar(), 12000);
    const aoAtivar = () => { void olhar(); };
    const aoMensagem = (event: MessageEvent) => {
      if (event.data?.tipo === "abrir-chamado" && typeof event.data.url === "string") {
        navigate(event.data.url);
      }
    };
    window.addEventListener("gl-avisos-ativados", aoAtivar);
    navigator.serviceWorker?.addEventListener("message", aoMensagem);
    return () => {
      ativo = false;
      window.clearInterval(timer);
      window.removeEventListener("gl-avisos-ativados", aoAtivar);
      navigator.serviceWorker?.removeEventListener("message", aoMensagem);
    };
  }, [navigate, cessionario]);

  useEffect(() => {
    if (!aberto) return;
    void aparelhoInscrito().then(setInscrito);
    const fechar = (event: MouseEvent) => {
      if (!caixa.current?.contains(event.target as Node)) setAberto(false);
    };
    const tecla = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAberto(false);
    };
    document.addEventListener("click", fechar);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("click", fechar);
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
      setMensagem(textoResultadoAviso(resultado, celular));
    } catch {
      setMensagem("Não foi possível autorizar este aparelho.");
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
      setMensagem(celular
        ? "Este celular deixou de receber os alertas do portal."
        : "Este computador deixou de receber os alertas do portal.");
    } catch {
      setMensagem("Não foi possível retirar a autorização deste aparelho.");
    }
    setOcupado(false);
  }

  async function abrirItem(item: ItemSino) {
    setAberto(false);
    if (!item.lida && item.tipo === "chamado") {
      try {
        await api.marcarLida(item.id);
      } catch {
        /* o chamado continua acessível */
      }
    }
    if (!item.lida && item.tipo === "comunicado") {
      try {
        await api.marcarLeituraComunicado(item.id);
      } catch {
        /* o comunicado continua acessível */
      }
    }
    navigate(item.url);
  }

  const aparelho = celular ? "celular" : "computador";

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
          <header className="qa-topo marca">
            <h2>Notificações</h2>
            <button className="qa-fechar" type="button" aria-label="Fechar" onClick={() => setAberto(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </header>
          {itens.length === 0 ? (
            <p className="x-sino-vazio">Nenhuma notificação.</p>
          ) : (
            <ul className="aviso-lista">
              {itens.map((item, indice) => (
                <li key={`${item.tipo}-${item.id}`}>
                  <LinhaAviso
                    iso={item.criadaEm}
                    texto={item.texto}
                    complemento={item.tipo === "comunicado" ? "Comunicado" : item.titulo}
                    cor={faixaAviso(indice)}
                    destaque={!item.lida}
                    onClick={() => void abrirItem(item)}
                  />
                </li>
              ))}
            </ul>
          )}
          <div className="x-sino-push">
            {permissao === "unsupported" ? (
              <p>Este navegador não recebe alertas do site.</p>
            ) : inscrito ? (
              <>
                <p>Este {aparelho} recebe os alertas do portal, mesmo com o site fechado.</p>
                <button className="x-sino-acao" type="button" disabled={ocupado} onClick={() => void parar()}>
                  Parar de receber neste {aparelho}
                </button>
              </>
            ) : (
              <button className="x-sino-acao" type="button" disabled={ocupado} onClick={() => void autorizar()}>
                {ocupado ? "Ativando..." : `Receber alertas neste ${aparelho}`}
              </button>
            )}
            {mensagem && <p>{mensagem}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function itemDeChamado(nota: Notificacao): ItemSino {
  return {
    id: nota.id,
    titulo: nota.protocolo || "Chamado",
    texto: nota.texto,
    criadaEm: nota.criadaEm,
    lida: nota.lida,
    url: destinoDaNotificacao(nota),
    tipo: "chamado",
  };
}

function itemDeComunicado(item: ComunicadoResumo): ItemSino {
  return {
    id: item.id,
    titulo: item.titulo,
    texto: item.titulo,
    criadaEm: item.publicadoEm,
    lida: false,
    url: `/comunicados/${item.id}`,
    tipo: "comunicado",
  };
}
