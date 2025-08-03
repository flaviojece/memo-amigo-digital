import { useState } from "react";
import { Navigation } from "@/components/ui/navigation";
import { HomePage } from "@/components/home/HomePage";
import { PlaceholderScreen } from "@/components/placeholder/PlaceholderScreen";
import { Pill, Calendar, Users, Settings } from "lucide-react";

const Index = () => {
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
          <PlaceholderScreen
            title="Configurações"
            description="Personalize o Dr. Memo, gerencie sua conta e acesse funcionalidades extras como memórias e benefícios."
            icon={<Settings className="w-16 h-16 text-muted-foreground" />}
          />
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
