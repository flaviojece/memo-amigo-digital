import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSuggestions } from "@/hooks/useSuggestions";
import { HomePage } from "@/components/home/HomePage";
import Medications from "./Medications";
import Appointments from "./Appointments";
import Contacts from "./Contacts";
import Profile from "./Profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SuggestionCard } from "@/components/angel/SuggestionCard";
import { Bell, Shield } from "lucide-react";

export default function PatientHome() {
  const { user, isAngel, hasPatients } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const { suggestions, approveSuggestion, rejectSuggestion } = useSuggestions();

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');

  const renderContent = () => {
    switch (activeTab) {
      case "medications":
        return <Medications onTabChange={setActiveTab} />;
      case "appointments":
        return <Appointments onTabChange={setActiveTab} />;
      case "contacts":
        return <Contacts onTabChange={setActiveTab} />;
      case "profile":
        return <Profile onBackToMore={() => setActiveTab("home")} />;
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
              <Card className="border-2 border-accent bg-accent/5">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Bell className="w-6 h-6 text-accent animate-bounce" />
                    <div>
                      <CardTitle className="text-senior-xl">
                        Sugestões Pendentes
                      </CardTitle>
                      <CardDescription>
                        Você tem {pendingSuggestions.length} sugestão(ões) dos seus anjos aguardando aprovação
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setActiveTab('suggestions')}
                    size="lg"
                    className="w-full gap-2"
                  >
                    <Bell className="w-5 h-5" />
                    Revisar Agora
                  </Button>
                </CardContent>
              </Card>
            )}

            <HomePage onTabChange={setActiveTab} />
          </div>
        );
    }
  };

  return renderContent();
}
