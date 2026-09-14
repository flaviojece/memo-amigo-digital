import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSuggestions } from "@/hooks/useSuggestions";
import { HomePage } from "@/components/home/HomePage";
import { MedicationScheduleView } from "@/components/medications/MedicationScheduleView";
import Medications from "./Medications";
import Appointments from "./Appointments";
import Contacts from "./Contacts";
import Profile from "./Profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SuggestionCard } from "@/components/angel/SuggestionCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Navigation } from "@/components/ui/navigation";
import { InstallPrompt } from "@/components/mobile/InstallPrompt";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";
import { GuardianManager } from "@/components/guardians/GuardianManager";
import { PatientsLocationList } from "@/components/location/PatientsLocationList";
import { BackToHomeButton } from "@/components/ui/BackToHomeButton";
import { Bell, Shield, Lightbulb, LogOut, MapPin, UserCircle } from "lucide-react";

/**
 * Abas válidas da área do paciente. Cada aba é um segmento de URL
 * (/patient/meds, /patient/more, ...) para que o botão "voltar" do Android
 * e do navegador voltem para a tela anterior em vez de sair do app.
 */
const VALID_TABS = [
  "home",
  "meds",
  "medication-schedule",
  "appointments",
  "contacts",
  "location",
  "profile",
  "suggestions",
  "more",
] as const;

type PatientTab = (typeof VALID_TABS)[number];

export default function PatientHome() {
  const { isAngel, hasPatients, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();

  const activeTab: PatientTab = VALID_TABS.includes(tab as PatientTab)
    ? (tab as PatientTab)
    : "home";

  const setActiveTab = (next: string) => {
    navigate(next === "home" ? "/patient" : `/patient/${next}`);
  };

  const { suggestions, approveSuggestion, rejectSuggestion } = useSuggestions();

  // Show loading screen while auth is initializing
  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');

  const renderContent = () => {
    switch (activeTab) {
      case "meds":
        return <Medications onTabChange={setActiveTab} />;
      case "medication-schedule":
        return <MedicationScheduleView onBackToHome={() => setActiveTab("home")} />;
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
          <div className="flex flex-col min-h-[60vh] p-6 pb-36 space-y-6">
            <BackToHomeButton onBackToHome={() => setActiveTab("home")} />

            <div className="space-y-2">
              <h2 className="text-senior-2xl font-display text-foreground">Configurações</h2>
              <p className="text-muted-foreground text-senior-sm">
                Ajuste seu perfil, seus anjos e os lembretes do Dr. Memo
              </p>
            </div>

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

            {isAngel && hasPatients && (
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab("location")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-senior-lg">
                    <MapPin className="w-6 h-6 text-primary" />
                    Localização dos Pacientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-senior-sm">
                    Acompanhe em tempo real quem está sob seus cuidados
                  </p>
                </CardContent>
              </Card>
            )}

            <NotificationSettings />

            <GuardianManager />

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
      case "suggestions":
        return (
          <div className="min-h-screen bg-background pattern-bg pb-24">
            <div className="max-w-4xl mx-auto p-4 space-y-4">
              <h1 className="text-senior-3xl font-bold text-foreground mb-6">
                🔔 Sugestões dos seus Anjos
              </h1>
              
              {pendingSuggestions.length === 0 ? (
                <Card className="border-2">
                  <CardContent className="text-center py-12">
                    <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-senior-base text-muted-foreground">
                      Nenhuma sugestão pendente
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pendingSuggestions.map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      isPatientView={true}
                      onApprove={approveSuggestion}
                      onReject={rejectSuggestion}
                    />
                  ))}
                </div>
              )}

              <h2 className="text-senior-xl font-bold mt-8 mb-4">Histórico</h2>
              {suggestions.filter(s => s.status !== 'pending').map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  isPatientView={true}
                />
              ))}
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            {/* Angel Dashboard Access */}
            {isAngel && hasPatients && (
              <Card className="bg-gradient-to-r from-secondary to-secondary/80 text-white border-none shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Shield className="w-8 h-8" />
                    <div>
                      <CardTitle className="text-senior-xl">Você é um Anjo 🛡️</CardTitle>
                      <CardDescription className="text-white/90">
                        Gerenciar cuidados dos seus pacientes
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => {
                      localStorage.setItem('interface-preference', '/angel');
                      navigate('/angel');
                    }}
                    variant="secondary"
                    size="lg"
                    className="w-full text-senior-base"
                  >
                    Ir para Painel do Anjo
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Pending Suggestions Alert */}
            {pendingSuggestions.length > 0 && (
              <Card className="bg-accent/50 border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-6 h-6 text-primary" />
                      <CardTitle className="text-senior-xl">
                        Sugestões dos seus Anjos
                      </CardTitle>
                      <Badge variant="secondary" className="text-senior-sm">
                        {pendingSuggestions.length}
                      </Badge>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab("suggestions")}
                    >
                      Ver todas
                    </Button>
                  </div>
                  <CardDescription>
                    Revise as sugestões enviadas pelos seus cuidadores
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendingSuggestions.slice(0, 2).map(suggestion => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      isPatientView={true}
                      onApprove={approveSuggestion}
                      onReject={rejectSuggestion}
                    />
                  ))}
                  {pendingSuggestions.length > 2 && (
                    <p className="text-senior-sm text-muted-foreground text-center">
                      E mais {pendingSuggestions.length - 2} sugestões...
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <HomePage onTabChange={setActiveTab} />
          </div>
        );
    }
  };

  return (
    <div className="bg-background min-h-screen pb-32">
      {renderContent()}
      <InstallPrompt />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
