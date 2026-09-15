import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { sendWebPush } from "./webPush.ts";

export type EventType =
  | "medication_taken"
  | "medication_missed"
  | "medication_upcoming"
  | "appointment_created"
  | "appointment_upcoming"
  | "appointment_completed"
  | "appointment_cancelled";

export interface EventData {
  medicationName?: string;
  doctorName?: string;
  specialty?: string;
  time?: string;
  date?: string;
}

interface Mensagem {
  assunto: string;
  corpo: string;
  urgente: boolean;
}

function montarMensagem(
  eventType: EventType,
  nomePaciente: string,
  d: EventData
): Mensagem {
  switch (eventType) {
    case "medication_taken":
      return {
        assunto: `✅ ${nomePaciente} tomou o remédio`,
        corpo: `${nomePaciente} confirmou:\n💊 ${d.medicationName}\n🕐 ${d.time}`,
        urgente: false,
      };
    case "medication_missed":
      return {
        assunto: `⚠️ ${nomePaciente} não tomou o remédio`,
        corpo: `${nomePaciente} ainda não confirmou:\n💊 ${d.medicationName}\n🕐 ${d.time}\n\nTalvez valha uma ligação.`,
        urgente: true,
      };
    case "medication_upcoming":
      return {
        assunto: `⏰ Lembrete de remédio para ${nomePaciente}`,
        corpo: `Está na hora de:\n💊 ${d.medicationName}\n🕐 ${d.time}`,
        urgente: false,
      };
    case "appointment_created":
      return {
        assunto: `📅 ${nomePaciente} agendou uma consulta`,
        corpo: `Nova consulta:\n🩺 ${d.doctorName} — ${d.specialty}\n📆 ${d.date}`,
        urgente: false,
      };
    case "appointment_upcoming":
      return {
        assunto: `📅 Consulta de ${nomePaciente} amanhã`,
        corpo: `Lembrete de consulta:\n🩺 ${d.doctorName} — ${d.specialty}\n📆 ${d.date}`,
        urgente: false,
      };
    case "appointment_completed":
      return {
        assunto: `✅ ${nomePaciente} foi à consulta`,
        corpo: `Consulta realizada:\n🩺 ${d.doctorName} — ${d.specialty}`,
        urgente: false,
      };
    case "appointment_cancelled":
      return {
        assunto: `❌ Consulta de ${nomePaciente} cancelada`,
        corpo: `Consulta cancelada:\n🩺 ${d.doctorName} — ${d.specialty}`,
        urgente: true,
      };
  }
}

function emailHtml(assunto: string, corpo: string): string {
  const linhas = corpo
    .split("\n")
    .map((l) => (l.trim() ? `<p style="margin:6px 0;font-size:17px;">${l}</p>` : ""))
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="color:#BE3F19;font-size:22px;margin-top:0;">${assunto}</h2>
      <div style="background:#F2EDC3;padding:20px;border-radius:12px;border-left:5px solid #DD4B1A;color:#4D3E2A;">
        ${linhas}
      </div>
      <a href="${Deno.env.get("APP_PUBLIC_URL") ?? "https://drmemo.com.br"}"
         style="display:inline-block;background:#DD4B1A;color:#fff;padding:14px 28px;
                text-decoration:none;border-radius:8px;font-weight:bold;margin-top:20px;">
        Abrir o Dr. Memo
      </a>
      <p style="color:#777;font-size:13px;margin-top:24px;">
        Você recebe este aviso porque é Anjo de alguém no Dr. Memo.
        Para mudar quais avisos recebe, entre no app em Mais → Notificações.
      </p>
    </div>`;
}

/**
 * Avisa os anjos de um paciente por e-mail e notificação push.
 *
 * Usado tanto pela função chamada pelo paciente (com JWT) quanto pelo cron
 * de doses perdidas — por isso recebe o `patientId` já validado por quem chama.
 */
export async function notificarAnjos(
  supabase: SupabaseClient,
  patientId: string,
  eventType: EventType,
  eventData: EventData
): Promise<{ notificados: number; falhas: number }> {
  const { data: paciente } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", patientId)
    .single();

  const nomePaciente = paciente?.full_name ?? "Seu paciente";

  const { data: anjos, error } = await supabase.rpc("get_guardians_to_notify", {
    _patient_id: patientId,
    _notification_type: eventType,
  });
  if (error) throw error;
  if (!anjos?.length) return { notificados: 0, falhas: 0 };

  const { assunto, corpo, urgente } = montarMensagem(eventType, nomePaciente, eventData);

  let notificados = 0;
  let falhas = 0;

  // --- Push: chega na hora, que é o que importa numa dose perdida ---
  const idsAnjos = anjos.map((a: { guardian_id: string }) => a.guardian_id);
  const { data: inscricoes } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth")
    .in("user_id", idsAnjos);

  for (const inscricao of inscricoes ?? []) {
    const ok = await sendWebPush(inscricao, {
      title: assunto,
      body: corpo,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: `${eventType}-${patientId}`,
      requireInteraction: urgente,
    });
    ok ? notificados++ : falhas++;
  }

  // --- E-mail: o registro que fica, para quem não usa push ---
  const senhaSmtp = Deno.env.get("HOSTINGER_EMAIL_PASSWORD");
  if (senhaSmtp) {
    try {
      const client = new SMTPClient({
        connection: {
          hostname: "smtp.hostinger.com",
          port: 465,
          tls: true,
          auth: { username: "contato@mouramente.com.br", password: senhaSmtp },
        },
      });

      for (const anjo of anjos as { guardian_email: string; guardian_name: string }[]) {
        if (!anjo.guardian_email) continue;
        try {
          await client.send({
            from: "Dr. Memo <contato@mouramente.com.br>",
            to: anjo.guardian_email,
            subject: assunto,
            html: emailHtml(assunto, corpo),
          });
          notificados++;
        } catch (e) {
          console.error(`Falha ao enviar e-mail para ${anjo.guardian_email}:`, e);
          falhas++;
        }
      }

      await client.close();
    } catch (e) {
      console.error("Falha ao conectar no SMTP:", e);
      falhas++;
    }
  } else {
    console.warn("HOSTINGER_EMAIL_PASSWORD não configurada — e-mails não enviados");
  }

  return { notificados, falhas };
}
