import { useEffect, useId, useRef, useState } from "react";
import { rotuloCampo, tarefasDa } from "../../domain/cadeia";
import { validarImagem } from "../../domain/entrada";
import { tipoBlob } from "../../domain/midia";
import type { Anexo, EtapaCadeia } from "../../domain/types";
import { api } from "../../infrastructure/api/client";

export function ModalAvanco({
  protocolo,
  demandaId,
  situacao,
  destino,
  jaTemPrevisao,
  podeDecidir,
  enviando,
  erro,
  onCancelar,
  onConfirmar,
  onDecidir,
}: {
  protocolo: string;
  demandaId: string;
  situacao: string;
  destino: EtapaCadeia;
  jaTemPrevisao: boolean;
  podeDecidir: boolean;
  enviando: boolean;
  erro: string | null;
  onCancelar: () => void;
  onConfirmar: (valor: { comentario: string; previsao: string; confirmacao: boolean | null; fotos: File[] }) => void;
  onDecidir?: (decisao: "Solicitar ajuste" | "Reprovar", motivo: string) => void;
}) {
  const tituloId = useId();
  const camera = useRef<HTMLInputElement>(null);
  const arquivos = useRef<HTMLInputElement>(null);
  const [comentario, setComentario] = useState("");
  const [previsao, setPrevisao] = useState("");
  const [confirmacao, setConfirmacao] = useState<boolean | null>(null);
  const [fotos, setFotos] = useState<File[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const tarefas = tarefasDa(destino);
  const comentarioTarefa = tarefas.find((tarefa) => tarefa.codigo === "comentario");
  const previsaoTarefa = tarefas.find((tarefa) => tarefa.codigo === "previsao");
  const anexoTarefa = tarefas.find((tarefa) => tarefa.codigo === "anexo");
  const pedeConfirmacao = situacao === "Aguardando validação" && destino.codigo === "conclusao";
  const pedeFotos = destino.codigo === "validacao";
  const pedeComentario = comentarioTarefa != null || (pedeConfirmacao && confirmacao === false);
  const comentarioObrigatorio = (comentarioTarefa?.obrigatoria ?? false) || (pedeConfirmacao && confirmacao === false);
  const pedePrevisao = previsaoTarefa != null && !jaTemPrevisao && confirmacao !== false;

  useEffect(() => {
    function fechar(event: KeyboardEvent) {
      if (event.key === "Escape") onCancelar();
    }
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [onCancelar]);

  function incluir(lista: FileList | null) {
    if (!lista || lista.length === 0) return;
    const recebidas = [...lista].map(nomearFoto);
    const invalida = recebidas.map((foto) => validarImagem(foto)).find((mensagem) => mensagem !== null);
    if (invalida) {
      setAviso(invalida);
      return;
    }
    setFotos((atual) => {
      const juntas = [...atual];
      for (const foto of recebidas) {
        if (juntas.length >= 8) break;
        const repetida = juntas.some((item) => item.name === foto.name && item.size === foto.size && item.lastModified === foto.lastModified);
        if (!repetida) juntas.push(foto);
      }
      return juntas;
    });
    setAviso(juntasDemais(recebidas.length) ? "É possível enviar até 8 fotos da obra executada." : null);
    if (camera.current) camera.current.value = "";
    if (arquivos.current) arquivos.current.value = "";
  }

  return (
    <div className="modal-fundo" onClick={onCancelar}>
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          if (pedeFotos && fotos.length === 0) {
            setAviso("Anexe ao menos uma foto da obra executada.");
            return;
          }
          onConfirmar({ comentario, previsao, confirmacao, fotos: pedeFotos ? fotos : [] });
        }}
      >
        <h2 id={tituloId}>{destino.codigo === "validacao" ? "Registrar atendimento" : `Avançar ${protocolo}`}</h2>
        <p>
          {destino.codigo === "validacao"
            ? "Descreva o que foi feito e anexe a foto da obra. O Cessionário valida em seguida."
            : <>Para ir a <strong>{destino.nome}</strong>, preencha o que esta etapa pede.</>}
        </p>
        {pedeConfirmacao && (
          <fieldset className="modal-opcoes">
            <legend>O serviço foi realizado?</legend>
            <label>
              <input type="radio" name="confirmacao" checked={confirmacao === true} required onChange={() => setConfirmacao(true)} />
              Sim, pode concluir
            </label>
            <label>
              <input type="radio" name="confirmacao" checked={confirmacao === false} onChange={() => setConfirmacao(false)} />
              Ainda não
            </label>
          </fieldset>
        )}
        {pedeConfirmacao && <FotosExistentes demandaId={demandaId} />}
        {pedeComentario && (
          <label>
            {pedeConfirmacao && confirmacao === false ? "O que ainda falta" : rotuloCampo(destino.codigo, "comentario")}
            {comentarioObrigatorio ? "" : " (opcional)"}
            <textarea maxLength={2000} value={comentario} onChange={(event) => setComentario(event.target.value)} required={comentarioObrigatorio} />
          </label>
        )}
        {pedeFotos && (
          <fieldset className="fotos-obra">
            <legend>Fotos da obra executada</legend>
            <p className="note">O Cessionário confere o serviço por essas fotos.</p>
            <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(event) => incluir(event.target.files)} />
            <input ref={arquivos} type="file" accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif" multiple hidden onChange={(event) => incluir(event.target.files)} />
            <div className="row">
              <button className="btn secondary" type="button" onClick={() => camera.current?.click()}>Tirar foto</button>
              <button className="btn secondary" type="button" onClick={() => arquivos.current?.click()}>Escolher fotos</button>
            </div>
            <PreviaFotos fotos={fotos} onRemover={(indice) => setFotos((atual) => atual.filter((_, posicao) => posicao !== indice))} />
          </fieldset>
        )}
        {pedePrevisao && (
          <label>
            {rotuloCampo(destino.codigo, "previsao")}
            {previsaoTarefa?.obrigatoria ? "" : " (opcional)"}
            <input type="datetime-local" value={previsao} onChange={(event) => setPrevisao(event.target.value)} required={previsaoTarefa?.obrigatoria ?? false} />
          </label>
        )}
        {anexoTarefa && destino.codigo !== "validacao" && (
          <p className="note">
            {anexoTarefa.obrigatoria
              ? "Esta etapa exige um anexo no chamado antes de confirmar."
              : "O anexo nesta etapa é opcional."}
          </p>
        )}
        {(aviso || erro) && <p className="erro">{aviso ?? erro}</p>}
        <div className="row">
          <button className="btn" type="submit" disabled={enviando}>
            {enviando ? "Salvando..." : destino.codigo === "validacao" ? "Registrar atendimento" : `Confirmar ${destino.nome}`}
          </button>
          <button className="btn secondary" type="button" onClick={onCancelar}>Cancelar</button>
        </div>
        {podeDecidir && onDecidir && (
          <div className="row">
            <button className="btn secondary" type="button" disabled={enviando} onClick={() => onDecidir("Solicitar ajuste", comentario)}>
              Solicitar ajuste
            </button>
            <button className="btn danger" type="button" disabled={enviando} onClick={() => onDecidir("Reprovar", comentario)}>
              Reprovar
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

function juntasDemais(quantidade: number) {
  return quantidade > 8;
}

function nomearFoto(arquivo: File) {
  if (/\.(jpe?g|png|webp|gif)$/i.test(arquivo.name)) return arquivo;
  const extensao = arquivo.type === "image/png" ? "png" : arquivo.type === "image/webp" ? "webp" : arquivo.type === "image/gif" ? "gif" : "jpg";
  return new File([arquivo], `obra-executada.${extensao}`, { type: arquivo.type || "image/jpeg", lastModified: arquivo.lastModified });
}

function PreviaFotos({ fotos, onRemover }: { fotos: File[]; onRemover: (indice: number) => void }) {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    const criadas = fotos.map((foto) => URL.createObjectURL(foto));
    setUrls(criadas);
    return () => criadas.forEach((url) => URL.revokeObjectURL(url));
  }, [fotos]);

  if (fotos.length === 0) return null;
  return (
    <div className="fotos-obra-lista">
      {fotos.map((foto, indice) => (
        <figure key={`${foto.name}-${foto.lastModified}-${indice}`}>
          {urls[indice] && <img src={urls[indice]} alt="" />}
          <figcaption>{foto.name}</figcaption>
          <button type="button" onClick={() => onRemover(indice)}>Remover</button>
        </figure>
      ))}
    </div>
  );
}

function FotosExistentes({ demandaId }: { demandaId: string }) {
  const [fotos, setFotos] = useState<{ id: string; url: string; nome: string }[]>([]);
  const [falha, setFalha] = useState<string | null>(null);

  useEffect(() => {
    const sessao = { ativo: true, urls: [] as string[] };
    setFalha(null);
    void api.detalhe(demandaId).then(async (detalhe) => {
      const obras = detalhe.anexos.filter((anexo) => anexo.finalidade === "obra");
      const carregadas = await Promise.all(obras.map((anexo) => carregar(demandaId, anexo, sessao)));
      if (!sessao.ativo) return;
      setFotos(carregadas.filter((item): item is { id: string; url: string; nome: string } => item !== null));
    }).catch(() => {
      if (sessao.ativo) setFalha("Não foi possível abrir as fotos da obra.");
    });
    return () => {
      sessao.ativo = false;
      sessao.urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [demandaId]);

  if (falha) return <p className="erro">{falha}</p>;
  if (fotos.length === 0) return null;
  return (
    <div className="fotos-obra">
      <strong>Fotos da obra executada</strong>
      <div className="fotos-obra-lista">
        {fotos.map((foto) => (
          <figure key={foto.id}>
            <img src={foto.url} alt={foto.nome} />
          </figure>
        ))}
      </div>
    </div>
  );
}

async function carregar(demandaId: string, anexo: Anexo, sessao: { ativo: boolean; urls: string[] }) {
  const arquivo = await api.abrirAnexo(demandaId, anexo.id);
  const url = URL.createObjectURL(new Blob([arquivo.buffer], { type: tipoBlob(anexo.nome, arquivo.tipo || anexo.tipo) }));
  if (!sessao.ativo) {
    URL.revokeObjectURL(url);
    return null;
  }
  sessao.urls.push(url);
  return { id: anexo.id, url, nome: anexo.nome };
}
