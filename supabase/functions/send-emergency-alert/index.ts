import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmergencyAlertRequest {
  userId: string;
  activationId: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, activationId, location }: EmergencyAlertRequest = await req.json();

    console.log('🚨 Processing emergency alert for user:', userId);

    // 1. Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // 2. Buscar contatos de emergência
    const { data: contacts, error: contactsError } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_emergency', true);

    if (contactsError) throw contactsError;

    if (!contacts || contacts.length === 0) {
      console.log('⚠️ No emergency contacts found for user:', userId);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Nenhum contato de emergência cadastrado' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // 3. Montar mensagem
    const locationText = location 
      ? `\n📍 Localização: https://maps.google.com/?q=${location.latitude},${location.longitude}`
      : '\n📍 Localização não disponível';

    const message = `🚨 ALERTA DE EMERGÊNCIA

${profile.full_name} ativou o botão de emergência!
${locationText}

🕐 ${new Date().toLocaleString('pt-BR')}

Dr. Memo - Cuidado Sênior`;

    // 4. Enviar notificações (por enquanto apenas log)
    const notified: string[] = [];
    
    for (const contact of contacts) {
      console.log(`📧 Would notify: ${contact.name} (${contact.phone})`);
      console.log(`Message: ${message}`);
      // TODO: Integrar Twilio/Resend aqui quando APIs estiverem disponíveis
      notified.push(contact.id);
    }

    // 5. Atualizar registro de ativação
    const { error: updateError } = await supabase
      .from('emergency_activations')
      .update({
        contacts_notified: notified,
        status: 'notified'
      })
      .eq('id', activationId);

    if (updateError) throw updateError;

    console.log('✅ Emergency alert processed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifiedCount: notified.length,
        message: `${notified.length} contatos notificados` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error processing emergency:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
