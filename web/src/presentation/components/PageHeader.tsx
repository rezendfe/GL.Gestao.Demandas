import type { ReactNode } from "react";

export function PageHeader({ title, trail, extra }: { title: string; trail: string[]; extra?: ReactNode }) {
  return (
    <div className="page-head">
      <h1>{title}</h1>
      <div className="page-head-side">
        {extra}
        <nav className="crumbs" aria-label="Trilha">
          {trail.map((item, index) => (
            <span key={`${item}-${index}`}>
              {index > 0 && <span className="sep">/</span>}
              <span className={index === trail.length - 1 ? "current" : undefined}>{item}</span>
            </span>
          ))}
        </nav>
      </div>
    </div>
  );
}
