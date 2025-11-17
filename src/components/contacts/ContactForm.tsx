import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, ContactFormData } from "@/lib/validations/contacts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface ContactFormProps {
  contactId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ContactForm({ contactId, onSuccess, onCancel }: ContactFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      is_favorite: false,
      is_emergency: false
    }
  });

  useEffect(() => {
    if (contactId) {
      loadContact();
    }
  }, [contactId]);

  const loadContact = async () => {
    if (!contactId) return;

    const { data, error } = await supabase
      .from("emergency_contacts")
      .select("*")
      .eq("id", contactId)
      .single();

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar o contato.",
        variant: "destructive",
      });
      return;
    }

    reset({
      name: data.name,
      relationship: data.relationship || "",
      phone: data.phone,
      email: data.email || "",
      is_favorite: data.is_favorite,
      is_emergency: data.is_emergency,
      photo_url: data.photo_url || ""
    });
    setIsFavorite(data.is_favorite);
    setIsEmergency(data.is_emergency);
  };

  const onSubmit = async (data: ContactFormData) => {
    if (!user) return;
    setIsLoading(true);

    const contactData = {
      name: data.name,
      relationship: data.relationship,
      phone: data.phone,
      email: data.email,
      photo_url: data.photo_url,
      is_favorite: isFavorite,
      is_emergency: isEmergency,
      user_id: user.id,
    };

    let error;
    if (contactId) {
      ({ error } = await supabase
        .from("emergency_contacts")
        .update(contactData)
        .eq("id", contactId));
    } else {
      ({ error } = await supabase
        .from("emergency_contacts")
        .insert([contactData]));
    }

    setIsLoading(false);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o contato.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: `Contato ${contactId ? 'atualizado' : 'cadastrado'} com sucesso!`,
    });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="name" className="text-senior-base">Nome *</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Ex: Maria Silva"
          className="text-senior-base mt-2"
        />
        {errors.name && (
          <p className="text-destructive text-senior-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="relationship" className="text-senior-base">Relacionamento</Label>
        <Input
          id="relationship"
          {...register("relationship")}
          placeholder="Ex: Filha, Esposo, Amigo"
          className="text-senior-base mt-2"
        />
        {errors.relationship && (
          <p className="text-destructive text-senior-sm mt-1">{errors.relationship.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="phone" className="text-senior-base">Telefone *</Label>
        <Input
          id="phone"
          type="tel"
          {...register("phone")}
          placeholder="Ex: (11) 98765-4321"
          className="text-senior-base mt-2"
        />
        {errors.phone && (
          <p className="text-destructive text-senior-sm mt-1">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email" className="text-senior-base">Email</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          placeholder="Ex: maria@exemplo.com"
          className="text-senior-base mt-2"
        />
        {errors.email && (
          <p className="text-destructive text-senior-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_favorite"
            checked={isFavorite}
            onCheckedChange={(checked) => {
              setIsFavorite(checked as boolean);
              setValue("is_favorite", checked as boolean);
            }}
          />
          <Label htmlFor="is_favorite" className="text-senior-base cursor-pointer">
            Marcar como favorito
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_emergency"
            checked={isEmergency}
            onCheckedChange={(checked) => {
              setIsEmergency(checked as boolean);
              setValue("is_emergency", checked as boolean);
            }}
          />
          <Label htmlFor="is_emergency" className="text-senior-base cursor-pointer">
            Contato de emergência
          </Label>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 text-senior-base"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 text-senior-base"
        >
          {isLoading ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
