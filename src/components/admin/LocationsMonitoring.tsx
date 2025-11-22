import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { LiveLocationMap } from "@/components/location/LiveLocationMap";
import { Badge } from "@/components/ui/badge";

export function LocationsMonitoring() {
  const { data: activeLocations, isLoading } = useQuery({
    queryKey: ["admin-active-locations"],
    queryFn: async () => {
      const { data: settings, error: settingsError } = await supabase
        .from("location_sharing_settings")
        .select(`
          user_id,
          is_sharing,
          profiles (
            full_name,
            email
          )
        `)
        .eq("is_sharing", true);

      if (settingsError) throw settingsError;

      const { data: locations, error: locError } = await supabase
        .from("live_locations")
        .select("*")
        .in(
          "user_id",
          settings?.map((s) => s.user_id) || []
        );

      if (locError) throw locError;

      return settings?.map((setting) => ({
        ...setting,
        location: locations?.find((l) => l.user_id === setting.user_id),
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
            Visualizar localizações em tempo real de todos os pacientes
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
              <div className="h-96 flex items-center justify-center bg-muted rounded-lg">
                <p className="text-muted-foreground">Carregando localizações...</p>
              </div>
            ) : !firstActiveLocation?.location ? (
              <div className="h-96 flex items-center justify-center bg-muted rounded-lg">
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
                  className="flex items-center justify-between p-2 hover:bg-muted rounded"
                >
                  <div>
                    <p className="font-medium">{(loc.profiles as any)?.full_name || "Sem nome"}</p>
                    <p className="text-sm text-muted-foreground">{(loc.profiles as any)?.email}</p>
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
