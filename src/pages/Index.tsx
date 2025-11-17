import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/ui/navigation";
import { HomePage } from "@/components/home/HomePage";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstallPrompt } from "@/components/mobile/InstallPrompt";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";
import Medications from "./Medications";
import Appointments from "./Appointments";
import Contacts from "./Contacts";

const Index = () => {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("home");

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HomePage />;
      case "meds":
        return <Medications />;
      case "appointments":
        return <Appointments />;
      case "contacts":
        return <Contacts />;
      case "more":
        return (
          <div className="flex flex-col min-h-[60vh] p-6 space-y-6">
            <h2 className="text-senior-2xl font-display text-foreground">Configurações</h2>
            
            {/* Notificações */}
            <NotificationSettings />
            
            {/* Botão de sair */}
            <Button
              onClick={signOut}
              variant="destructive"
              size="lg"
              className="min-h-[60px] text-senior-lg"
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
      <InstallPrompt />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
