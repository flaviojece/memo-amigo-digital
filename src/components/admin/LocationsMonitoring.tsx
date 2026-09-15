import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { LiveLocationMap } from "@/components/location/LiveLocationMap";
import { Badge } from "@/components/ui/badge";

export function LocationsMonitoring() {
  // Acesso ao mapa passa por RPC que registra em audit_logs.
  // Postgres não tem trigger de SELECT, então auditar leitura exige isto.
  const { data: activeLocations, isLoading } = useQuery({
    queryKey: ["admin-active-locations"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_live_locations");
      if (error) throw error;

      return (data ?? []).map((l) => ({
        user_id: l.user_id,
        profiles: { full_name: l.full_name },
        location: {
          latitude: l.latitude,
          longitude: l.longitude,
          updated_at: l.updated_at,
        },
      }));
    },
  });

  const firstActiveLocation = activeLocations?.find((loc) => loc.location);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Monitoramento de Localizações
          </CardTitle>
          <CardDescription>
            Última localização conhecida dos pacientes que compartilham
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="default">
                {activeLocations?.length || 0} compartilhamentos ativos
              </Badge>
            </div>

            {isLoading ? (
              <div className="h-[min(24rem,65dvh)] min-h-[320px] flex items-center justify-center bg-muted rounded-lg">
                <p className="text-muted-foreground">Carregando localizações...</p>
              </div>
            ) : !firstActiveLocation?.location ? (
              <div className="h-[min(24rem,65dvh)] min-h-[320px] flex items-center justify-center bg-muted rounded-lg">
                <p className="text-muted-foreground">Nenhuma localização ativa no momento</p>
              </div>
            ) : (
              <LiveLocationMap 
                patientId={firstActiveLocation.user_id}
                onClose={() => {}}
              />
            )}

            <div className="border rounded-lg p-4 space-y-2">
              <h4 className="font-medium">Pacientes compartilhando localização:</h4>
              {activeLocations?.map((loc) => (
                <div
                  key={loc.user_id}
                  className="flex flex-col gap-2 p-3 hover:bg-muted rounded min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between"
                >
                  <div>
                    <p className="font-medium">{(loc.profiles as any)?.full_name || "Sem nome"}</p>
                  </div>
                  {loc.location && (
                    <Badge variant="outline">
                      Última atualização:{" "}
                      {new Date(loc.location.updated_at!).toLocaleTimeString("pt-BR")}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
