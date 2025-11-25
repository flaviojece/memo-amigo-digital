import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackToHomeButton } from "@/components/ui/BackToHomeButton";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Clock, Pill } from "lucide-react";
import { translateFrequency } from "@/lib/frequencyTranslations";

interface MedicationScheduleViewProps {
  onBackToHome: () => void;
}

export function MedicationScheduleView({ onBackToHome }: MedicationScheduleViewProps) {
  const { user } = useAuth();

  const { data: medications, isLoading } = useQuery({
    queryKey: ["medications-schedule", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medications")
        .select("*")
        .eq("user_id", user?.id)
        .eq("active", true)
        .order("name", { ascending: true });

      if (error) throw error;

      return data?.map(med => ({
        ...med,
        times: Array.isArray(med.times) ? med.times : JSON.parse(String(med.times || '[]'))
      }));
    },
    enabled: !!user
  });

  return (
    <div className="min-h-screen bg-background pattern-bg pb-24">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <BackToHomeButton onBackToHome={onBackToHome} />

        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-8 h-8 text-primary" />
          <h1 className="text-senior-3xl font-bold text-foreground">
            ⏰ Horários das Medicações
          </h1>
        </div>

        {isLoading ? (
          <LoadingSpinner message="Carregando medicações..." />
        ) : medications && medications.length > 0 ? (
          <div className="space-y-4">
            {medications.map((medication) => (
              <Card key={medication.id} className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Pill className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <CardTitle className="text-senior-xl mb-1">
                        {medication.name}
                      </CardTitle>
                      {medication.dosage && (
                        <p className="text-senior-base text-muted-foreground">
                          Dosagem: {medication.dosage}
                        </p>
                      )}
                      <p className="text-senior-sm text-muted-foreground">
                        {translateFrequency(medication.frequency)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <span className="text-senior-base font-semibold">Horários:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {medication.times.map((time: string, index: number) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-senior-lg px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20"
                        >
                          {time}
                        </Badge>
                      ))}
                    </div>
                    {medication.notes && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                        <p className="text-senior-sm text-muted-foreground">
                          📝 {medication.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-2">
            <CardContent className="text-center py-12">
              <Pill className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-senior-xl text-muted-foreground">
                Nenhuma medicação cadastrada
              </p>
              <p className="text-senior-base text-muted-foreground mt-2">
                Volte ao início e cadastre seus medicamentos
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
