import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Parse request body
    const { medication_id, scheduled_time, user_id } = await req.json();

    if (!medication_id || !scheduled_time || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: medication_id, scheduled_time, user_id' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client with service role (bypass RLS for insertion)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar que a medicação pertence ao usuário (segurança)
    const { data: medication, error: medError } = await supabase
      .from('medications')
      .select('id, name, user_id')
      .eq('id', medication_id)
      .eq('user_id', user_id)
      .single();

    if (medError || !medication) {
      console.error('❌ Medicação não encontrada ou não pertence ao usuário:', medError);
      return new Response(
        JSON.stringify({ error: 'Medication not found or unauthorized' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`✅ Medicação validada: ${medication.name} (${medication_id})`);

    // Inserir log de medicação tomada
    const { data: log, error: insertError } = await supabase
      .from('medication_logs')
      .insert({
        user_id: user_id,
        medication_id: medication_id,
        scheduled_time: scheduled_time,
        taken_at: new Date().toISOString(),
        status: 'taken',
        notes: 'Marcado via notificação push',
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao inserir log:', insertError);
      throw insertError;
    }

    console.log(`✅ Log criado: ${log.id} - ${medication.name} tomado às ${log.taken_at}`);

    // Opcional: Notificar guardiões
    try {
      await supabase.functions.invoke('notify-guardians', {
        body: {
          patientId: user_id,
          eventType: 'medication_taken',
          eventData: {
            medicationName: medication.name,
            time: new Date().toLocaleTimeString('pt-BR'),
          },
        },
      });
      console.log('📧 Guardiões notificados');
    } catch (notifyError) {
      console.warn('⚠️ Erro ao notificar guardiões (não crítico):', notifyError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        log: log,
        message: `Medicação "${medication.name}" registrada com sucesso!`
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Erro ao processar requisição:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
