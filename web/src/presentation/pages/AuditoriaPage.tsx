import { useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useSessao } from "../../application/session";
import type { EventoAuditoria, PessoaAuditoria } from "../../domain/types";
import { ApiError, api } from "../../infrastructure/api/client";
import { ListaAuditoria } from "../components/QuadroAuditoria";
import { PageHeader } from "../components/PageHeader";
import { Panel } from "../components/Panel";

function hojeIso() {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

export function AuditoriaPage() {
  const { sessao } = useSessao();
  const gl = sessao?.usuario.perfil === "GL / Administrador";
  const [pessoas, setPessoas] = useState<PessoaAuditoria[]>([]);
  const [autorId, setAutorId] = useState("");
  const [de, setDe] = useState(hojeIso);
  const [ate, setAte] = useState(hojeIso);
  const [texto, setTexto] = useState("");
  const [itens, setItens] = useState<EventoAuditoria[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [consultou, setConsultou] = useState(false);

  useEffect(() => {
    if (!gl) return;
    let ativo = true;
    api.pessoasAuditoria()
      .then((lista) => {
        if (ativo) setPessoas(lista);
      })
      .catch(() => {
        if (ativo) setPessoas([]);
      });
    return () => {
      ativo = false;
    };
  }, [gl]);

  useEffect(() => {
    if (!gl) return;
    let ativo = true;
    setCarregando(true);
    api.pesquisarAuditoria({ de: hojeIso(), ate: hojeIso() })
      .then((lista) => {
        if (!ativo) return;
        setItens(lista);
        setConsultou(true);
      })
      .catch((error: unknown) => {
        if (!ativo) return;
        setErro(error instanceof ApiError ? error.message : "Não foi possível pesquisar.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [gl]);

  if (!gl) return <Navigate to="/inicio" replace />;

  async function pesquisar(event: FormEvent) {
    event.preventDefault();
    setCarregando(true);
    setErro(null);
    try {
      setItens(await api.pesquisarAuditoria({
        de,
        ate,
        autorId: autorId || undefined,
        texto: texto.trim() || undefined,
      }));
      setConsultou(true);
    } catch (error) {
      setItens([]);
      setErro(error instanceof ApiError ? error.message : "Não foi possível pesquisar.");
    } finally {
      setCarregando(false);
    }
  }

  async function exportar() {
    setExportando(true);
    setErro(null);
    try {
      await api.exportarAuditoria();
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Não foi possível exportar a base.");
    } finally {
      setExportando(false);
    }
  }

  return (
    <>
      <PageHeader title="Pesquisa de auditoria" trail={["Início", "Auditoria"]} />
      <Panel>
        <form className="fila-filtros audit-filtros" onSubmit={(event) => void pesquisar(event)}>
          <label>
            Pessoa
            <select value={autorId} onChange={(event) => setAutorId(event.target.value)}>
              <option value="">Todas</option>
              {pessoas.map((pessoa) => (
                <option key={pessoa.id} value={pessoa.id}>{pessoa.nome} · {pessoa.perfil}</option>
              ))}
            </select>
          </label>
          <label>
            De
            <input type="date" required value={de} max={ate} onChange={(event) => setDe(event.target.value)} />
          </label>
          <label>
            Até
            <input type="date" required value={ate} min={de} onChange={(event) => setAte(event.target.value)} />
          </label>
          <label>
            Texto
            <input value={texto} maxLength={80} placeholder="Protocolo, nome ou comentário" onChange={(event) => setTexto(event.target.value)} />
          </label>
          <button className="btn" type="submit" disabled={carregando}>{carregando ? "Pesquisando..." : "Pesquisar"}</button>
        </form>
        <div className="audit-exportar">
          <p>A consulta na tela pede início e fim, com no máximo 3 meses entre as datas. A base inteira sai no Excel.</p>
          <button className="btn secondary" type="button" disabled={exportando} onClick={() => void exportar()}>
            {exportando ? "Exportando..." : "Exportar base para Excel"}
          </button>
        </div>
      </Panel>
      <Panel title="Ações executadas">
        {erro && <p className="erro" role="alert">{erro}</p>}
        {carregando && <p className="audit-vazio">Carregando...</p>}
        {!carregando && consultou && itens.length === 0 && <p className="audit-vazio">Nenhuma ação neste período.</p>}
        {!carregando && itens.length > 0 && (
          <>
            <p className="audit-resumo">{itens.length === 1 ? "1 ação." : `${itens.length} ações.`}</p>
            <ListaAuditoria itens={itens} mostrarAutor />
          </>
        )}
      </Panel>
    </>
  );
}
