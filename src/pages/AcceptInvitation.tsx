import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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

    const { data, error } = await supabase
      .from('guardian_invitations')
      .select('*, patient:profiles!patient_id(full_name, email)')
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .maybeSingle();

    if (error || !data) {
      toast.error('Convite não encontrado ou já foi usado');
      navigate('/');
      return;
    }

    if (new Date(data.expires_at) < new Date()) {
      toast.error('Este convite expirou');
      navigate('/');
      return;
    }

    setInvitation(data);
    setLoading(false);
  };

  const handleAccept = async () => {
    if (!user) {
      toast.error('Você precisa fazer login primeiro');
      navigate('/login');
      return;
    }

    setProcessing(true);

    const { error: updateError } = await supabase
      .from('guardian_invitations')
      .update({
        status: 'accepted',
        guardian_id: user.id,
        responded_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    if (updateError) {
      toast.error('Erro ao aceitar convite');
      setProcessing(false);
      return;
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
      setProcessing(false);
      return;
    }

    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'angel')
      .maybeSingle();

    if (!existingRole) {
      await supabase.from('user_roles').insert({
        user_id: user.id,
        role: 'angel',
      });
    }

    toast.success('Convite aceito com sucesso!');
    navigate('/');
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
    navigate('/');
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
