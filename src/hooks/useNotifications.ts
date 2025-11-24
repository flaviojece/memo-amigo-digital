import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type NotificationPermission = 'default' | 'granted' | 'denied';

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Verificar se notificações são suportadas
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
    
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Notificações não são suportadas neste navegador');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        toast.success('Notificações ativadas! 🔔');
        return true;
      } else if (result === 'denied') {
        toast.error('Permissão negada. Ative nas configurações do navegador.');
        return false;
      }
      return false;
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      toast.error('Erro ao ativar notificações');
      return false;
    }
  };

  const subscribeToPush = async (): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') {
      console.log('⚠️ Push não suportado ou sem permissão');
      return false;
    }

    try {
      // Esperar o service worker estar pronto
      const registration = await navigator.serviceWorker.ready;
      
      // Verificar se já existe subscrição
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('✅ Já existe subscrição ativa');
        await savePushSubscription(existingSubscription);
        return true;
      }

      // Buscar VAPID public key
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error('❌ VAPID public key não configurada');
        toast.error('Erro ao configurar notificações push');
        return false;
      }

      // Subscrever ao push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
      });

      // Salvar no banco
      await savePushSubscription(subscription);
      
      console.log('✅ Subscrição push criada com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao subscrever push:', error);
      toast.error('Erro ao ativar notificações push');
      return false;
    }
  };

  const showTestNotification = () => {
    if (permission !== 'granted') {
      toast.error('Ative as notificações primeiro');
      return;
    }

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        payload: {
          title: '🩺 Dr. Memo',
          body: 'Notificações funcionando perfeitamente!',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
        }
      });
    }
  };

  return {
    permission,
    isSupported,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
    requestPermission,
    subscribeToPush,
    showTestNotification,
  };
};

// Helper: Converter VAPID key de base64 para Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Salvar subscrição no banco
async function savePushSubscription(subscription: PushSubscription): Promise<void> {
  try {
    const json = subscription.toJSON();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('❌ Usuário não autenticado');
      return;
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: json.keys?.p256dh || '',
        auth: json.keys?.auth || '',
        user_agent: navigator.userAgent,
      }, {
        onConflict: 'user_id,endpoint'
      });

    if (error) {
      console.error('❌ Erro ao salvar subscrição:', error);
      throw error;
    }

    console.log('💾 Subscrição salva no banco');
  } catch (error) {
    console.error('❌ Erro ao salvar subscrição:', error);
    throw error;
  }
}
