import { useState } from "react";
import { validarOpcional } from "../../domain/entrada";
import { ApiError, api } from "../../infrastructure/api/client";

const NOTAS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function PerguntaAtendimento({
  id,
  protocolo,
  aoEnviar,
}: {
  id: string;
  protocolo: string;
  aoEnviar: () => Promise<void>;
}) {
  const [nota, setNota] = useState<number | null>(null);
  const [comentario, setComentario] = useState("");
  const [falha, setFalha] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (nota === null) return;
    const comentarioInvalido = validarOpcional(comentario, 500, "O comentário da avaliação tem no máximo 500 caracteres.");
    if (comentarioInvalido) {
      setFalha(comentarioInvalido);
      return;
    }
    setEnviando(true);
    setFalha(null);
    try {
      await api.avaliar(id, nota, comentario.trim());
      await aoEnviar();
    } catch (error) {
      setFalha(error instanceof ApiError ? error.message : "Não foi possível registrar a nota.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <article className="pergunta-nps">
      <p>Como foi o atendimento de {protocolo}?</p>
      <div className="notas" role="group" aria-label="Nota de 0 a 10">
        {NOTAS.map((valor) => (
          <button key={valor} type="button" className={nota === valor ? "ativa" : ""} onClick={() => setNota(valor)}>
            {valor}
          </button>
        ))}
      </div>
      <label>
        Comentário, se quiser
        <textarea maxLength={500} value={comentario} onChange={(event) => setComentario(event.target.value)} placeholder="O que pode melhorar no tratamento" />
      </label>
      {falha && <p className="erro">{falha}</p>}
      <button className="btn" type="button" disabled={enviando || nota === null} onClick={() => void enviar()}>
        Enviar nota
      </button>
    </article>
  );
}
