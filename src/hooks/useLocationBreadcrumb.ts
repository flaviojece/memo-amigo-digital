import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { locationTracker } from "@/services/locationTrackingService";
import { useAuth } from "@/contexts/AuthContext";

/** Evita repetir o registro a cada navegação dentro da mesma sessão. */
const INTERVALO_MINIMO_MS = 10 * 60 * 1000;

/**
 * Registra a posição nos momentos em que o app já está aberto.
 *
 * O rastreamento contínuo só funciona com a tela ligada, o que na prática
 * quase nunca acontece. Mas o idoso abre o app algumas vezes por dia por causa
 * dos remédios — e cada abertura pode deixar uma posição recente, sem gastar
 * bateria. São esses rastros que dão ao anjo uma noção real do dia.
 *
 * Só registra se o paciente tiver o compartilhamento ligado.
 */
export function useLocationBreadcrumb(
  motivo: "abertura_app" | "remedio_confirmado" | "emergencia" = "abertura_app",
  ativo = true
) {
  const { user } = useAuth();
  const jaRegistrou = useRef(false);

  useEffect(() => {
    if (!user || !ativo || jaRegistrou.current) return;

    const registrar = async () => {
      const { data: settings } = await supabase
        .from("location_sharing_settings")
        .select("is_sharing")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!settings?.is_sharing) return;

      const chave = `dr-memo-ultimo-rastro`;
      const ultimo = Number(localStorage.getItem(chave) ?? 0);
      if (motivo !== "emergencia" && Date.now() - ultimo < INTERVALO_MINIMO_MS) return;

      jaRegistrou.current = true;
      const ok = await locationTracker.registrarPosicaoPontual(user.id, motivo);
      if (ok) localStorage.setItem(chave, String(Date.now()));
    };

    void registrar();
  }, [user, motivo, ativo]);
}

/** Versão imperativa, para chamar dentro de um handler (confirmar remédio, emergência). */
export async function registrarRastro(
  userId: string,
  motivo: "abertura_app" | "remedio_confirmado" | "emergencia"
) {
  const { data: settings } = await supabase
    .from("location_sharing_settings")
    .select("is_sharing")
    .eq("user_id", userId)
    .maybeSingle();

  if (!settings?.is_sharing) return;
  await locationTracker.registrarPosicaoPontual(userId, motivo);
}
