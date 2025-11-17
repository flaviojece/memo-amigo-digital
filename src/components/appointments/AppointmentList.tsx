import { Calendar as CalendarIcon, MapPin, Phone, Edit, Trash2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Appointment {
  id: string;
  doctor_name: string;
  specialty: string;
  date: string;
  location?: string;
  phone?: string;
  notes?: string;
  status: string;
}

interface AppointmentListProps {
  appointments: Appointment[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onRefetch: () => void;
}

const statusConfig = {
  scheduled: { label: "Agendada", variant: "default" as const },
  completed: { label: "Realizada", variant: "secondary" as const },
  cancelled: { label: "Cancelada", variant: "destructive" as const }
};

export function AppointmentList({ appointments, isLoading, onEdit, onRefetch }: AppointmentListProps) {
  const { toast } = useToast();

  const handleDelete = async (id: string, doctorName: string) => {
    if (!confirm(`Deseja realmente excluir a consulta com ${doctorName}?`)) return;

    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a consulta.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Consulta excluída com sucesso.",
    });
    onRefetch();
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-senior-base text-muted-foreground">Carregando consultas...</p>
      </div>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <Card className="card-memo">
        <CardContent className="text-center py-12">
          <CalendarIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-senior-lg text-muted-foreground mb-2">
            Nenhuma consulta agendada
          </p>
          <p className="text-senior-sm text-muted-foreground">
            Clique em "Agendar" para cadastrar sua primeira consulta
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <Card key={appointment.id} className="card-memo">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-senior flex-shrink-0">
                <CalendarIcon className="w-8 h-8 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-senior-xl font-bold text-foreground">
                    Dr(a). {appointment.doctor_name}
                  </h3>
                  <Badge variant={statusConfig[appointment.status as keyof typeof statusConfig].variant}>
                    {statusConfig[appointment.status as keyof typeof statusConfig].label}
                  </Badge>
                </div>

                <p className="text-senior-base text-muted-foreground mb-3">
                  {appointment.specialty}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-senior-base text-foreground">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <span>
                      {format(new Date(appointment.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>

                  {appointment.location && (
                    <div className="flex items-center gap-2 text-senior-base text-muted-foreground">
                      <MapPin className="w-5 h-5" />
                      <span>{appointment.location}</span>
                    </div>
                  )}

                  {appointment.phone && (
                    <div className="flex items-center gap-2 text-senior-base text-muted-foreground">
                      <Phone className="w-5 h-5" />
                      <a href={`tel:${appointment.phone}`} className="hover:text-primary">
                        {appointment.phone}
                      </a>
                    </div>
                  )}

                  {appointment.notes && (
                    <p className="text-senior-sm text-muted-foreground mt-3 italic">
                      {appointment.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEdit(appointment.id)}
                  aria-label="Editar consulta"
                >
                  <Edit className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDelete(appointment.id, appointment.doctor_name)}
                  aria-label="Excluir consulta"
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
