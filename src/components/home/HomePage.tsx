import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WelcomeHeader } from "./WelcomeHeader";
import { QuickActionCard } from "./QuickActionCard";
import { EmergencyButton } from "./EmergencyButton";
import { FavoriteContactsModal } from "./FavoriteContactsModal";
import { LocationSharingModal } from "@/components/location/LocationSharingModal";
import { FloatingActionButton } from "./FloatingActionButton";
import { Pill, Calendar, Users, Clock, Stethoscope, Phone, Heart, MapPin, Radio } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
interface HomePageProps {
  onTabChange: (tab: string) => void;
}
export function HomePage({
  onTabChange
}: HomePageProps) {
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [showCallModal, setShowCallModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Buscar próximo medicamento: entre TODOS os ativos de hoje, o horário mais próximo
  // (antes pegava apenas o cadastrado mais recentemente, ignorando os horários)
  const {
    data: nextMedication
  } = useQuery({
    queryKey: ["next-medication", user?.id],
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("medications")
        .select("id, name, dosage, times")
        .eq("user_id", user?.id)
        .eq("active", true)
        .lte("start_date", nowIso)
        .or(`end_date.is.null,end_date.gte.${nowIso}`);
      if (error) throw error;

      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      let best: { med: any; time: string; isTomorrow: boolean } | null = null;
      for (const med of data || []) {
        const times: string[] = (Array.isArray(med.times) ? med.times : JSON.parse(String(med.times || '[]')))
          .filter((t: unknown): t is string => typeof t === 'string')
          .sort();
        if (times.length === 0) continue;
        const upcoming = times.find(t => t >= currentTime);
        const candidate = upcoming
          ? { med, time: upcoming, isTomorrow: false }
          : { med, time: times[0], isTomorrow: true };
        if (
          !best ||
          (best.isTomorrow && !candidate.isTomorrow) ||
          (best.isTomorrow === candidate.isTomorrow && candidate.time < best.time)
        ) {
          best = candidate;
        }
      }
      return best;
    },
    enabled: !!user,
    refetchInterval: 60_000, // recalcula a cada minuto para o card não ficar preso no passado
  });

  // Buscar próxima consulta
  const {
    data: nextAppointment
  } = useQuery({
    queryKey: ["next-appointment", user?.id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("appointments").select("*").eq("user_id", user?.id).gte("date", new Date().toISOString()).eq("status", "scheduled").order("date", {
        ascending: true
      }).limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user
  });

  // Buscar contatos favoritos
  const {
    data: favoriteContacts
  } = useQuery({
    queryKey: ["favorite-contacts", user?.id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("emergency_contacts").select("*").eq("user_id", user?.id).eq("is_favorite", true).order("name", {
        ascending: true
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Buscar contagem de guardiões
  const {
    data: guardiansCount
  } = useQuery({
    queryKey: ["guardians-count", user?.id],
    queryFn: async () => {
      const {
        count,
        error
      } = await supabase.from("guardian_relationships").select("*", {
        count: 'exact',
        head: true
      }).eq("patient_id", user?.id).eq("status", "active");
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user
  });

  // Formatar data da consulta
  const formatAppointmentDate = (date: string) => {
    const d = parseISO(date);
    return format(d, "EEEE, dd/MM 'às' HH:mm", {
      locale: ptBR
    });
  };
  return <div className="min-h-screen bg-background pb-28">
      <WelcomeHeader />
      
      <main className="p-4 space-y-6">
        {/* Cards de ação rápida */}
        <section className="space-y-4">
          <h2 className="text-senior-xl font-bold text-foreground mb-4">
            Resumo do Dia
          </h2>
          
          <div className="grid gap-4">
            <QuickActionCard title="Próximo Remédio" subtitle={nextMedication ? `${nextMedication.med.name} - ${nextMedication.isTomorrow ? 'amanhã às ' : ''}${nextMedication.time}` : "Nenhum medicamento com horário para hoje"} icon={<Pill className="text-primary" />} onClick={() => onTabChange("meds")} />

            <QuickActionCard title="Próxima Consulta" subtitle={nextAppointment ? `${nextAppointment.doctor_name} - ${nextAppointment.specialty}\n${formatAppointmentDate(nextAppointment.date)}` : "Nenhuma consulta agendada"} icon={<Stethoscope className="text-secondary" />} onClick={() => onTabChange("appointments")} />

            <QuickActionCard title="Contatos Favoritos" subtitle={`${favoriteContacts?.length || 0} contatos favoritos`} icon={<Heart className="text-accent" />} onClick={() => setShowCallModal(true)} variant="accent" />
          </div>
        </section>

        {/* Ações rápidas */}
        <section className="space-y-4">
          <h2 className="text-senior-xl font-bold text-foreground mb-4 pt-[8px] pb-[8px]">
            Ações Rápidas
          </h2>
          
          <div className="grid grid-cols-2 gap-3 auto-rows-fr">
            <QuickActionCard title="Remédios" icon={<Pill className="text-primary" />} onClick={() => onTabChange("meds")} />

            <QuickActionCard title="Consultas" icon={<Calendar className="text-secondary" />} onClick={() => onTabChange("appointments")} />

            <QuickActionCard title="Ligar" icon={<Phone className="text-accent" />} onClick={() => setShowCallModal(true)} />

            <QuickActionCard title="Agenda" icon={<Clock className="text-muted-foreground" />} onClick={() => onTabChange("medication-schedule")} />
          </div>
        </section>

        {/* Acesso à Localização dos Pacientes */}
        {guardiansCount !== undefined && guardiansCount === 0 && <section className="space-y-4">
            <QuickActionCard title="Adicionar um Anjo" subtitle="Convide um familiar ou cuidador para acompanhar você" icon={<MapPin className="text-primary" />} onClick={() => navigate("/location-sharing-settings")} />
          </section>}

        {/* Botão de Compartilhar Localização */}
        <section>
          <button onClick={() => setShowLocationModal(true)} className="w-full min-h-[70px] px-4 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 
                       text-white hover:from-blue-600 hover:to-blue-700 
                       transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                       shadow-md hover:shadow-lg flex items-center justify-center gap-4">
            <Radio className="w-6 h-6" />
            <span className="font-semibold text-lg">Compartilhar Minha Localização</span>
            <MapPin className="w-6 h-6" />
          </button>
        </section>

        {/* Botão de Emergência */}
        <section className="space-y-4">
          <h2 className="text-senior-xl font-bold text-foreground mb-4 pt-[8px] pb-[8px]">
            Precisa de Ajuda?
          </h2>
          
          <EmergencyButton />
        </section>

        {/* Status e informações */}
        <section className="bg-card p-4 rounded-memo border-2 border-border">
          <div className="text-center space-y-2">
            <p className="text-senior-sm text-muted-foreground">
              {navigator.onLine ? "Conectado" : "Sem conexão — dados podem estar desatualizados"}
            </p>
            <p className="text-senior-sm text-muted-foreground">
              Familiares conectados: {guardiansCount || 0} anjos 👨‍👩‍👧‍👦
            </p>
          </div>
        </section>
      </main>

      <FavoriteContactsModal open={showCallModal} onOpenChange={setShowCallModal} onNavigateToContacts={() => onTabChange("contacts")} />

      {/* Modal de compartilhamento de localização */}
      <LocationSharingModal open={showLocationModal} onOpenChange={setShowLocationModal} />

      <FloatingActionButton onTabChange={onTabChange} />
    </div>;
}