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
      .select('id, status')
      .eq('patient_id', user.id)
      .eq('invited_email', email)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      toast.error('Já existe um convite pendente para este email. Use "Reenviar" ou "Excluir" o convite existente.');
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
        toast.success(`Convite enviado para ${email}!`, {
          description: 'Ative o compartilhamento de localização para que seu anjo possa te encontrar.',
          action: {
            label: 'Ativar Agora',
            onClick: () => {
              window.location.href = '/location-sharing-settings';
            }
          },
          duration: 10000,
        });
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      toast.success('Convite criado, mas houve um erro ao enviar o email');
    }

    await loadSentInvitations();
    return true;
  };

  const acceptInvitation = async (invitationId: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para aceitar convites');
      return false;
    }

    try {
      console.log('[Guardian] Aceitando convite:', invitationId);

      // 1. Verificar se o convite existe e é válido
      const { data: existingInvitation, error: checkError } = await supabase
        .from('guardian_invitations')
        .select('*, patient:profiles!patient_id(full_name)')
        .eq('id', invitationId)
        .eq('status', 'pending')
        .maybeSingle();

      if (checkError || !existingInvitation) {
        console.error('[Guardian] Convite não encontrado:', checkError);
        toast.error('Convite não encontrado ou já foi processado');
        return false;
      }

      // Verificar expiração
      if (existingInvitation.expires_at && new Date(existingInvitation.expires_at) < new Date()) {
        toast.error('Este convite expirou');
        return false;
      }

      console.log('[Guardian] Convite válido, atualizando status...');

      // 2. Atualizar convite para aceito
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

      if (updateError || !invitation) {
        console.error('[Guardian] Erro ao atualizar convite:', updateError);
        toast.error('Erro ao aceitar convite');
        return false;
      }

      console.log('[Guardian] Convite atualizado, verificando relacionamento existente...');

      // 3. Verificar se já existe relacionamento (prevenir duplicatas)
      const { data: existingRelationship } = await supabase
        .from('guardian_relationships')
        .select('id')
        .eq('patient_id', invitation.patient_id)
        .eq('guardian_id', user.id)
        .maybeSingle();

      if (existingRelationship) {
        console.log('[Guardian] Relacionamento já existe, pulando criação');
        toast.success('Convite aceito! Você já está vinculado a este paciente.');
      } else {
        console.log('[Guardian] Criando novo relacionamento...');

        // 4. Criar relacionamento
        const { error: relationshipError } = await supabase
          .from('guardian_relationships')
          .insert({
            patient_id: invitation.patient_id,
            guardian_id: user.id,
            access_level: invitation.access_level,
            relationship_type: invitation.relationship_type,
          });

        if (relationshipError) {
          console.error('[Guardian] Erro ao criar relacionamento:', relationshipError);
          
          // Verificar se é erro de duplicata (apesar da verificação anterior)
          if (relationshipError.code === '23505') {
            toast.success('Convite aceito! Você já está vinculado a este paciente.');
          } else {
            toast.error('Erro ao criar relacionamento com o paciente');
            return false;
          }
        } else {
          console.log('[Guardian] Relacionamento criado com sucesso');
        }
      }

      // 5. Adicionar role 'angel' se não tiver
      console.log('[Guardian] Verificando role angel...');
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'angel')
        .maybeSingle();

      if (!roles) {
        console.log('[Guardian] Adicionando role angel...');
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role: 'angel',
          });

        if (roleError) {
          console.error('[Guardian] Erro ao adicionar role:', roleError);
          // Não falhamos por isso, apenas logamos
        }
      }

      const patientName = (existingInvitation.patient as any)?.full_name || 'este paciente';
      toast.success(`Convite aceito! Você agora é cuidador de ${patientName}.`, {
        description: 'Redirecionando para o painel...',
        duration: 3000,
      });

      console.log('[Guardian] Convite aceito com sucesso!');
      await loadReceivedInvitations();
      return true;

    } catch (error) {
      console.error('[Guardian] Erro inesperado ao aceitar convite:', error);
      toast.error('Erro inesperado ao aceitar convite');
      return false;
    }
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

  const deleteInvitation = async (invitationId: string) => {
    const { error } = await supabase
      .from('guardian_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
      toast.error('Erro ao excluir convite');
      return false;
    }

    toast.success('Convite excluído');
    await loadSentInvitations();
    return true;
  };

  const resendInvitationEmail = async (invitation: Invitation) => {
    if (!user) return false;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          invited_email: invitation.invited_email,
          patient_name: profile?.full_name || user.email || 'Um paciente',
          relationship_type: invitation.relationship_type || 'family',
          invitation_token: invitation.id,
          message: null,
          site_url: window.location.origin,
        }
      });

      if (emailError) {
        console.error('Failed to resend email:', emailError);
        toast.error('Erro ao reenviar email');
        return false;
      }

      toast.success('Email reenviado para ' + invitation.invited_email);
      return true;
    } catch (error) {
      console.error('Error resending email:', error);
      toast.error('Erro ao reenviar email');
      return false;
    }
  };

  return {
    sentInvitations,
    receivedInvitations,
    loading,
    sendInvitation,
    acceptInvitation,
    declineInvitation,
    revokeInvitation,
    deleteInvitation,
    resendInvitationEmail,
    reload: () => Promise.all([loadSentInvitations(), loadReceivedInvitations()]),
  };
};
