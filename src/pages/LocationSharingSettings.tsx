import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { LocationSharingHeader } from "@/components/location/settings/LocationSharingHeader";
import { GuardiansManager } from "@/components/location/settings/GuardiansManager";
import { AdvancedSettings } from "@/components/location/settings/AdvancedSettings";

export default function LocationSharingSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Buscar configurações de compartilhamento
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["location-settings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("location_sharing_settings")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Buscar última localização
  const { data: lastLocation } = useQuery({
    queryKey: ["last-location", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("live_locations")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user && !!settings?.is_sharing,
    refetchInterval: settings?.is_sharing ? 10000 : false,
  });

  if (settingsLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header compacto e sticky */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="container max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Compartilhamento</h1>
              <p className="text-xs text-muted-foreground">Gerencie seus anjos e localização</p>
            </div>
          </div>
        </div>
      </div>

      {/* Container principal */}
      <div className="container max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Status e controle principal */}
        <LocationSharingHeader settings={settings} />

        {/* Gerenciamento de guardiões/anjos */}
        <GuardiansManager />

        {/* Configurações avançadas (colapsável) */}
        <AdvancedSettings settings={settings} lastLocation={lastLocation} />
      </div>
    </div>
  );
}
