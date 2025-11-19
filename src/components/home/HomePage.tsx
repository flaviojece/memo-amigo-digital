import { useState } from "react";
import { WelcomeHeader } from "./WelcomeHeader";
import { QuickActionCard } from "./QuickActionCard";
import { EmergencyButton } from "./EmergencyButton";
import { FavoriteContactsModal } from "./FavoriteContactsModal";
import { LocationSharingModal } from "@/components/location/LocationSharingModal";
import { 
  Pill, 
  Calendar, 
  Users, 
  Clock,
  Stethoscope,
  Phone,
  Heart,
  MapPin,
  Radio
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HomePageProps {
  onTabChange: (tab: string) => void;
}

export function HomePage({ onTabChange }: HomePageProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showCallModal, setShowCallModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Buscar próximo medicamento
  const { data: nextMedication } = useQuery({
    queryKey: ["next-medication", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medications")
        .select("*")
        .eq("user_id", user?.id)
        .eq("active", true)
        .lte("start_date", new Date().toISOString())
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user
  });

  // Buscar próxima consulta
  const { data: nextAppointment } = useQuery({
    queryKey: ["next-appointment", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user?.id)
        .gte("date", new Date().toISOString())
        .eq("status", "scheduled")
        .order("date", { ascending: true })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user
  });

  // Buscar contatos favoritos
  const { data: favoriteContacts } = useQuery({
    queryKey: ["favorite-contacts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_favorite", true)
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Buscar contagem de guardiões
  const { data: guardiansCount } = useQuery({
    queryKey: ["guardians-count", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("guardian_relationships")
        .select("*", { count: 'exact', head: true })
        .eq("patient_id", user?.id)
        .eq("status", "active");
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user
  });

  // Calcular próximo horário do medicamento
  const getNextMedicationTime = (med: any) => {
    if (!med) return null;
    const times = Array.isArray(med.times) ? med.times : JSON.parse(med.times || '[]');
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const nextTime = times.find((t: string) => t > currentTime);
    return nextTime || times[0];
  };

  // Formatar data da consulta
  const formatAppointmentDate = (date: string) => {
    const d = parseISO(date);
    return format(d, "EEEE, dd/MM 'às' HH:mm", { locale: ptBR });
  };

  return (
    <div className="min-h-screen bg-background pb-36">
      <WelcomeHeader />
      
      <main className="p-4 space-y-6">
        {/* Cards de ação rápida */}
        <section className="space-y-4">
          <h2 className="text-senior-xl font-bold text-foreground mb-4">
            Resumo do Dia
          </h2>
          
          <div className="grid gap-4">
            <QuickActionCard
              title="Próximo Remédio"
              subtitle={
                nextMedication
                  ? `${nextMedication.name} - ${getNextMedicationTime(nextMedication) || 'Sem horários definidos'}`
                  : "Nenhum medicamento cadastrado"
              }
              icon={<Pill className="w-8 h-8 text-primary" />}
              onClick={() => onTabChange("meds")}
            />

            <QuickActionCard
              title="Próxima Consulta"
              subtitle={
                nextAppointment
                  ? `${nextAppointment.doctor_name} - ${nextAppointment.specialty}\n${formatAppointmentDate(nextAppointment.date)}`
                  : "Nenhuma consulta agendada"
              }
              icon={<Stethoscope className="w-8 h-8 text-secondary" />}
              onClick={() => onTabChange("appointments")}
            />

            <QuickActionCard
              title="Contatos Favoritos"
              subtitle={`${favoriteContacts?.length || 0} contatos favoritos`}
              icon={<Heart className="w-8 h-8 text-accent" />}
              onClick={() => setShowCallModal(true)}
              variant="accent"
            />
          </div>
        </section>

        {/* Ações rápidas */}
        <section className="space-y-4">
          <h2 className="text-senior-xl font-bold text-foreground mb-4">
            Ações Rápidas
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <QuickActionCard
              title="Remédios"
              icon={<Pill className="w-6 h-6 text-primary" />}
              onClick={() => onTabChange("meds")}
            />

            <QuickActionCard
              title="Consultas"
              icon={<Calendar className="w-6 h-6 text-secondary" />}
              onClick={() => onTabChange("appointments")}
            />

            <QuickActionCard
              title="Ligar"
              icon={<Phone className="w-6 h-6 text-accent" />}
              onClick={() => setShowCallModal(true)}
            />

            <QuickActionCard
              title="Horário das Medicações"
              icon={<Clock className="w-6 h-6 text-muted-foreground" />}
              onClick={() => onTabChange("meds")}
            />
          </div>
        </section>

        {/* Botão de Compartilhar Localização */}
        <section>
          <button
            onClick={() => setShowLocationModal(true)}
            className="w-full p-4 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 
                       text-white hover:from-blue-600 hover:to-blue-700 
                       transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                       shadow-md hover:shadow-lg flex items-center justify-center gap-3"
          >
            <Radio className="w-5 h-5" />
            <span className="font-semibold text-base">Compartilhar Minha Localização</span>
            <MapPin className="w-5 h-5" />
          </button>
        </section>

        {/* Botão de Emergência */}
        <section className="space-y-4">
          <h2 className="text-senior-xl font-bold text-foreground mb-4">
            Precisa de Ajuda?
          </h2>
          
          <EmergencyButton />
        </section>

        {/* Status e informações */}
        <section className="bg-card p-4 rounded-memo border-2 border-border">
          <div className="text-center space-y-2">
            <p className="text-senior-sm text-muted-foreground">
              Última sincronização: Agora
            </p>
            <p className="text-senior-sm text-muted-foreground">
              Familiares conectados: {guardiansCount || 0} anjos 👨‍👩‍👧‍👦
            </p>
          </div>
        </section>
      </main>

      <FavoriteContactsModal 
        open={showCallModal} 
        onOpenChange={setShowCallModal} 
      />

      {/* Modal de compartilhamento de localização */}
      <LocationSharingModal
        open={showLocationModal}
        onOpenChange={setShowLocationModal}
      />
    </div>
  );
}