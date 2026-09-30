import { useCallback, useEffect, useState } from "react";
import type { CadeiaTipo, Catalogo, DetalheDemanda, FilaItem, Notificacao, Obra, Sugestao } from "../domain/types";
import { ApiError, api } from "../infrastructure/api/client";

function mensagem(error: unknown) {
  return error instanceof ApiError ? error.message : "Não foi possível carregar.";
}

export function useFila() {
  const [dados, setDados] = useState<FilaItem[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setDados(await api.fila());
    } catch (error) {
      setErro(mensagem(error));
    } finally {
      setCarregando(false);
    }
  }, []);
  useEffect(() => { void recarregar(); }, [recarregar]);
  return { dados, erro, carregando, recarregar };
}

export function useDetalhe(id: string) {
  const [dados, setDados] = useState<DetalheDemanda | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setDados(await api.detalhe(id));
    } catch (error) {
      setErro(mensagem(error));
    } finally {
      setCarregando(false);
    }
  }, [id]);
  useEffect(() => { void recarregar(); }, [recarregar]);
  return { dados, erro, carregando, recarregar, setDados };
}

export function useCatalogo() {
  const [dados, setDados] = useState<Catalogo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const recarregar = useCallback(async () => {
    try {
      setDados(await api.catalogo());
    } catch (error) {
      setErro(mensagem(error));
    }
  }, []);
  useEffect(() => { void recarregar(); }, [recarregar]);
  return { dados, erro };
}

export function useCadeia() {
  const [dados, setDados] = useState<CadeiaTipo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const recarregar = useCallback(async () => {
    try {
      setDados(await api.cadeia());
    } catch (error) {
      setErro(mensagem(error));
    }
  }, []);
  useEffect(() => { void recarregar(); }, [recarregar]);
  return { dados, erro, recarregar };
}

export function useObras() {
  const [dados, setDados] = useState<Obra[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  useEffect(() => {
    void api.obras()
      .then(setDados)
      .catch((error: unknown) => setErro(mensagem(error)))
      .finally(() => setCarregando(false));
  }, []);
  return { dados, erro, carregando };
}

export function useNotificacoes() {
  const [dados, setDados] = useState<Notificacao[] | null>(null);
  const recarregar = useCallback(async () => {
    try {
      setDados(await api.notificacoes());
    } catch {
      setDados([]);
    }
  }, []);
  useEffect(() => { void recarregar(); }, [recarregar]);
  return { dados, recarregar };
}

export async function sugerir(texto: string): Promise<Sugestao> {
  return api.sugerir(texto);
}
