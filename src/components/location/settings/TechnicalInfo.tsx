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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5" />
          Informações Técnicas
        </CardTitle>
        <CardDescription className="text-sm">
          Dados da última atualização de localização
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!lastLocation ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aguardando primeira atualização...</p>
            <p className="text-xs">A localização será compartilhada em breve</p>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Última Atualização</p>
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
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Battery className={`w-4 h-4 ${
                    lastLocation.battery_level > 0.5 
                      ? "text-green-500" 
                      : lastLocation.battery_level > 0.2 
                        ? "text-yellow-500" 
                        : "text-red-500"
                  }`} />
                  <div>
                    <p className="font-medium text-sm">Bateria</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(lastLocation.battery_level * 100)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {lastLocation.is_moving ? "🚶 Em movimento" : "🧍 Parado"}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
