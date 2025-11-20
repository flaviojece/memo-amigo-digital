import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/ui/navigation";
import { HomePage } from "@/components/home/HomePage";
import { PatientsLocationList } from "@/components/location/PatientsLocationList";
import { LogOut, MapPin, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InstallPrompt } from "@/components/mobile/InstallPrompt";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";
import { GuardianManager } from "@/components/guardians/GuardianManager";
import { BackToHomeButton } from "@/components/ui/BackToHomeButton";
import Medications from "./Medications";
import Appointments from "./Appointments";
import Contacts from "./Contacts";
import Profile from "./Profile";

const Index = () => {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("home");

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HomePage onTabChange={setActiveTab} />;
      case "meds":
        return <Medications onTabChange={setActiveTab} />;
      case "appointments":
        return <Appointments onTabChange={setActiveTab} />;
      case "contacts":
        return <Contacts onTabChange={setActiveTab} />;
      case "location":
        return <PatientsLocationList onBackToMore={() => setActiveTab("more")} />;
      case "profile":
        return <Profile onBackToMore={() => setActiveTab("more")} />;
      case "more":
        return (
          <div className="flex flex-col min-h-[60vh] p-6 pb-32 space-y-6">
            <BackToHomeButton onBackToHome={() => setActiveTab("home")} />
            
            <div className="space-y-2">
              <h2 className="text-senior-2xl font-display text-foreground">Configurações</h2>
              <p className="text-muted-foreground text-senior-sm">
                Acesse as opções de configuração através desta aba "Mais" no menu inferior
              </p>
            </div>
            
            {/* Meu Perfil */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab("profile")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-senior-lg">
                  <UserCircle className="w-6 h-6 text-primary" />
                  Meu Perfil
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-senior-sm">
                  Visualize e edite suas informações pessoais
                </p>
              </CardContent>
            </Card>
            
            {/* Localização dos Pacientes */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab("location")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-senior-lg">
                  <MapPin className="w-6 h-6 text-primary" />
                  Localização dos Pacientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-senior-sm">
                  Acompanhe a localização em tempo real dos pacientes sob seus cuidados
                </p>
              </CardContent>
            </Card>
            
            {/* Notificações */}
            <NotificationSettings />
            
            {/* Gestão de Cuidadores */}
            <GuardianManager />
            
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
        return <HomePage onTabChange={setActiveTab} />;
    }
  };

  return (
    <div className="bg-background min-h-screen pattern-checkered pb-24">
      {renderContent()}
      <InstallPrompt />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
