import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Suggestion {
  id: string;
  created_at: string;
  updated_at: string;
  patient_id: string;
  angel_id: string;
  type: 'medication_create' | 'medication_update' | 'medication_delete' | 'appointment_create' | 'appointment_update' | 'appointment_delete';
  status: 'pending' | 'approved' | 'rejected';
  suggestion_data: any;
  target_medication_id?: string;
  target_appointment_id?: string;
  patient_response?: string;
  responded_at?: string;
  angel_name?: string;
  patient_name?: string;
}

export interface CreateSuggestionInput {
  patientId: string;
  type: Suggestion['type'];
  suggestionData: any;
  targetMedicationId?: string;
  targetAppointmentId?: string;
}

export function useSuggestions(patientId?: string) {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSuggestions = async () => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('suggestions')
        .select('*')
        .order('created_at', { ascending: false });

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get names separately
      const suggestionsWithNames = await Promise.all((data || []).map(async (suggestion) => {
        const [angelProfile, patientProfile] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('id', suggestion.angel_id).single(),
          supabase.from('profiles').select('full_name').eq('id', suggestion.patient_id).single(),
        ]);

        return {
          ...suggestion,
          angel_name: angelProfile.data?.full_name || 'Anjo',
          patient_name: patientProfile.data?.full_name || 'Paciente',
        };
      }));

      setSuggestions(suggestionsWithNames);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      toast.error('Erro ao carregar sugestões');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();

    // Setup realtime subscription
    const channel = supabase
      .channel('suggestions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'suggestions',
        },
        () => {
          loadSuggestions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, patientId]);

  const createSuggestion = async (input: CreateSuggestionInput) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { error } = await supabase.from('suggestions').insert({
        patient_id: input.patientId,
        angel_id: user.id,
        type: input.type,
        suggestion_data: input.suggestionData,
        target_medication_id: input.targetMedicationId,
        target_appointment_id: input.targetAppointmentId,
      });

      if (error) throw error;

      // Send notification to patient
      await supabase.functions.invoke('notify-patient-suggestion', {
        body: {
          patientId: input.patientId,
          angelName: user.user_metadata?.full_name || user.email,
          suggestionType: input.type,
        },
      });

      toast.success('Sugestão enviada! O paciente será notificado.');
      await loadSuggestions();
      return true;
    } catch (error: any) {
      console.error('Error creating suggestion:', error);
      toast.error(error.message || 'Erro ao criar sugestão');
      return false;
    }
  };

  const approveSuggestion = async (suggestionId: string) => {
    try {
      // 1. Get the suggestion
      const { data: suggestion, error: fetchError } = await supabase
        .from('suggestions')
        .select('*')
        .eq('id', suggestionId)
        .single();

      if (fetchError) throw fetchError;
      if (!suggestion) throw new Error('Sugestão não encontrada');

      // 2. Apply the change based on type
      if (suggestion.type === 'medication_create') {
        const medData = suggestion.suggestion_data as any;
        await supabase.from('medications').insert({
          name: medData.name,
          dosage: medData.dosage,
          frequency: medData.frequency,
          start_date: medData.start_date,
          end_date: medData.end_date,
          times: medData.times,
          notes: medData.notes,
          user_id: suggestion.patient_id,
        });
      } else if (suggestion.type === 'medication_update') {
        const medData = suggestion.suggestion_data as any;
        await supabase
          .from('medications')
          .update({
            name: medData.name,
            dosage: medData.dosage,
            frequency: medData.frequency,
            start_date: medData.start_date,
            end_date: medData.end_date,
            times: medData.times,
            notes: medData.notes,
          })
          .eq('id', suggestion.target_medication_id);
      } else if (suggestion.type === 'medication_delete') {
        await supabase
          .from('medications')
          .update({ active: false })
          .eq('id', suggestion.target_medication_id);
      }
      // Add appointment types here when needed

      // 3. Mark suggestion as approved
      const { error: updateError } = await supabase
        .from('suggestions')
        .update({
          status: 'approved',
          responded_at: new Date().toISOString(),
        })
        .eq('id', suggestionId);

      if (updateError) throw updateError;

      toast.success('Sugestão aprovada e aplicada!');
      await loadSuggestions();
      return true;
    } catch (error: any) {
      console.error('Error approving suggestion:', error);
      toast.error(error.message || 'Erro ao aprovar sugestão');
      return false;
    }
  };

  const rejectSuggestion = async (suggestionId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('suggestions')
        .update({
          status: 'rejected',
          patient_response: reason,
          responded_at: new Date().toISOString(),
        })
        .eq('id', suggestionId);

      if (error) throw error;

      toast.success('Sugestão recusada.');
      await loadSuggestions();
      return true;
    } catch (error: any) {
      console.error('Error rejecting suggestion:', error);
      toast.error(error.message || 'Erro ao recusar sugestão');
      return false;
    }
  };

  return {
    suggestions,
    loading,
    createSuggestion,
    approveSuggestion,
    rejectSuggestion,
    reload: loadSuggestions,
  };
}
