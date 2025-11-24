import { describe, it, expect } from 'vitest';
import { medicationSchema } from '../medications';

describe('Medication Validation Schema', () => {
  it('deve aceitar um medicamento válido completo', () => {
    const validMedication = {
      name: 'Aspirina',
      dosage: '100mg',
      frequency: 'Diário',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      times: ['08:00', '20:00'],
      notes: 'Tomar após as refeições',
      active: true,
    };

    const result = medicationSchema.safeParse(validMedication);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar nome vazio', () => {
    const invalidMedication = {
      name: '',
      frequency: 'Diário',
      start_date: '2024-01-01',
      times: ['08:00'],
    };

    const result = medicationSchema.safeParse(invalidMedication);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Nome do medicamento é obrigatório');
    }
  });

  it('deve rejeitar frequência vazia', () => {
    const invalidMedication = {
      name: 'Aspirina',
      frequency: '',
      start_date: '2024-01-01',
      times: ['08:00'],
    };

    const result = medicationSchema.safeParse(invalidMedication);
    expect(result.success).toBe(false);
  });

  it('deve rejeitar horário inválido', () => {
    const invalidMedication = {
      name: 'Aspirina',
      frequency: 'Diário',
      start_date: '2024-01-01',
      times: ['25:00'], // Hora inválida
    };

    const result = medicationSchema.safeParse(invalidMedication);
    expect(result.success).toBe(false);
  });

  it('deve rejeitar sem horários', () => {
    const invalidMedication = {
      name: 'Aspirina',
      frequency: 'Diário',
      start_date: '2024-01-01',
      times: [],
    };

    const result = medicationSchema.safeParse(invalidMedication);
    expect(result.success).toBe(false);
  });

  it('deve rejeitar mais de 10 horários', () => {
    const invalidMedication = {
      name: 'Aspirina',
      frequency: 'Diário',
      start_date: '2024-01-01',
      times: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
    };

    const result = medicationSchema.safeParse(invalidMedication);
    expect(result.success).toBe(false);
  });
});
