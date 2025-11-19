import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactList } from "@/components/contacts/ContactList";
import { ContactForm } from "@/components/contacts/ContactForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BackToHomeButton } from "@/components/ui/BackToHomeButton";

interface ContactsProps {
  onTabChange?: (tab: string) => void;
}

export default function Contacts({ onTabChange }: ContactsProps) {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: contacts, isLoading, refetch } = useQuery({
    queryKey: ["contacts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("is_favorite", { ascending: false })
        .order("name", { ascending: true });
      
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
        {onTabChange && (
          <BackToHomeButton onBackToHome={() => onTabChange("home")} />
        )}
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-senior-3xl font-bold text-foreground">
            👥 Meus Contatos
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

        <ContactList
          contacts={contacts || []}
          isLoading={isLoading}
          onEdit={handleEdit}
          onRefetch={refetch}
        />

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-senior-xl">
                {editingId ? "Editar Contato" : "Novo Contato"}
              </DialogTitle>
            </DialogHeader>
            <ContactForm
              contactId={editingId}
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
