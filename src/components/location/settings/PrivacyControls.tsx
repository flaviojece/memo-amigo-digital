import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PrivacyControlsProps {
  settings: any;
}

export function PrivacyControls({ settings }: PrivacyControlsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-senior-xl">
          <Shield className="w-6 h-6" />
          Privacidade e Segurança
        </CardTitle>
        <CardDescription className="text-senior-sm">
          Como seus dados de localização são protegidos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-5 w-5" />
          <AlertDescription className="text-senior-base ml-2">
            <strong>Sua privacidade é garantida:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Apenas guardiões autorizados podem ver sua localização</li>
              <li>Você pode pausar o compartilhamento a qualquer momento</li>
              <li>Suas localizações são criptografadas e seguras</li>
              <li>Você controla quem tem acesso aos seus dados</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <h4 className="font-semibold text-senior-base">Configurações Técnicas</h4>
          <div className="grid gap-2 text-senior-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Intervalo de atualização:</span>
              <span className="font-medium">
                {settings?.update_interval_seconds || 15} segundos
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Precisão mínima:</span>
              <span className="font-medium">
                {settings?.accuracy_threshold_meters || 50} metros
              </span>
            </div>
            {settings?.consent_given_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Consentimento dado em:</span>
                <span className="font-medium">
                  {new Date(settings.consent_given_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            )}
          </div>
        </div>

        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <Info className="h-5 w-5 text-blue-600" />
          <AlertDescription className="text-senior-sm ml-2 text-blue-900">
            <strong>Dica de economia de bateria:</strong> O compartilhamento de localização
            consome bateria. Desative quando não precisar ou mantenha seu dispositivo carregado.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
