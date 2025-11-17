import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { medicationSchema, MedicationFormData } from "@/lib/validations/medications";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import { scheduleMedicationNotifications, deleteNotifications } from "@/lib/notificationScheduler";

interface MedicationFormProps {
  medicationId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MedicationForm({ medicationId, onSuccess, onCancel }: MedicationFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [times, setTimes] = useState<string[]>(["08:00"]);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<MedicationFormData>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      times: ["08:00"],
      active: true
    }
  });

  useEffect(() => {
    if (medicationId) {
      loadMedication();
    }
  }, [medicationId]);

  const loadMedication = async () => {
    if (!medicationId) return;

    const { data, error } = await supabase
      .from("medications")
      .select("*")
      .eq("id", medicationId)
      .single();

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar o medicamento.",
        variant: "destructive",
      });
      return;
    }

    reset({
      name: data.name,
      dosage: data.dosage || "",
      frequency: data.frequency,
      start_date: data.start_date,
      end_date: data.end_date || "",
      notes: data.notes || "",
      active: data.active,
      times: Array.isArray(data.times) ? data.times : JSON.parse(data.times as string)
    });
    setTimes(Array.isArray(data.times) ? data.times : JSON.parse(data.times as string));
  };

  const onSubmit = async (data: MedicationFormData) => {
    if (!user) return;
    setIsLoading(true);

    try {
      const medicationData = {
        name: data.name,
        dosage: data.dosage,
        frequency: data.frequency,
        start_date: data.start_date,
        end_date: data.end_date,
        notes: data.notes,
        active: data.active,
        times: times as any,
        user_id: user.id,
      };

      let savedMedicationId: string;

      if (medicationId) {
        // Edição: deletar notificações antigas
        await deleteNotifications('medication', medicationId);
        
        const { data: updatedData, error } = await supabase
          .from("medications")
          .update(medicationData)
          .eq("id", medicationId)
          .select()
          .single();

        if (error) throw error;
        savedMedicationId = updatedData.id;
      } else {
        // Criação
        const { data: newData, error } = await supabase
          .from("medications")
          .insert([medicationData])
          .select()
          .single();

        if (error) throw error;
        savedMedicationId = newData.id;
      }

      // Agendar notificações
      await scheduleMedicationNotifications(
        user.id,
        savedMedicationId,
        data.name,
        times,
        new Date(data.start_date),
        data.end_date ? new Date(data.end_date) : undefined
      );

      setIsLoading(false);

      toast({
        title: "Sucesso",
        description: `Medicamento ${medicationId ? 'atualizado' : 'cadastrado'} com sucesso!`,
      });
      onSuccess();
    } catch (error: any) {
      setIsLoading(false);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o medicamento.",
        variant: "destructive",
      });
    }
  };

  const addTime = () => {
    setTimes([...times, "12:00"]);
  };

  const removeTime = (index: number) => {
    const newTimes = times.filter((_, i) => i !== index);
    setTimes(newTimes);
    setValue("times", newTimes);
  };

  const updateTime = (index: number, value: string) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
    setValue("times", newTimes);
  };

  useEffect(() => {
    setValue("times", times);
  }, [times, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="name" className="text-senior-base">Nome do Medicamento *</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Ex: Losartana"
          className="text-senior-base mt-2"
        />
        {errors.name && (
          <p className="text-destructive text-senior-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="dosage" className="text-senior-base">Dosagem</Label>
        <Input
          id="dosage"
          {...register("dosage")}
          placeholder="Ex: 50mg"
          className="text-senior-base mt-2"
        />
        {errors.dosage && (
          <p className="text-destructive text-senior-sm mt-1">{errors.dosage.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="frequency" className="text-senior-base">Frequência *</Label>
        <Input
          id="frequency"
          {...register("frequency")}
          placeholder="Ex: 1x ao dia, 2x ao dia"
          className="text-senior-base mt-2"
        />
        {errors.frequency && (
          <p className="text-destructive text-senior-sm mt-1">{errors.frequency.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_date" className="text-senior-base">Data de Início *</Label>
          <Input
            id="start_date"
            type="date"
            {...register("start_date")}
            className="text-senior-base mt-2"
          />
          {errors.start_date && (
            <p className="text-destructive text-senior-sm mt-1">{errors.start_date.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="end_date" className="text-senior-base">Data de Término</Label>
          <Input
            id="end_date"
            type="date"
            {...register("end_date")}
            className="text-senior-base mt-2"
          />
          {errors.end_date && (
            <p className="text-destructive text-senior-sm mt-1">{errors.end_date.message}</p>
          )}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <Label className="text-senior-base">Horários *</Label>
          <Button type="button" onClick={addTime} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Adicionar Horário
          </Button>
        </div>
        <div className="space-y-2">
          {times.map((time, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type="time"
                value={time}
                onChange={(e) => updateTime(index, e.target.value)}
                className="text-senior-base"
              />
              {times.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeTime(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        {errors.times && (
          <p className="text-destructive text-senior-sm mt-1">{errors.times.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="notes" className="text-senior-base">Observações</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          placeholder="Ex: Tomar com água, após refeição..."
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
