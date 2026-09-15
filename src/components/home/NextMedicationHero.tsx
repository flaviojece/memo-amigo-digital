import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill, Check, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notifyGuardians } from "@/lib/guardianNotifications";
import { registrarRastro } from "@/hooks/useLocationBreadcrumb";
import { cn } from "@/lib/utils";

interface ProximoRemedio {
  id: string;
  name: string;
  dosage: string | null;
  photo_url: string | null;
  horario: string;
  amanha: boolean;
}

/** Vibra brevemente, quando o aparelho suportar. Confirmação silenciosa gera dúvida. */
function vibrar() {
  try {
    navigator.vibrate?.([40, 60, 40]);
  } catch {
    // aparelho sem suporte: silencioso mesmo
  }
}

/**
 * O card dominante da tela inicial: uma única coisa óbvia para fazer agora.
 * Idoso não varre a tela procurando — precisa achar de primeira.
 */
export function NextMedicationHero() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  const { data: proximo, isLoading } = useQuery({
    queryKey: ["proximo-remedio", user?.id],
    queryFn: async (): Promise<ProximoRemedio | null> => {
      const hojeIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("medications")
        .select("id, name, dosage, times, photo_url")
        .eq("user_id", user!.id)
        .eq("active", true)
        .lte("start_date", hojeIso)
        .or(`end_date.is.null,end_date.gte.${hojeIso}`);
      if (error) throw error;

      const agora = new Date();
      const horaAtual = `${String(agora.getHours()).padStart(2, "0")}:${String(
        agora.getMinutes()
      ).padStart(2, "0")}`;

      let melhor: ProximoRemedio | null = null;
      for (const med of data ?? []) {
        const horarios: string[] = (
          Array.isArray(med.times) ? med.times : JSON.parse(String(med.times ?? "[]"))
        )
          .filter((t: unknown): t is string => typeof t === "string")
          .sort();
        if (!horarios.length) continue;

        const aindaHoje = horarios.find((h) => h >= horaAtual);
        const candidato: ProximoRemedio = {
          id: med.id,
          name: med.name,
          dosage: med.dosage,
          photo_url: med.photo_url,
          horario: aindaHoje ?? horarios[0],
          amanha: !aindaHoje,
        };

        if (
          !melhor ||
          (melhor.amanha && !candidato.amanha) ||
          (melhor.amanha === candidato.amanha && candidato.horario < melhor.horario)
        ) {
          melhor = candidato;
        }
      }
      return melhor;
    },
    enabled: !!user,
    refetchInterval: 60_000,
  });

  // O bucket é privado: a exibição precisa de URL assinada
  useEffect(() => {
    let cancelado = false;
    if (!proximo?.photo_url) {
      setFotoUrl(null);
      return;
    }
    supabase.storage
      .from("medication-photos")
      .createSignedUrl(proximo.photo_url, 3600)
      .then(({ data }) => {
        if (!cancelado) setFotoUrl(data?.signedUrl ?? null);
      });
    return () => {
      cancelado = true;
    };
  }, [proximo?.photo_url]);

  const confirmar = async () => {
    if (!proximo || !user) return;
    setConfirmando(true);
    try {
      const agora = new Date();
      const [h, m] = proximo.horario.split(":").map(Number);
      const previsto = new Date(agora);
      previsto.setHours(h, m, 0, 0);
      if (proximo.amanha) previsto.setDate(previsto.getDate() + 1);

      const { error } = await supabase.from("medication_logs").insert({
        medication_id: proximo.id,
        user_id: user.id,
        scheduled_time: previsto.toISOString(),
        taken_at: agora.toISOString(),
        status: "taken",
      });
      if (error) throw error;

      vibrar();
      toast({
        title: "Remédio registrado! ✅",
        description: `${proximo.name} às ${proximo.horario}`,
      });

      void notifyGuardians(user.id, "medication_taken", {
        medicationName: proximo.name,
        time: proximo.horario,
      });

      // O momento do remédio é quando o app está comprovadamente aberto:
      // a melhor oportunidade do dia para registrar onde a pessoa está
      void registrarRastro(user.id, "remedio_confirmado");

      queryClient.invalidateQueries({ queryKey: ["proximo-remedio"] });
      queryClient.invalidateQueries({ queryKey: ["adherence-by-day"] });
      queryClient.invalidateQueries({ queryKey: ["adherence-by-medication"] });
    } catch {
      toast({
        title: "Não foi possível registrar",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setConfirmando(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-4 border-primary/20">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!proximo) {
    return (
      <Card className="border-4 border-dashed border-border">
        <CardContent className="p-6 text-center space-y-2">
          <Pill className="w-12 h-12 text-muted-foreground mx-auto" aria-hidden="true" />
          <p className="text-senior-base text-muted-foreground">
            Nenhum remédio com horário cadastrado
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-4 border-primary shadow-card overflow-hidden">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-senior-sm font-semibold text-primary uppercase tracking-wide">
          <Clock className="w-5 h-5" aria-hidden="true" />
          {proximo.amanha ? "Próximo remédio — amanhã" : "Próximo remédio"}
        </div>

        <div className="flex items-center gap-4">
          {fotoUrl ? (
            <img
              src={fotoUrl}
              alt={`Foto de ${proximo.name}`}
              className="w-24 h-24 object-cover rounded-senior border-4 border-border shrink-0"
            />
          ) : (
            <div
              className="w-24 h-24 rounded-senior bg-accent/30 border-4 border-border flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <Pill className="w-12 h-12 text-primary" />
            </div>
          )}

          <div className="min-w-0">
            <p className="text-senior-xl font-bold text-foreground leading-tight break-words">
              {proximo.name}
            </p>
            {proximo.dosage && (
              <p className="text-senior-base text-muted-foreground">{proximo.dosage}</p>
            )}
            <p className={cn("text-[40px] leading-none font-bold text-primary mt-1")}>
              {proximo.horario}
            </p>
          </div>
        </div>

        <Button
          size="lg"
          onClick={confirmar}
          disabled={confirmando}
          className="w-full min-h-[72px] text-senior-lg font-bold shadow-button"
        >
          <Check className="w-7 h-7 mr-3" aria-hidden="true" />
          {confirmando ? "Registrando..." : "Já tomei"}
        </Button>
      </CardContent>
    </Card>
  );
}
