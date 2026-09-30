import { useEffect, useId, useState } from "react";
import { rotuloCampo } from "../../domain/cadeia";
import type { EtapaCadeia } from "../../domain/types";

export function ModalAvanco({
  protocolo,
  situacao,
  destino,
  jaTemPrevisao,
  podeDecidir,
  enviando,
  erro,
  onCancelar,
  onConfirmar,
  onDecidir,
}: {
  protocolo: string;
  situacao: string;
  destino: EtapaCadeia;
  jaTemPrevisao: boolean;
  podeDecidir: boolean;
  enviando: boolean;
  erro: string | null;
  onCancelar: () => void;
  onConfirmar: (valor: { comentario: string; previsao: string; confirmacao: boolean | null }) => void;
  onDecidir?: (decisao: "Solicitar ajuste" | "Reprovar", motivo: string) => void;
}) {
  const tituloId = useId();
  const [comentario, setComentario] = useState("");
  const [previsao, setPrevisao] = useState("");
  const [confirmacao, setConfirmacao] = useState<boolean | null>(null);
  const pedeConfirmacao = situacao === "Aguardando validação" && destino.codigo === "conclusao";
  const pedeComentario = destino.campos.includes("comentario") || (pedeConfirmacao && confirmacao === false);
  const pedePrevisao = destino.campos.includes("previsao") && !jaTemPrevisao && confirmacao !== false;

  useEffect(() => {
    function fechar(event: KeyboardEvent) {
      if (event.key === "Escape") onCancelar();
    }
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [onCancelar]);

  return (
    <div className="modal-fundo" onClick={onCancelar}>
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          onConfirmar({ comentario, previsao, confirmacao });
        }}
      >
        <h2 id={tituloId}>Avançar {protocolo}</h2>
        <p>
          Para ir a <strong>{destino.nome}</strong>, preencha o que esta etapa pede.
        </p>
        {pedeConfirmacao && (
          <fieldset className="modal-opcoes">
            <legend>O serviço foi realizado?</legend>
            <label>
              <input type="radio" name="confirmacao" checked={confirmacao === true} required onChange={() => setConfirmacao(true)} />
              Sim, pode concluir
            </label>
            <label>
              <input type="radio" name="confirmacao" checked={confirmacao === false} onChange={() => setConfirmacao(false)} />
              Ainda não
            </label>
          </fieldset>
        )}
        {pedeComentario && (
          <label>
            {pedeConfirmacao && confirmacao === false ? "O que ainda falta" : rotuloCampo(destino.codigo, "comentario")}
            <textarea value={comentario} onChange={(event) => setComentario(event.target.value)} required />
          </label>
        )}
        {pedePrevisao && (
          <label>
            {rotuloCampo(destino.codigo, "previsao")}
            <input type="datetime-local" value={previsao} onChange={(event) => setPrevisao(event.target.value)} required />
          </label>
        )}
        {erro && <p className="erro">{erro}</p>}
        <div className="row">
          <button className="btn" type="submit" disabled={enviando}>
            {enviando ? "Salvando..." : `Confirmar ${destino.nome}`}
          </button>
          <button className="btn secondary" type="button" onClick={onCancelar}>Cancelar</button>
        </div>
        {podeDecidir && onDecidir && (
          <div className="row">
            <button className="btn secondary" type="button" disabled={enviando} onClick={() => onDecidir("Solicitar ajuste", comentario)}>
              Solicitar ajuste
            </button>
            <button className="btn danger" type="button" disabled={enviando} onClick={() => onDecidir("Reprovar", comentario)}>
              Reprovar
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
