import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

interface PushSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string;
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  actions?: Array<{ action: string; title: string }>;
  vibrate?: number[];
  requireInteraction?: boolean;
}

/**
 * Envia notificação Web Push usando a biblioteca web-push
 */
export async function sendWebPush(
  subscription: PushSubscription,
  payload: PushPayload
): Promise<boolean> {
  try {
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:contato@drmemo.com';

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('❌ VAPID keys não configuradas');
      return false;
    }

    // Configurar VAPID details
    webpush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    );

    // Preparar subscription object para web-push
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    // Enviar notificação
    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload),
      {
        TTL: 86400, // 24 horas
      }
    );

    console.log('✅ Push enviado:', subscription.endpoint.substring(0, 50) + '...');
    return true;
  } catch (error: any) {
    // Verificar se é erro de subscrição inválida
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log('⚠️ Subscrição inválida (410/404), marcando para remoção');
      await removeExpiredSubscription(subscription.id);
      return false;
    }

    console.error('❌ Erro ao enviar push:', error);
    return false;
  }
}

/**
 * Remove subscrição expirada do banco
 */
async function removeExpiredSubscription(subscriptionId: string): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('id', subscriptionId);

    console.log('🗑️ Subscrição removida:', subscriptionId);
  } catch (error) {
    console.error('Erro ao remover subscrição:', error);
  }
}
