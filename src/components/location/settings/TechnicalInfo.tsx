import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Battery, Clock, MapPin, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TechnicalInfoProps {
  lastLocation: any;
  settings: any;
}

export function TechnicalInfo({ lastLocation, settings }: TechnicalInfoProps) {
  if (!settings?.is_sharing) {
    return null;
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Activity className="w-4 h-4" />
          Informações Técnicas
        </CardTitle>
        <CardDescription className="text-xs">
          Dados da última atualização
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!lastLocation ? (
          <div className="text-center py-6 text-muted-foreground">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">Aguardando atualização...</p>
          </div>
        ) : (
          <div className="grid gap-2">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-xs">Última Atualização</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(lastLocation.updated_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
            </div>

            {lastLocation.battery_level !== null && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Battery className={`w-4 h-4 ${
                    lastLocation.battery_level > 0.5 
                      ? "text-green-500" 
                      : lastLocation.battery_level > 0.2 
                        ? "text-yellow-500" 
                        : "text-red-500"
                  }`} />
                  <div>
                    <p className="font-medium text-xs">Bateria</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(lastLocation.battery_level * 100)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-3 bg-muted/50 rounded-lg">
              <span className="text-xs font-medium">
                {lastLocation.is_moving ? "🚶 Em movimento" : "🧍 Parado"}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
