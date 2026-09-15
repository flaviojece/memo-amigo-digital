import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, jsonResponse, serviceClient, getCallerUser } from "../_shared/auth.ts";
import { notificarAnjos, type EventType, type EventData } from "../_shared/notifyGuardians.ts";

interface NotifyGuardiansRequest {
  eventType: EventType;
  eventData: EventData;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = serviceClient();

    // Segurança: só o próprio paciente pode notificar os seus anjos
    const caller = await getCallerUser(req, supabase);
    if (!caller) return jsonResponse({ error: "Não autorizado" }, 401);

    const { eventType, eventData }: NotifyGuardiansRequest = await req.json();

    const resultado = await notificarAnjos(supabase, caller.id, eventType, eventData);
    console.log(`👪 ${eventType}: ${resultado.notificados} avisos enviados`);

    return jsonResponse({ notified: resultado.notificados, failed: resultado.falhas });
  } catch (erro) {
    console.error("Erro ao notificar anjos:", erro);
    return jsonResponse(
      { error: erro instanceof Error ? erro.message : "Erro desconhecido" },
      500
    );
  }
});
