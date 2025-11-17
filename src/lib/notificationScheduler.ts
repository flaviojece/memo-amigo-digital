import { supabase } from '@/integrations/supabase/client';
import { addMinutes, subDays, isPast } from 'date-fns';

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
    console.log('Horário no passado, pulando:', scheduledFor);
    return null;
  }

  const { data, error } = await supabase
    .from('notification_schedules')
    .insert({
      user_id: userId,
      type,
      [type === 'medication' ? 'medication_id' : 'appointment_id']: itemId,
      scheduled_for: scheduledFor.toISOString(),
      title,
      body,
      click_action: clickAction || '/',
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao agendar notificação:', error);
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
    console.error('Erro ao deletar notificações:', error);
  }
};

// Função auxiliar
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
