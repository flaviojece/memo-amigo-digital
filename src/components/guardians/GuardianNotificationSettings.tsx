import { useGuardianNotificationPreferences } from '@/hooks/useGuardianNotificationPreferences';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

              {/* Escalonamento: quanto esperar antes de avisar, e quando não incomodar */}
              {preferences.notify_medication_missed && (
                <div className="rounded-lg border p-3 space-y-3 bg-muted/30">
                  <div className="space-y-1">
                    <Label htmlFor="escalate" className="text-sm">
                      Avisar depois de quantos minutos
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Tempo de tolerância antes de considerar a dose perdida
                    </p>
                    <Select
                      value={String(preferences.escalate_after_minutes)}
                      onValueChange={(v) =>
                        updatePreferences({ escalate_after_minutes: Number(v) })
                      }
                      disabled={!preferences.enabled}
                    >
                      <SelectTrigger id="escalate" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Não avisar</SelectItem>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                        <SelectItem value="120">2 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm">Não me avise entre</Label>
                    <p className="text-xs text-muted-foreground">
                      Fora desta janela você recebe normalmente
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="time"
                        aria-label="Início do silêncio"
                        value={preferences.quiet_hours_start?.slice(0, 5) ?? "22:00"}
                        onChange={(e) =>
                          updatePreferences({ quiet_hours_start: e.target.value })
                        }
                        disabled={!preferences.enabled}
                      />
                      <span className="text-sm text-muted-foreground">e</span>
                      <Input
                        type="time"
                        aria-label="Fim do silêncio"
                        value={preferences.quiet_hours_end?.slice(0, 5) ?? "07:00"}
                        onChange={(e) =>
                          updatePreferences({ quiet_hours_end: e.target.value })
                        }
                        disabled={!preferences.enabled}
                      />
                    </div>
                  </div>
                </div>
              )}

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
