import { z } from "zod";

export const contactSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "Nome é obrigatório" })
    .max(100, { message: "Nome muito longo (máximo 100 caracteres)" }),
  
  relationship: z.string()
    .trim()
    .max(50, { message: "Relacionamento muito longo (máximo 50 caracteres)" })
    .optional(),
  
  phone: z.string()
    .trim()
    .min(1, { message: "Telefone é obrigatório" })
    .regex(/^[\d\s\-\(\)\+]*$/, { message: "Telefone inválido" })
    .max(20, { message: "Telefone muito longo (máximo 20 caracteres)" }),
  
  email: z.string()
    .trim()
    .email({ message: "Email inválido" })
    .max(100, { message: "Email muito longo (máximo 100 caracteres)" })
    .optional()
    .or(z.literal("")),
  
  is_favorite: z.boolean().default(false),
  
  is_emergency: z.boolean().default(false),
  
  photo_url: z.string()
    .trim()
    .url({ message: "URL da foto inválida" })
    .optional()
    .or(z.literal(""))
});

export type ContactFormData = z.infer<typeof contactSchema>;
