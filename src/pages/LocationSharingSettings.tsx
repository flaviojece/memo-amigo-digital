import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationSharingHeader } from "@/components/location/settings/LocationSharingHeader";
import { GuardiansManager } from "@/components/location/settings/GuardiansManager";
import { PrivacyControls } from "@/components/location/settings/PrivacyControls";
import { TechnicalInfo } from "@/components/location/settings/TechnicalInfo";

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
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-senior-lg text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        {/* Header com botão voltar */}
        <div className="flex items-center gap-4 pt-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Button>
          <h1 className="text-senior-2xl font-bold text-foreground">
            Configurações de Compartilhamento
          </h1>
        </div>

        {/* Status e controle principal */}
        <LocationSharingHeader settings={settings} />

        {/* Gerenciamento de guardiões/anjos */}
        <GuardiansManager />

        {/* Controles de privacidade */}
        <PrivacyControls settings={settings} />

        {/* Informações técnicas */}
        <TechnicalInfo lastLocation={lastLocation} settings={settings} />
      </div>
    </div>
  );
}
