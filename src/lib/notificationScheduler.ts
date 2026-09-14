import { supabase } from '@/integrations/supabase/client';
import { addMinutes, subDays, isPast } from 'date-fns';
import { logger } from '@/lib/logger';

export type NotificationType = 'medication' | 'appointment';

interface ScheduleNotificationParams {
  userId: string;
  type: NotificationType;
  itemId: string;
  scheduledFor: Date;
  title: string;
  body: string;
  clickAction?: string;
}

export const scheduleNotification = async (params: ScheduleNotificationParams) => {
  const { userId, type, itemId, scheduledFor, title, body, clickAction } = params;

  // Não agendar notificações no passado
  if (isPast(scheduledFor)) {
    logger.warn('Horário no passado, pulando:', scheduledFor);
    return null;
  }

  const { data, error } = await supabase
    .from('notification_schedules')
    .insert({
      user_id: userId,
      type,
      medication_id: type === 'medication' ? itemId : null,
      appointment_id: type === 'appointment' ? itemId : null,
      scheduled_for: scheduledFor.toISOString(),
      title,
      body,
      click_action: clickAction || '/',
    })
    .select()
    .single();

  if (error) {
    logger.error('Erro ao agendar notificação:', error);
    throw error;
  }

  return data;
};

// Agendar notificações para um medicamento
export const scheduleMedicationNotifications = async (
  userId: string,
  medicationId: string,
  medicationName: string,
  times: string[], // ["08:00", "14:00", "20:00"]
  startDate: Date,
  endDate?: Date
) => {
  const notifications: Promise<any>[] = [];

  // Para cada horário do dia
  for (const time of times) {
    const [hours, minutes] = time.split(':').map(Number);
    
    // Começar da data de início
    let currentDate = new Date(startDate);
    currentDate.setHours(hours, minutes, 0, 0);

    // Agendar até a data final (ou 30 dias se não tiver)
    const finalDate = endDate || addDays(new Date(), 30);

    while (currentDate <= finalDate) {
      // Notificar 30 minutos antes
      const notificationTime = addMinutes(currentDate, -30);

      if (!isPast(notificationTime)) {
        notifications.push(
          scheduleNotification({
            userId,
            type: 'medication',
            itemId: medicationId,
            scheduledFor: notificationTime,
            title: '💊 Hora do remédio!',
            body: `${medicationName} em 30 minutos (${time})`,
            clickAction: '/?tab=meds',
          })
        );
      }

      // Próximo dia
      currentDate = addDays(currentDate, 1);
    }
  }

  return Promise.all(notifications);
};

// Agendar notificação para consulta
export const scheduleAppointmentNotification = async (
  userId: string,
  appointmentId: string,
  doctorName: string,
  specialty: string,
  appointmentDate: Date
) => {
  // Notificar 1 dia antes
  const notificationTime = subDays(appointmentDate, 1);

  if (isPast(notificationTime)) {
    return null;
  }

  return scheduleNotification({
    userId,
    type: 'appointment',
    itemId: appointmentId,
    scheduledFor: notificationTime,
    title: '📅 Consulta amanhã!',
    body: `${doctorName} - ${specialty}`,
    clickAction: '/?tab=appointments',
  });
};

// Deletar notificações de um item
export const deleteNotifications = async (
  type: NotificationType,
  itemId: string
) => {
  const column = type === 'medication' ? 'medication_id' : 'appointment_id';
  
  const { error } = await supabase
    .from('notification_schedules')
    .delete()
    .eq(column, itemId);

  if (error) {
    logger.error('Erro ao deletar notificações:', error);
  }
};

// Função auxiliar
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ========================================
// NOTIFICAÇÕES PARA GUARDIANS/CUIDADORES
// ========================================

interface GuardianToNotify {
  guardian_id: string;
  guardian_email: string;
  guardian_name: string;
}

// Buscar guardians que devem ser notificados
const getGuardiansToNotify = async (
  patientId: string,
  notificationType: string
): Promise<GuardianToNotify[]> => {
  try {
    const { data, error } = await supabase.rpc('get_guardians_to_notify', {
      _patient_id: patientId,
      _notification_type: notificationType,
    });

    if (error) {
      logger.error('Erro ao buscar guardians:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Erro ao buscar guardians:', error);
    return [];
  }
};

// Enviar notificação para um guardian
const sendGuardianNotification = (
  guardianId: string,
  title: string,
  body: string,
  clickAction: string = '/'
) => {
  // Enviar notificação via Service Worker
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      payload: {
        title,
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `guardian-${guardianId}`,
        data: { url: clickAction },
      },
    });
  }
};

// Notificar guardians quando paciente toma medicamento
export const notifyGuardiansOfMedicationTaken = async (
  patientId: string,
  patientName: string,
  medicationName: string,
  time: string
) => {
  const guardians = await getGuardiansToNotify(patientId, 'medication_taken');

  guardians.forEach((guardian) => {
    sendGuardianNotification(
      guardian.guardian_id,
      `💊 ${patientName} tomou medicamento`,
      `${medicationName} às ${time}`,
      '/?tab=meds'
    );
  });
};

// Notificar guardians quando paciente perde medicamento
export const notifyGuardiansOfMedicationMissed = async (
  patientId: string,
  patientName: string,
  medicationName: string,
  time: string
) => {
  const guardians = await getGuardiansToNotify(patientId, 'medication_missed');

  guardians.forEach((guardian) => {
    sendGuardianNotification(
      guardian.guardian_id,
      `⚠️ ${patientName} perdeu medicamento`,
      `${medicationName} (${time}) não foi tomado`,
      '/?tab=meds'
    );
  });
};

// Notificar guardians sobre lembrete de medicamento
export const notifyGuardiansOfMedicationUpcoming = async (
  patientId: string,
  patientName: string,
  medicationName: string,
  time: string
) => {
  const guardians = await getGuardiansToNotify(patientId, 'medication_upcoming');

  guardians.forEach((guardian) => {
    sendGuardianNotification(
      guardian.guardian_id,
      `🔔 Lembrete: ${patientName}`,
      `${medicationName} em 30 minutos (${time})`,
      '/?tab=meds'
    );
  });
};

// Notificar guardians quando nova consulta é criada
export const notifyGuardiansOfAppointmentCreated = async (
  patientId: string,
  patientName: string,
  doctorName: string,
  specialty: string,
  date: Date
) => {
  const guardians = await getGuardiansToNotify(patientId, 'appointment_created');

  const dateStr = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  guardians.forEach((guardian) => {
    sendGuardianNotification(
      guardian.guardian_id,
      `📅 ${patientName} agendou consulta`,
      `${doctorName} - ${specialty} em ${dateStr}`,
      '/?tab=appointments'
    );
  });
};

// Notificar guardians sobre lembrete de consulta
export const notifyGuardiansOfAppointmentUpcoming = async (
  patientId: string,
  patientName: string,
  doctorName: string,
  specialty: string,
  date: Date
) => {
  const guardians = await getGuardiansToNotify(patientId, 'appointment_upcoming');

  const dateStr = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  guardians.forEach((guardian) => {
    sendGuardianNotification(
      guardian.guardian_id,
      `🔔 Lembrete: Consulta de ${patientName} amanhã`,
      `${doctorName} - ${specialty} às ${dateStr}`,
      '/?tab=appointments'
    );
  });
};
