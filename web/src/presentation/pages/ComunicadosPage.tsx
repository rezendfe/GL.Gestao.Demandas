import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useComunicado, useComunicados } from "../../application/hooks";
import { useSessao } from "../../application/session";
import { validarTexto } from "../../domain/entrada";
import { ApiError, api } from "../../infrastructure/api/client";
import { PageHeader } from "../components/PageHeader";

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
      <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>Aviso do GL / Administrador. Não é chamado e não tem resposta.</p>
      {gl && (
        <form className="panel comunicado-form" onSubmit={(event) => { event.preventDefault(); void publicar(); }}>
          <h2>Publicar</h2>
          <label htmlFor="comunicado-titulo">Título
            <input id="comunicado-titulo" value={titulo} maxLength={120} onChange={(event) => setTitulo(event.target.value)} />
          </label>
          <label htmlFor="comunicado-texto">Texto
            <textarea id="comunicado-texto" value={texto} maxLength={2000} onChange={(event) => setTexto(event.target.value)} />
          </label>
          <label className="comunicado-aviso">
            <input type="checkbox" checked={avisar} onChange={(event) => setAvisar(event.target.checked)} />
            <span>Avisar no celular</span>
          </label>
          {falha && <p className="erro">{falha}</p>}
          <button className="btn" type="submit" disabled={enviando}>{enviando ? "Publicando..." : "Publicar comunicado"}</button>
        </form>
      )}
      {erro && (
        <p className="erro">
          {erro}{" "}
          <button className="btn secondary" type="button" onClick={() => void recarregar()}>Tentar de novo</button>
        </p>
      )}
      {carregando && <p>Carregando comunicados...</p>}
      {!carregando && !erro && (dados ?? []).length === 0 && <p>Nenhum comunicado vigente.</p>}
      <div className="comunicado-lista">
        {(dados ?? []).map((item) => (
          <Link key={item.id} className="comunicado-item" to={`/comunicados/${item.id}`}>
            <strong>{item.titulo}</strong>
            <em>{estado(item.situacao, item.lido)}</em>
          </Link>
        ))}
      </div>
    </>
  );
}

export function ComunicadoPage() {
  const { id = "" } = useParams();
  const { sessao } = useSessao();
  const perfil = sessao?.usuario.perfil;
  const { dados, erro, carregando, recarregar, setDados } = useComunicado(id, perfil !== "Responsável da Área");
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);

  if (perfil === "Responsável da Área") return <Navigate to="/inicio" replace />;

  async function acao(executar: () => Promise<typeof dados>) {
    setEnviando(true);
    setFalha(null);
    try {
      const atual = await executar();
      if (atual) setDados(atual);
    } catch (error) {
      setFalha(error instanceof ApiError ? error.message : "Não foi possível concluir.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <PageHeader title="Comunicado" trail={["Início", "Comunicados", "Comunicado"]} />
      <p><Link to="/comunicados">Voltar aos comunicados</Link></p>
      {erro && (
        <p className="erro">
          {erro}{" "}
          <button className="btn secondary" type="button" onClick={() => void recarregar()}>Tentar de novo</button>
        </p>
      )}
      {carregando && <p>Carregando comunicado...</p>}
      {dados && (
        <article className="comunicado-leitura">
          <p className="protocol">{estado(dados.situacao, dados.lido)}</p>
          <h1>{dados.titulo}</h1>
          <p>{dados.texto}</p>
          {falha && <p className="erro">{falha}</p>}
          {perfil === "Cessionário" && dados.situacao === "Vigente" && !dados.lido && (
            <button className="btn" type="button" disabled={enviando} onClick={() => void acao(() => api.marcarLeituraComunicado(id))}>
              {enviando ? "Registrando..." : "Marcar como lido"}
            </button>
          )}
          {perfil === "GL / Administrador" && dados.situacao === "Vigente" && (
            <button className="btn secondary" type="button" disabled={enviando} onClick={() => void acao(() => api.encerrarComunicado(id))}>
              {enviando ? "Encerrando..." : "Encerrar comunicado"}
            </button>
          )}
          {perfil === "GL / Administrador" && (
            <ul className="comunicado-historico">
              {dados.historico.map((evento) => (
                <li key={evento.id}>{evento.comentario}</li>
              ))}
            </ul>
          )}
        </article>
      )}
    </>
  );
}
