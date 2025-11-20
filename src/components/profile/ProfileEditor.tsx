import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().email(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  currentEmail: string;
  onProfileUpdated: () => void;
}

export function ProfileEditor({
  open,
  onOpenChange,
  currentName,
  currentEmail,
  onProfileUpdated,
}: ProfileEditorProps) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: currentName,
      email: currentEmail,
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    // Check if name actually changed
    if (data.full_name === currentName) {
      toast({
        title: "Nenhuma alteração",
        description: "O nome não foi alterado.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: data.full_name })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });

      onProfileUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-senior-lg">Editar Perfil</DialogTitle>
          <DialogDescription className="text-senior-sm">
            Atualize suas informações pessoais. O email não pode ser alterado.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-senior-base">Nome Completo</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Digite seu nome completo"
                      className="text-senior-base min-h-[48px]"
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormMessage className="text-senior-sm" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-senior-base">Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      className="text-senior-base min-h-[48px] bg-muted"
                      disabled
                      readOnly
                    />
                  </FormControl>
                  <FormMessage className="text-senior-sm" />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
                size="lg"
                className="text-senior-base"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                size="lg"
                className="text-senior-base"
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
