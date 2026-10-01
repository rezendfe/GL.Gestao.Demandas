import { useEffect, useRef, useState } from "react";

type CampoDitadoProps = {
  id: string;
  value: string;
  onChange: (valor: string) => void;
  onConcluido?: (texto: string) => void;
  placeholder?: string;
};

type ReconhecimentoFala = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((evento: EventoFala) => void) | null;
  onerror: ((evento: ErroFala) => void) | null;
  onend: (() => void) | null;
};

type EventoFala = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0?: { transcript: string };
  }>;
};

type ErroFala = { error: string };

function juntar(base: string, fala: string) {
  const texto = fala.replace(/\s+/g, " ").trim();
  if (!texto) return base;
  if (!base.trim()) return texto.charAt(0).toLocaleUpperCase("pt-BR") + texto.slice(1);
  return `${base.replace(/\s+$/, "")} ${texto}`;
}

function construtorReconhecimento(): (new () => ReconhecimentoFala) | null {
  const janela = window as Window & {
    SpeechRecognition?: new () => ReconhecimentoFala;
    webkitSpeechRecognition?: new () => ReconhecimentoFala;
  };
  return janela.SpeechRecognition ?? janela.webkitSpeechRecognition ?? null;
}

function IconeMicrofone() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4M8 21h8" />
    </svg>
  );
}

function IconeParar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" />
    </svg>
  );
}

export function CampoDitado({ id, value, onChange, onConcluido, placeholder }: CampoDitadoProps) {
  const [ouvindo, setOuvindo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const valorRef = useRef(value);
  const baseRef = useRef(value);
  const finaisRef = useRef("");
  const ativoRef = useRef(false);
  const concluirRef = useRef(false);
  const ouviuFalaRef = useRef(false);
  const reconhecimentoRef = useRef<ReconhecimentoFala | null>(null);
  const aoConcluirRef = useRef(onConcluido);
  aoConcluirRef.current = onConcluido;
  valorRef.current = value;

  function publicar(texto: string) {
    const limitado = texto.slice(0, 2000);
    valorRef.current = limitado;
    onChange(limitado);
  }

  useEffect(() => {
    return () => {
      concluirRef.current = false;
      ativoRef.current = false;
      reconhecimentoRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!ouvindo || !areaRef.current) return;
    const campo = areaRef.current;
    const fim = campo.value.length;
    campo.setSelectionRange(fim, fim);
  }, [ouvindo, value]);

  function aplicar(interim: string) {
    publicar(juntar(baseRef.current, `${finaisRef.current}${interim}`));
  }

  function garantirReconhecimento() {
    if (reconhecimentoRef.current) return reconhecimentoRef.current;
    const Construtor = construtorReconhecimento();
    if (!Construtor) return null;
    const reconhecimento = new Construtor();
    reconhecimento.lang = "pt-BR";
    reconhecimento.continuous = true;
    reconhecimento.interimResults = true;
    reconhecimento.onresult = (evento) => {
      let interim = "";
      for (let indice = evento.resultIndex; indice < evento.results.length; indice += 1) {
        const resultado = evento.results[indice];
        const trecho = resultado?.[0]?.transcript ?? "";
        if (trecho.trim()) ouviuFalaRef.current = true;
        if (resultado?.isFinal) finaisRef.current += trecho;
        else interim += trecho;
      }
      aplicar(interim);
    };
    reconhecimento.onerror = (evento) => {
      if (evento.error === "no-speech" || evento.error === "aborted") return;
      ativoRef.current = false;
      setOuvindo(false);
      if (evento.error === "not-allowed" || evento.error === "service-not-allowed") {
        setAviso("Permita o microfone do navegador para ditar a descrição.");
        return;
      }
      if (evento.error === "audio-capture") {
        setAviso("Nenhum microfone foi encontrado neste dispositivo.");
        return;
      }
      setAviso("Não foi possível transcrever agora. Verifique a conexão e tente de novo.");
    };
    reconhecimento.onend = () => {
      if (!ativoRef.current) {
        setOuvindo(false);
        const concluir = concluirRef.current;
        concluirRef.current = false;
        const texto = valorRef.current.trim();
        if (concluir && ouviuFalaRef.current && texto)
          aoConcluirRef.current?.(texto);
        return;
      }
      baseRef.current = juntar(baseRef.current, finaisRef.current);
      finaisRef.current = "";
      publicar(baseRef.current);
      window.setTimeout(() => {
        if (!ativoRef.current) return;
        try {
          reconhecimento.start();
        } catch {
          ativoRef.current = false;
          setOuvindo(false);
        }
      }, 200);
    };
    reconhecimentoRef.current = reconhecimento;
    return reconhecimento;
  }

  function parar(concluir: boolean) {
    concluirRef.current = concluir;
    ativoRef.current = false;
    setOuvindo(false);
    try {
      reconhecimentoRef.current?.stop();
    } catch {
      /* reconhecimento já encerrado */
    }
  }

  function alternar() {
    if (ativoRef.current) {
      parar(true);
      return;
    }
    const reconhecimento = garantirReconhecimento();
    if (!reconhecimento) {
      setAviso("Ditado por voz está disponível no Chrome e no Edge.");
      return;
    }
    setAviso(null);
    baseRef.current = valorRef.current;
    finaisRef.current = "";
    ouviuFalaRef.current = false;
    concluirRef.current = false;
    ativoRef.current = true;
    setOuvindo(true);
    areaRef.current?.focus();
    try {
      reconhecimento.start();
    } catch {
      ativoRef.current = false;
      setOuvindo(false);
      setAviso("Não foi possível iniciar o microfone. Tente novamente.");
    }
  }

  return (
    <span className="campo-ditado">
      <span className="campo-ditado-caixa">
        <textarea
          id={id}
          ref={areaRef}
          value={value}
          maxLength={2000}
          placeholder={placeholder}
          onChange={(evento) => {
            if (ativoRef.current) parar(false);
            publicar(evento.target.value);
          }}
        />
        {ouvindo && <span className="ditado-ouvindo" aria-hidden="true">Ouvindo</span>}
        <button
          type="button"
          className={ouvindo ? "ditado-mic ouvindo" : "ditado-mic"}
          aria-pressed={ouvindo}
          aria-label={ouvindo ? "Parar ditado" : "Ditar descrição"}
          onClick={alternar}
        >
          {ouvindo ? <IconeParar /> : <IconeMicrofone />}
        </button>
      </span>
      <span className="sr-only" aria-live="polite">
        {ouvindo ? "Ouvindo. A fala está sendo transcrita na descrição." : (aviso ?? "")}
      </span>
      {aviso && <span className="ditado-aviso" role="alert">{aviso}</span>}
    </span>
  );
}
