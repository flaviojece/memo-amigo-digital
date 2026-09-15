import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AdherenceDay {
  dia: string;
  previstas: number;
  tomadas: number;
}

export interface AdherenceMedication {
  medication_id: string;
  nome: string;
  dosagem: string;
  previstas: number;
  tomadas: number;
}

export function percent(tomadas: number, previstas: number) {
  if (previstas <= 0) return null;
  return Math.min(100, Math.round((tomadas / previstas) * 100));
}

/**
 * Adesão ao tratamento: quantas doses previstas foram confirmadas.
 * Funciona tanto para o próprio paciente quanto para um anjo dele
 * (a permissão é checada no banco, não aqui).
 */
export function useAdherenceByDay(patientId?: string, days = 30) {
  const { user } = useAuth();
  const target = patientId ?? user?.id;

  return useQuery({
    queryKey: ["adherence-by-day", target, days],
    queryFn: async (): Promise<AdherenceDay[]> => {
      const { data, error } = await supabase.rpc("get_adherence_by_day", {
        _patient_id: target!,
        _days: days,
      });
      if (error) throw error;
      return (data ?? []) as AdherenceDay[];
    },
    enabled: !!target,
    staleTime: 60_000,
  });
}

export function useAdherenceByMedication(patientId?: string, days = 30) {
  const { user } = useAuth();
  const target = patientId ?? user?.id;

  return useQuery({
    queryKey: ["adherence-by-medication", target, days],
    queryFn: async (): Promise<AdherenceMedication[]> => {
      const { data, error } = await supabase.rpc("get_adherence_by_medication", {
        _patient_id: target!,
        _days: days,
      });
      if (error) throw error;
      return (data ?? []) as AdherenceMedication[];
    },
    enabled: !!target,
    staleTime: 60_000,
  });
}

/** Totais do período, prontos para exibição. */
export function summarize(days: AdherenceDay[] | undefined) {
  if (!days?.length) return { previstas: 0, tomadas: 0, pct: null as number | null };
  const previstas = days.reduce((s, d) => s + d.previstas, 0);
  const tomadas = days.reduce((s, d) => s + d.tomadas, 0);
  return { previstas, tomadas, pct: percent(tomadas, previstas) };
}
