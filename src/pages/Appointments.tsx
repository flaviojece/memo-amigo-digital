import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppointmentList } from "@/components/appointments/AppointmentList";
import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import { PatientSelector } from "@/components/guardians/PatientSelector";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BackToHomeButton } from "@/components/ui/BackToHomeButton";

interface AppointmentsProps {
  onTabChange?: (tab: string) => void;
}

export default function Appointments({ onTabChange }: AppointmentsProps) {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
  const effectiveUserId = selectedPatientId || user?.id;

  const { data: appointments, isLoading, refetch } = useQuery({
    queryKey: ["appointments", effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", effectiveUserId)
        .order("date", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!effectiveUserId
  });

  const handleEdit = (id: string) => {
    setEditingId(id);
    setIsFormOpen(true);
  };

  const handleSuccess = () => {
    setIsFormOpen(false);
    setEditingId(null);
    refetch();
  };

  return (
    <div className="min-h-screen bg-background pattern-bg pb-6">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {onTabChange && (
          <BackToHomeButton onBackToHome={() => onTabChange("home")} />
        )}
        
        <PatientSelector
          selectedPatientId={selectedPatientId}
          onSelectPatient={setSelectedPatientId}
        />
        
        <div className="flex flex-col gap-3 mb-6 min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between">
          <h1 className="min-w-0 text-senior-2xl font-bold text-foreground sm:text-senior-3xl">
            📅 {selectedPatientId ? 'Consultas' : 'Minhas Consultas'}
          </h1>
          <Button
            onClick={() => setIsFormOpen(true)}
            size="lg"
            className="w-full text-senior-base min-[430px]:w-auto"
          >
            <Plus className="w-6 h-6 mr-2" />
            Agendar
          </Button>
        </div>

        <AppointmentList
          appointments={appointments || []}
          isLoading={isLoading}
          onEdit={handleEdit}
          onRefetch={refetch}
        />

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-senior-xl">
                {editingId ? "Editar Consulta" : "Nova Consulta"}
              </DialogTitle>
            </DialogHeader>
            <AppointmentForm
              appointmentId={editingId}
              onSuccess={handleSuccess}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingId(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
