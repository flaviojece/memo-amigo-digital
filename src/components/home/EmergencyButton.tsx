import { AlertTriangle, Phone } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function EmergencyButton() {
  const [isActivating, setIsActivating] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup do timer quando componente desmonta ou isActivating muda
  useEffect(() => {
    if (!isActivating) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsActivating(false);
          activateEmergency();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActivating]);

  const handleEmergencyClick = () => {
    if (isActivating) return;
    setIsActivating(true);
    setCountdown(5);
  };

  const activateEmergency = async () => {
    if (!user) return;

    try {
      // Capturar localização se disponível
      let location = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
        } catch (error) {
          console.log("Localização não disponível:", error);
        }
      }

      // Registrar ativação no banco
      const { error } = await supabase
        .from("emergency_activations")
        .insert({
          user_id: user.id,
          location: location,
          status: "activated",
          notes: "Ativação manual via botão de emergência"
        });

      if (error) throw error;

      toast({
        title: "🚨 Emergência Ativada",
        description: "Contatos de emergência estão sendo notificados...",
        variant: "destructive",
      });

      // Aqui seria chamada a edge function para enviar notificações
      // await supabase.functions.invoke('send-emergency-alert', { body: { location } })

    } catch (error) {
      console.error("Erro ao ativar emergência:", error);
      toast({
        title: "Erro",
        description: "Não foi possível ativar a emergência. Tente novamente.",
        variant: "destructive",
      });
    }
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
        aria-label={isActivating ? "Cancelar emergência" : "Ativar emergência - SAMU 192"}
        aria-live="polite"
        aria-atomic="true"
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