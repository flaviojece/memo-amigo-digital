import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { corsHeaders, jsonResponse, serviceClient, getCallerUser } from '../_shared/auth.ts';

interface InvitationEmailRequest {
  invitation_token: string;
  message?: string;
  site_url: string;
}

// Só permite links de aceite para domínios do próprio app (evita phishing)
const ALLOWED_SITE_HOSTS = [/\.lovable\.app$/, /\.lovableproject\.com$/, /^localhost(:\d+)?$/];
function safeSiteUrl(raw: string): string {
  try {
    const u = new URL(raw);
    if (ALLOWED_SITE_HOSTS.some((r) => r.test(u.host))) return u.origin;
  } catch { /* ignore */ }
  return Deno.env.get("APP_PUBLIC_URL") ?? "";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = serviceClient();
    const caller = await getCallerUser(req, supabase);
    if (!caller) return jsonResponse({ error: "Não autorizado" }, 401);

    const { invitation_token, message, site_url: rawSiteUrl }: InvitationEmailRequest = await req.json();

    // Segurança: o convite precisa existir, estar pendente e pertencer ao chamador.
    // E-mail do convidado, nome do paciente e tipo de relação vêm do banco, não do body.
    const { data: invitation, error: invError } = await supabase
      .from("guardian_invitations")
      .select("invited_email, relationship_type, status, patient_id")
      .eq("invitation_token", invitation_token)
      .eq("patient_id", caller.id)
      .single();
    if (invError || !invitation) return jsonResponse({ error: "Convite não encontrado" }, 403);
    if (invitation.status !== "pending") return jsonResponse({ error: "Convite não está pendente" }, 400);

    const { data: patientProfile } = await supabase
      .from("profiles").select("full_name").eq("id", caller.id).single();

    const invited_email = invitation.invited_email;
    const relationship_type = invitation.relationship_type;
    const patient_name = patientProfile?.full_name || caller.email || "Um paciente";
    const site_url = safeSiteUrl(rawSiteUrl);

    console.log("Sending invitation email to:", invited_email);

    const acceptUrl = `${site_url}/accept-invitation?token=${invitation_token}`;

    const relationshipLabel = relationship_type === 'family' ? 'familiar' :
                              relationship_type === 'caregiver' ? 'cuidador' :
                              relationship_type === 'friend' ? 'amigo' :
                              'anjo';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
            .button { display: inline-block; background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; padding: 20px; }
            .message-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Dr. Memo</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Convite para ser um Anjo</p>
            </div>
            <div class="content">
              <h2 style="color: #667eea; margin-top: 0;">Você foi convidado! 🎉</h2>
              
              <p><strong>${patient_name}</strong> convidou você para ser seu <strong>${relationshipLabel}</strong> no Dr. Memo.</p>
              
              <h3 style="color: #333; font-size: 18px; margin-top: 24px;">Como funciona?</h3>
              <ol style="line-height: 2; color: #555;">
                <li><strong>Aceite o convite</strong> clicando no botão abaixo</li>
                <li><strong>Faça login</strong> ou crie sua conta gratuita</li>
                <li><strong>Pronto!</strong> Você poderá acompanhar tudo automaticamente</li>
              </ol>

              <h3 style="color: #333; font-size: 18px; margin-top: 24px;">O que você verá como Anjo:</h3>
              <ul style="line-height: 2; color: #555;">
                <li>📋 Acompanhar medicações e horários</li>
                <li>🩺 Visualizar consultas agendadas</li>
                <li>📞 Acessar contatos de emergência</li>
                <li>📍 Ver localização em tempo real (quando ativada)</li>
                <li>🔔 Receber notificações importantes</li>
              </ul>

              <div style="background: #fff3cd; padding: 16px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 24px 0;">
                <strong style="color: #856404;">💡 Sobre a localização:</strong><br>
                <span style="color: #856404; font-size: 14px;">
                  ${patient_name} precisará ativar o compartilhamento de localização no aplicativo para que você possa visualizar onde ele(a) está em tempo real.
                </span>
              </div>

              ${message ? `
              <div class="message-box">
                <strong>Mensagem pessoal:</strong><br>
                "${message}"
              </div>
              ` : ''}

              <div style="text-align: center;">
                <a href="${acceptUrl}" class="button">Aceitar Convite</a>
              </div>

              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Ou copie e cole este link no seu navegador:<br>
                <span style="color: #667eea; word-break: break-all;">${acceptUrl}</span>
              </p>

              <p style="font-size: 13px; color: #999; margin-top: 20px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
                Se você não esperava este convite, pode ignorar este email com segurança.
              </p>
            </div>
            <div class="footer">
              <p>Dr. Memo - Cuidando de quem você ama</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Enviar email usando Hostinger SMTP
    console.log("Enviando email via Hostinger SMTP para:", invited_email);

    const client = new SMTPClient({
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
      await client.send({
        from: "Dr. Memo <contato@mouramente.com.br>",
        to: invited_email,
        subject: `${patient_name} convidou você para ser um Anjo no Dr. Memo`,
        content: "auto",
        html: emailHtml,
      });

      await client.close();
      console.log("Email enviado com sucesso via Hostinger SMTP");
    } catch (emailError: any) {
      await client.close();
      throw emailError;
    }

    return new Response(JSON.stringify({ 
      success: true
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending invitation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

Deno.serve(handler);
