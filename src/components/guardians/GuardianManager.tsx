import { useState } from 'react';
import { useGuardianRelationships } from '@/hooks/useGuardianRelationships';
import { useGuardianInvitations } from '@/hooks/useGuardianInvitations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GuardianNotificationSettings } from './GuardianNotificationSettings';
import { Users, UserPlus, Mail, Check, X, Trash2, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const GuardianManager = () => {
  const { guardians, patients, loading: relationshipsLoading, revokeGuardian } = useGuardianRelationships();
  const { 
    sentInvitations, 
    receivedInvitations, 
    loading: invitationsLoading,
    sendInvitation,
    acceptInvitation,
    declineInvitation,
    revokeInvitation
  } = useGuardianInvitations();

  const [inviteEmail, setInviteEmail] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<string | null>(null);
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string } | null>(null);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !relationshipType) return;

    const success = await sendInvitation(inviteEmail, relationshipType);
    if (success) {
      setInviteEmail('');
      setRelationshipType('');
    }
  };

  const handleRevokeConfirm = async () => {
    if (!selectedRelationship) return;
    await revokeGuardian(selectedRelationship);
    setRevokeDialogOpen(false);
    setSelectedRelationship(null);
  };

  if (relationshipsLoading || invitationsLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="guardians" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="guardians">
            <Users className="w-4 h-4 mr-2" />
            Meus Cuidadores
          </TabsTrigger>
          <TabsTrigger value="patients">
            <Users className="w-4 h-4 mr-2" />
            Cuido de
          </TabsTrigger>
          <TabsTrigger value="invites">
            <Mail className="w-4 h-4 mr-2" />
            Convites
            {receivedInvitations.length > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {receivedInvitations.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guardians" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Convidar Cuidador
              </CardTitle>
              <CardDescription>
                Convide familiares ou cuidadores para acompanharem seus medicamentos e consultas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email do cuidador</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="exemplo@email.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="relationship">Tipo de relacionamento</Label>
                  <Select value={relationshipType} onValueChange={setRelationshipType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="filho">Filho(a)</SelectItem>
                      <SelectItem value="esposo">Esposo(a)</SelectItem>
                      <SelectItem value="neto">Neto(a)</SelectItem>
                      <SelectItem value="cuidador">Cuidador Profissional</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar Convite
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cuidadores Autorizados ({guardians.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {guardians.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum cuidador autorizado ainda
                </p>
              ) : (
                <ul className="space-y-3">
                  {guardians.map((guardian) => (
                    <li key={guardian.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{guardian.guardian_name}</p>
                        <p className="text-sm text-muted-foreground">{guardian.guardian_email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {guardian.relationship_type} • Desde {format(new Date(guardian.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedRelationship(guardian.id);
                          setRevokeDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {sentInvitations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Convites Enviados</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {sentInvitations.map((inv) => (
                    <li key={inv.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="text-sm font-medium">{inv.invited_email}</p>
                        <p className="text-xs text-muted-foreground">
                          {inv.status === 'pending' && `Pendente • Expira em ${format(new Date(inv.expires_at), 'dd/MM')}`}
                          {inv.status === 'accepted' && 'Aceito ✓'}
                          {inv.status === 'declined' && 'Recusado'}
                        </p>
                      </div>
                      {inv.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeInvitation(inv.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="patients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pessoas que Cuido ({patients.length})</CardTitle>
              <CardDescription>
                Você tem acesso aos dados de saúde destas pessoas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patients.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Você ainda não cuida de ninguém
                </p>
              ) : (
                <ul className="space-y-3">
                  {patients.map((patient) => (
                    <li key={patient.patient_id} className="p-3 border rounded-lg">
                      <p className="font-medium">{patient.patient_name}</p>
                      <p className="text-sm text-muted-foreground">{patient.patient_email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {patient.relationship_type} • Desde {format(new Date(patient.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Convites Recebidos ({receivedInvitations.length})</CardTitle>
              <CardDescription>
                Pessoas que querem que você acompanhe seus cuidados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {receivedInvitations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum convite pendente
                </p>
              ) : (
                <ul className="space-y-3">
                  {receivedInvitations.map((inv: any) => (
                    <li key={inv.id} className="p-4 border rounded-lg space-y-3">
                      <div>
                        <p className="font-medium">{inv.patient?.full_name || 'Usuário'}</p>
                        <p className="text-sm text-muted-foreground">{inv.patient?.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Relacionamento: {inv.relationship_type}
                        </p>
                        {inv.message && (
                          <p className="text-sm mt-2 p-2 bg-muted rounded">
                            "{inv.message}"
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => acceptInvitation(inv.id)}
                          className="flex-1"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Aceitar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => declineInvitation(inv.id)}
                          className="flex-1"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Recusar
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar acesso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta pessoa não poderá mais ver seus medicamentos e consultas. Você pode convidá-la novamente depois se quiser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeConfirm} className="bg-destructive text-destructive-foreground">
              Revogar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={notificationSettingsOpen} onOpenChange={setNotificationSettingsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurações de Notificação</DialogTitle>
            <DialogDescription>
              Configure quais notificações você deseja receber sobre este paciente
            </DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <GuardianNotificationSettings
              patientId={selectedPatient.id}
              patientName={selectedPatient.name}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
