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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Users, UserPlus, Mail, Check, X, Send, Clock, UserX, CheckCircle2, XCircle, AlertCircle, RefreshCw, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function GuardiansManager() {
  const { guardians, loading: relationshipsLoading, revokeGuardian } = useGuardianRelationships();
  const { 
    sentInvitations, 
    receivedInvitations, 
    loading: invitationsLoading,
    sendInvitation,
    acceptInvitation,
    declineInvitation,
    revokeInvitation,
    deleteInvitation,
    resendInvitationEmail
  } = useGuardianInvitations();

  const [inviteEmail, setInviteEmail] = useState("");
  const [relationshipType, setRelationshipType] = useState("family");
  const [selectedGuardianForRemoval, setSelectedGuardianForRemoval] = useState<any>(null);
  const [isRemovalDialogOpen, setIsRemovalDialogOpen] = useState(false);

  const handleSendInvite = async () => {
    if (!inviteEmail) return;
    
    const success = await sendInvitation(inviteEmail, relationshipType);
    if (success) {
      setInviteEmail("");
      setRelationshipType("family");
    }
  };

  const handleRevokeConfirm = async () => {
    if (!selectedGuardianForRemoval) return;
    await revokeGuardian(selectedGuardianForRemoval.id);
    setIsRemovalDialogOpen(false);
    setSelectedGuardianForRemoval(null);
  };

  if (relationshipsLoading || invitationsLoading) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="py-8">
          <div className="text-center text-sm text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                Meus Anjos
              </CardTitle>
              <CardDescription className="text-xs">
                {guardians.length} pessoa(s) com acesso à sua localização
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {guardians.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <UserX className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Nenhum anjo autorizado</p>
              <p className="text-xs">Convide pessoas para acompanhar você</p>
            </div>
          ) : (
            <div className="space-y-2">
              {guardians.map((guardian) => (
                <div key={guardian.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {guardian.guardian_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{guardian.guardian_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span>{guardian.guardian_email}</span>
                        {guardian.relationship_type && (
                          <>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                              {guardian.relationship_type === "family" ? "Família" : guardian.relationship_type === "friend" ? "Amigo" : guardian.relationship_type === "caregiver" ? "Cuidador" : guardian.relationship_type}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedGuardianForRemoval(guardian); setIsRemovalDialogOpen(true); }} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Separator className="my-3" />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              <h3 className="font-medium text-sm">Adicionar Anjo</h3>
            </div>
            <div className="grid gap-3">
              <div>
                <Label htmlFor="invite-email" className="text-xs font-medium">Email do Anjo</Label>
                <Input id="invite-email" type="email" placeholder="anjo@exemplo.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label htmlFor="relationship-type" className="text-xs font-medium">Tipo de Relacionamento</Label>
                <Select value={relationshipType} onValueChange={setRelationshipType}>
                  <SelectTrigger id="relationship-type" className="mt-1 h-9 text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">Família</SelectItem>
                    <SelectItem value="friend">Amigo</SelectItem>
                    <SelectItem value="caregiver">Cuidador</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSendInvite} disabled={!inviteEmail} className="w-full" size="sm"><Send className="w-3 h-3 mr-2" />Enviar Convite</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {(sentInvitations.length > 0 || receivedInvitations.length > 0) && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2"><Clock className="w-4 h-4" />Convites Pendentes</CardTitle>
            <CardDescription className="text-xs">Convites enviados e recebidos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sentInvitations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-xs flex items-center gap-2 text-muted-foreground"><Send className="w-3 h-3" />Enviados ({sentInvitations.length})</h4>
                <div className="space-y-2">
                  {sentInvitations.map((invitation) => {
                    const statusConfig = {
                      pending: { 
                        label: 'Pendente', 
                        variant: 'default' as const, 
                        icon: <Clock className="w-3 h-3" />,
                        className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20'
                      },
                      revoked: { 
                        label: 'Revogado', 
                        variant: 'secondary' as const, 
                        icon: <XCircle className="w-3 h-3" />,
                        className: 'bg-muted text-muted-foreground border-border'
                      },
                      accepted: { 
                        label: 'Aceito', 
                        variant: 'default' as const, 
                        icon: <CheckCircle2 className="w-3 h-3" />,
                        className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
                      },
                      declined: { 
                        label: 'Recusado', 
                        variant: 'destructive' as const, 
                        icon: <AlertCircle className="w-3 h-3" />,
                        className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
                      },
                    };
                    
                    const status = statusConfig[invitation.status as keyof typeof statusConfig] || statusConfig.pending;
                    const isRevoked = invitation.status === 'revoked';
                    
                    return (
                      <div key={invitation.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{invitation.invited_email}</p>
                            <Badge variant={status.variant} className={`text-xs px-1.5 py-0 flex items-center gap-1 ${status.className}`}>
                              {status.icon}
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(invitation.created_at!), { addSuffix: true, locale: ptBR })}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => revokeInvitation(invitation.id)} 
                          disabled={isRevoked}
                          className={`h-8 w-8 p-0 ${isRevoked ? 'opacity-50 cursor-not-allowed' : 'text-destructive hover:text-destructive hover:bg-destructive/10'}`}
                          title={isRevoked ? 'Convite já revogado' : 'Revogar convite'}
                        >
                          {isRevoked ? <CheckCircle2 className="w-4 h-4 text-muted-foreground" /> : <X className="w-4 h-4" />}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {receivedInvitations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-xs flex items-center gap-2 text-muted-foreground"><Mail className="w-3 h-3" />Recebidos ({receivedInvitations.length})</h4>
                <div className="space-y-2">
                  {receivedInvitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{invitation.patient?.full_name || invitation.patient?.email}</p>
                        <p className="text-xs text-muted-foreground">Quer que você seja seu anjo</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => acceptInvitation(invitation.id)} className="gap-1 h-8 text-xs"><Check className="w-3 h-3" />Aceitar</Button>
                        <Button variant="outline" size="sm" onClick={() => declineInvitation(invitation.id)} className="h-8 w-8 p-0"><X className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={isRemovalDialogOpen} onOpenChange={setIsRemovalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Acesso?</AlertDialogTitle>
            <AlertDialogDescription>Você está prestes a remover o acesso de <strong>{selectedGuardianForRemoval?.guardian_name}</strong> à sua localização. Esta pessoa não poderá mais ver onde você está.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover Acesso</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
