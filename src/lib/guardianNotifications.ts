import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

type EventType = 
  | 'medication_taken' 
  | 'medication_missed' 
  | 'medication_upcoming'
  | 'appointment_created'
  | 'appointment_upcoming'
  | 'appointment_completed'
  | 'appointment_cancelled';

interface EventData {
  medicationName?: string;
  doctorName?: string;
  specialty?: string;
  time?: string;
  date?: string;
}

export async function notifyGuardians(
  patientId: string,
  eventType: EventType,
  eventData: EventData
) {
  try {
    const { data, error } = await supabase.functions.invoke('notify-guardians', {
      body: {
        patientId,
        eventType,
        eventData
      }
    });

    if (error) throw error;
    
    logger.info('Guardians notified:', data);
    return data;
  } catch (error) {
    logger.error('Error notifying guardians:', error);
    // Não fazer throw para não quebrar o fluxo principal
    return null;
  }
}

// Helpers específicos
export const notifyGuardiansOfMedicationTaken = (
  patientId: string,
  medicationName: string,
  time: string
) => notifyGuardians(patientId, 'medication_taken', { medicationName, time });

export const notifyGuardiansOfAppointmentCreated = (
  patientId: string,
  doctorName: string,
  specialty: string,
  date: string
) => notifyGuardians(patientId, 'appointment_created', { doctorName, specialty, date });
