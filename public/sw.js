// Service Worker para gerenciar notificações do Dr. Memo

// Event listener para push notifications
self.addEventListener('push', function(event) {
  console.log('Push notification received:', event);
  
  let notificationData = {
    title: 'Dr. Memo',
    body: 'Você tem uma notificação',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      clickAction: '/'
    }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data
      };
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Event listener para cliques na notificação
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  const data = event.notification.data || {};
  const clickAction = data.clickAction || '/';

  // Tratar ações específicas (ex: "Marcar como tomado")
  if (event.action === 'mark_taken' && data.medicationId) {
    console.log('Marcando medicação como tomada:', data.medicationId);
    // TODO: Chamar API para marcar medicação
  } else if (event.action === 'snooze' && data.medicationId) {
    console.log('Adiando notificação:', data.medicationId);
    // TODO: Adiar notificação por 10 minutos
  }

  // Abrir ou focar no app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Procurar janela já aberta com a rota específica
        for (const client of clientList) {
          if (client.url.includes(clickAction) && 'focus' in client) {
            return client.focus();
          }
        }
        // Se não encontrou, abrir nova janela
        if (clients.openWindow) {
          return clients.openWindow(clickAction);
        }
      })
  );
});

// Listener para mensagens do app (mostrar notificação sob demanda)
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, badge } = event.data.payload;
    
    self.registration.showNotification(title, {
      body,
      icon: icon || '/icon-192.png',
      badge: badge || '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'dr-memo-notification',
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: 'Abrir App'
        },
        {
          action: 'dismiss',
          title: 'Dispensar'
        }
      ]
    });
  }
});
