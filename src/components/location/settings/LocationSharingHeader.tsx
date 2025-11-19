import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Pause } from "lucide-react";
import { locationTracker } from "@/services/locationTrackingService";

interface LocationSharingHeaderProps {
  settings: any;
}

export function LocationSharingHeader({ settings }: LocationSharingHeaderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleSharingMutation = useMutation({
    mutationFn: async (newState: boolean) => {
      if (newState && !settings?.consent_given_at) {
        const consentText = `Eu, ${user?.email}, autorizo o compartilhamento da minha localização em tempo real com meus familiares cadastrados como guardiões. Entendo que posso desativar a qualquer momento.`;
        
        const { error } = await supabase
          .from("location_sharing_settings")
          .upsert({
            user_id: user?.id,
            is_sharing: true,
            consent_given_at: new Date().toISOString(),
            consent_text: consentText,
            update_interval_seconds: 15,
            accuracy_threshold_meters: 50,
          });

        if (error) throw error;
        await locationTracker.startTracking(user?.id!);
      } else {
        const { error } = await supabase
          .from("location_sharing_settings")
          .update({ is_sharing: newState })
          .eq("user_id", user?.id);

        if (error) throw error;

        if (newState) {
          await locationTracker.startTracking(user?.id!);
        } else {
          locationTracker.stopTracking();
        }
      }
    },
    onSuccess: (_, newState) => {
      queryClient.invalidateQueries({ queryKey: ["location-settings"] });
      toast({
        title: newState ? "✅ Compartilhamento ativado" : "⏸️ Compartilhamento pausado",
        description: newState 
          ? "Seus guardiões podem agora ver sua localização em tempo real."
          : "Seus guardiões não podem mais ver sua localização.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível alterar o status do compartilhamento.",
      });
    },
  });

  const isSharing = settings?.is_sharing ?? false;

  return (
    <Card className="border-2">
      <CardContent className="pt-8 pb-8">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-6 flex-1">
            {isSharing ? (
              <>
                <MapPin className="w-12 h-12 text-green-500 animate-pulse flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-xl">Compartilhando Localização</span>
                    <Badge className="bg-green-500 text-white px-3 py-1">
                      ATIVO
                    </Badge>
                  </div>
                  <p className="text-base text-muted-foreground">
                    Seus anjos podem ver onde você está agora
                  </p>
                </div>
              </>
            ) : (
              <>
                <MapPin className="w-12 h-12 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-xl">Compartilhamento Pausado</span>
                    <Badge variant="secondary" className="px-3 py-1">
                      PAUSADO
                    </Badge>
                  </div>
                  <p className="text-base text-muted-foreground">
                    Ative para seus anjos verem sua localização
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col items-center gap-3">
            <Label 
              htmlFor="sharing-toggle" 
              className="text-lg font-bold cursor-pointer"
            >
              {isSharing ? "Pausar" : "Ativar"}
            </Label>
            <Switch
              id="sharing-toggle"
              checked={isSharing}
              onCheckedChange={(checked) => toggleSharingMutation.mutate(checked)}
              disabled={toggleSharingMutation.isPending}
              className="data-[state=checked]:bg-green-500 scale-150"
            />
          </div>
        </div>

        {toggleSharingMutation.isPending && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Atualizando configurações...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
