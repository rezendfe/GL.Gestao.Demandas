import { useState } from "react";
import { ApiError, api } from "../../infrastructure/api/client";

export function BotaoPdfProtocolo({ id, protocolo }: { id: string; protocolo: string }) {
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);

  async function exportar() {
    setFalha(null);
    setEnviando(true);
    try {
      await api.exportarProtocolo(id, protocolo);
    } catch (error) {
      setFalha(error instanceof ApiError ? error.message : "Não foi possível gerar o PDF.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <span className="acao-arquivo">
      <button className="btn secondary" type="button" onClick={exportar} disabled={enviando}>
        {enviando ? "Gerando PDF..." : "PDF do protocolo"}
      </button>
      <span className="note">Protocolo {protocolo}. Próximo passo: baixar o PDF.</span>
      {falha && <span className="erro">{falha} <button className="btn secondary" type="button" onClick={exportar}>Tentar de novo</button></span>}
    </span>
  );
}
