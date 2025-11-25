import { User, Phone, Heart, Edit, Trash2, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface Contact {
  id: string;
  name: string;
  relationship?: string;
  phone: string;
  email?: string;
  is_favorite: boolean;
  is_emergency: boolean;
  photo_url?: string;
}

interface ContactListProps {
  contacts: Contact[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onRefetch: () => void;
}

export function ContactList({ contacts, isLoading, onEdit, onRefetch }: ContactListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir o contato "${name}"?`)) return;

    const { error } = await supabase
      .from("emergency_contacts")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o contato.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Contato excluído com sucesso.",
    });
    
    // Invalidar cache para atualizar a lista de contatos e favoritos
    queryClient.invalidateQueries({ queryKey: ["contacts"] });
    queryClient.invalidateQueries({ queryKey: ["favorite-contacts"] });
    
    onRefetch();
  };

  const toggleFavorite = async (id: string, currentValue: boolean) => {
    const { error } = await supabase
      .from("emergency_contacts")
      .update({ is_favorite: !currentValue })
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o contato.",
        variant: "destructive",
      });
      return;
    }

    // Invalidar cache para atualizar a lista de contatos e favoritos
    queryClient.invalidateQueries({ queryKey: ["contacts"] });
    queryClient.invalidateQueries({ queryKey: ["favorite-contacts"] });
    
    onRefetch();
  };

  if (isLoading) {
    return <LoadingSpinner message="Carregando contatos..." />;
  }

  if (!contacts || contacts.length === 0) {
    return (
      <Card className="card-memo">
        <CardContent className="text-center py-12">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-senior-lg text-muted-foreground mb-2">
            Nenhum contato cadastrado
          </p>
          <p className="text-senior-sm text-muted-foreground">
            Clique em "Adicionar" para cadastrar seu primeiro contato
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {contacts.map((contact) => (
        <Card key={contact.id} className="card-memo">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-senior flex-shrink-0">
                <User className="w-8 h-8 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-senior-xl font-bold text-foreground">
                    {contact.name}
                  </h3>
                  <div className="flex gap-2">
                    {contact.is_favorite && (
                      <Badge variant="secondary">
                        <Heart className="w-4 h-4 mr-1 fill-current" />
                        Favorito
                      </Badge>
                    )}
                    {contact.is_emergency && (
                      <Badge variant="destructive">Emergência</Badge>
                    )}
                  </div>
                </div>

                {contact.relationship && (
                  <p className="text-senior-base text-muted-foreground mb-3">
                    {contact.relationship}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-senior-base">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <a href={`tel:${contact.phone}`} className="hover:text-primary text-foreground">
                      {contact.phone}
                    </a>
                  </div>

                  {contact.email && (
                    <div className="flex items-center gap-2 text-senior-base">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <a href={`mailto:${contact.email}`} className="hover:text-primary text-muted-foreground">
                        {contact.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleFavorite(contact.id, contact.is_favorite)}
                  aria-label={contact.is_favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                >
                  <Heart className={`w-5 h-5 ${contact.is_favorite ? 'fill-current text-primary' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEdit(contact.id)}
                  aria-label="Editar contato"
                >
                  <Edit className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDelete(contact.id, contact.name)}
                  aria-label="Excluir contato"
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
