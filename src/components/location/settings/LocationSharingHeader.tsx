import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { MapPin } from "lucide-react";
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
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`p-2 rounded-full ${
                isSharing
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}
            >
              <MapPin
                className={`w-5 h-5 ${
                  isSharing
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base">
                  {isSharing ? "Compartilhando" : "Pausado"}
                </span>
                <Badge
                  variant={isSharing ? "default" : "secondary"}
                  className="text-xs"
                >
                  {isSharing ? "ATIVO" : "PAUSADO"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isSharing
                  ? "Seus anjos podem ver sua localização"
                  : "Ative para compartilhar sua localização"}
              </p>
            </div>
          </div>
          <Switch
            checked={isSharing}
            onCheckedChange={(checked) => toggleSharingMutation.mutate(checked)}
            disabled={toggleSharingMutation.isPending}
            className="data-[state=checked]:bg-green-600"
          />
        </div>

        {toggleSharingMutation.isPending && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs mt-3 pt-3 border-t">
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Atualizando...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
