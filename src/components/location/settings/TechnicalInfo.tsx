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
        <CardTitle className="flex items-center gap-2 text-senior-xl">
          <Activity className="w-6 h-6" />
          Informações Técnicas
        </CardTitle>
        <CardDescription className="text-senior-sm">
          Dados da última atualização de localização
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!lastLocation ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-senior-base">Aguardando primeira atualização...</p>
            <p className="text-senior-sm">A localização será compartilhada em breve</p>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-senior-base">Última Atualização</p>
                  <p className="text-senior-sm text-muted-foreground">
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
                  <Battery className={`w-5 h-5 ${
                    lastLocation.battery_level > 50 
                      ? "text-green-500" 
                      : lastLocation.battery_level > 20 
                        ? "text-yellow-500" 
                        : "text-red-500"
                  }`} />
                  <div>
                    <p className="font-medium text-senior-base">Nível de Bateria</p>
                    <p className="text-senior-sm text-muted-foreground">
                      {Math.round(lastLocation.battery_level * 100)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-senior-base">Precisão</p>
                  <p className="text-senior-sm text-muted-foreground">
                    ±{Math.round(lastLocation.accuracy || 0)} metros
                  </p>
                </div>
              </div>
            </div>

            {lastLocation.speed !== null && lastLocation.speed > 0 && (
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-senior-base">Velocidade</p>
                    <p className="text-senior-sm text-muted-foreground">
                      {(lastLocation.speed * 3.6).toFixed(1)} km/h
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-senior-sm text-blue-900">
                <strong>Status:</strong> {lastLocation.is_moving ? "Em movimento" : "Parado"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
