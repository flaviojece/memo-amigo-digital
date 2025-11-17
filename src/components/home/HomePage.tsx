import { WelcomeHeader } from "./WelcomeHeader";
import { QuickActionCard } from "./QuickActionCard";
import { EmergencyButton } from "./EmergencyButton";
import { 
  Pill, 
  Calendar, 
  Users, 
  Clock,
  Stethoscope,
  Phone,
  Heart
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function HomePage() {
  const { toast } = useToast();

  const handleCardClick = (action: string) => {
    toast({
      title: `${action} selecionado`,
      description: "Esta funcionalidade será implementada em breve!",
    });
  };

  // Dados mockados para demonstração
  const nextMedicine = {
    name: "Losartana 50mg",
    time: "14:30",
    remaining: "em 2 horas"
  };

  const nextAppointment = {
    doctor: "Dr. Silva",
    specialty: "Cardiologista", 
    date: "Quinta-feira, 15:00"
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
              subtitle={`${nextMedicine.name} - ${nextMedicine.time} (${nextMedicine.remaining})`}
              icon={<Pill className="w-8 h-8 text-primary" />}
              onClick={() => handleCardClick("Próximo Remédio")}
            />

            <QuickActionCard
              title="Próxima Consulta"
              subtitle={`${nextAppointment.doctor} - ${nextAppointment.specialty}\n${nextAppointment.date}`}
              icon={<Stethoscope className="w-8 h-8 text-secondary" />}
              onClick={() => handleCardClick("Próxima Consulta")}
            />

            <QuickActionCard
              title="Contatos Favoritos"
              subtitle="Família e médicos sempre à mão"
              icon={<Heart className="w-8 h-8 text-accent" />}
              onClick={() => handleCardClick("Contatos Favoritos")}
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
              onClick={() => handleCardClick("Remédios")}
            />

            <QuickActionCard
              title="Consultas"
              icon={<Calendar className="w-6 h-6 text-secondary" />}
              onClick={() => handleCardClick("Consultas")}
            />

            <QuickActionCard
              title="Ligar"
              icon={<Phone className="w-6 h-6 text-accent" />}
              onClick={() => handleCardClick("Ligar")}
            />

            <QuickActionCard
              title="Horários"
              icon={<Clock className="w-6 h-6 text-muted-foreground" />}
              onClick={() => handleCardClick("Horários")}
            />
          </div>
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
              Familiares conectados: 2 anjos 👨‍👩‍👧‍👦
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}