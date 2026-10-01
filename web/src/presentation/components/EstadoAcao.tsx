import type { ReactNode } from "react";
import { Badge } from "./Badge";

export function EstadoAcao({ situacao, proximo, acao }: { situacao: string; proximo: string; acao?: ReactNode }) {
  return (
    <section className="estado-acao" aria-label="Situação e próximo passo">
      <p><span className="note">Situação</span> <Badge valor={situacao} /></p>
      <p><span className="note">Próximo passo</span> <strong>{proximo}</strong></p>
      {acao}
    </section>
  );
}
