import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Guardian {
  id: string;
  guardian_id: string;
  guardian_name: string;
  guardian_email: string;
  relationship_type: string | null;
  access_level: string;
  created_at: string;
}

interface Patient {
  patient_id: string;
  patient_name: string;
  patient_email: string;
  relationship_type: string | null;
  access_level: string;
  created_at: string;
}

export const useGuardianRelationships = () => {
  const { user } = useAuth();
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGuardians = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('guardian_relationships')
      .select(`
        id,
        guardian_id,
        relationship_type,
        access_level,
        created_at,
        guardian:profiles!guardian_id (
          full_name,
          email
        )
      `)
      .eq('patient_id', user.id)
      .eq('status', 'active');

    if (error) {
      console.error('Erro ao carregar guardians:', error);
      return;
    }

    const formatted = (data || []).map((item: any) => ({
      id: item.id,
      guardian_id: item.guardian_id,
      guardian_name: item.guardian?.full_name || 'Sem nome',
      guardian_email: item.guardian?.email || '',
      relationship_type: item.relationship_type,
      access_level: item.access_level,
      created_at: item.created_at,
    }));

    setGuardians(formatted);
  };

  const loadPatients = async () => {
    if (!user) return;

    const { data, error } = await supabase.rpc('get_patients_for_guardian', {
      _guardian_id: user.id
    });

    if (error) {
      console.error('Erro ao carregar pacientes:', error);
      return;
    }

    setPatients(data || []);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadGuardians(), loadPatients()]);
      setLoading(false);
    };

    load();
  }, [user]);

  const revokeGuardian = async (relationshipId: string) => {
    const { error } = await supabase
      .from('guardian_relationships')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoked_by: user!.id,
      })
      .eq('id', relationshipId);

    if (error) {
      toast.error('Erro ao revogar acesso');
      return false;
    }

    toast.success('Acesso revogado com sucesso');
    await loadGuardians();
    return true;
  };

  return {
    guardians,
    patients,
    loading,
    revokeGuardian,
    reload: () => Promise.all([loadGuardians(), loadPatients()]),
  };
};
