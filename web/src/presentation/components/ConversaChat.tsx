import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ACEITA_ARQUIVO, validarArquivo } from "../../domain/entrada";
import { fotoPorPessoa } from "../../domain/fotos";
import { classeArquivo } from "../../domain/midia";
import type { Anexo, Mensagem } from "../../domain/types";
import { hora } from "../../domain/types";
import { api } from "../../infrastructure/api/client";

type ConversaChatProps = {
  demandaId: string;
  mensagens: Mensagem[];
  anexos: Anexo[];
  meuNome: string;
  minhaFoto: string | null;
  nomeCessionario: string;
  fotoCessionario: string | null;
  texto: string;
  onTexto: (valor: string) => void;
  arquivo: File | null;
  onArquivo: (arquivo: File | null) => void;
  onErro: (mensagem: string | null) => void;
  onAbrirAnexo: (anexoId: string) => void;
  onEnviar: () => void;
  rotuloEnvio: string;
  mensagemDestacada?: string | null;
  encerrado?: boolean;
  avisoEncerrado?: string;
};

export function ConversaChat({
  demandaId,
  mensagens,
  anexos,
  meuNome,
  minhaFoto,
  nomeCessionario,
  fotoCessionario,
  texto,
  onTexto,
  arquivo,
  onArquivo,
  onErro,
  onAbrirAnexo,
  onEnviar,
  rotuloEnvio,
  mensagemDestacada,
  encerrado = false,
  avisoEncerrado,
}: ConversaChatProps) {
  const fio = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = fio.current;
    if (!el) return;
    if (mensagemDestacada) {
      const alvo = Array.from(el.querySelectorAll<HTMLElement>("[data-mensagem]"))
        .find((item) => item.getAttribute("data-mensagem")?.toLowerCase() === mensagemDestacada.toLowerCase());
      if (alvo) {
        alvo.scrollIntoView({ block: "center" });
        return;
      }
    }
    el.scrollTop = el.scrollHeight;
  }, [mensagens, mensagemDestacada]);

  return (
    <section className="conversa-chat" aria-label="Comunicação">
      <div className="conversa-fio" ref={fio}>
        {mensagens.length === 0 && <p className="conversa-vazia">Nenhuma mensagem ainda.</p>}
        {mensagens.map((item) => {
          const minha = mesmaPessoa(item.autor, meuNome);
          const foto = fotoPorPessoa(minha ? meuNome : item.autor, null, minha ? minhaFoto : fotoDe(item.autor, meuNome, minhaFoto, nomeCessionario, fotoCessionario));
          const canal = rotuloExtra(item.canal, item.finalidade);
          const anexo = item.anexoId ? anexos.find((itemAnexo) => itemAnexo.id === item.anexoId) : undefined;
          const destacada = Boolean(mensagemDestacada) && item.id.toLowerCase() === mensagemDestacada!.toLowerCase();
          return (
            <article
              key={item.id}
              data-mensagem={item.id}
              className={`${minha ? "fala minha" : "fala"}${destacada ? " destacada" : ""}`}
            >
              <div className="fala-topo">
                {!minha && <AvatarFala nome={item.autor} foto={foto} />}
                <div className="fala-ident">
                  <strong>{minha ? "Você" : item.autor}</strong>
                  <time dateTime={item.enviadaEm} title={hora(item.enviadaEm)}>{tempoConversa(item.enviadaEm)}</time>
                </div>
                {minha && <AvatarFala nome={meuNome || "Você"} foto={foto} />}
              </div>
              {anexo && <MidiaAnexo demandaId={demandaId} anexo={anexo} onAbrir={() => onAbrirAnexo(anexo.id)} />}
              {item.texto.trim() && <p className="fala-bolha">{item.texto}</p>}
              {canal && <span className="fala-canal">{canal}</span>}
            </article>
          );
        })}
      </div>
      {encerrado ? (
        <p className="note">{avisoEncerrado}</p>
      ) : (
      <form
        className="conversa-escrever"
        onSubmit={(event) => {
          event.preventDefault();
          onEnviar();
        }}
      >
        <SeletorAnexo arquivo={arquivo} onArquivo={onArquivo} onErro={onErro}>
          <label className="sr-only" htmlFor="conversa-texto">Mensagem</label>
          <input
            id="conversa-texto"
            maxLength={2000}
            value={texto}
            onChange={(event) => onTexto(event.target.value)}
            placeholder="Escreva uma mensagem..."
          />
          <button className="conversa-enviar" type="submit" aria-label={rotuloEnvio} disabled={texto.trim().length === 0 && !arquivo}>
            <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </SeletorAnexo>
      </form>
      )}
    </section>
  );
}

export function SeletorAnexo({
  arquivo,
  onArquivo,
  onErro,
  children,
}: {
  arquivo: File | null;
  onArquivo: (arquivo: File | null) => void;
  onErro: (mensagem: string | null) => void;
  children?: ReactNode;
}) {
  const arquivos = useRef<HTMLInputElement>(null);
  const cameraArquivo = useRef<HTMLInputElement>(null);
  const [camera, setCamera] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [previa, setPrevia] = useState<string | null>(null);
  const classe = arquivo ? classeArquivo(arquivo.name, arquivo.type) : null;

  useEffect(() => {
    if (!arquivo) {
      setPrevia(null);
      return;
    }
    const url = URL.createObjectURL(arquivo);
    setPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);

  function escolher(escolhido: File | null) {
    if (!escolhido) return;
    const invalida = validarArquivo(escolhido);
    if (invalida) {
      onErro(invalida);
      return;
    }
    onErro(null);
    onArquivo(escolhido);
  }

  return (
    <>
      {previa && arquivo && (
        <div className="conversa-previa">
          {classe === "imagem" && <img src={previa} alt="Prévia da imagem" />}
          {classe === "audio" && <audio src={previa} controls />}
          {classe !== "imagem" && classe !== "audio" && <span>{arquivo.name}</span>}
          <button type="button" onClick={() => onArquivo(null)}>Remover</button>
        </div>
      )}
      {gravando && (
        <GravadorAudio
          onPronto={(gravado) => {
            setGravando(false);
            escolher(gravado);
          }}
          onErro={(texto) => {
            setGravando(false);
            onErro(texto);
          }}
          onCancelar={() => setGravando(false)}
        />
      )}
      <input
        ref={arquivos}
        className="sr-only"
        type="file"
        accept={ACEITA_ARQUIVO}
        aria-label="Procurar arquivo"
        onChange={(event) => {
          escolher(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />
      <input
        ref={cameraArquivo}
        className="sr-only"
        type="file"
        accept="image/*"
        capture="environment"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => {
          escolher(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />
      <div className="conversa-linha">
        <div className="conversa-anexos">
          <button className="conversa-anexar" type="button" aria-label="Tirar foto" title="Tirar foto" onClick={() => setCamera(true)}>
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M9 3 7.17 5H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.17L15 3H9zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
            </svg>
          </button>
          <button className="conversa-anexar" type="button" aria-label="Procurar arquivo" title="Procurar arquivo" onClick={() => arquivos.current?.click()}>
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
            </svg>
          </button>
          <button className="conversa-anexar" type="button" aria-label="Gravar áudio" title="Gravar áudio" onClick={() => setGravando(true)}>
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
            </svg>
          </button>
        </div>
        {children}
      </div>
      {camera && (
        <CameraFoto
          onFoto={(foto) => {
            setCamera(false);
            escolher(foto);
          }}
          onArquivo={() => cameraArquivo.current?.click()}
          onFechar={() => setCamera(false)}
          onErro={onErro}
        />
      )}
    </>
  );
}

function CameraFoto({
  onFoto,
  onArquivo,
  onFechar,
  onErro,
}: {
  onFoto: (arquivo: File) => void;
  onArquivo: () => void;
  onFechar: () => void;
  onErro: (mensagem: string | null) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [falha, setFalha] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setFalha("Este navegador não abriu a câmera. Use a câmera do aparelho.");
      return;
    }
    let ativo = true;
    let midia: MediaStream | null = null;
    void navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false }).then((stream) => {
      if (!ativo) {
        stream.getTracks().forEach((faixa) => faixa.stop());
        return;
      }
      midia = stream;
      if (video.current) {
        video.current.srcObject = stream;
        void video.current.play().catch(() => undefined);
      }
    }).catch(() => {
      if (ativo) setFalha("Autorize a câmera neste navegador, ou use a câmera do aparelho.");
    });
    return () => {
      ativo = false;
      midia?.getTracks().forEach((faixa) => faixa.stop());
    };
  }, []);

  async function capturar() {
    const origem = video.current;
    if (!origem) return;
    for (let tentativa = 0; tentativa < 10 && origem.videoWidth === 0; tentativa += 1) {
      await new Promise((resolver) => window.setTimeout(resolver, 200));
    }
    if (origem.videoWidth === 0) {
      onErro("Aguarde a câmera ficar pronta.");
      return;
    }
    const quadro = document.createElement("canvas");
    quadro.width = origem.videoWidth;
    quadro.height = origem.videoHeight;
    quadro.getContext("2d")?.drawImage(origem, 0, 0);
    quadro.toBlob((blob) => {
      if (!blob) {
        onErro("Não foi possível guardar a foto.");
        return;
      }
      onFoto(new File([blob], `foto-${Date.now()}.jpg`, { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  }

  return createPortal(
    <div className="camera-painel" role="dialog" aria-label="Câmera">
      {falha ? <p className="camera-falha">{falha}</p> : <video ref={video} autoPlay playsInline muted />}
      <div className="camera-acoes">
        {!falha && <button className="btn" type="button" onClick={capturar}>Tirar foto</button>}
        {falha && <button className="btn" type="button" onClick={() => { onArquivo(); onFechar(); }}>Usar a câmera do aparelho</button>}
        <button className="btn secondary" type="button" onClick={onFechar}>Cancelar</button>
      </div>
    </div>,
    document.body,
  );
}

function GravadorAudio({
  onPronto,
  onErro,
  onCancelar,
}: {
  onPronto: (arquivo: File) => void;
  onErro: (mensagem: string) => void;
  onCancelar: () => void;
}) {
  const [segundos, setSegundos] = useState(0);
  const [ligado, setLigado] = useState(false);
  const gravador = useRef<MediaRecorder | null>(null);
  const pedacos = useRef<Blob[]>([]);
  const pronto = useRef(onPronto);
  const falhou = useRef(onErro);
  pronto.current = onPronto;
  falhou.current = onErro;

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      falhou.current("Este navegador não grava áudio.");
      return;
    }
    let ativo = true;
    let descartar = false;
    let midia: MediaStream | null = null;
    let relogio = 0;
    void navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      if (!ativo) {
        stream.getTracks().forEach((faixa) => faixa.stop());
        return;
      }
      midia = stream;
      const tipo = tipoGravacao();
      const recorder = tipo ? new MediaRecorder(stream, { mimeType: tipo }) : new MediaRecorder(stream);
      gravador.current = recorder;
      pedacos.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) pedacos.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((faixa) => faixa.stop());
        if (descartar) return;
        const blob = new Blob(pedacos.current, { type: recorder.mimeType || tipo || "audio/webm" });
        if (blob.size <= 0) {
          falhou.current("A gravação ficou vazia.");
          return;
        }
        pronto.current(arquivoDeAudio(blob));
      };
      recorder.start();
      setLigado(true);
      relogio = window.setInterval(() => setSegundos((valor) => valor + 1), 1000);
    }).catch(() => {
      if (ativo) falhou.current("Autorize o microfone neste navegador para gravar o áudio.");
    });
    return () => {
      ativo = false;
      descartar = true;
      window.clearInterval(relogio);
      if (gravador.current && gravador.current.state !== "inactive") gravador.current.stop();
      else midia?.getTracks().forEach((faixa) => faixa.stop());
    };
  }, []);

  function parar() {
    if (gravador.current && gravador.current.state !== "inactive") gravador.current.stop();
  }

  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;

  return (
    <div className="conversa-gravando" role="status">
      <span>{ligado ? `Gravando ${minutos}:${resto.toString().padStart(2, "0")}` : "Abrindo microfone..."}</span>
      <button className="btn" type="button" onClick={parar} disabled={!ligado}>Parar e usar</button>
      <button className="btn secondary" type="button" onClick={onCancelar}>Cancelar</button>
    </div>
  );
}

function tipoGravacao() {
  if (typeof MediaRecorder === "undefined") return "";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  if (MediaRecorder.isTypeSupported("audio/ogg")) return "audio/ogg";
  return "";
}

function arquivoDeAudio(blob: Blob) {
  const tipo = (blob.type || "audio/webm").split(";")[0];
  const extensao = tipo.includes("mp4") ? "m4a" : tipo.includes("ogg") ? "ogg" : "webm";
  return new File([blob], `audio-${Date.now()}.${extensao}`, { type: tipo });
}

export function MidiaAnexo({
  demandaId,
  anexo,
  onAbrir,
}: {
  demandaId: string;
  anexo: Anexo;
  onAbrir: () => void;
}) {
  const classe = classeArquivo(anexo.nome, anexo.tipo);
  const [url, setUrl] = useState<string | null>(null);
  const [erro, setErro] = useState(false);
  const precisaBytes = classe === "imagem" || classe === "audio";

  useEffect(() => {
    if (!precisaBytes) return;
    let ativo = true;
    let objeto: string | null = null;
    setErro(false);
    setUrl(null);
    void api.abrirAnexo(demandaId, anexo.id).then((arquivo) => {
      objeto = URL.createObjectURL(new Blob([arquivo.buffer], { type: arquivo.tipo || anexo.tipo || "application/octet-stream" }));
      if (ativo) setUrl(objeto);
      else URL.revokeObjectURL(objeto);
    }).catch(() => {
      if (ativo) setErro(true);
    });
    return () => {
      ativo = false;
      if (objeto) URL.revokeObjectURL(objeto);
    };
  }, [demandaId, anexo.id, anexo.tipo, precisaBytes]);

  if (!precisaBytes) {
    return (
      <button className="btn secondary" type="button" onClick={onAbrir}>
        {anexo.nome}
      </button>
    );
  }
  if (erro) return <p className="fala-bolha">Não foi possível abrir o arquivo.</p>;
  if (!url) return <p className="fala-bolha">Abrindo arquivo...</p>;
  if (classe === "audio") return <audio className="fala-audio" src={url} controls />;
  return (
    <button className="fala-imagem" type="button" onClick={onAbrir} aria-label="Abrir imagem">
      <img src={url} alt="" />
    </button>
  );
}

function AvatarFala({ nome, foto }: { nome: string; foto: string | null }) {
  if (foto) return <img className="fala-avatar" src={foto} alt="" />;
  return <span className="fala-avatar" aria-hidden="true">{iniciais(nome)}</span>;
}

function fotoDe(autor: string, meuNome: string, minhaFoto: string | null, nomeCessionario: string, fotoCessionario: string | null) {
  if (mesmaPessoa(autor, meuNome)) return minhaFoto;
  if (mesmaPessoa(autor, nomeCessionario)) return fotoCessionario;
  return null;
}

function mesmaPessoa(a: string, b: string) {
  return a.trim().toLocaleLowerCase("pt-BR") === b.trim().toLocaleLowerCase("pt-BR");
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  return partes.slice(0, 2).map((parte) => parte[0]?.toUpperCase() ?? "").join("") || "?";
}

function rotuloExtra(canal: string, finalidade: string) {
  if (finalidade === "complemento") return "Complemento";
  if (canal === "CELULAR") return "Celular";
  if (canal === "MENSAGERIA") return "Mensageria";
  return "";
}

function tempoConversa(iso: string) {
  const segundos = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (segundos < 5) return "agora";
  if (segundos < 60) return segundos === 1 ? "1 segundo" : `${segundos} segundos`;
  const minutos = Math.round(segundos / 60);
  if (minutos < 60) return minutos === 1 ? "1 minuto" : `${minutos} minutos`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return horas === 1 ? "1 hora" : `${horas} horas`;
  const dias = Math.round(horas / 24);
  if (dias < 7) return dias === 1 ? "1 dia" : `${dias} dias`;
  return hora(iso);
}
