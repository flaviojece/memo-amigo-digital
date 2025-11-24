import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, TestTube } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const NotificationSettings = () => {
  const { user } = useAuth();
  const { permission, isSupported, isGranted, requestPermission, subscribeToPush, showTestNotification } = useNotifications();
  const [enabled, setEnabled] = useState(false);
  const [upcomingNotifications, setUpcomingNotifications] = useState<any[]>([]);

  useEffect(() => {
    loadSettings();
    loadUpcomingNotifications();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('notifications_enabled')
      .eq('id', user.id)
      .single();

    if (data) {
      setEnabled(data.notifications_enabled ?? true);
    }
  };

  const loadUpcomingNotifications = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('notification_schedules')
      .select('*')
      .eq('user_id', user.id)
      .eq('sent', false)
      .gte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(5);

    if (data) {
      setUpcomingNotifications(data);
    }
  };

  const handleToggle = async (checked: boolean) => {
    if (checked && !isGranted) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ notifications_enabled: checked })
      .eq('id', user!.id);

    if (error) {
      toast.error('Erro ao salvar configuração');
      return;
    }

    setEnabled(checked);
    
    // Se ativou, subscrever ao Web Push
    if (checked && isGranted) {
      const subscribed = await subscribeToPush();
      if (!subscribed) {
        console.warn('⚠️ Falha ao subscrever push');
      }
    }
    
    toast.success(checked ? 'Notificações ativadas' : 'Notificações desativadas');
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="w-5 h-5" />
            Notificações não suportadas
          </CardTitle>
          <CardDescription>
            Seu navegador não suporta notificações. Tente usar Chrome, Firefox ou Safari.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificações
          </CardTitle>
          <CardDescription>
            Receba lembretes de medicamentos e consultas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Ativar notificações</p>
              <p className="text-sm text-muted-foreground">
                Avisos 30min antes de remédios e 1 dia antes de consultas
              </p>
            </div>
            <Switch
              checked={enabled && isGranted}
              onCheckedChange={handleToggle}
            />
          </div>

          {isGranted && (
            <Button
              variant="outline"
              onClick={showTestNotification}
              className="w-full"
            >
              <TestTube className="w-4 h-4 mr-2" />
              Testar Notificação
            </Button>
          )}
        </CardContent>
      </Card>

      {enabled && upcomingNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Próximas notificações</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {upcomingNotifications.map((notif) => (
                <li key={notif.id} className="text-sm border-l-2 border-primary pl-3 py-1">
                  <p className="font-medium">{notif.title}</p>
                  <p className="text-muted-foreground">{notif.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(notif.scheduled_for), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
