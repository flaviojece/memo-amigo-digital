import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pill, Plus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { medicationSchema } from "@/lib/validations/medications";
import { useSuggestions } from "@/hooks/useSuggestions";
import { z } from "zod";
import { toast } from "sonner";

interface Medication {
  id: string;
  name: string;
  dosage?: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  times: string[];
  notes?: string;
  active: boolean;
}

interface MedicationEditSuggestionDialogProps {
  patientId: string;
  medication: Medication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MedicationEditSuggestionDialog({
  patientId,
  medication,
  open,
  onOpenChange,
}: MedicationEditSuggestionDialogProps) {
  const [times, setTimes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { createSuggestion } = useSuggestions();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<z.infer<typeof medicationSchema>>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      name: "",
      dosage: "",
      frequency: "daily",
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      notes: "",
      active: true,
    },
  });

  // Pre-populate form when medication changes
  useEffect(() => {
    if (medication && open) {
      reset({
        name: medication.name,
        dosage: medication.dosage || "",
        frequency: medication.frequency,
        start_date: medication.start_date,
        end_date: medication.end_date || "",
        notes: medication.notes || "",
        active: medication.active,
      });
      setTimes(medication.times || []);
    } else if (!open) {
      reset();
      setTimes([]);
    }
  }, [medication, open, reset]);

  const addTime = () => {
    setTimes([...times, "08:00"]);
  };

  const removeTime = (index: number) => {
    setTimes(times.filter((_, i) => i !== index));
  };

  const updateTime = (index: number, value: string) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  };

  const onSubmit = async (data: z.infer<typeof medicationSchema>) => {
    if (!medication) return;
    
    if (times.length === 0) {
      toast.error("Adicione pelo menos um horário para o medicamento");
      return;
    }

    setIsLoading(true);
    try {
      await createSuggestion({
        patientId,
        type: "medication_update",
        suggestionData: {
          name: data.name,
          dosage: data.dosage,
          frequency: data.frequency,
          start_date: data.start_date,
          end_date: data.end_date || null,
          times,
          notes: data.notes,
          active: data.active,
        },
        targetMedicationId: medication.id,
      });

      toast.success("Sugestão de edição enviada com sucesso!");
      onOpenChange(false);
      reset();
      setTimes([]);
    } catch (error) {
      console.error("Error creating suggestion:", error);
      toast.error("Erro ao enviar sugestão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!medication) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-senior-xl">
            <Pill className="w-6 h-6 text-secondary" />
            Sugerir Edição de Medicamento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-senior-base">
                Nome do Medicamento *
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Ex: Losartana"
                className="text-senior-base h-12"
              />
              {errors.name && (
                <p className="text-destructive text-senior-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="dosage" className="text-senior-base">
                Dosagem
              </Label>
              <Input
                id="dosage"
                {...register("dosage")}
                placeholder="Ex: 50mg"
                className="text-senior-base h-12"
              />
              {errors.dosage && (
                <p className="text-destructive text-senior-sm mt-1">{errors.dosage.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="frequency" className="text-senior-base">
                Frequência *
              </Label>
              <Select
                value={watch("frequency")}
                onValueChange={(value) => setValue("frequency", value)}
              >
                <SelectTrigger className="text-senior-base h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily" className="text-senior-base">
                    Diário
                  </SelectItem>
                  <SelectItem value="weekly" className="text-senior-base">
                    Semanal
                  </SelectItem>
                  <SelectItem value="monthly" className="text-senior-base">
                    Mensal
                  </SelectItem>
                  <SelectItem value="as_needed" className="text-senior-base">
                    Quando necessário
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.frequency && (
                <p className="text-destructive text-senior-sm mt-1">{errors.frequency.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date" className="text-senior-base">
                  Data de Início *
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  {...register("start_date")}
                  className="text-senior-base h-12"
                />
                {errors.start_date && (
                  <p className="text-destructive text-senior-sm mt-1">{errors.start_date.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="end_date" className="text-senior-base">
                  Data de Término (opcional)
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  {...register("end_date")}
                  className="text-senior-base h-12"
                />
              </div>
            </div>

            <div>
              <Label className="text-senior-base mb-2 block">
                Horários de Tomada *
              </Label>
              <div className="space-y-2">
                {times.map((time, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => updateTime(index, e.target.value)}
                      className="text-senior-base h-12"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeTime(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTime}
                  className="w-full gap-2 h-12 text-senior-base"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Horário
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="notes" className="text-senior-base">
                Observações
              </Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Ex: Tomar com água, após as refeições"
                className="text-senior-base min-h-24"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 text-senior-base"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 text-senior-base gap-2"
              disabled={isLoading}
            >
              <Pill className="w-4 h-4" />
              {isLoading ? "Enviando..." : "Enviar Sugestão"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
