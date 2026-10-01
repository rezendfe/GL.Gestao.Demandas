import { api } from "../infrastructure/api/client";

const EXIBIDAS = "gl-celular-avisos";

export async function ativarAvisosCelular() {
  if (!("Notification" in window)) return "unsupported" as const;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    const permissao = await Notification.requestPermission();
    if (permissao === "granted") await registrarWorker();
    return permissao;
  }

  let chavePublica: string;
  try {
    chavePublica = (await api.chavePush()).chavePublica;
  } catch {
    return "indisponivel" as const;
  }

  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") return permissao;
  await inscreverComChave(chavePublica);
  return permissao;
}

export async function pararAvisosCelular() {
  const registro = await navigator.serviceWorker?.getRegistration();
  const inscricao = await registro?.pushManager.getSubscription();
  if (!inscricao) return;
  const endpoint = inscricao.endpoint;
  await inscricao.unsubscribe();
  await api.cancelarPush(endpoint);
}

export async function aparelhoInscrito() {
  if (!("serviceWorker" in navigator)) return false;
  const registro = await navigator.serviceWorker.getRegistration();
  const inscricao = await registro?.pushManager.getSubscription();
  return Boolean(inscricao);
}

export async function registrarWorker() {
  if (!("serviceWorker" in navigator)) return;
  await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
}

export async function mostrarAvisoCelular(id: string, protocolo: string, texto: string, demandaId: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const vistas = new Set(JSON.parse(sessionStorage.getItem(EXIBIDAS) ?? "[]") as string[]);
  if (vistas.has(id)) return;
  vistas.add(id);
  sessionStorage.setItem(EXIBIDAS, JSON.stringify([...vistas]));
  const registro = await navigator.serviceWorker?.getRegistration();
  const destino = `/demandas/${demandaId}?responder=${id}`;
  const opcoes: NotificationOptions = {
    body: texto,
    tag: id,
    data: { url: destino },
  };
  if (registro) {
    await registro.showNotification(protocolo || "Chamado GL", opcoes);
    return;
  }
  const aviso = new Notification(protocolo || "Chamado GL", opcoes);
  aviso.onclick = () => {
    window.focus();
    window.location.assign(destino);
  };
}

async function inscreverComChave(chavePublica: string) {
  const registro = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
  await navigator.serviceWorker.ready;
  let inscricao = await registro.pushManager.getSubscription();
  if (!inscricao) {
    inscricao = await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: chaveParaBytes(chavePublica),
    });
  }
  const chaves = inscricao.toJSON().keys;
  await api.inscreverPush({
    endpoint: inscricao.endpoint,
    chaveP256dh: chaves?.p256dh ?? "",
    segredoAuth: chaves?.auth ?? "",
  });
}

function chaveParaBytes(chave: string) {
  const preenchimento = "=".repeat((4 - (chave.length % 4)) % 4);
  const base64 = (chave + preenchimento).replace(/-/g, "+").replace(/_/g, "/");
  const bruto = atob(base64);
  const bytes = new Uint8Array(bruto.length);
  for (let i = 0; i < bruto.length; i += 1) bytes[i] = bruto.charCodeAt(i);
  return bytes;
}
