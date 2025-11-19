import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Phone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface FavoriteContactsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FavoriteContactsModal({ open, onOpenChange }: FavoriteContactsModalProps) {
  const { user } = useAuth();
  
  const { data: contacts, isLoading } = useQuery({
    queryKey: ["favorite-contacts-modal", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_favorite", true)
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && open
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-senior-xl">
            📞 Ligar para Contatos Favoritos
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <p className="text-center text-senior-base py-8">Carregando...</p>
        ) : contacts?.length === 0 ? (
          <p className="text-center text-senior-base py-8">
            Nenhum contato favorito cadastrado
          </p>
        ) : (
          <div className="space-y-3">
            {contacts?.map((contact) => (
              <a
                key={contact.id}
                href={`tel:${contact.phone}`}
                className="flex items-center justify-between p-4 bg-card border-2 border-border rounded-senior hover:bg-accent hover:border-accent transition-all min-h-[80px]"
              >
                <div>
                  <p className="text-senior-base font-bold">{contact.name}</p>
                  <p className="text-senior-sm text-muted-foreground">
                    {contact.relationship}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <Phone className="w-6 h-6" />
                  <span className="text-senior-base font-bold">{contact.phone}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
