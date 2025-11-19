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
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isSharing ? (
              <MapPin className="w-6 h-6 text-green-500" />
            ) : (
              <Pause className="w-6 h-6 text-muted-foreground" />
            )}
            <div>
              <CardTitle className="text-senior-xl">Status do Compartilhamento</CardTitle>
              <CardDescription>
                {isSharing 
                  ? "Seus guardiões podem ver sua localização em tempo real"
                  : "Compartilhamento pausado. Seus guardiões não podem ver sua localização"}
              </CardDescription>
            </div>
          </div>
          <Badge 
            variant={isSharing ? "default" : "secondary"}
            className={`text-lg px-4 py-2 ${isSharing ? "bg-green-500" : ""}`}
          >
            {isSharing ? "ATIVO" : "PAUSADO"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <Label htmlFor="sharing-toggle" className="text-senior-lg cursor-pointer">
            {isSharing ? "Desativar compartilhamento" : "Ativar compartilhamento"}
          </Label>
          <Switch
            id="sharing-toggle"
            checked={isSharing}
            onCheckedChange={(checked) => toggleSharingMutation.mutate(checked)}
            disabled={toggleSharingMutation.isPending}
            className="scale-125"
          />
        </div>
      </CardContent>
    </Card>
  );
}
