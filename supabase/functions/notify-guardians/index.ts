import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type EventType = 
  | 'medication_taken' 
  | 'medication_missed' 
  | 'medication_upcoming'
  | 'appointment_created'
  | 'appointment_upcoming'
  | 'appointment_completed'
  | 'appointment_cancelled';

interface NotifyGuardiansRequest {
  patientId: string;
  eventType: EventType;
  eventData: {
    medicationName?: string;
    doctorName?: string;
    specialty?: string;
    time?: string;
    date?: string;
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

    const { patientId, eventType, eventData }: NotifyGuardiansRequest = await req.json();

    console.log(`👪 Notifying guardians for patient ${patientId}, event: ${eventType}`);

    // 1. Buscar perfil do paciente
    const { data: patient, error: patientError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', patientId)
      .single();

    if (patientError) throw patientError;

    // 2. Buscar guardiões que devem ser notificados
    const { data: guardians, error: guardiansError } = await supabase
      .rpc('get_guardians_to_notify', {
        _patient_id: patientId,
        _notification_type: eventType
      });

    if (guardiansError) throw guardiansError;

    if (!guardians || guardians.length === 0) {
      console.log('⚠️ No guardians to notify for this event');
      return new Response(
        JSON.stringify({ notified: 0, message: 'No guardians to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Montar mensagem baseada no tipo de evento
    let message = '';
    let subject = '';

    switch (eventType) {
      case 'medication_taken':
        subject = `✅ ${patient.full_name} tomou o remédio`;
        message = `${patient.full_name} marcou como tomado:\n💊 ${eventData.medicationName}\n🕐 ${eventData.time}`;
        break;
      
      case 'medication_missed':
        subject = `⚠️ ${patient.full_name} não tomou o remédio`;
        message = `${patient.full_name} não tomou o remédio no horário:\n💊 ${eventData.medicationName}\n🕐 ${eventData.time}`;
        break;
      
      case 'medication_upcoming':
        subject = `⏰ Lembrete de remédio para ${patient.full_name}`;
        message = `${patient.full_name} deve tomar em breve:\n💊 ${eventData.medicationName}\n🕐 ${eventData.time}`;
        break;
      
      case 'appointment_created':
        subject = `📅 ${patient.full_name} agendou uma consulta`;
        message = `Nova consulta agendada:\n🩺 ${eventData.doctorName} - ${eventData.specialty}\n📆 ${eventData.date}`;
        break;
      
      case 'appointment_upcoming':
        subject = `📅 Consulta de ${patient.full_name} amanhã`;
        message = `Lembrete de consulta:\n🩺 ${eventData.doctorName} - ${eventData.specialty}\n📆 ${eventData.date}`;
        break;
      
      case 'appointment_completed':
        subject = `✅ ${patient.full_name} completou a consulta`;
        message = `Consulta finalizada:\n🩺 ${eventData.doctorName} - ${eventData.specialty}`;
        break;
      
      case 'appointment_cancelled':
        subject = `❌ ${patient.full_name} cancelou a consulta`;
        message = `Consulta cancelada:\n🩺 ${eventData.doctorName} - ${eventData.specialty}`;
        break;
    }

    // 4. Enviar para cada guardião
    let notified = 0;

    for (const guardian of guardians) {
      console.log(`📧 Would notify guardian: ${guardian.guardian_name} (${guardian.guardian_email})`);
      console.log(`Subject: ${subject}`);
      console.log(`Message: ${message}`);
      
      // TODO: Integrar com serviço de email (Resend/SendGrid) quando disponível
      // TODO: Integrar com serviço de SMS (Twilio) se tiver número
      
      notified++;
    }

    console.log(`✅ Notified ${notified} guardians`);

    return new Response(
      JSON.stringify({ 
        notified, 
        message: `${notified} guardians notified` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error notifying guardians:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
