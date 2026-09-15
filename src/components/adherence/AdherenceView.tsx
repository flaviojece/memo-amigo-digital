import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer, Pill } from "lucide-react";
import {
  useAdherenceByDay,
  useAdherenceByMedication,
  summarize,
  percent,
} from "@/hooks/useAdherence";
import { AdherenceWeekGrid } from "./AdherenceWeekGrid";
import { BackToHomeButton } from "@/components/ui/BackToHomeButton";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface AdherenceViewProps {
  patientId?: string;
  patientName?: string;
  onBackToHome?: () => void;
}

const PERIODOS = [
  { dias: 7, label: "7 dias" },
  { dias: 30, label: "30 dias" },
  { dias: 90, label: "90 dias" },
];

export function AdherenceView({ patientId, patientName, onBackToHome }: AdherenceViewProps) {
  const { user } = useAuth();
  const [dias, setDias] = useState(30);

  const { data: porDia, isLoading: carregandoDias } = useAdherenceByDay(patientId, dias);
  const { data: porRemedio, isLoading: carregandoRemedios } = useAdherenceByMedication(
    patientId,
    dias
  );

  const { previstas, tomadas, pct } = summarize(porDia);
  const nome = patientName ?? user?.user_metadata?.full_name ?? "";
  const hoje = new Date().toLocaleDateString("pt-BR");

  return (
    <div className="min-h-screen bg-background pb-[calc(var(--mobile-nav-height)+1rem)]">
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {onBackToHome && (
          <div className="no-print">
            <BackToHomeButton onBackToHome={onBackToHome} />
          </div>
        )}

        <h1 className="text-senior-2xl font-display text-foreground">
          Adesão ao tratamento
        </h1>

        {/* Seletor de período */}
        <div className="grid grid-cols-3 gap-2 no-print" role="group" aria-label="Período">
          {PERIODOS.map((p) => (
            <Button
              key={p.dias}
              variant={dias === p.dias ? "default" : "outline"}
              size="lg"
              onClick={() => setDias(p.dias)}
              className="flex-1 min-h-[56px] text-senior-base"
              aria-pressed={dias === p.dias}
            >
              {p.label}
            </Button>
          ))}
        </div>

        {/* Resumo */}
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-senior-lg">Resumo do período</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {carregandoDias ? (
              <>
                <Skeleton className="h-16 w-40" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : previstas === 0 ? (
              <p className="text-senior-base text-muted-foreground">
                Nenhum remédio previsto neste período.
              </p>
            ) : (
              <>
                <div className="flex flex-col gap-2 min-[430px]:flex-row min-[430px]:items-baseline min-[430px]:gap-3">
                  <span
                    className={cn(
                      "text-senior-3xl leading-none font-bold",
                      (pct ?? 0) >= 80 ? "text-secondary" : "text-accent-foreground"
                    )}
                  >
                    {pct}%
                  </span>
                  <span className="text-senior-base text-muted-foreground">
                    {tomadas} de {previstas} doses
                  </span>
                </div>
                {porDia && <AdherenceWeekGrid days={porDia} limit={7} />}
                <p className="text-senior-xs text-muted-foreground no-print">
                  Os quadrados mostram os últimos 7 dias.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Por medicamento */}
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-senior-lg">Por remédio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {carregandoRemedios ? (
              <Skeleton className="h-24 w-full" />
            ) : !porRemedio?.length ? (
              <p className="text-senior-base text-muted-foreground">
                Nenhum remédio ativo no período.
              </p>
            ) : (
              porRemedio.map((m) => {
                const p = percent(m.tomadas, m.previstas);
                return (
                  <div key={m.medication_id} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-senior-base font-semibold flex items-center gap-2">
                        <Pill className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                        {m.nome} {m.dosagem && <span className="font-normal">{m.dosagem}</span>}
                      </span>
                      <span className="text-senior-base font-bold shrink-0">
                        {p === null ? "—" : `${p}%`}
                      </span>
                    </div>
                    <div
                      className="h-4 rounded-full bg-muted overflow-hidden"
                      role="progressbar"
                      aria-valuenow={p ?? 0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Adesão de ${m.nome}`}
                    >
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          (p ?? 0) >= 80 ? "bg-secondary" : "bg-accent"
                        )}
                        style={{ width: `${p ?? 0}%` }}
                      />
                    </div>
                    <p className="text-senior-xs text-muted-foreground">
                      {m.tomadas} de {m.previstas} doses
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Rodapé só do relatório impresso */}
        <div className="hidden print:block text-sm mt-6 border-t pt-3">
          <p>
            Relatório de adesão ao tratamento{nome && ` — ${nome}`} | Período: últimos {dias} dias |
            Emitido em {hoje}
          </p>
          <p>Gerado pelo aplicativo Dr. Memo — Amigo Digital</p>
        </div>

        <Button
          size="lg"
          variant="secondary"
          onClick={() => window.print()}
          className="w-full min-h-[64px] text-senior-base no-print"
        >
          <Printer className="mr-2 w-6 h-6" aria-hidden="true" />
          Imprimir ou salvar em PDF
        </Button>
        <p className="text-senior-xs text-muted-foreground text-center no-print">
          Leve este relatório na próxima consulta médica.
        </p>
      </div>
    </div>
  );
}
