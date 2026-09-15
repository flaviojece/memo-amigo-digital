import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MedicationList } from "@/components/medications/MedicationList";
import { MedicationForm } from "@/components/medications/MedicationForm";
import {
  PrescriptionScanner,
  type MedicamentoExtraido,
} from "@/components/medications/PrescriptionScanner";
import { PatientSelector } from "@/components/guardians/PatientSelector";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BackToHomeButton } from "@/components/ui/BackToHomeButton";
import { useSuggestions } from "@/hooks/useSuggestions";
import { toast } from "sonner";

interface MedicationsProps {
  onTabChange?: (tab: string) => void;
}

export default function Medications({ onTabChange }: MedicationsProps) {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [scannerAberto, setScannerAberto] = useState(false);
  const { createSuggestion } = useSuggestions(selectedPatientId ?? undefined);
  
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

  /**
   * Resultado da leitura da receita.
   * Se um anjo cadastrou, vira sugestão para o paciente aprovar — a decisão
   * sobre a própria medicação continua sendo dele. Se foi o próprio paciente,
   * grava direto, porque ele já revisou campo a campo na tela anterior.
   */
  const salvarDaReceita = async (lista: MedicamentoExtraido[]) => {
    if (!user) return;
    const ehAnjo = !!selectedPatientId && selectedPatientId !== user.id;
    const alvo = selectedPatientId ?? user.id;

    try {
      for (const m of lista) {
        const horarios = m.horarios_sugeridos?.length ? m.horarios_sugeridos : ["08:00"];
        const dados = {
          name: m.nome,
          dosage: m.dosagem || null,
          frequency: m.frequencia || "daily",
          times: horarios,
          notes: m.observacoes || null,
          start_date: new Date().toISOString().slice(0, 10),
          active: true,
        };

        if (ehAnjo) {
          await createSuggestion({
            patientId: alvo,
            type: "medication_create",
            suggestionData: dados,
          });
        } else {
          const { error } = await supabase
            .from("medications")
            .insert([{ ...dados, user_id: alvo }]);
          if (error) throw error;
        }
      }

      toast.success(
        ehAnjo
          ? `${lista.length} sugestão(ões) enviada(s) para aprovação`
          : `${lista.length} remédio(s) cadastrado(s). Confira os horários.`
      );
      refetch();
    } catch {
      toast.error("Não foi possível salvar os remédios da receita");
    }
  };

  return (
    <div className="min-h-screen bg-background pattern-bg pb-24">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {onTabChange && (
          <BackToHomeButton onBackToHome={() => onTabChange("home")} />
        )}
        
        <PatientSelector
          selectedPatientId={selectedPatientId}
          onSelectPatient={setSelectedPatientId}
        />
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-senior-3xl font-bold text-foreground">
            💊 {selectedPatientId ? 'Medicamentos' : 'Meus Medicamentos'}
          </h1>
          <Button
            onClick={() => setIsFormOpen(true)}
            size="lg"
            className="text-senior-base"
          >
            <Plus className="w-6 h-6 mr-2" />
            Adicionar
          </Button>
        </div>

        {/* Ler receita por foto: cadastrar cinco remédios à mão é onde as
            pessoas desistem. A revisão é obrigatória antes de salvar. */}
        <Button
          variant="outline"
          size="lg"
          onClick={() => setScannerAberto(true)}
          className="w-full min-h-[64px] text-senior-base border-2 border-dashed mb-6"
        >
          <ScanLine className="w-6 h-6 mr-2" aria-hidden="true" />
          Ler receita por foto
        </Button>

        <PrescriptionScanner
          aberto={scannerAberto}
          onFechar={() => setScannerAberto(false)}
          patientId={selectedPatientId ?? user?.id ?? ""}
          onConfirmar={salvarDaReceita}
        />

        <MedicationList
          medications={medications || []}
          isLoading={isLoading}
          onEdit={handleEdit}
          onRefetch={refetch}
        />

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
