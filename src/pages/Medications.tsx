import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MedicationList } from "@/components/medications/MedicationList";
import { MedicationForm } from "@/components/medications/MedicationForm";
import { PatientSelector } from "@/components/guardians/PatientSelector";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Medications() {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
  const effectiveUserId = selectedPatientId || user?.id;

  const { data: medications, isLoading, refetch } = useQuery({
    queryKey: ["medications", effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return [];
      const { data, error } = await supabase
        .from("medications")
        .select("*")
        .eq("user_id", effectiveUserId)
        .eq("active", true)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return (data || []).map(med => ({
        ...med,
        times: Array.isArray(med.times) ? med.times : JSON.parse(med.times as string)
      }));
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
    <div className="min-h-screen bg-background pattern-bg pb-24">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <PatientSelector 
          selectedPatientId={selectedPatientId}
          onSelectPatient={setSelectedPatientId}
        />
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-senior-3xl font-bold text-foreground">
            💊 {selectedPatientId ? 'Medicamentos' : 'Meus Medicamentos'}
          </h1>
          {!selectedPatientId && (
            <Button
              onClick={() => setIsFormOpen(true)}
              size="lg"
              className="text-senior-base"
            >
              <Plus className="w-6 h-6 mr-2" />
              Adicionar
            </Button>
          )}
        </div>

        <MedicationList
          medications={medications || []}
          isLoading={isLoading}
          onEdit={handleEdit}
          onRefetch={refetch}
        />

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-senior-xl">
                {editingId ? "Editar Medicamento" : "Novo Medicamento"}
              </DialogTitle>
            </DialogHeader>
            <MedicationForm
              medicationId={editingId}
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
