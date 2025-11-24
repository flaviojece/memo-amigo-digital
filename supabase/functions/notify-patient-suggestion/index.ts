import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  patientId: string;
  angelName: string;
  suggestionType: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { patientId, angelName, suggestionType }: NotificationRequest = await req.json();

    console.log("Notification request:", { patientId, angelName, suggestionType });

    // Get patient email
    const { data: patient, error: patientError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", patientId)
      .single();

    if (patientError || !patient) {
      throw new Error("Patient not found");
    }

    const typeLabels: Record<string, string> = {
      medication_create: "Novo Medicamento",
      medication_update: "Alteração de Medicamento",
      medication_delete: "Remover Medicamento",
      appointment_create: "Nova Consulta",
      appointment_update: "Alteração de Consulta",
      appointment_delete: "Cancelar Consulta",
    };

    const typeLabel = typeLabels[suggestionType] || suggestionType;

    // Send email using Resend
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #DD4B1A;">Olá, ${patient.full_name}!</h2>
        <p style="font-size: 16px; line-height: 1.6;">
          <strong>${angelName}</strong> sugeriu uma mudança no seu Dr. Memo:
        </p>
        <div style="background: #F2EDC3; padding: 20px; border-radius: 12px; border-left: 4px solid #DD4B1A; margin: 20px 0;">
          <p style="font-size: 18px; font-weight: bold; margin: 0; color: #4D3E2A;">
            📝 ${typeLabel}
          </p>
        </div>
        <p style="font-size: 16px; line-height: 1.6;">
          Entre no aplicativo para revisar e aprovar ou recusar esta sugestão.
        </p>
        <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || 'https://app.com'}" 
           style="display: inline-block; background: #DD4B1A; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">
          Abrir Dr. Memo
        </a>
        <p style="color: #8B6F47; font-size: 14px; margin-top: 30px; border-top: 1px solid #E8DCC4; padding-top: 20px;">
          Dr. Memo - Cuidando de quem você ama ❤️
        </p>
      </div>
    `;

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.hostinger.com",
        port: 465,
        tls: true,
        auth: {
          username: "noreply@mouramente.com.br",
          password: Deno.env.get("HOSTINGER_EMAIL_PASSWORD") || "",
        },
      },
    });

    try {
      await client.send({
        from: "Dr. Memo <noreply@mouramente.com.br>",
        to: patient.email,
        subject: `${angelName} sugeriu: ${typeLabel}`,
        content: "auto",
        html: emailHtml,
      });

      await client.close();
      console.log("Email sent successfully via Hostinger SMTP to:", patient.email);
    } catch (emailError: any) {
      await client.close();
      throw emailError;
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
