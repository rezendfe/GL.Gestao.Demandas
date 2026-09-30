import type { ReactNode } from "react";

export function Panel({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={className ? `panel ${className}` : "panel"}>
      {title ? (
        <header className="panel-heading">
          <h2>{title}</h2>
        </header>
      ) : null}
      <div className="panel-body">{children}</div>
    </section>
  );
}
