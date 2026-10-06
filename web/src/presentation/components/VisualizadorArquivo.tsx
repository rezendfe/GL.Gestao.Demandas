import { useEffect, useState } from "react";
import type { Anexo } from "../../domain/types";
import { classeArquivo, tipoBlob, type ClasseArquivo } from "../../domain/midia";
import { api } from "../../infrastructure/api/client";
import { GaleriaLightbox, type FotoItem } from "./GaleriaLightbox";

export function VisualizadorArquivo({
  demandaId,
  anexos,
  alvo,
  onAlvo,
  onFechar,
}: {
  demandaId: string;
  anexos: Anexo[];
  alvo: Anexo | null;
  onAlvo: (anexo: Anexo) => void;
  onFechar: () => void;
}) {
  const imagens = anexos.filter((anexo) => classeArquivo(anexo.nome, anexo.tipo) === "imagem");
  const classe = alvo ? classeArquivo(alvo.nome, alvo.tipo) : null;
  const indiceImagem = alvo && classe === "imagem" ? Math.max(0, imagens.findIndex((item) => item.id === alvo.id)) : null;

  if (!alvo || !classe) return null;
  if (classe === "imagem") {
    return (
      <GaleriaAnexos
        demandaId={demandaId}
        imagens={imagens}
        indice={indiceImagem ?? 0}
        onIndice={(posicao) => onAlvo(imagens[posicao])}
        onFechar={onFechar}
      />
    );
  }
  return <PainelDocumento demandaId={demandaId} anexo={alvo} classe={classe} onFechar={onFechar} />;
}

function GaleriaAnexos({
  demandaId,
  imagens,
  indice,
  onIndice,
  onFechar,
}: {
  demandaId: string;
  imagens: Anexo[];
  indice: number;
  onIndice: (indice: number) => void;
  onFechar: () => void;
}) {
  const [fotos, setFotos] = useState<FotoItem[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const chave = imagens.map((anexo) => anexo.id).join("|");

  useEffect(() => {
    const sessao = { ativo: true, urls: [] as string[] };
    setErro(null);
    setFotos([]);
    void Promise.all(imagens.map(async (anexo) => {
      const arquivo = await api.abrirAnexo(demandaId, anexo.id);
      const url = URL.createObjectURL(new Blob([arquivo.buffer], { type: tipoBlob(anexo.nome, arquivo.tipo) }));
      if (!sessao.ativo) {
        URL.revokeObjectURL(url);
        return null;
      }
      sessao.urls.push(url);
      return { id: anexo.id, url, legenda: anexo.nome };
    })).then((itens) => {
      if (sessao.ativo) setFotos(itens.filter((item): item is FotoItem => item !== null));
    }).catch(() => {
      if (sessao.ativo) setErro("Não foi possível abrir as imagens.");
    });
    return () => {
      sessao.ativo = false;
      sessao.urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [demandaId, chave]);

  if (erro) return <AvisoVisor texto={erro} onFechar={onFechar} />;
  if (fotos.length === 0) return <AvisoVisor texto="Abrindo imagens..." onFechar={onFechar} />;
  return <GaleriaLightbox fotos={fotos} indice={indice} onIndice={onIndice} onFechar={onFechar} />;
}

function PainelDocumento({
  demandaId,
  anexo,
  classe,
  onFechar,
}: {
  demandaId: string;
  anexo: Anexo;
  classe: Exclude<ClasseArquivo, "imagem">;
  onFechar: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    let objeto: string | null = null;
    setUrl(null);
    setHtml(null);
    setErro(null);
    void api.abrirAnexo(demandaId, anexo.id).then(async (arquivo) => {
      const tipo = tipoBlob(anexo.nome, arquivo.tipo || anexo.tipo);
      const blob = new Blob([arquivo.buffer], { type: tipo });
      if (classe === "word" || classe === "excel") {
        const marcado = await htmlDoOffice(anexo.nome, arquivo.buffer, classe);
        if (ativo) setHtml(marcado);
        return;
      }
      objeto = URL.createObjectURL(blob);
      if (ativo) setUrl(objeto);
    }).catch(() => {
      if (ativo) setErro("Não foi possível abrir o arquivo.");
    });
    return () => {
      ativo = false;
      if (objeto) URL.revokeObjectURL(objeto);
    };
  }, [anexo, classe, demandaId]);

  useEffect(() => {
    function tecla(event: KeyboardEvent) {
      if (event.key === "Escape") onFechar();
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onFechar]);

  return (
    <div className="visor" role="dialog" aria-modal="true" aria-label={anexo.nome}>
      <header className="lightbox-topo">
        <strong>{anexo.nome}</strong>
        <button className="lightbox-fechar" type="button" onClick={onFechar}>Fechar</button>
      </header>
      <div className="visor-corpo">
        {erro && <p>{erro}</p>}
        {!erro && !url && !html && <p>Abrindo arquivo...</p>}
        {classe === "pdf" && url && <iframe title={anexo.nome} src={url} />}
        {classe === "audio" && url && <audio controls autoPlay src={url} />}
        {(classe === "word" || classe === "excel") && html && (
          <iframe title={anexo.nome} sandbox="" srcDoc={html} />
        )}
        {classe === "outro" && <p>Este formato não abre no portal.</p>}
      </div>
    </div>
  );
}

function AvisoVisor({ texto, onFechar }: { texto: string; onFechar: () => void }) {
  return (
    <div className="visor" role="dialog" aria-modal="true">
      <header className="lightbox-topo">
        <strong>{texto}</strong>
        <button className="lightbox-fechar" type="button" onClick={onFechar}>Fechar</button>
      </header>
    </div>
  );
}

async function htmlDoOffice(nome: string, buffer: ArrayBuffer, classe: "word" | "excel") {
  if (classe === "word") return htmlWord(nome, buffer);
  return htmlExcel(buffer);
}

async function htmlWord(nome: string, buffer: ArrayBuffer) {
  if (nome.toLowerCase().endsWith(".doc") && !zip(buffer)) {
    return pagina(extrairTexto(buffer) || "Não foi possível ler este Word antigo. Envie o arquivo em .docx.");
  }
  const mammoth = await import("mammoth");
  const resultado = await mammoth.convertToHtml({ arrayBuffer: buffer });
  return pagina(resultado.value || "O documento não tem texto para mostrar.");
}

async function htmlExcel(buffer: ArrayBuffer) {
  const XLSX = await import("xlsx");
  const livro = XLSX.read(buffer, { type: "array" });
  const tabelas = livro.SheetNames.map((nome) => {
    const folha = livro.Sheets[nome];
    const tabela = XLSX.utils.sheet_to_html(folha);
    return `<h2>${escapar(nome)}</h2>${tabela}`;
  }).join("");
  return pagina(tabelas || "A planilha está vazia.");
}

function zip(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  return bytes.length > 3 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

function extrairTexto(buffer: ArrayBuffer) {
  const texto = new TextDecoder("utf-16le").decode(buffer);
  const limpo = texto.replace(/[^\p{L}\p{N}\p{P}\p{Z}\n]/gu, " ").replace(/[ ]{2,}/g, " ").trim();
  const trechos = limpo.split(/\s{3,}|\n/).map((parte) => parte.trim()).filter((parte) => parte.length > 2);
  return trechos.slice(0, 80).join("\n");
}

function pagina(corpo: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { font-family: Segoe UI, sans-serif; margin: 24px; color: #1b1d24; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #d9d6e3; padding: 6px 8px; text-align: left; }
    img { max-width: 100%; }
    h2 { font-size: 16px; }
  </style></head><body>${corpo}</body></html>`;
}

function escapar(valor: string) {
  return valor.replace(/[&<>"]/g, (letra) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[letra] ?? letra));
}
