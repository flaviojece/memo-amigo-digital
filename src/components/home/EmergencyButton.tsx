import { AlertTriangle, Phone } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export function EmergencyButton() {
  const [isActivating, setIsActivating] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();

  const handleEmergencyClick = () => {
    if (isActivating) return;

    setIsActivating(true);
    setCountdown(5);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsActivating(false);
          activateEmergency();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Permitir cancelar tocando novamente
    const cancelTimer = setTimeout(() => {
      clearInterval(timer);
      setIsActivating(false);
      setCountdown(0);
    }, 5000);
  };

  const activateEmergency = () => {
    toast({
      title: "🚨 Emergência Ativada",
      description: "Ligando para contato de emergência e notificando familiares...",
      variant: "destructive",
    });

    // Aqui seria a lógica real de emergência:
    // 1. Ligar para contato de emergência
    // 2. Enviar SMS para familiares com localização
    // 3. Registrar evento no histórico
    console.log("Emergência ativada!");
  };

  const cancelEmergency = () => {
    setIsActivating(false);
    setCountdown(0);
    toast({
      title: "Emergência Cancelada",
      description: "A chamada de emergência foi cancelada.",
    });
  };

  return (
    <div className="relative">
      <button
        onClick={isActivating ? cancelEmergency : handleEmergencyClick}
        className="w-full bg-destructive text-destructive-foreground p-8 rounded-memo shadow-emergency border-4 border-destructive hover:bg-destructive/90 transition-all duration-300 relative overflow-hidden"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <AlertTriangle className="w-12 h-12 text-white" />
            {isActivating && (
              <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
            )}
          </div>
          
          <div className="text-center">
            <h3 className="text-senior-xl font-bold mb-2">
              {isActivating ? "CANCELAR" : "EMERGÊNCIA"}
            </h3>
            
            {isActivating ? (
              <div className="space-y-2">
                <p className="text-senior-lg font-semibold">
                  Ativando em {countdown}s
                </p>
                <p className="text-senior-sm text-white/90">
                  Toque para cancelar
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Phone className="w-5 h-5" />
                  <span className="text-senior-base">192 - SAMU</span>
                </div>
                <p className="text-senior-sm text-white/90">
                  Toque para ativar
                </p>
              </div>
            )}
          </div>
        </div>

        {isActivating && (
          <div 
            className="absolute bottom-0 left-0 bg-white/30 h-2 transition-all duration-1000 ease-linear"
            style={{ width: `${((5 - countdown) / 5) * 100}%` }}
          />
        )}
      </button>
    </div>
  );
}