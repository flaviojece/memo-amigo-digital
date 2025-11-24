import { describe, it, expect } from 'vitest';
import { loginSchema, signupSchema } from '../auth';

describe('Auth Validation Schemas', () => {
  describe('Login Schema', () => {
    it('deve aceitar email e senha válidos', () => {
      const validLogin = {
        email: 'usuario@exemplo.com',
        password: 'senha123',
      };

      const result = loginSchema.safeParse(validLogin);
      expect(result.success).toBe(true);
    });

    it('deve rejeitar email inválido', () => {
      const invalidLogin = {
        email: 'email-invalido',
        password: 'senha123',
      };

      const result = loginSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
    });

    it('deve rejeitar senha vazia', () => {
      const invalidLogin = {
        email: 'usuario@exemplo.com',
        password: '',
      };

      const result = loginSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
    });
  });

  describe('Signup Schema', () => {
    it('deve aceitar dados de cadastro válidos', () => {
      const validSignup = {
        fullName: 'João Silva',
        email: 'joao@exemplo.com',
        password: 'Senha123@',
        confirmPassword: 'Senha123@',
        userType: 'patient' as const,
      };

      const result = signupSchema.safeParse(validSignup);
      expect(result.success).toBe(true);
    });

    it('deve rejeitar senha sem letra maiúscula', () => {
      const invalidSignup = {
        fullName: 'João Silva',
        email: 'joao@exemplo.com',
        password: 'senha123@',
        confirmPassword: 'senha123@',
        userType: 'patient' as const,
      };

      const result = signupSchema.safeParse(invalidSignup);
      expect(result.success).toBe(false);
    });

    it('deve rejeitar senha sem letra minúscula', () => {
      const invalidSignup = {
        fullName: 'João Silva',
        email: 'joao@exemplo.com',
        password: 'SENHA123@',
        confirmPassword: 'SENHA123@',
        userType: 'patient' as const,
      };

      const result = signupSchema.safeParse(invalidSignup);
      expect(result.success).toBe(false);
    });

    it('deve rejeitar senha sem número', () => {
      const invalidSignup = {
        fullName: 'João Silva',
        email: 'joao@exemplo.com',
        password: 'Senhaaa@',
        confirmPassword: 'Senhaaa@',
        userType: 'patient' as const,
      };

      const result = signupSchema.safeParse(invalidSignup);
      expect(result.success).toBe(false);
    });

    it('deve rejeitar senha sem caractere especial', () => {
      const invalidSignup = {
        fullName: 'João Silva',
        email: 'joao@exemplo.com',
        password: 'Senha123',
        confirmPassword: 'Senha123',
        userType: 'patient' as const,
      };

      const result = signupSchema.safeParse(invalidSignup);
      expect(result.success).toBe(false);
    });

    it('deve rejeitar senha menor que 8 caracteres', () => {
      const invalidSignup = {
        fullName: 'João Silva',
        email: 'joao@exemplo.com',
        password: 'Sen1@',
        confirmPassword: 'Sen1@',
        userType: 'patient' as const,
      };

      const result = signupSchema.safeParse(invalidSignup);
      expect(result.success).toBe(false);
    });

    it('deve rejeitar quando senhas não coincidem', () => {
      const invalidSignup = {
        fullName: 'João Silva',
        email: 'joao@exemplo.com',
        password: 'Senha123@',
        confirmPassword: 'Senha456@',
        userType: 'patient' as const,
      };

      const result = signupSchema.safeParse(invalidSignup);
      expect(result.success).toBe(false);
    });

    it('deve rejeitar nome muito curto', () => {
      const invalidSignup = {
        fullName: 'J',
        email: 'joao@exemplo.com',
        password: 'Senha123@',
        confirmPassword: 'Senha123@',
        userType: 'patient' as const,
      };

      const result = signupSchema.safeParse(invalidSignup);
      expect(result.success).toBe(false);
    });
  });
});
