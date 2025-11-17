import { z } from "zod";

export const medicationSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "Nome do medicamento é obrigatório" })
    .max(100, { message: "Nome muito longo (máximo 100 caracteres)" }),
  
  dosage: z.string()
    .trim()
    .max(50, { message: "Dosagem muito longa (máximo 50 caracteres)" })
    .optional(),
  
  frequency: z.string()
    .trim()
    .min(1, { message: "Frequência é obrigatória" })
    .max(50, { message: "Frequência muito longa (máximo 50 caracteres)" }),
  
  start_date: z.string()
    .min(1, { message: "Data de início é obrigatória" }),
  
  end_date: z.string()
    .optional(),
  
  times: z.array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Horário inválido (use formato HH:MM)"
  }))
    .min(1, { message: "Adicione pelo menos um horário" })
    .max(10, { message: "Máximo de 10 horários por dia" }),
  
  notes: z.string()
    .trim()
    .max(500, { message: "Observações muito longas (máximo 500 caracteres)" })
    .optional(),
  
  active: z.boolean().default(true)
});

export const medicationLogSchema = z.object({
  medication_id: z.string().uuid({ message: "ID do medicamento inválido" }),
  
  scheduled_time: z.string()
    .min(1, { message: "Horário agendado é obrigatório" }),
  
  taken_at: z.string().optional(),
  
  status: z.enum(["taken", "missed", "skipped"], {
    errorMap: () => ({ message: "Status deve ser 'tomado', 'perdido' ou 'pulado'" })
  }),
  
  notes: z.string()
    .trim()
    .max(200, { message: "Observações muito longas (máximo 200 caracteres)" })
    .optional()
});

export type MedicationFormData = z.infer<typeof medicationSchema>;
export type MedicationLogFormData = z.infer<typeof medicationLogSchema>;
