import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { corsHeaders, jsonResponse, serviceClient, getCallerUser } from '../_shared/auth.ts';

interface EmergencyAlertRequest {
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
    const supabase = serviceClient();

    // Segurança: o usuário é sempre o dono do JWT, nunca o userId enviado no body
    const caller = await getCallerUser(req, supabase);
    if (!caller) return jsonResponse({ error: 'Não autorizado' }, 401);
    const userId = caller.id;

    const { activationId, location }: EmergencyAlertRequest = await req.json();

    // A ativação precisa existir e pertencer ao usuário chamador
    const { data: activation, error: activationError } = await supabase
      .from('emergency_activations')
      .select('id')
      .eq('id', activationId)
      .eq('user_id', userId)
      .single();
    if (activationError || !activation) {
      return jsonResponse({ error: 'Ativação de emergência inválida' }, 403);
    }

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

    // 4. Enviar notificações via email para contatos de emergência
    const notified: string[] = [];
    
    for (const contact of contacts) {
      console.log(`📧 Notifying: ${contact.name} (${contact.phone})`);
      
      // Enviar email se o contato tiver email cadastrado
      if (contact.email) {
        try {
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #FFF3E0;">
              <div style="background: #DD4B1A; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">🚨 ALERTA DE EMERGÊNCIA</h1>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
                <p style="font-size: 18px; color: #4D3E2A; font-weight: bold;">
                  ${profile.full_name} ativou o botão de emergência!
                </p>
                
                ${location ? `
                  <div style="background: #F2EDC3; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-weight: bold; color: #4D3E2A;">📍 Localização:</p>
                    <a href="https://maps.google.com/?q=${location.latitude},${location.longitude}" 
                       style="color: #DD4B1A; text-decoration: none; font-weight: bold;">
                      Ver no Google Maps
                    </a>
                    <p style="margin: 10px 0 0 0; font-size: 14px; color: #8B6F47;">
                      Precisão: ${Math.round(location.accuracy)}m
                    </p>
                  </div>
                ` : `
                  <div style="background: #FFE0B2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #E65100;">📍 Localização não disponível</p>
                  </div>
                `}
                
                <p style="color: #8B6F47; font-size: 16px;">
                  🕐 <strong>Horário:</strong> ${new Date().toLocaleString('pt-BR')}
                </p>
                
                <div style="background: #FFEBEE; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DD4B1A;">
                  <p style="margin: 0; color: #C62828; font-weight: bold;">
                    ⚠️ Esta é uma emergência real. Por favor, entre em contato imediatamente!
                  </p>
                </div>
                
                <p style="color: #8B6F47; font-size: 14px; margin-top: 30px; border-top: 1px solid #E8DCC4; padding-top: 20px;">
                  Dr. Memo - Cuidado Sênior
                </p>
              </div>
            </div>
          `;

          const smtpClient = new SMTPClient({
            connection: {
              hostname: "smtp.hostinger.com",
              port: 465,
              tls: true,
              auth: {
                username: "contato@mouramente.com.br",
                password: Deno.env.get("HOSTINGER_EMAIL_PASSWORD") || "",
              },
            },
          });

          try {
            await smtpClient.send({
              from: "Dr. Memo Emergência <contato@mouramente.com.br>",
              to: contact.email,
              subject: `🚨 EMERGÊNCIA: ${profile.full_name} precisa de ajuda!`,
              content: "auto",
              html: emailHtml,
            });

            await smtpClient.close();
            console.log(`✅ Email sent via Hostinger SMTP to ${contact.email}`);
            notified.push(contact.id);
          } catch (emailError: any) {
            await smtpClient.close();
            console.error(`❌ Error sending email to ${contact.email}:`, emailError);
          }
        } catch (emailError) {
          console.error(`❌ Exception sending email to ${contact.email}:`, emailError);
        }
      } else {
        console.log(`⚠️ No email for contact ${contact.name}, skipping email notification`);
        // TODO: Implementar SMS via Twilio quando disponível
      }
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
