import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentSchema, AppointmentFormData } from "@/lib/validations/appointments";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AppointmentFormProps {
  appointmentId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AppointmentForm({ appointmentId, onSuccess, onCancel }: AppointmentFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      status: "scheduled"
    }
  });

  useEffect(() => {
    if (appointmentId) {
      loadAppointment();
    }
  }, [appointmentId]);

  const loadAppointment = async () => {
    if (!appointmentId) return;

    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .single();

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar a consulta.",
        variant: "destructive",
      });
      return;
    }

    reset({
      doctor_name: data.doctor_name,
      specialty: data.specialty,
      date: data.date,
      location: data.location || "",
      phone: data.phone || "",
      notes: data.notes || "",
      status: data.status as "scheduled" | "completed" | "cancelled"
    });
  };

  const onSubmit = async (data: AppointmentFormData) => {
    if (!user) return;
    setIsLoading(true);

    const appointmentData = {
      ...data,
      user_id: user.id,
    };

    let error;
    if (appointmentId) {
      ({ error } = await supabase
        .from("appointments")
        .update(appointmentData)
        .eq("id", appointmentId));
    } else {
      ({ error } = await supabase
        .from("appointments")
        .insert([appointmentData]));
    }

    setIsLoading(false);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a consulta.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: `Consulta ${appointmentId ? 'atualizada' : 'agendada'} com sucesso!`,
    });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="doctor_name" className="text-senior-base">Nome do Médico *</Label>
        <Input
          id="doctor_name"
          {...register("doctor_name")}
          placeholder="Ex: Dr. João Silva"
          className="text-senior-base mt-2"
        />
        {errors.doctor_name && (
          <p className="text-destructive text-senior-sm mt-1">{errors.doctor_name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="specialty" className="text-senior-base">Especialidade *</Label>
        <Input
          id="specialty"
          {...register("specialty")}
          placeholder="Ex: Cardiologia, Ortopedia"
          className="text-senior-base mt-2"
        />
        {errors.specialty && (
          <p className="text-destructive text-senior-sm mt-1">{errors.specialty.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="date" className="text-senior-base">Data e Hora *</Label>
        <Input
          id="date"
          type="datetime-local"
          {...register("date")}
          className="text-senior-base mt-2"
        />
        {errors.date && (
          <p className="text-destructive text-senior-sm mt-1">{errors.date.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="location" className="text-senior-base">Local</Label>
        <Input
          id="location"
          {...register("location")}
          placeholder="Ex: Hospital Santa Casa, Rua..."
          className="text-senior-base mt-2"
        />
        {errors.location && (
          <p className="text-destructive text-senior-sm mt-1">{errors.location.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="phone" className="text-senior-base">Telefone</Label>
        <Input
          id="phone"
          type="tel"
          {...register("phone")}
          placeholder="Ex: (11) 1234-5678"
          className="text-senior-base mt-2"
        />
        {errors.phone && (
          <p className="text-destructive text-senior-sm mt-1">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="status" className="text-senior-base">Status</Label>
        <Select onValueChange={(value) => setValue("status", value as any)} defaultValue="scheduled">
          <SelectTrigger className="text-senior-base mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scheduled">Agendada</SelectItem>
            <SelectItem value="completed">Realizada</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes" className="text-senior-base">Observações</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          placeholder="Ex: Levar exames anteriores, chegar com 15 min de antecedência..."
          className="text-senior-base mt-2 min-h-[100px]"
        />
        {errors.notes && (
          <p className="text-destructive text-senior-sm mt-1">{errors.notes.message}</p>
        )}
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
