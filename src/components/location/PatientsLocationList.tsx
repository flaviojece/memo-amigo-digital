import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Navigation, Clock, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import { LocationFreshness } from "./LocationFreshness";
import { LiveLocationMap } from "./LiveLocationMap";
import { logger } from "@/lib/logger";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface PatientsLocationListProps {
  onBackToMore?: () => void;
}

export function PatientsLocationList({ onBackToMore }: PatientsLocationListProps = {}) {
  const { user } = useAuth();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [locationStatuses, setLocationStatuses] = useState<Record<string, any>>({});

  // Buscar pacientes vinculados
  const { data: patients, isLoading } = useQuery({
    queryKey: ["guardian-patients", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guardian_relationships")
        .select(`
          id,
          patient_id,
          relationship_type,
          profiles!guardian_relationships_patient_id_fkey(
            id,
            full_name,
            email
          )
        `)
        .eq("guardian_id", user?.id)
        .eq("status", "active");

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Subscribe em mudanças nas configurações e localizações
  useEffect(() => {
    if (!patients || patients.length === 0) return;

    const patientIds = patients.map((p) => p.patient_id);

    // Subscribe em location_sharing_settings
    const settingsChannel = supabase
      .channel("patient-location-settings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "location_sharing_settings",
          filter: `user_id=in.(${patientIds.join(",")})`,
        },
        (payload) => {
          logger.log("Settings changed:", payload);
          loadLocationStatuses();
        }
      )
      .subscribe();

    // Subscribe em live_locations
    const locationsChannel = supabase
      .channel("patient-live-locations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_locations",
          filter: `user_id=in.(${patientIds.join(",")})`,
        },
        (payload) => {
          logger.log("Location changed:", payload);
          loadLocationStatuses();
        }
      )
      .subscribe();

    // Carregar status iniciais
    loadLocationStatuses();

    return () => {
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(locationsChannel);
    };
  }, [patients]);

  const loadLocationStatuses = async () => {
    if (!patients) return;

    const statuses: Record<string, any> = {};

    for (const patient of patients) {
      // Buscar configurações
      const { data: settings } = await supabase
        .from("location_sharing_settings")
        .select("*")
        .eq("user_id", patient.patient_id)
        .maybeSingle();

      // Buscar última localização
      const { data: location } = await supabase
        .from("live_locations")
        .select("*")
        .eq("user_id", patient.patient_id)
        .maybeSingle();

      statuses[patient.patient_id] = {
        isSharing: settings?.is_sharing || false,
        lastUpdate: location?.updated_at,
        batteryLevel: location?.battery_level,
        trackingActive: settings?.tracking_active ?? false,
        stoppedReason: settings?.tracking_stopped_reason ?? null,
        source: location?.source ?? null,
      };
    }

    setLocationStatuses(statuses);
  };

  if (selectedPatientId) {
    return (
      <LiveLocationMap
        patientId={selectedPatientId}
        onClose={() => setSelectedPatientId(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-[calc(var(--mobile-nav-height)+1rem)]">
      {onBackToMore && (
        <Button
          onClick={onBackToMore}
          variant="ghost"
          size="default"
          className="group flex items-center gap-3 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 mb-4"
        >
          <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-senior-sm font-medium">Voltar ao Menu</span>
        </Button>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <MapPin className="w-7 h-7 text-primary" />
            Localização dos Meus Pacientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <LoadingSpinner />
            </div>
          ) : patients && patients.length > 0 ? (
            <div className="space-y-4">
              {patients.map((patient: any) => {
                const status = locationStatuses[patient.patient_id] || {};
                const profile = patient.profiles;

                return (
                  <Card key={patient.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-4 min-[430px]:flex-row min-[430px]:items-center">
                        {/* Avatar */}
                        <Avatar className="w-14 h-14">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                            {profile?.full_name?.[0] || profile?.email?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="min-w-0 font-bold text-lg break-words">
                              {profile?.full_name || profile?.email}
                            </h3>
                            <Badge variant={status.isSharing ? "default" : "secondary"}>
                              {status.isSharing ? "Compartilhando" : "Pausado"}
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground mb-2">
                            {patient.relationship_type || "Paciente"}
                          </p>

                          {status.isSharing ? (
                            <div className="space-y-2">
                              <LocationFreshness
                                updatedAt={status.lastUpdate}
                                trackingActive={status.trackingActive}
                                stoppedReason={status.stoppedReason}
                                source={status.source}
                                compacto
                              />
                              {status.batteryLevel != null && (
                                <p className="text-senior-xs text-muted-foreground">
                                  Bateria do celular: {status.batteryLevel}%
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-senior-sm text-muted-foreground">
                              Não está compartilhando no momento
                            </p>
                          )}
                        </div>

                        {/* Botão */}
                        <Button
                          onClick={() => setSelectedPatientId(patient.patient_id)}
                          disabled={!status.isSharing}
                          variant={status.isSharing ? "default" : "outline"}
                          size="lg"
                          className="w-full flex-shrink-0 min-[430px]:w-auto"
                        >
                          <Navigation className="w-5 h-5 mr-2" />
                          Ver no Mapa
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              <MapPin className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Você ainda não tem pacientes vinculados.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
