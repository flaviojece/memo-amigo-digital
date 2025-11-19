import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PrivacyControlsProps {
  settings: any;
}

export function PrivacyControls({ settings }: PrivacyControlsProps) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Shield className="w-4 h-4" />
          Privacidade e Segurança
        </CardTitle>
        <CardDescription className="text-xs">
          Como seus dados são protegidos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert className="border-0 bg-muted/30">
          <Info className="h-3 w-3" />
          <AlertDescription className="text-xs ml-2">
            <strong className="text-xs">Sua privacidade é garantida:</strong>
            <ul className="list-disc list-inside mt-1.5 space-y-0.5 text-xs">
              <li>Apenas guardiões autorizados veem sua localização</li>
              <li>Você pode pausar a qualquer momento</li>
              <li>Dados criptografados e seguros</li>
              <li>Controle total sobre acessos</li>
            </ul>
          </AlertDescription>
        </Alert>

        {settings?.consent_given_at && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Consentimento:</span>
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
