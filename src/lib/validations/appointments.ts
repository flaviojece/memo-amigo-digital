import { z } from "zod";

export const appointmentSchema = z.object({
  doctor_name: z.string()
    .trim()
    .min(1, { message: "Nome do médico é obrigatório" })
    .max(100, { message: "Nome muito longo (máximo 100 caracteres)" }),
  
  specialty: z.string()
    .trim()
    .min(1, { message: "Especialidade é obrigatória" })
    .max(100, { message: "Especialidade muito longa (máximo 100 caracteres)" }),
  
  date: z.string()
    .min(1, { message: "Data e hora são obrigatórias" }),
  
  location: z.string()
    .trim()
    .max(200, { message: "Local muito longo (máximo 200 caracteres)" })
    .optional(),
  
  phone: z.string()
    .trim()
    .regex(/^[\d\s\-\(\)\+]*$/, { message: "Telefone inválido" })
    .max(20, { message: "Telefone muito longo (máximo 20 caracteres)" })
    .optional(),
  
  notes: z.string()
    .trim()
    .max(500, { message: "Observações muito longas (máximo 500 caracteres)" })
    .optional(),
  
  status: z.enum(["scheduled", "completed", "cancelled"])
    .default("scheduled")
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;
