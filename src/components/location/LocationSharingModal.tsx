import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Shield, Users, Clock, Battery, CheckCircle, AlertCircle } from "lucide-react";
import { locationTracker } from "@/services/locationTrackingService";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LocationSharingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LocationSharingModal({ open, onOpenChange }: LocationSharingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hasConsented, setHasConsented] = useState(false);

  // Buscar configurações de compartilhamento
  const { data: settings, isLoading } = useQuery({
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
    enabled: !!user && open,
  });

  // Buscar guardiões ativos
  const { data: guardians } = useQuery({
    queryKey: ["active-guardians", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guardian_relationships")
        .select(`
          id,
          guardian_id,
          relationship_type,
          profiles!guardian_relationships_guardian_id_fkey(full_name, email)
        `)
        .eq("patient_id", user?.id)
        .eq("status", "active");

      if (error) throw error;
      return data;
    },
    enabled: !!user && open,
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
    enabled: !!user && open && settings?.is_sharing,
    refetchInterval: settings?.is_sharing ? 10000 : false,
  });

  // Mutation: Ativar compartilhamento
  const activateMutation = useMutation({
    mutationFn: async () => {
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

      // Iniciar tracking
      await locationTracker.startTracking(user?.id!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["location-settings"] });
      toast({
        title: "✅ Rastreamento ativado",
        description: "Seus guardiões agora podem ver sua localização em tempo real.",
      });
    },
    onError: (error) => {
      console.error("Erro ao ativar:", error);
      toast({
        title: "❌ Erro ao ativar",
        description: "Não foi possível ativar o rastreamento. Verifique as permissões de localização.",
        variant: "destructive",
      });
    },
  });

  // Mutation: Desativar compartilhamento
  const deactivateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("location_sharing_settings")
        .update({ is_sharing: false })
        .eq("user_id", user?.id);

      if (error) throw error;

      // Parar tracking
      locationTracker.stopTracking();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["location-settings"] });
      toast({
        title: "⏸️ Rastreamento pausado",
        description: "Seus guardiões não podem mais ver sua localização.",
      });
    },
  });

  // Verificar se já deu consentimento
  useEffect(() => {
    if (settings?.consent_given_at) {
      setHasConsented(true);
    }
  }, [settings]);

  // Auto-iniciar tracking se já está ativo
  useEffect(() => {
    if (settings?.is_sharing && user?.id) {
      locationTracker.startTracking(user.id);
    }
  }, [settings?.is_sharing, user?.id]);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // TELA 1: Consentimento (primeira vez)
  if (!hasConsented) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-8 h-8 text-primary" />
              <DialogTitle className="text-2xl">Rastreamento em Tempo Real</DialogTitle>
            </div>
            <DialogDescription className="text-base">
              Compartilhe sua localização com seus familiares para maior segurança
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* O que é */}
            <Alert>
              <CheckCircle className="h-5 w-5" />
              <AlertDescription className="text-base ml-2">
                <strong>O que é isso?</strong>
                <p className="mt-1">
                  Seus familiares poderão ver onde você está no mapa, em tempo real,
                  como funciona no Uber.
                </p>
              </AlertDescription>
            </Alert>

            {/* Quem pode ver */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-primary" />
                <strong className="text-base">Quem pode ver?</strong>
              </div>
              {guardians && guardians.length > 0 ? (
                <ul className="space-y-2">
                  {guardians.map((g: any) => (
                    <li key={g.id} className="flex items-center gap-2">
                      <Badge variant="outline">
                        {g.profiles?.full_name || g.profiles?.email}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        ({g.relationship_type || "guardião"})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Você ainda não tem guardiões cadastrados.
                </p>
              )}
            </div>

            {/* Privacidade */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-green-600" />
                <strong className="text-base">Sua Privacidade</strong>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  Você pode desligar quando quiser
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  Apenas pessoas que você autorizou
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  Seus dados são criptografados
                </li>
              </ul>
            </div>

            {/* Consentimento */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <Label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasConsented}
                  onChange={(e) => setHasConsented(e.target.checked)}
                  className="mt-1 w-5 h-5"
                />
                <span className="text-sm">
                  Eu entendi como funciona o rastreamento em tempo real e concordo
                  em compartilhar minha localização com meus guardiões.
                </span>
              </Label>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Agora Não
            </Button>
            <Button
              onClick={() => activateMutation.mutate()}
              disabled={!hasConsented || activateMutation.isPending}
              className="flex-1 bg-gradient-to-r from-primary to-purple-600"
            >
              {activateMutation.isPending ? "Ativando..." : "✅ Ativar Agora"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // TELA 2: Controle (já consentiu)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-8 h-8 text-primary" />
            <DialogTitle className="text-2xl">Compartilhamento de Localização</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Card */}
          <div
            className={`p-6 rounded-xl border-2 transition-all ${
              settings?.is_sharing
                ? "bg-green-50 border-green-300"
                : "bg-gray-50 border-gray-300"
            }`}
          >
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                {settings?.is_sharing ? (
                  <>
                    <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-2xl font-bold text-green-700">ATIVO</span>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 bg-gray-400 rounded-full" />
                    <span className="text-2xl font-bold text-gray-700">PAUSADO</span>
                  </>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                {settings?.is_sharing
                  ? "Seus familiares estão vendo sua localização agora"
                  : "Seus familiares não podem ver sua localização"}
              </p>

              {/* Toggle grande */}
              <Button
                onClick={() =>
                  settings?.is_sharing
                    ? deactivateMutation.mutate()
                    : activateMutation.mutate()
                }
                disabled={activateMutation.isPending || deactivateMutation.isPending}
                variant={settings?.is_sharing ? "destructive" : "default"}
                size="lg"
                className="w-full h-14 text-lg font-bold"
              >
                {settings?.is_sharing ? "🔴 DESLIGAR" : "🟢 LIGAR"}
              </Button>
            </div>
          </div>

          {/* Info: Última atualização */}
          {settings?.is_sharing && lastLocation && (
            <Alert>
              <Clock className="h-5 w-5" />
              <AlertDescription className="ml-2">
                <strong>Última atualização:</strong>{" "}
                {formatDistanceToNow(new Date(lastLocation.updated_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
                {lastLocation.battery_level && (
                  <>
                    {" • "}
                    <Battery className="inline w-4 h-4" />
                    {lastLocation.battery_level}%
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Quem está vendo */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-primary" />
              <strong>Quem pode ver:</strong>
            </div>
            {guardians && guardians.length > 0 ? (
              <ul className="space-y-2">
                {guardians.map((g: any) => (
                  <li key={g.id} className="flex items-center gap-2 text-sm">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        settings?.is_sharing ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    <span className="font-medium">
                      {g.profiles?.full_name || g.profiles?.email}
                    </span>
                    <span className="text-muted-foreground">
                      ({g.relationship_type || "guardião"})
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Você ainda não tem guardiões cadastrados.
              </p>
            )}
          </div>

          {/* Avisos */}
          {settings?.is_sharing && (
            <Alert variant="default">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="ml-2 text-sm">
                💡 <strong>Dica:</strong> Para economizar bateria, mantenha seu
                dispositivo conectado ao carregador enquanto o rastreamento estiver ativo.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
