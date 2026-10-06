import type { ButtonHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import { diaCurto, horaCurta } from "../../domain/types";

const FAIXAS = ["#7047ee", "#16a34a", "#3b82f6", "#e11d48", "#f5a524"];

export function faixaAviso(indice: number) {
  return FAIXAS[indice % FAIXAS.length];
}

type LinhaAvisoProps = {
  iso: string;
  texto: string;
  complemento: string;
  cor: string;
  destaque?: boolean;
  ativo?: boolean;
  para?: string;
  onClick?: () => void;
} & Pick<ButtonHTMLAttributes<HTMLButtonElement>, "role" | "aria-selected">;

export function LinhaAviso({ iso, texto, complemento, cor, destaque, ativo, para, onClick, role, "aria-selected": selecionado }: LinhaAvisoProps) {
  const classe = `aviso-linha${destaque ? " destaque" : ""}${ativo ? " ativo" : ""}`;
  const corpo = (
    <>
      <time dateTime={iso}>
        <span className="aviso-dia">{diaCurto(iso)}</span>
        <span className="aviso-hora">{horaCurta(iso)}</span>
      </time>
      <span className="aviso-faixa" style={{ background: cor }} aria-hidden="true" />
      <span className="aviso-corpo">
        <span className="aviso-texto">{texto}</span>
        {complemento && <span className="aviso-autor">{complemento}</span>}
      </span>
    </>
  );
  if (para) {
    return (
      <Link className={classe} to={para}>
        {corpo}
      </Link>
    );
  }
  return (
    <button className={classe} type="button" role={role} aria-selected={selecionado} onClick={onClick}>
      {corpo}
    </button>
  );
}
