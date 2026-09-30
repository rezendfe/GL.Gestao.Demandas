const EXIBIDAS = "gl-celular-avisos";

export async function ativarAvisosCelular() {
  if (!("Notification" in window)) return "unsupported" as const;
  const permissao = await Notification.requestPermission();
  if (permissao === "granted") await registrarWorker();
  return permissao;
}

export async function registrarWorker() {
  if (!("serviceWorker" in navigator)) return;
  await navigator.serviceWorker.register("/sw.js");
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
