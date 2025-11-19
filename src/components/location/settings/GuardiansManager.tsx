import { useState } from "react";
import { useGuardianRelationships } from "@/hooks/useGuardianRelationships";
import { useGuardianInvitations } from "@/hooks/useGuardianInvitations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Users, UserPlus, Mail, Check, X, Trash2, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function GuardiansManager() {
  const { guardians, loading: relationshipsLoading, revokeGuardian } = useGuardianRelationships();
  const { 
    sentInvitations, 
    receivedInvitations, 
    loading: invitationsLoading,
    sendInvitation,
    acceptInvitation,
    declineInvitation,
    revokeInvitation
  } = useGuardianInvitations();

  const [inviteEmail, setInviteEmail] = useState("");
  const [relationshipType, setRelationshipType] = useState("");
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !relationshipType) return;

    const success = await sendInvitation(inviteEmail, relationshipType);
    if (success) {
      setInviteEmail("");
      setRelationshipType("");
      setShowInviteForm(false);
    }
  };

  const handleRevokeConfirm = async () => {
    if (!selectedRelationship) return;
    await revokeGuardian(selectedRelationship);
    setRevokeDialogOpen(false);
    setSelectedRelationship(null);
  };

  if (relationshipsLoading || invitationsLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">Carregando guardiões...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Meus Anjos/Guardiões Ativos */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-senior-2xl">
                <Users className="w-8 h-8" />
                Meus Anjos/Guardiões
              </CardTitle>
              <CardDescription className="text-senior-base mt-1">
                Pessoas que podem ver sua localização
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowInviteForm(!showInviteForm)}
              size="lg"
              className="gap-2 text-senior-base px-6"
            >
              <UserPlus className="w-5 h-5" />
              Adicionar Anjo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulário de convite */}
          {showInviteForm && (
            <form onSubmit={handleSendInvite} className="p-4 bg-muted/50 rounded-lg space-y-4">
              <div>
                <Label htmlFor="email" className="text-senior-base">Email do guardião</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="exemplo@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="text-senior-base"
                />
              </div>
              <div>
                <Label htmlFor="relationship" className="text-senior-base">Tipo de relacionamento</Label>
                <Select value={relationshipType} onValueChange={setRelationshipType} required>
                  <SelectTrigger id="relationship" className="text-senior-base">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">Familiar</SelectItem>
                    <SelectItem value="caregiver">Cuidador(a)</SelectItem>
                    <SelectItem value="friend">Amigo(a)</SelectItem>
                    <SelectItem value="healthcare">Profissional de Saúde</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Enviar Convite
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowInviteForm(false);
                    setInviteEmail("");
                    setRelationshipType("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          {/* Lista de guardiões ativos */}
          {guardians.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-senior-lg font-semibold">Nenhum anjo cadastrado ainda</p>
              <p className="text-senior-base mt-2">Adicione pessoas de confiança para compartilhar sua localização</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {guardians.map((guardian) => (
                <div
                  key={guardian.id}
                  className="flex items-center justify-between p-6 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg hover:shadow-md transition-all border border-border"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Users className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-senior-lg">{guardian.guardian_name}</p>
                      <p className="text-senior-base text-muted-foreground">{guardian.guardian_email}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-senior-sm px-2 py-1">
                          {guardian.relationship_type || "Guardião"}
                        </Badge>
                        <Badge variant="secondary" className="text-senior-sm px-2 py-1">
                          {guardian.access_level}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={() => {
                      setSelectedRelationship(guardian.id);
                      setRevokeDialogOpen(true);
                    }}
                    className="gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Remover
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Convites Pendentes */}
      {(sentInvitations.length > 0 || receivedInvitations.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-senior-xl">
              <Mail className="w-6 h-6" />
              Convites Pendentes
            </CardTitle>
            <CardDescription className="text-senior-sm">
              Convites enviados e recebidos aguardando resposta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Convites Enviados */}
            {sentInvitations.length > 0 && (
              <div>
                <h4 className="font-semibold text-senior-base mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Enviados por mim
                </h4>
                <div className="space-y-2">
                  {sentInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-senior-base">{invitation.invited_email}</p>
                        <p className="text-senior-sm text-muted-foreground">
                          Enviado em {format(new Date(invitation.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeInvitation(invitation.id)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sentInvitations.length > 0 && receivedInvitations.length > 0 && (
              <Separator />
            )}

            {/* Convites Recebidos */}
            {receivedInvitations.length > 0 && (
              <div>
                <h4 className="font-semibold text-senior-base mb-3">Recebidos</h4>
                <div className="space-y-2">
                  {receivedInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="p-3 bg-primary/5 border-2 border-primary/20 rounded-lg space-y-3"
                    >
                      <div>
                        <p className="font-semibold text-senior-base">
                          {invitation.patient?.full_name || "Paciente"} quer que você seja um guardião
                        </p>
                        <p className="text-senior-sm text-muted-foreground">
                          {invitation.patient?.email || invitation.invited_email}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 gap-2"
                          onClick={() => acceptInvitation(invitation.id)}
                        >
                          <Check className="w-4 h-4" />
                          Aceitar
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 gap-2"
                          onClick={() => declineInvitation(invitation.id)}
                        >
                          <X className="w-4 h-4" />
                          Recusar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmação de revogação */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover acesso do guardião?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta pessoa não poderá mais ver sua localização. Você pode convidá-la novamente depois se quiser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeConfirm}>
              Confirmar Remoção
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
