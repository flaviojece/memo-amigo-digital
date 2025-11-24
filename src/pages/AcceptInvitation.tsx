import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    if (!token) {
      toast.error('Token inválido');
      navigate('/');
      return;
    }

    // Check if user is logged in
    if (!user) {
      sessionStorage.setItem('pendingInvitationToken', token);
      toast.error('Você precisa estar logado para aceitar o convite');
      navigate('/login');
      return;
    }

    // First get the invitation without auto-join
    const { data, error } = await supabase
      .from('guardian_invitations')
      .select('*')
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .maybeSingle();

    if (error || !data) {
      logger.error('[AcceptInvitation] Error loading invitation:', error);
      toast.error('Convite não encontrado ou já foi usado');
      navigate('/');
      return;
    }

    if (new Date(data.expires_at) < new Date()) {
      toast.error('Este convite expirou');
      navigate('/');
      return;
    }

    // Separately fetch patient data
    const { data: patient, error: patientError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', data.patient_id)
      .maybeSingle();

    if (patientError) {
      logger.error('[AcceptInvitation] Error loading patient:', patientError);
    }

    setInvitation({ ...data, patient });
    setLoading(false);
  };

  const handleAccept = async () => {
    logger.log('[AcceptInvitation] Botão Aceitar clicado', { user, invitation });

    if (!user) {
      toast.error('Você precisa fazer login primeiro');
      navigate('/login');
      return;
    }

    if (!invitation || !invitation.id) {
      logger.error('[AcceptInvitation] Convite não carregado corretamente', invitation);
      toast.error('Convite não carregado. Recarregue a página e tente novamente.');
      return;
    }

    setProcessing(true);

    try {
      logger.log('[AcceptInvitation] Chamando função accept-invitation...', {
        invitationId: invitation.id,
      });
      
      const { data, error } = await supabase.functions.invoke('accept-invitation', {
        body: { invitation_id: invitation.id }
      });

      logger.log('[AcceptInvitation] Resposta da função:', { data, error });

      if (error || (data && (data as any).error)) {
        const message =
          (data as any)?.error ||
          (error as any)?.message ||
          'Erro ao aceitar convite';

        logger.error('[AcceptInvitation] Erro na função:', { data, error });
        toast.error(message);
        return;
      }

      toast.success((data as any)?.message || 'Convite aceito com sucesso!', {
        description: 'Redirecionando para o painel...',
        duration: 3000,
      });
      
      setTimeout(() => {
        navigate('/angel', { replace: true });
      }, 1500);

    } catch (err) {
      logger.error('[AcceptInvitation] Erro inesperado:', err);
      toast.error('Erro inesperado ao aceitar convite');
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    setProcessing(true);

    const { error } = await supabase
      .from('guardian_invitations')
      .update({
        status: 'declined',
        responded_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    if (error) {
      toast.error('Erro ao recusar convite');
      setProcessing(false);
      return;
    }

    toast.success('Convite recusado');
    navigate('/patient', { replace: true });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Convite para Cuidador</CardTitle>
          <CardDescription>
            Você foi convidado para acompanhar os cuidados de saúde de alguém
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 text-senior-base">
              ℹ️ O que você verá como Anjo:
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2 ml-4 list-none">
              <li>📋 Medicamentos e horários</li>
              <li>🩺 Consultas agendadas</li>
              <li>📞 Contatos de emergência</li>
              <li>📍 Localização em tempo real (quando ativada pelo paciente)</li>
              <li>🔔 Notificações importantes</li>
            </ul>
          </div>
          

          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium">{invitation.patient?.full_name || 'Usuário'}</p>
            <p className="text-sm text-muted-foreground">{invitation.patient?.email}</p>
            <p className="text-sm mt-2">
              Relacionamento: <strong>{invitation.relationship_type}</strong>
            </p>
            {invitation.message && (
              <p className="text-sm mt-2 p-2 bg-background rounded">
                "{invitation.message}"
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Ao aceitar, você poderá visualizar:
            </p>
            <ul className="text-sm space-y-1 ml-4">
              <li>✓ Medicamentos e horários</li>
              <li>✓ Consultas agendadas</li>
              <li>✓ Contatos de emergência</li>
              <li>✓ Notificações programadas</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Você terá acesso <strong>somente leitura</strong>. Não poderá editar ou excluir informações.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAccept}
              disabled={processing}
              className="flex-1"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Aceitar
            </Button>
            <Button
              variant="outline"
              onClick={handleDecline}
              disabled={processing}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Recusar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
