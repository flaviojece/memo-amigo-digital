import { Pill, Clock, Calendar as CalendarIcon, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { translateFrequency } from "@/lib/frequencyTranslations";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface Medication {
  id: string;
  name: string;
  dosage?: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  times: string[];
  notes?: string;
  active: boolean;
}

interface MedicationListProps {
  medications: Medication[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onRefetch: () => void;
}

export function MedicationList({ medications, isLoading, onEdit, onRefetch }: MedicationListProps) {
  const { toast } = useToast();

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir o medicamento "${name}"?`)) return;

    const { error } = await supabase
      .from("medications")
      .update({ active: false })
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o medicamento.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Medicamento excluído com sucesso.",
    });
    onRefetch();
  };

  if (isLoading) {
    return <LoadingSpinner message="Carregando medicamentos..." />;
  }

  if (!medications || medications.length === 0) {
    return (
      <Card className="card-memo">
        <CardContent className="text-center py-12">
          <Pill className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-senior-lg text-muted-foreground mb-2">
            Nenhum medicamento cadastrado
          </p>
          <p className="text-senior-sm text-muted-foreground">
            Clique em "Adicionar" para cadastrar seu primeiro medicamento
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {medications.map((medication) => (
        <Card key={medication.id} className="card-memo">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-senior flex-shrink-0">
                <Pill className="w-8 h-8 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-senior-xl font-bold text-foreground mb-2">
                  {medication.name}
                  {medication.dosage && (
                    <span className="text-senior-base text-muted-foreground ml-2">
                      ({medication.dosage})
                    </span>
                  )}
                </h3>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-senior-base text-muted-foreground">
                    <Clock className="w-5 h-5" />
                    <span>{translateFrequency(medication.frequency)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-senior-base text-muted-foreground">
                    <CalendarIcon className="w-5 h-5" />
                    <span>
                      Início: {format(new Date(medication.start_date), "dd/MM/yyyy", { locale: ptBR })}
                      {medication.end_date && (
                        <> - Fim: {format(new Date(medication.end_date), "dd/MM/yyyy", { locale: ptBR })}</>
                      )}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {medication.times.map((time, index) => (
                      <Badge key={index} variant="outline" className="text-senior-sm">
                        {time}
                      </Badge>
                    ))}
                  </div>

                  {medication.notes && (
                    <p className="text-senior-sm text-muted-foreground mt-3 italic">
                      {medication.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEdit(medication.id)}
                  aria-label="Editar medicamento"
                >
                  <Edit className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDelete(medication.id, medication.name)}
                  aria-label="Excluir medicamento"
                >
                  <Trash2 className="w-5 h-5 text-destructive" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
