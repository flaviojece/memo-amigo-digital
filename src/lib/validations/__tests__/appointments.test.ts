import { describe, it, expect } from 'vitest';
import { appointmentSchema } from '../appointments';

describe('Appointment Validation Schema', () => {
  it('deve aceitar uma consulta válida completa', () => {
    const validAppointment = {
      doctor_name: 'Dr. Silva',
      specialty: 'Cardiologia',
      date: '2024-12-01T10:00:00',
      location: 'Hospital Central',
      phone: '(11) 98765-4321',
      notes: 'Levar exames anteriores',
      status: 'scheduled' as const,
    };

    const result = appointmentSchema.safeParse(validAppointment);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar nome de médico vazio', () => {
    const invalidAppointment = {
      doctor_name: '',
      specialty: 'Cardiologia',
      date: '2024-12-01T10:00:00',
    };

    const result = appointmentSchema.safeParse(invalidAppointment);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Nome do médico é obrigatório');
    }
  });

  it('deve rejeitar especialidade vazia', () => {
    const invalidAppointment = {
      doctor_name: 'Dr. Silva',
      specialty: '',
      date: '2024-12-01T10:00:00',
    };

    const result = appointmentSchema.safeParse(invalidAppointment);
    expect(result.success).toBe(false);
  });

  it('deve aceitar consulta sem localização', () => {
    const validAppointment = {
      doctor_name: 'Dr. Silva',
      specialty: 'Cardiologia',
      date: '2024-12-01T10:00:00',
    };

    const result = appointmentSchema.safeParse(validAppointment);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar telefone com caracteres inválidos', () => {
    const invalidAppointment = {
      doctor_name: 'Dr. Silva',
      specialty: 'Cardiologia',
      date: '2024-12-01T10:00:00',
      phone: '(11) 98765-ABCD',
    };

    const result = appointmentSchema.safeParse(invalidAppointment);
    expect(result.success).toBe(false);
  });
});
