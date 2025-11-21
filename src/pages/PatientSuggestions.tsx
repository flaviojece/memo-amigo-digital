import { Shield, ArrowLeft } from "lucide-react";
import { useSuggestions } from "@/hooks/useSuggestions";
import { SuggestionCard } from "@/components/angel/SuggestionCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function PatientSuggestions() {
  const navigate = useNavigate();
  const { suggestions, approveSuggestion, rejectSuggestion, loading } = useSuggestions();
  
  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const respondedSuggestions = suggestions.filter(s => s.status !== 'pending');
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground text-lg">Carregando sugestões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/patient')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Sugestões dos seus Anjos</h1>
          <p className="text-muted-foreground mt-2">
            Revise e responda às sugestões enviadas pelos seus cuidadores
          </p>
        </div>
        
        {pendingSuggestions.length === 0 && respondedSuggestions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma sugestão</h3>
              <p className="text-muted-foreground">
                Você não tem sugestões no momento
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {pendingSuggestions.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-foreground">
                  Pendentes ({pendingSuggestions.length})
                </h2>
                <div className="space-y-4">
                  {pendingSuggestions.map(suggestion => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      isPatientView={true}
                      onApprove={approveSuggestion}
                      onReject={rejectSuggestion}
                    />
                  ))}
                </div>
              </div>
            )}

            {respondedSuggestions.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-foreground">
                  Histórico ({respondedSuggestions.length})
                </h2>
                <div className="space-y-4">
                  {respondedSuggestions.map(suggestion => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      isPatientView={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
