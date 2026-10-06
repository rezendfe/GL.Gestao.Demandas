import { useEffect, useId, type ReactNode } from "react";

export function ModalCadastro({
  titulo,
  onFechar,
  children,
}: {
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
}) {
  const tituloId = useId();

  useEffect(() => {
    const fechar = (event: KeyboardEvent) => {
      if (event.key === "Escape") onFechar();
    };
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [onFechar]);

  return (
    <div className="modal-fundo" role="presentation">
      <section className="modal modal-cadastro" role="dialog" aria-modal="true" aria-labelledby={tituloId}>
        <h2 id={tituloId}>{titulo}</h2>
        {children}
      </section>
    </div>
  );
}
