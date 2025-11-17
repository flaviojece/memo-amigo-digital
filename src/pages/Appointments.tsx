import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppointmentList } from "@/components/appointments/AppointmentList";
import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Appointments() {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: appointments, isLoading, refetch } = useQuery({
    queryKey: ["appointments", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
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
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-senior-3xl font-bold text-foreground">
            📅 Minhas Consultas
          </h1>
          <Button
            onClick={() => setIsFormOpen(true)}
            size="lg"
            className="text-senior-base"
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
          <DialogContent className="max-w-2xl">
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
