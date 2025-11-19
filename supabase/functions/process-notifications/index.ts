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

        // TODO: Aqui enviaria via Web Push API quando implementado
        // Por enquanto apenas marca como enviada
        
        // Marcar como enviada
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
