self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  const fcmMessage = notification?.data?.FCM_MSG || {};
  const targetUrl =
    notification?.data?.link ||
    fcmMessage?.fcmOptions?.link ||
    fcmMessage?.data?.link ||
    "/#/";

  notification?.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const matchingClient = clientList.find((client) => {
        return client.url === targetUrl || client.url.startsWith(targetUrl);
      });

      if (matchingClient && "focus" in matchingClient) {
        return matchingClient.focus();
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }

      return undefined;
    })
  );
});
