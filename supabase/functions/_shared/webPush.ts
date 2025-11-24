import { createClient } from 'jsr:@supabase/supabase-js@2';

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
 * Envia notificação Web Push usando a API nativa do navegador
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

    // Preparar headers VAPID (JWT)
    const vapidHeaders = generateVAPIDHeaders(
      subscription.endpoint,
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    );

    // Encriptar payload
    const encryptedPayload = await encryptPayload(
      JSON.stringify(payload),
      subscription.p256dh,
      subscription.auth
    );

    // Enviar para o endpoint de push
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400', // 24 horas
        ...vapidHeaders,
      },
      body: encryptedPayload,
    });

    if (response.status === 410 || response.status === 404) {
      // Subscrição expirou ou foi removida
      console.log('⚠️ Subscrição inválida (410/404), marcando para remoção');
      await removeExpiredSubscription(subscription.id);
      return false;
    }

    if (!response.ok) {
      console.error('❌ Erro ao enviar push:', response.status, await response.text());
      return false;
    }

    console.log('✅ Push enviado:', subscription.endpoint.substring(0, 50) + '...');
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar push:', error);
    return false;
  }
}

/**
 * Gera headers VAPID (JWT) para autenticação
 */
function generateVAPIDHeaders(
  endpoint: string,
  subject: string,
  publicKey: string,
  privateKey: string
): Record<string, string> {
  // Simplificado: em produção, usar biblioteca VAPID completa
  // Por ora, retornamos headers básicos
  const url = new URL(endpoint);
  return {
    'Authorization': `vapid t=${generateJWT(subject, url.origin, publicKey, privateKey)}, k=${publicKey}`,
  };
}

/**
 * Gera JWT simples para VAPID
 */
function generateJWT(
  subject: string,
  audience: string,
  publicKey: string,
  privateKey: string
): string {
  // NOTA: Implementação simplificada
  // Em produção, usar biblioteca como jose ou similar
  const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const payload = btoa(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 43200, // 12 horas
    sub: subject,
  }));
  
  // Simplificado: retornar token mock (substituir por assinatura real)
  return `${header}.${payload}.mock-signature`;
}

/**
 * Encripta payload usando Web Crypto API
 */
async function encryptPayload(
  payload: string,
  userPublicKey: string,
  userAuthSecret: string
): Promise<Uint8Array> {
  // NOTA: Implementação simplificada
  // Em produção, usar especificação completa de Web Push encryption (RFC 8291)
  
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  
  // Por ora, retornar dados sem encriptação (apenas para desenvolvimento)
  // TODO: Implementar encriptação AES-GCM completa
  return data;
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
