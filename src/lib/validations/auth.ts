import { z } from "zod";

const passwordValidation = z
  .string()
  .min(8, { message: "A senha deve ter no mínimo 8 caracteres" })
  .max(100, { message: "A senha deve ter no máximo 100 caracteres" })
  .regex(/[a-z]/, { message: "A senha deve conter pelo menos uma letra minúscula" })
  .regex(/[A-Z]/, { message: "A senha deve conter pelo menos uma letra MAIÚSCULA" })
  .regex(/\d/, { message: "A senha deve conter pelo menos um número" })
  .regex(/[@$!%*?&#]/, { message: "A senha deve conter pelo menos um caractere especial (@$!%*?&#)" });

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Email inválido" })
    .max(255, { message: "Email deve ter menos de 255 caracteres" }),
  password: z
    .string()
    .min(1, { message: "Senha é obrigatória" }),
});

export const signupSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: "Nome deve ter no mínimo 2 caracteres" })
    .max(100, { message: "Nome deve ter no máximo 100 caracteres" }),
  email: z
    .string()
    .trim()
    .email({ message: "Email inválido" })
    .max(255, { message: "Email deve ter menos de 255 caracteres" }),
  password: passwordValidation,
  confirmPassword: z.string().min(1, { message: "Confirme sua senha" }),
  userType: z.enum(['patient', 'angel'], {
    errorMap: () => ({ message: "Selecione se você é paciente ou anjo" })
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
