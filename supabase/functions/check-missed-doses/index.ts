import { corsHeaders, jsonResponse, serviceClient } from "../_shared/auth.ts";
import { notificarAnjos } from "../_shared/notifyGuardians.ts";

/**
 * Roda no cron, a cada 10 minutos.
 *
 * 1. Marca como perdidas as doses que passaram do prazo de tolerância
 *    e avisa os anjos — é isso que transforma um alarme em rede de cuidado.
 * 2. Envia o lembrete da véspera das consultas.
 *
 * Respeita o horário de silêncio de cada anjo: ninguém precisa ser acordado
 * às 3h por causa de um remédio das 22h. Fora da janela, o aviso espera.
 */

const FUSO = "America/Sao_Paulo";

function horaLocal(): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

/** Verifica se `hora` (HH:MM) está dentro da janela de silêncio, que pode cruzar a meia-noite. */
function emSilencio(hora: string, inicio: string, fim: string): boolean {
  const h = hora.slice(0, 5);
  const i = inicio.slice(0, 5);
  const f = fim.slice(0, 5);
  return i <= f ? h >= i && h < f : h >= i || h < f;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = serviceClient();
  const agora = horaLocal();
  let dosesAvisadas = 0;
  let consultasAvisadas = 0;

  try {
    // ---------- 1. Doses perdidas ----------
    const { data: perdidas, error: erroPerdidas } = await supabase.rpc(
      "registrar_doses_perdidas"
    );
    if (erroPerdidas) throw erroPerdidas;

    for (const dose of perdidas ?? []) {
      // Preferências dos anjos deste paciente, para respeitar o silêncio
      const { data: prefs } = await supabase
        .from("guardian_notification_preferences")
        .select("guardian_id, quiet_hours_start, quiet_hours_end")
        .eq("patient_id", dose.patient_id)
        .eq("enabled", true)
        .eq("notify_medication_missed", true);

      const algumDisponivel = (prefs ?? []).some(
        (p) => !emSilencio(agora, p.quiet_hours_start, p.quiet_hours_end)
      );

      if (!algumDisponivel) {
        console.log(
          `🔕 Dose perdida de ${dose.medication_name} não avisada: todos os anjos em horário de silêncio`
        );
        continue;
      }

      try {
        await notificarAnjos(supabase, dose.patient_id, "medication_missed", {
          medicationName: dose.medication_name,
          time: dose.horario,
        });
        dosesAvisadas++;
      } catch (e) {
        console.error("Erro ao avisar anjos sobre dose perdida:", e);
      }
    }

    // ---------- 2. Consultas de amanhã ----------
    const { data: consultas, error: erroConsultas } = await supabase.rpc(
      "consultas_de_amanha"
    );
    if (erroConsultas) throw erroConsultas;

    for (const c of consultas ?? []) {
      try {
        await notificarAnjos(supabase, c.patient_id, "appointment_upcoming", {
          doctorName: c.doctor_name,
          specialty: c.specialty,
          date: new Date(c.data).toLocaleString("pt-BR", { timeZone: FUSO }),
        });
        await supabase
          .from("appointments")
          .update({ reminder_24h_sent: true })
          .eq("id", c.appointment_id);
        consultasAvisadas++;
      } catch (e) {
        console.error("Erro ao lembrar da consulta:", e);
      }
    }

    return jsonResponse({
      ok: true,
      hora_local: agora,
      doses_perdidas: perdidas?.length ?? 0,
      doses_avisadas: dosesAvisadas,
      consultas_avisadas: consultasAvisadas,
    });
  } catch (erro) {
    console.error("Falha no escalonamento:", erro);
    return jsonResponse(
      { error: erro instanceof Error ? erro.message : "Erro desconhecido" },
      500
    );
  }
});
