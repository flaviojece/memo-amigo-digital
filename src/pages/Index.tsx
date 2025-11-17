import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/ui/navigation";
import { HomePage } from "@/components/home/HomePage";
import { PlaceholderScreen } from "@/components/placeholder/PlaceholderScreen";
import { Pill, Calendar, Users, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("home");

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HomePage />;
      case "meds":
        return (
          <PlaceholderScreen
            title="Meus Remédios"
            description="Aqui você poderá gerenciar todos os seus medicamentos, definir horários e receber lembretes personalizados."
            icon={<Pill className="w-16 h-16 text-primary" />}
          />
        );
      case "appointments":
        return (
          <PlaceholderScreen
            title="Minhas Consultas"
            description="Organize sua agenda médica, agende consultas e receba lembretes automáticos."
            icon={<Calendar className="w-16 h-16 text-secondary" />}
          />
        );
      case "contacts":
        return (
          <PlaceholderScreen
            title="Meus Contatos"
            description="Mantenha os contatos da família, médicos e emergência sempre organizados e acessíveis."
            icon={<Users className="w-16 h-16 text-accent" />}
          />
        );
      case "more":
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
            <h2 className="text-senior-2xl font-display text-foreground mb-8">Configurações</h2>
            <Button
              onClick={signOut}
              variant="destructive"
              size="lg"
              className="min-h-[60px] min-w-[200px] text-senior-lg"
            >
              <LogOut className="mr-2" size={24} />
              Sair
            </Button>
          </div>
        );
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="bg-background min-h-screen pattern-checkered">
      {renderContent()}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
