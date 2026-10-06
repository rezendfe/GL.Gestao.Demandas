import { ApiError, api } from "../infrastructure/api/client";

const EXIBIDAS = "gl-celular-avisos";

export type ResultadoAviso = NotificationPermission | "unsupported" | "indisponivel" | "inseguro" | "ios" | "sem-servico" | "falha";

export function textoResultadoAviso(resultado: ResultadoAviso, celular: boolean) {
  const aparelho = celular ? "celular" : "computador";
  if (resultado === "granted") return `Este ${aparelho} passa a receber os alertas do portal.`;
  if (resultado === "denied") return "Os alertas estão bloqueados neste navegador. Libere o site nas configurações.";
  if (resultado === "inseguro") return "O navegador do celular só libera o alerta em um endereço https. Neste Wi-Fi o botão fica bloqueado.";
  if (resultado === "ios") return "No iPhone, adicione o portal à Tela de Início, abra por esse ícone e toque de novo para ativar o alerta.";
  if (resultado === "sem-servico") return "Este navegador não envia o alerta com o site fechado. Com o portal aberto, o aviso aparece no sino.";
  if (resultado === "unsupported") return "Este navegador não recebe alertas do site.";
  if (resultado === "indisponivel") return "O servidor ainda não consegue enviar o alerta. Confira se a API está no ar.";
  if (resultado === "falha") return "Não foi possível inscrever este aparelho. Libere as notificações do site e toque de novo.";
  return "O navegador não abriu a permissão. Toque no botão de novo.";
}

export async function ativarAvisosCelular(): Promise<ResultadoAviso> {
  try {
    return await pedirPermissaoEInscrever();
  } finally {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      window.dispatchEvent(new Event("gl-avisos-ativados"));
    }
  }
}

async function pedirPermissaoEInscrever(): Promise<ResultadoAviso> {
  if (!window.isSecureContext) return "inseguro";
  if (!("Notification" in window)) return iosForaDoIcone() ? "ios" : "unsupported";

  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") return permissao;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    if (iosForaDoIcone()) return "ios";
    await registrarWorker();
    return permissao;
  }

  let chavePublica: string;
  try {
    chavePublica = (await api.chavePush()).chavePublica;
  } catch {
    return "indisponivel";
  }

  try {
    await inscreverComChave(chavePublica);
  } catch (error) {
    if (error instanceof ApiError) return "indisponivel";
    const texto = error instanceof Error ? error.message : "";
    if (iosForaDoIcone()) return "ios";
    if (/push service not available/i.test(texto)) return "sem-servico";
    return "falha";
  }
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

export async function avisosCelularHabilitados() {
  if (!("Notification" in window) || Notification.permission !== "granted") return false;
  if (!("PushManager" in window) || !("serviceWorker" in navigator)) return true;
  return aparelhoInscrito();
}

export async function registrarWorker() {
  if (!("serviceWorker" in navigator)) return;
  await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
}

export async function mostrarAvisoCelular(id: string, titulo: string, texto: string, url: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const vistas = new Set(JSON.parse(sessionStorage.getItem(EXIBIDAS) ?? "[]") as string[]);
  if (vistas.has(id)) return;
  vistas.add(id);
  sessionStorage.setItem(EXIBIDAS, JSON.stringify([...vistas]));
  const registro = await navigator.serviceWorker?.getRegistration();
  const opcoes: NotificationOptions = {
    body: texto,
    tag: id,
    data: { url },
  };
  if (registro) {
    await registro.showNotification(titulo || "GL Events", opcoes);
    return;
  }
  const aviso = new Notification(titulo || "GL Events", opcoes);
  aviso.onclick = () => {
    window.focus();
    window.location.assign(url);
  };
}

async function inscreverComChave(chavePublica: string) {
  const registro = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
  await navigator.serviceWorker.ready;
  const anterior = await registro.pushManager.getSubscription();
  if (anterior) await anterior.unsubscribe();
  const inscricao = await registro.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: chaveParaBytes(chavePublica),
  });
  const chaves = inscricao.toJSON().keys;
  await api.inscreverPush({
    endpoint: inscricao.endpoint,
    chaveP256dh: chaves?.p256dh ?? "",
    segredoAuth: chaves?.auth ?? "",
  });
}

function iosForaDoIcone() {
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const instalado = window.matchMedia("(display-mode: standalone)").matches
    || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
  return ios && !instalado;
}

function chaveParaBytes(chave: string) {
  const preenchimento = "=".repeat((4 - (chave.length % 4)) % 4);
  const base64 = (chave + preenchimento).replace(/-/g, "+").replace(/_/g, "/");
  const bruto = atob(base64);
  const bytes = new Uint8Array(bruto.length);
  for (let i = 0; i < bruto.length; i += 1) bytes[i] = bruto.charCodeAt(i);
  return bytes;
}
