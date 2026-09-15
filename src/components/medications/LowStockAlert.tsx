import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PackageOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface EstoqueBaixoProps {
  onVerRemedios?: () => void;
}

/**
 * Cartela acabando é uma das causas mais comuns de tratamento interrompido,
 * e ninguém percebe até o dia em que não tem o comprimido na mão.
 */
export function LowStockAlert({ onVerRemedios }: EstoqueBaixoProps) {
  const { user } = useAuth();

  const { data: acabando } = useQuery({
    queryKey: ["estoque-baixo", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medications")
        .select("id, name, stock_quantity, stock_alert_at")
        .eq("user_id", user!.id)
        .eq("active", true)
        .not("stock_quantity", "is", null);
      if (error) throw error;

      return (data ?? []).filter(
        (m) => (m.stock_quantity ?? 0) <= (m.stock_alert_at ?? 7)
      );
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  if (!acabando?.length) return null;

  return (
    <Card className="border-4 border-accent bg-accent/10">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <PackageOpen className="w-8 h-8 text-accent-text shrink-0" aria-hidden="true" />
          <div>
            <p className="text-senior-lg font-bold text-foreground">
              {acabando.length === 1 ? "Um remédio está acabando" : "Remédios acabando"}
            </p>
            <ul className="mt-2 space-y-1">
              {acabando.map((m) => (
                <li key={m.id} className="text-senior-base text-foreground">
                  <strong>{m.name}</strong>
                  {m.stock_quantity === 0
                    ? " — acabou"
                    : ` — restam ${m.stock_quantity} ${
                        m.stock_quantity === 1 ? "dose" : "doses"
                      }`}
                </li>
              ))}
            </ul>
            <p className="text-senior-sm text-muted-foreground mt-2">
              Hora de comprar ou pedir a renovação da receita.
            </p>
          </div>
        </div>

        {onVerRemedios && (
          <Button
            variant="outline"
            size="lg"
            onClick={onVerRemedios}
            className="w-full min-h-[56px] text-senior-base border-2"
          >
            Ver meus remédios
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
