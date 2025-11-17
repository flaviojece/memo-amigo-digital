import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface GuardianNotificationPreferences {
  id: string;
  guardian_id: string;
  patient_id: string;
  enabled: boolean;
  notify_medication_taken: boolean;
  notify_medication_missed: boolean;
  notify_medication_upcoming: boolean;
  notify_appointment_created: boolean;
  notify_appointment_upcoming: boolean;
  notify_appointment_completed: boolean;
  notify_appointment_cancelled: boolean;
  created_at: string;
  updated_at: string;
}

export const useGuardianNotificationPreferences = (patientId?: string) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<GuardianNotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPreferences = async () => {
    if (!user || !patientId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('guardian_notification_preferences')
        .select('*')
        .eq('guardian_id', user.id)
        .eq('patient_id', patientId)
        .maybeSingle();

      if (error) throw error;

      // Se não existir, criar com valores padrão
      if (!data) {
        const { data: newPrefs, error: insertError } = await supabase
          .from('guardian_notification_preferences')
          .insert({
            guardian_id: user.id,
            patient_id: patientId,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setPreferences(newPrefs);
      } else {
        setPreferences(data);
      }
    } catch (error: any) {
      console.error('Erro ao carregar preferências:', error);
      toast.error('Erro ao carregar preferências de notificação');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, [user, patientId]);

  const updatePreferences = async (
    updates: Partial<Omit<GuardianNotificationPreferences, 'id' | 'guardian_id' | 'patient_id' | 'created_at' | 'updated_at'>>
  ): Promise<boolean> => {
    if (!user || !patientId || !preferences) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('guardian_notification_preferences')
        .update(updates)
        .eq('id', preferences.id);

      if (error) throw error;

      // Atualizar estado local
      setPreferences(prev => prev ? { ...prev, ...updates } : null);
      
      toast.success('Preferências atualizadas com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar preferências:', error);
      toast.error('Erro ao atualizar preferências');
      return false;
    }
  };

  const toggleEnabled = async (): Promise<boolean> => {
    if (!preferences) return false;
    return updatePreferences({ enabled: !preferences.enabled });
  };

  return {
    preferences,
    loading,
    updatePreferences,
    toggleEnabled,
    reload: loadPreferences,
  };
};
