import { AdherenceDay } from "@/hooks/useAdherence";
import { cn } from "@/lib/utils";

interface AdherenceWeekGridProps {
  days: AdherenceDay[];
  /** Quantos dias mostrar (a partir do mais recente) */
  limit?: number;
}

const DIA_CURTO = ["D", "S", "T", "Q", "Q", "S", "S"];

/**
 * Grade de adesão em bolinhas grandes — sem números, sem gráfico.
 * A leitura tem que ser instantânea para quem enxerga mal.
 * Verde: tomou tudo. Amarelo: tomou parte. Vermelho: não tomou.
 */
export function AdherenceWeekGrid({ days, limit = 7 }: AdherenceWeekGridProps) {
  const recentes = days.slice(-limit);

  return (
    <div className="flex justify-between gap-2" role="list" aria-label="Adesão dos últimos dias">
      {recentes.map((d) => {
        const data = new Date(`${d.dia}T12:00:00`);
        const semDoses = d.previstas === 0;
        const completo = !semDoses && d.tomadas >= d.previstas;
        const parcial = !semDoses && d.tomadas > 0 && d.tomadas < d.previstas;
        const nenhum = !semDoses && d.tomadas === 0;

        const descricao = semDoses
          ? "sem remédios previstos"
          : `${d.tomadas} de ${d.previstas} tomados`;

        return (
          <div key={d.dia} className="flex flex-col items-center gap-1 flex-1" role="listitem">
            <span className="text-senior-xs font-semibold text-muted-foreground">
              {DIA_CURTO[data.getDay()]}
            </span>
            <div
              className={cn(
                "w-full aspect-square max-w-[52px] rounded-senior border-4 flex items-center justify-center",
                "text-senior-sm font-bold transition-colors",
                completo && "bg-secondary border-secondary text-white",
                parcial && "bg-accent border-accent text-accent-foreground",
                nenhum && "bg-destructive/15 border-destructive text-destructive",
                semDoses && "bg-muted border-muted text-muted-foreground"
              )}
              title={`${data.toLocaleDateString("pt-BR")} — ${descricao}`}
              aria-label={`${data.toLocaleDateString("pt-BR")}, ${descricao}`}
            >
              {completo ? "✓" : semDoses ? "–" : d.tomadas}
            </div>
            <span className="text-senior-xs text-muted-foreground">{data.getDate()}</span>
          </div>
        );
      })}
    </div>
  );
}
