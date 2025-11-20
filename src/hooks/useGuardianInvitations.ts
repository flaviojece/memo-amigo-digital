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
      .in('status', ['pending', 'accepted', 'declined', 'revoked'])
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

    const { data: invitation, error } = await supabase
      .from('guardian_invitations')
      .insert({
        patient_id: user.id,
        invited_email: email,
        relationship_type: relationshipType,
        message: message || null,
      })
      .select()
      .single();

    if (error || !invitation) {
      toast.error('Erro ao enviar convite');
      return false;
    }

    // Buscar nome do paciente
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    // Enviar email via edge function
    try {
      const { data, error: emailError } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          invited_email: email,
          patient_name: profile?.full_name || user.email || 'Um paciente',
          relationship_type: relationshipType,
          invitation_token: invitation.invitation_token,
          message: message,
          site_url: window.location.origin,
        }
      });

      if (emailError) {
        console.error('Failed to send email:', emailError);
        toast.success('Convite criado, mas houve um erro ao enviar o email');
      } else {
        toast.success('Convite enviado por email para ' + email);
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      toast.success('Convite criado, mas houve um erro ao enviar o email');
    }

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
