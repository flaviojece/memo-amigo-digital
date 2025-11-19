import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
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
import { MapPin, Shield, Users, Clock, Battery, CheckCircle, AlertCircle, Settings, ChevronDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
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
  const navigate = useNavigate();
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

  // TELA 2: Controle com Botão Dividido (já consentiu)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Compartilhar Localização</DialogTitle>
        </DialogHeader>

        {/* BOTÃO DIVIDIDO */}
        <div className="grid grid-cols-2 gap-0 rounded-lg overflow-hidden border-2 border-border">
          
          {/* LADO ESQUERDO: Toggle */}
          <button
            onClick={() => settings?.is_sharing ? deactivateMutation.mutate() : activateMutation.mutate()}
            disabled={activateMutation.isPending || deactivateMutation.isPending}
            className={`p-6 flex flex-col items-center justify-center gap-3 transition-all min-h-[120px] ${
              settings?.is_sharing 
                ? 'bg-gradient-to-br from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700' 
                : 'bg-gradient-to-br from-gray-400 to-gray-500 text-white hover:from-gray-500 hover:to-gray-600'
            }`}
          >
            <div className="flex items-center gap-2">
              {settings?.is_sharing && (
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              )}
              <span className="text-xl font-bold">
                {settings?.is_sharing ? 'ATIVO' : 'PAUSADO'}
              </span>
            </div>
            
            {/* Switch Visual */}
            <Switch checked={settings?.is_sharing} className="pointer-events-none" />
            
            <span className="text-xs opacity-90">
              {activateMutation.isPending || deactivateMutation.isPending 
                ? 'Processando...' 
                : settings?.is_sharing ? 'Toque para desligar' : 'Toque para ligar'}
            </span>
          </button>

          {/* LADO DIREITO: Configurações */}
          <button
            onClick={() => {
              onOpenChange(false);
              navigate('/location-sharing-settings');
            }}
            className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white flex flex-col items-center justify-center gap-2 hover:from-blue-600 hover:to-blue-700 transition-all min-h-[120px]"
          >
            <Settings className="w-8 h-8" />
            <span className="font-semibold">Configurações</span>
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
