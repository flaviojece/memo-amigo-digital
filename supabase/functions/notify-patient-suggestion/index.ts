import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { corsHeaders, jsonResponse, serviceClient, getCallerUser, isGuardianOf } from '../_shared/auth.ts';

interface NotificationRequest {
  patientId: string;
  suggestionType: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = serviceClient();

    // Segurança: o anjo é o dono do JWT e precisa ter vínculo ativo com o paciente
    const caller = await getCallerUser(req, supabase);
    if (!caller) return jsonResponse({ error: "Não autorizado" }, 401);

    const { patientId, suggestionType }: NotificationRequest = await req.json();

    if (!(await isGuardianOf(supabase, caller.id, patientId))) {
      return jsonResponse({ error: "Você não é anjo deste paciente" }, 403);
    }

    const { data: angelProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", caller.id)
      .single();
    const angelName = angelProfile?.full_name || caller.email || "Um anjo";

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
          username: "contato@mouramente.com.br",
          password: Deno.env.get("HOSTINGER_EMAIL_PASSWORD") || "",
        },
      },
    });

    try {
      await client.send({
        from: "Dr. Memo <contato@mouramente.com.br>",
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
