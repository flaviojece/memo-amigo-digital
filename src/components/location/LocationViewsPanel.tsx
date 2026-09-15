import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Quem olhou a minha localização.
 *
 * Quem é observado tem direito de saber quando foi observado. Sem isso, o
 * "consentimento" é uma caixa marcada uma vez e esquecida; com isso, vira uma
 * relação que a pessoa consegue acompanhar e revogar com informação.
 */
export function LocationViewsPanel() {
  const { user } = useAuth();

  const { data: visualizacoes, isLoading } = useQuery({
    queryKey: ["visualizacoes-localizacao", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("minhas_visualizacoes_localizacao", {
        _dias: 7,
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-senior-lg">
          <Eye className="w-6 h-6 text-primary" aria-hidden="true" />
          Quem viu minha localização
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-senior-sm text-muted-foreground">
          Últimos 7 dias. Você pode desligar o compartilhamento a qualquer momento.
        </p>

        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : !visualizacoes?.length ? (
          <p className="text-senior-base text-foreground">
            Ninguém consultou sua localização nesta semana.
          </p>
        ) : (
          <ul className="space-y-2">
            {visualizacoes.map((v, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 text-senior-base border-b border-border pb-2 last:border-0"
              >
                <span className="font-semibold">{v.anjo_nome}</span>
                <span className="text-senior-sm text-muted-foreground">
                  {new Date(v.visualizado_em).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
