export type NomeIcone = "menu" | "lista" | "mais" | "mensagem" | "grade" | "obra" | "caixa" | "casa" | "quadro" | "alerta" | "configuracao" | "sino" | "agenda";

type IconeProps = { name: NomeIcone };

export function Icone({ name }: IconeProps) {
  const comum = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, "aria-hidden": true } as const;
  if (name === "menu") {
    return (
      <svg {...comum}>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    );
  }
  if (name === "lista") {
    return (
      <svg {...comum}>
        <path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" />
      </svg>
    );
  }
  if (name === "mais") {
    return (
      <svg {...comum}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }
  if (name === "mensagem") {
    return (
      <svg {...comum}>
        <path d="M5 6h14v9H8l-3 3V6z" />
      </svg>
    );
  }
  if (name === "obra") {
    return (
      <svg {...comum}>
        <path d="M4 20V9l8-5 8 5v11H4zM9 20v-6h6v6" />
      </svg>
    );
  }
  if (name === "casa") {
    return (
      <svg {...comum}>
        <path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
      </svg>
    );
  }
  if (name === "caixa") {
    return (
      <svg {...comum}>
        <path d="M3 8l9-4 9 4-9 4-9-4zM3 8v8l9 4 9-4V8M12 12v8" />
      </svg>
    );
  }
  if (name === "quadro") {
    return (
      <svg {...comum}>
        <path d="M4 5h4v14H4zM10 5h4v9h-4zM16 5h4v6h-4z" />
      </svg>
    );
  }
  if (name === "alerta") {
    return (
      <svg {...comum}>
        <path d="M12 4 3 19h18L12 4zM12 10v4M12 16.5h.01" />
      </svg>
    );
  }
  if (name === "configuracao") {
    return (
      <svg {...comum}>
        <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" />
        <path d="m19.4 15 .1.1a1.7 1.7 0 1 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 1 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 1 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 1 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 1 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9z" transform="translate(1 1) scale(.92)" />
      </svg>
    );
  }
  if (name === "sino") {
    return (
      <svg {...comum}>
        <path d="M6 16V10a6 6 0 1 1 12 0v6l1.5 2h-15L6 16z" />
        <path d="M10 18a2 2 0 0 0 4 0" />
      </svg>
    );
  }
  if (name === "agenda") {
    return (
      <svg {...comum}>
        <path d="M7 3v3M17 3v3M4 8h16M5 5h14v15H5z" />
      </svg>
    );
  }
  return (
    <svg {...comum}>
      <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
    </svg>
  );
}
