import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useComunicado, useComunicados } from "../../application/hooks";
import { useSessao } from "../../application/session";
import { validarTexto } from "../../domain/entrada";
import { ApiError, api } from "../../infrastructure/api/client";
import { EstadoAcao } from "../components/EstadoAcao";
import { faixaAviso, LinhaAviso } from "../components/LinhaAviso";
import { useAcoesDaPagina } from "../components/AcoesRapidas";
import { PageHeader } from "../components/PageHeader";
import { Panel } from "../components/Panel";

function estado(situacao: string, lido: boolean) {
  if (situacao === "Encerrado") return "Encerrado";
  return lido ? "Lido" : "Vigente";
}

export function ComunicadosPage() {
  const { sessao } = useSessao();
  const perfil = sessao?.usuario.perfil;
  const gl = perfil === "GL / Administrador";
  const navigate = useNavigate();
  const { dados, erro, carregando, recarregar } = useComunicados(perfil !== "Responsável da Área");
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [avisar, setAvisar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);

  useAcoesDaPagina(erro ? [{
    id: "tentar-comunicados",
    rotulo: "Tentar de novo",
    icone: "alerta",
    executar: () => recarregar(),
  }] : []);

  if (perfil === "Responsável da Área") return <Navigate to="/inicio" replace />;

  async function publicar() {
    const tituloInvalido = validarTexto(titulo, 2, 120, "O título tem de 2 a 120 caracteres.");
    const textoInvalido = validarTexto(texto, 2, 2000, "O texto tem de 2 a 2000 caracteres.");
    if (tituloInvalido || textoInvalido) {
      setFalha(tituloInvalido ?? textoInvalido);
      return;
    }
    setEnviando(true);
    setFalha(null);
    try {
      const criado = await api.publicarComunicado({ titulo, texto, avisarCelular: avisar });
      navigate(`/comunicados/${criado.id}`);
    } catch (error) {
      setFalha(error instanceof ApiError ? error.message : "Não foi possível publicar.");
      setEnviando(false);
    }
  }

  return (
    <>
      <PageHeader title="Comunicados" trail={["Início", "Comunicados"]} />
      {gl && (
        <form className="panel comunicado-form" onSubmit={(event) => { event.preventDefault(); void publicar(); }}>
          <h2>Publicar</h2>
          <p className="note">Aviso do GL / Administrador. Não é chamado e não tem resposta.</p>
          <label htmlFor="comunicado-titulo">Título
            <input id="comunicado-titulo" value={titulo} maxLength={120} onChange={(event) => setTitulo(event.target.value)} />
          </label>
          <label htmlFor="comunicado-texto">Texto
            <textarea id="comunicado-texto" value={texto} maxLength={2000} onChange={(event) => setTexto(event.target.value)} />
          </label>
          <label className="comunicado-aviso">
            <input type="checkbox" checked={avisar} onChange={(event) => setAvisar(event.target.checked)} />
            <span>Avisar o Cessionário</span>
          </label>
          {falha && <p className="erro">{falha}</p>}
          <button className="btn" type="submit" disabled={enviando}>{enviando ? "Publicando..." : "Publicar comunicado"}</button>
        </form>
      )}
      {erro && <p className="erro">{erro}</p>}
      {carregando && <p>Carregando comunicados...</p>}
      {!carregando && !erro && (dados ?? []).length === 0 && (
        <Panel title="Vigentes">
          <p>Nenhum comunicado vigente.</p>
        </Panel>
      )}
      {(dados ?? []).length > 0 && (
      <Panel title="Vigentes">
      {!gl && <p className="note">Aviso do GL / Administrador. Não é chamado e não tem resposta.</p>}
      <ul className="aviso-lista">
        {(dados ?? []).map((item, indice) => (
          <li key={item.id}>
            <LinhaAviso
              iso={item.publicadoEm}
              texto={item.titulo}
              complemento={estado(item.situacao, item.lido)}
              cor={faixaAviso(indice)}
              destaque={!item.lido && item.situacao !== "Encerrado"}
              para={`/comunicados/${item.id}`}
            />
          </li>
        ))}
      </ul>
      </Panel>
      )}
    </>
  );
}

export function ComunicadoPage() {
  const { id = "" } = useParams();
  const { sessao } = useSessao();
  const perfil = sessao?.usuario.perfil;
  const { dados, erro, carregando, recarregar, setDados } = useComunicado(id, perfil !== "Responsável da Área");
  const navigate = useNavigate();
  const [falha, setFalha] = useState<string | null>(null);

  useAcoesDaPagina([
    { id: "voltar-comunicados", rotulo: "Voltar aos comunicados", icone: "lista", executar: () => navigate("/comunicados") },
    ...(dados && perfil === "Cessionário" && dados.situacao === "Vigente" && !dados.lido ? [{
      id: "lido",
      rotulo: "Marcar como lido",
      rotuloOcupado: "Registrando...",
      icone: "sino" as const,
      executar: () => acao(() => api.marcarLeituraComunicado(id)),
    }] : []),
    ...(dados && perfil === "GL / Administrador" && dados.situacao === "Vigente" ? [{
      id: "encerrar-comunicado",
      rotulo: "Encerrar comunicado",
      rotuloOcupado: "Encerrando...",
      icone: "alerta" as const,
      executar: () => acao(() => api.encerrarComunicado(id)),
    }] : []),
    ...(erro ? [{
      id: "tentar-comunicado",
      rotulo: "Tentar de novo",
      icone: "alerta" as const,
      executar: () => recarregar(),
    }] : []),
  ]);

  if (perfil === "Responsável da Área") return <Navigate to="/inicio" replace />;

  async function acao(executar: () => Promise<typeof dados>) {
    setFalha(null);
    try {
      const atual = await executar();
      if (atual) setDados(atual);
    } catch (error) {
      setFalha(error instanceof ApiError ? error.message : "Não foi possível concluir.");
    }
  }

  return (
    <>
      <PageHeader title="Comunicado" trail={["Início", "Comunicados", "Comunicado"]} />
      {erro && <p className="erro">{erro}</p>}
      {carregando && <p>Carregando comunicado...</p>}
      {dados && (
        <Panel title={dados.titulo}>
          <EstadoAcao
            situacao={estado(dados.situacao, dados.lido)}
            proximo={
              perfil === "Cessionário" && dados.situacao === "Vigente" && !dados.lido
                ? "Marcar como lido"
                : perfil === "GL / Administrador" && dados.situacao === "Vigente"
                  ? "Encerrar o comunicado"
                  : "Acompanhar o aviso"
            }
          />
          <p>{dados.texto}</p>
          {falha && <p className="erro">{falha}</p>}
          {perfil === "GL / Administrador" && (
            <ul className="comunicado-historico">
              {dados.historico.map((evento) => (
                <li key={evento.id}>{evento.comentario}</li>
              ))}
            </ul>
          )}
        </Panel>
      )}
    </>
  );
}
