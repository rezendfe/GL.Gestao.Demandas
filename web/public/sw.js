self.addEventListener("push", (event) => {
  let dados = {};
  try {
    dados = event.data ? event.data.json() : {};
  } catch {
    dados = { body: event.data ? event.data.text() : "" };
  }
  const titulo = dados.title || "Chamado GL";
  event.waitUntil(self.registration.showNotification(titulo, {
    body: dados.body || "Há uma atualização no portal.",
    tag: dados.tag,
    data: { url: dados.url || "/inicio" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/inicio";
  event.waitUntil((async () => {
    const abertas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const cliente of abertas) {
      cliente.postMessage({ tipo: "abrir-chamado", url });
      if ("focus" in cliente) return cliente.focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  })());
});
