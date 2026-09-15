import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, ChevronRight } from "lucide-react";
import { useAdherenceByDay, summarize } from "@/hooks/useAdherence";
import { AdherenceWeekGrid } from "./AdherenceWeekGrid";

interface AdherenceCardProps {
  patientId?: string;
  onVerMais?: () => void;
}

/**
 * Resumo de adesão da semana. O tom é sempre de reforço positivo:
 * nunca cobra, nunca culpa — celebra o que foi feito.
 */
export function AdherenceCard({ patientId, onVerMais }: AdherenceCardProps) {
  const { data, isLoading } = useAdherenceByDay(patientId, 7);
  const { previstas, tomadas, pct } = summarize(data);

  if (isLoading) {
    return (
      <Card className="border-2">
        <CardHeader>
          <Skeleton className="h-7 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Sem nenhuma dose prevista, o card não tem o que dizer
  if (previstas === 0) return null;

  const mensagem =
    pct === null
      ? ""
      : pct >= 90
      ? "Você está cuidando muito bem de você! 👏"
      : pct >= 70
      ? "Você está indo bem. Vamos manter o ritmo!"
      : "Cada remédio tomado conta. Um de cada vez.";

  return (
    <Card className="border-2 border-secondary/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-senior-lg">
          <TrendingUp className="w-6 h-6 text-secondary" aria-hidden="true" />
          Sua semana
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-senior-base text-foreground">
          Você tomou <strong>{tomadas}</strong> de <strong>{previstas}</strong> remédios
          {pct !== null && <> — <strong>{pct}%</strong></>}
        </p>

        {data && <AdherenceWeekGrid days={data} limit={7} />}

        <p className="text-senior-sm text-muted-foreground">{mensagem}</p>

        {onVerMais && (
          <Button
            variant="outline"
            size="lg"
            onClick={onVerMais}
            className="w-full min-h-[56px] text-senior-base justify-between"
          >
            Ver histórico completo
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
