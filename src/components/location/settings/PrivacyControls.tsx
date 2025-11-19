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
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="w-5 h-5" />
          Privacidade e Segurança
        </CardTitle>
        <CardDescription className="text-sm">
          Como seus dados de localização são protegidos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm ml-2">
            <strong>Sua privacidade é garantida:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
              <li>Apenas guardiões autorizados podem ver sua localização</li>
              <li>Você pode pausar o compartilhamento a qualquer momento</li>
              <li>Suas localizações são criptografadas e seguras</li>
              <li>Você controla quem tem acesso aos seus dados</li>
            </ul>
          </AlertDescription>
        </Alert>

        {settings?.consent_given_at && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Consentimento dado em:</span>
              <span className="font-medium">
                {new Date(settings.consent_given_at).toLocaleDateString("pt-BR")}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
