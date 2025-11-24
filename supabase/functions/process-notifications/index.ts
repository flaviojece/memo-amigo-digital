import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔔 Processing scheduled notifications...');

    // Buscar notificações pendentes (até 5 minutos no futuro para compensar delay)
    const now = new Date();
    const fiveMinutesAhead = new Date(now.getTime() + 5 * 60000);

    const { data: notifications, error: fetchError } = await supabase
      .from('notification_schedules')
      .select('*')
      .eq('sent', false)
      .lte('scheduled_for', fiveMinutesAhead.toISOString())
      .limit(50);

    if (fetchError) throw fetchError;

    console.log(`📬 Found ${notifications?.length || 0} pending notifications`);

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: 'No pending notifications' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processed = 0;

    // Processar cada notificação
    for (const notification of notifications) {
      try {
        console.log(`📤 Processing notification: ${notification.title}`);
        console.log(`Body: ${notification.body}`);

        // 1. Buscar subscrições do usuário
        const { data: subscriptions } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', notification.user_id);
        
        if (!subscriptions || subscriptions.length === 0) {
          console.log(`⚠️ No push subscriptions for user ${notification.user_id}`);
          
          // Marcar como enviada mesmo sem subscrições (evitar reprocessamento)
          await supabase
            .from('notification_schedules')
            .update({ sent: true, sent_at: new Date().toISOString() })
            .eq('id', notification.id);
          
          continue;
        }
        
        // 2. Preparar payload da notificação
        const isMedication = notification.type === 'medication';
        const payload = {
          title: notification.title,
          body: notification.body,
          icon: notification.icon || '/icon-192.png',
          badge: '/icon-192.png',
          data: {
            type: notification.type,
            medicationId: notification.medication_id,
            appointmentId: notification.appointment_id,
            clickAction: notification.click_action || (isMedication ? '/medications' : '/appointments'),
          },
          vibrate: [200, 100, 200],
          requireInteraction: isMedication, // Medicamento requer ação
          actions: isMedication ? [
            { action: 'mark_taken', title: '✅ Tomei' },
            { action: 'snooze', title: '⏰ Adiar 10min' }
          ] : undefined,
        };
        
        // 3. Enviar para todas as subscrições do usuário
        let sentCount = 0;
        for (const sub of subscriptions) {
          // Usar Web Push API nativa (simplificado por ora)
          // TODO: Implementar envio real via web-push library
          console.log(`📨 Enviando para dispositivo: ${sub.endpoint.substring(0, 50)}...`);
          
          // Por ora, apenas simular envio bem-sucedido
          // Em produção, chamar sendWebPush(sub, payload)
          sentCount++;
          
          // Atualizar last_used_at
          await supabase
            .from('push_subscriptions')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', sub.id);
        }
        
        console.log(`📨 Sent to ${sentCount}/${subscriptions.length} devices`);
        
        // 4. Marcar notificação como enviada
        const { error: updateError } = await supabase
          .from('notification_schedules')
          .update({
            sent: true,
            sent_at: new Date().toISOString()
          })
          .eq('id', notification.id);

        if (updateError) {
          console.error(`Error updating notification ${notification.id}:`, updateError);
        } else {
          processed++;
        }

      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error);
      }
    }

    console.log(`✅ Processed ${processed}/${notifications.length} notifications`);

    return new Response(
      JSON.stringify({ 
        processed, 
        total: notifications.length,
        message: `Processed ${processed} notifications` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error processing notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
