import { useGuardianNotificationPreferences } from '@/hooks/useGuardianNotificationPreferences';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Bell, BellOff, Pill, Calendar } from 'lucide-react';

interface GuardianNotificationSettingsProps {
  patientId: string;
  patientName: string;
}

export const GuardianNotificationSettings = ({ 
  patientId, 
  patientName 
}: GuardianNotificationSettingsProps) => {
  const { preferences, loading, updatePreferences, toggleEnabled } = useGuardianNotificationPreferences(patientId);

  if (loading) {
    return <div className="text-center py-8">Carregando preferências...</div>;
  }

  if (!preferences) {
    return <div className="text-center py-8 text-muted-foreground">Não foi possível carregar as preferências.</div>;
  }

  const handleToggle = async (field: string, value: boolean) => {
    await updatePreferences({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {preferences.enabled ? (
              <Bell className="w-5 h-5 text-primary" />
            ) : (
              <BellOff className="w-5 h-5 text-muted-foreground" />
            )}
            Notificações para {patientName}
          </CardTitle>
          <CardDescription>
            Configure quais notificações você deseja receber sobre este paciente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Switch principal */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="enabled" className="text-base font-medium">
                Notificações Ativas
              </Label>
              <p className="text-sm text-muted-foreground">
                Ativar/desativar todas as notificações
              </p>
            </div>
            <Switch
              id="enabled"
              checked={preferences.enabled}
              onCheckedChange={toggleEnabled}
            />
          </div>

          <Separator />

          {/* Notificações de Medicamentos */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Medicamentos</h3>
            </div>

            <div className="space-y-4 pl-7">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="med-taken" className="text-sm">
                    Medicamento Tomado
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Quando o paciente registra que tomou um medicamento
                  </p>
                </div>
                <Switch
                  id="med-taken"
                  checked={preferences.notify_medication_taken}
                  onCheckedChange={(value) => handleToggle('notify_medication_taken', value)}
                  disabled={!preferences.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="med-missed" className="text-sm">
                    Medicamento Perdido
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Quando o paciente perde um horário de medicamento
                  </p>
                </div>
                <Switch
                  id="med-missed"
                  checked={preferences.notify_medication_missed}
                  onCheckedChange={(value) => handleToggle('notify_medication_missed', value)}
                  disabled={!preferences.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="med-upcoming" className="text-sm">
                    Lembrete de Medicamento
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    30 minutos antes do horário do medicamento
                  </p>
                </div>
                <Switch
                  id="med-upcoming"
                  checked={preferences.notify_medication_upcoming}
                  onCheckedChange={(value) => handleToggle('notify_medication_upcoming', value)}
                  disabled={!preferences.enabled}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notificações de Consultas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Consultas</h3>
            </div>

            <div className="space-y-4 pl-7">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="appt-created" className="text-sm">
                    Nova Consulta Agendada
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Quando o paciente agenda uma nova consulta
                  </p>
                </div>
                <Switch
                  id="appt-created"
                  checked={preferences.notify_appointment_created}
                  onCheckedChange={(value) => handleToggle('notify_appointment_created', value)}
                  disabled={!preferences.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="appt-upcoming" className="text-sm">
                    Lembrete de Consulta
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    1 dia antes da consulta
                  </p>
                </div>
                <Switch
                  id="appt-upcoming"
                  checked={preferences.notify_appointment_upcoming}
                  onCheckedChange={(value) => handleToggle('notify_appointment_upcoming', value)}
                  disabled={!preferences.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="appt-completed" className="text-sm">
                    Consulta Concluída
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Quando uma consulta é marcada como concluída
                  </p>
                </div>
                <Switch
                  id="appt-completed"
                  checked={preferences.notify_appointment_completed}
                  onCheckedChange={(value) => handleToggle('notify_appointment_completed', value)}
                  disabled={!preferences.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="appt-cancelled" className="text-sm">
                    Consulta Cancelada
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Quando uma consulta é cancelada
                  </p>
                </div>
                <Switch
                  id="appt-cancelled"
                  checked={preferences.notify_appointment_cancelled}
                  onCheckedChange={(value) => handleToggle('notify_appointment_cancelled', value)}
                  disabled={!preferences.enabled}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
