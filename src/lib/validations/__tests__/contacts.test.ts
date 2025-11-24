import { describe, it, expect } from 'vitest';
import { contactSchema } from '../contacts';

describe('Contact Validation Schema', () => {
  it('deve aceitar um contato válido completo', () => {
    const validContact = {
      name: 'Dr. Silva',
      relationship: 'Médico',
      phone: '(11) 98765-4321',
      email: 'dr.silva@exemplo.com',
      is_favorite: true,
      is_emergency: false,
    };

    const result = contactSchema.safeParse(validContact);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar nome vazio', () => {
    const invalidContact = {
      name: '',
      phone: '(11) 98765-4321',
    };

    const result = contactSchema.safeParse(invalidContact);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Nome é obrigatório');
    }
  });

  it('deve rejeitar email inválido', () => {
    const invalidContact = {
      name: 'Dr. Silva',
      phone: '(11) 98765-4321',
      email: 'email-invalido',
    };

    const result = contactSchema.safeParse(invalidContact);
    expect(result.success).toBe(false);
  });

  it('deve aceitar contato sem email', () => {
    const validContact = {
      name: 'Dr. Silva',
      phone: '(11) 98765-4321',
    };

    const result = contactSchema.safeParse(validContact);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar telefone com caracteres inválidos', () => {
    const invalidContact = {
      name: 'Dr. Silva',
      phone: '(11) 98765-ABCD',
    };

    const result = contactSchema.safeParse(invalidContact);
    expect(result.success).toBe(false);
  });

  it('deve rejeitar nome muito longo (>100 caracteres)', () => {
    const invalidContact = {
      name: 'A'.repeat(101),
      phone: '(11) 98765-4321',
    };

    const result = contactSchema.safeParse(invalidContact);
    expect(result.success).toBe(false);
  });
});
