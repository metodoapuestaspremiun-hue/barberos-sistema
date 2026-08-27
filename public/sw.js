self.addEventListener("push", function (event) {
  if (event.data) {
    try {
      const payload = event.data.json();
      const options = {
        body: payload.body || "Tienes un check-in pendiente de aprobación.",
        icon: payload.icon || "/logos/negocios_icon_192.png",
        badge: "/logos/negocios_icon_192.png",
        vibrate: [200, 100, 200],
        data: {
          url: payload.url || "/panel",
        },
      };

      event.waitUntil(
        self.registration.showNotification(payload.title || "🔔 NegociOS Check-In", options)
      );
    } catch (e) {
      // Fallback si no es JSON válido
      const options = {
        body: event.data.text(),
        icon: "/logos/negocios_icon_192.png",
        badge: "/logos/negocios_icon_192.png",
        vibrate: [200, 100, 200],
        data: {
          url: "/panel",
        },
      };
      event.waitUntil(
        self.registration.showNotification("🔔 NegociOS Check-In", options)
      );
    }
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/panel";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      // Si la app está abierta, redirigimos/enfocamos
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }
      // Si no, la abrimos de nuevo
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
