import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { medicationSchema, MedicationFormData } from "@/lib/validations/medications";
import { useSuggestions } from "@/hooks/useSuggestions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, X } from "lucide-react";

interface MedicationSuggestionDialogProps {
  patientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MedicationSuggestionDialog({ patientId, open, onOpenChange }: MedicationSuggestionDialogProps) {
  const { createSuggestion } = useSuggestions();
  const [isLoading, setIsLoading] = useState(false);
  const [times, setTimes] = useState<string[]>(["08:00"]);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<MedicationFormData>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      times: ["08:00"],
      active: true
    }
  });

  const onSubmit = async (data: MedicationFormData) => {
    setIsLoading(true);

    const success = await createSuggestion({
      patientId,
      type: 'medication_create',
      suggestionData: {
        name: data.name,
        dosage: data.dosage,
        frequency: data.frequency,
        start_date: data.start_date,
        end_date: data.end_date,
        times: times,
        notes: data.notes,
      },
    });

    setIsLoading(false);

    if (success) {
      reset();
      setTimes(["08:00"]);
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Sugerir Novo Medicamento</DialogTitle>
          <DialogDescription>
            Preencha os dados do medicamento que deseja sugerir ao paciente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="name" className="text-base">Nome do Medicamento *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Ex: Losartana"
              className="text-base mt-2"
            />
            {errors.name && (
              <p className="text-destructive text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="dosage" className="text-base">Dosagem</Label>
            <Input
              id="dosage"
              {...register("dosage")}
              placeholder="Ex: 50mg"
              className="text-base mt-2"
            />
            {errors.dosage && (
              <p className="text-destructive text-sm mt-1">{errors.dosage.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="frequency" className="text-base">Frequência *</Label>
            <Input
              id="frequency"
              {...register("frequency")}
              placeholder="Ex: 1x ao dia, 2x ao dia"
              className="text-base mt-2"
            />
            {errors.frequency && (
              <p className="text-destructive text-sm mt-1">{errors.frequency.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date" className="text-base">Data de Início *</Label>
              <Input
                id="start_date"
                type="date"
                {...register("start_date")}
                className="text-base mt-2"
              />
              {errors.start_date && (
                <p className="text-destructive text-sm mt-1">{errors.start_date.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="end_date" className="text-base">Data de Término</Label>
              <Input
                id="end_date"
                type="date"
                {...register("end_date")}
                className="text-base mt-2"
              />
              {errors.end_date && (
                <p className="text-destructive text-sm mt-1">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-base">Horários *</Label>
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
                    className="text-base"
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
              <p className="text-destructive text-sm mt-1">{errors.times.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="notes" className="text-base">Observações</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Ex: Tomar com água, após refeição..."
              className="text-base mt-2 min-h-[100px]"
            />
            {errors.notes && (
              <p className="text-destructive text-sm mt-1">{errors.notes.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 text-base"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 text-base"
            >
              {isLoading ? "Enviando..." : "Enviar Sugestão"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
