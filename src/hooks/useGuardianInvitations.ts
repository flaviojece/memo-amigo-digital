import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Invitation {
  id: string;
  invited_email: string;
  relationship_type: string | null;
  status: string;
  created_at: string;
  expires_at: string;
  patient?: {
    full_name: string;
    email: string;
  };
}

export const useGuardianInvitations = () => {
  const { user } = useAuth();
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([]);
  const [receivedInvitations, setReceivedInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSentInvitations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('guardian_invitations')
      .select('*')
      .eq('patient_id', user.id)
      .in('status', ['pending', 'accepted', 'declined'])
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSentInvitations(data);
    }
  };

  const loadReceivedInvitations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('guardian_invitations')
      .select('*, patient:profiles!patient_id(full_name, email)')
      .or(`invited_email.eq.${user.email},guardian_id.eq.${user.id}`)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReceivedInvitations(data as any);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadSentInvitations(), loadReceivedInvitations()]);
      setLoading(false);
    };

    load();
  }, [user]);

  const sendInvitation = async (
    email: string,
    relationshipType: string,
    message?: string
  ) => {
    if (!user) return false;

    const { data: existing } = await supabase
      .from('guardian_invitations')
      .select('id')
      .eq('patient_id', user.id)
      .eq('invited_email', email)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      toast.error('Já existe um convite pendente para este email');
      return false;
    }

    const { error } = await supabase
      .from('guardian_invitations')
      .insert({
        patient_id: user.id,
        invited_email: email,
        relationship_type: relationshipType,
        message: message || null,
      });

    if (error) {
      toast.error('Erro ao enviar convite');
      return false;
    }

    toast.success('Convite enviado com sucesso!');
    await loadSentInvitations();
    return true;
  };

  const acceptInvitation = async (invitationId: string) => {
    if (!user) return false;

    const { data: invitation, error: updateError } = await supabase
      .from('guardian_invitations')
      .update({
        status: 'accepted',
        guardian_id: user.id,
        responded_at: new Date().toISOString(),
      })
      .eq('id', invitationId)
      .select()
      .single();

    if (updateError) {
      toast.error('Erro ao aceitar convite');
      return false;
    }

    const { error: relationshipError } = await supabase
      .from('guardian_relationships')
      .insert({
        patient_id: invitation.patient_id,
        guardian_id: user.id,
        access_level: invitation.access_level,
        relationship_type: invitation.relationship_type,
      });

    if (relationshipError) {
      toast.error('Erro ao criar relacionamento');
      return false;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'angel')
      .maybeSingle();

    if (!roles) {
      await supabase.from('user_roles').insert({
        user_id: user.id,
        role: 'angel',
      });
    }

    toast.success('Convite aceito! Você agora é um cuidador.');
    await loadReceivedInvitations();
    return true;
  };

  const declineInvitation = async (invitationId: string) => {
    const { error } = await supabase
      .from('guardian_invitations')
      .update({
        status: 'declined',
        responded_at: new Date().toISOString(),
      })
      .eq('id', invitationId);

    if (error) {
      toast.error('Erro ao recusar convite');
      return false;
    }

    toast.success('Convite recusado');
    await loadReceivedInvitations();
    return true;
  };

  const revokeInvitation = async (invitationId: string) => {
    const { error } = await supabase
      .from('guardian_invitations')
      .update({ status: 'revoked' })
      .eq('id', invitationId);

    if (error) {
      toast.error('Erro ao revogar convite');
      return false;
    }

    toast.success('Convite revogado');
    await loadSentInvitations();
    return true;
  };

  return {
    sentInvitations,
    receivedInvitations,
    loading,
    sendInvitation,
    acceptInvitation,
    declineInvitation,
    revokeInvitation,
    reload: () => Promise.all([loadSentInvitations(), loadReceivedInvitations()]),
  };
};
