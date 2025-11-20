import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  invited_email: string;
  patient_name: string;
  relationship_type: string;
  invitation_token: string;
  message?: string;
  site_url: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      invited_email,
      patient_name,
      relationship_type,
      invitation_token,
      message,
      site_url,
    }: InvitationEmailRequest = await req.json();

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
              
              <p>Como anjo, você poderá:</p>
              <ul>
                <li>Acompanhar medicações e consultas</li>
                <li>Receber notificações importantes</li>
                <li>Ajudar no cuidado e bem-estar</li>
              </ul>

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


    // Configurar transporte SMTP do Hostinger
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true, // SSL
      auth: {
        user: 'contato@mouramente.com.br',
        pass: Deno.env.get('HOSTINGER_EMAIL_PASSWORD')
      }
    });

    console.log("Enviando email via SMTP Hostinger para:", invited_email);

    // Enviar email usando nodemailer
    const emailResponse = await transporter.sendMail({
      from: '"Dr. Memo" <contato@mouramente.com.br>',
      to: invited_email,
      subject: `${patient_name} convidou você para ser um Anjo no Dr. Memo`,
      html: emailHtml,
    });

    console.log("Email enviado com sucesso via Hostinger:", emailResponse.messageId);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.messageId 
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

serve(handler);
