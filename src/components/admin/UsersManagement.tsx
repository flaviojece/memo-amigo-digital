import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Search, Trash2, Edit, Eye, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type UserWithRoles = {
  id: string;
  email: string | null;
  full_name: string | null;
  notifications_enabled: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  roles: Array<{ id: string; user_id: string; role: string; created_at: string | null }>;
};

export function UsersManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<{ id: string; email: string } | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [userToEdit, setUserToEdit] = useState<UserWithRoles | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    notifications_enabled: true,
    roles: [] as string[]
  });
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      return profiles?.map((profile) => ({
        ...profile,
        roles: roles?.filter((r) => r.user_id === profile.id) || [],
      }));
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Usuário deletado com sucesso");
      setUserToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar usuário");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { userId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Email de redefinição de senha enviado com sucesso");
      setUserToResetPassword(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao enviar email de redefinição");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates, rolesToAdd, rolesToRemove }: {
      userId: string;
      updates: { full_name?: string; notifications_enabled?: boolean };
      rolesToAdd: string[];
      rolesToRemove: string[];
    }) => {
      // Atualizar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (profileError) throw profileError;

      // Gerenciar roles via edge function
      if (rolesToAdd.length > 0 || rolesToRemove.length > 0) {
        const { data, error } = await supabase.functions.invoke('admin-manage-user-roles', {
          body: { userId, rolesToAdd, rolesToRemove },
        });
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Usuário atualizado com sucesso");
      setUserToEdit(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar usuário");
    },
  });

  const handleEditUser = (user: UserWithRoles) => {
    setUserToEdit(user);
    setEditForm({
      full_name: user.full_name || "",
      notifications_enabled: user.notifications_enabled ?? true,
      roles: user.roles.map(r => r.role)
    });
  };

  const handleSaveEdit = () => {
    if (!userToEdit) return;

    const currentRoles = userToEdit.roles.map(r => r.role);
    const newRoles = editForm.roles;

    const rolesToAdd = newRoles.filter(r => !currentRoles.includes(r));
    const rolesToRemove = currentRoles.filter(r => !newRoles.includes(r));

    updateUserMutation.mutate({
      userId: userToEdit.id,
      updates: {
        full_name: editForm.full_name,
        notifications_enabled: editForm.notifications_enabled
      },
      rolesToAdd,
      rolesToRemove
    });
  };

  const toggleRole = (role: string) => {
    setEditForm(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const filteredUsers = users?.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Gestão de Usuários
        </CardTitle>
        <CardDescription>
          Gerenciar todos os usuários do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Cadastrado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredUsers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name || "Sem nome"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {user.roles.map((role) => (
                          <Badge
                            key={role.id}
                            variant={
                              role.role === "admin"
                                ? "destructive"
                                : role.role === "angel"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {role.role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at!).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setSelectedUser(user)}
                          title="Visualizar detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleEditUser(user)}
                          title="Editar usuário"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Resetar Senha"
                          onClick={() => setUserToResetPassword({ id: user.id, email: user.email || '' })}
                        >
                          <KeyRound className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setUserToDelete(user.id)}
                          title="Deletar usuário"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o usuário <strong>{users?.find(u => u.id === userToDelete)?.full_name || users?.find(u => u.id === userToDelete)?.email}</strong>? 
              Esta ação não pode ser desfeita e todos os dados relacionados serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUserMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Deletando..." : "Deletar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!userToResetPassword} onOpenChange={() => setUserToResetPassword(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar senha</AlertDialogTitle>
            <AlertDialogDescription>
              Um email de redefinição de senha será enviado para <strong>{userToResetPassword?.email}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetPasswordMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToResetPassword && resetPasswordMutation.mutate(userToResetPassword.id)}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? "Enviando..." : "Enviar email"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Visualização */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>
              Informações completas do usuário
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">ID</Label>
                  <p className="text-sm font-mono">{selectedUser.id}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Nome Completo</Label>
                  <p className="text-sm">{selectedUser.full_name || "Não informado"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Notificações</Label>
                  <p className="text-sm">{selectedUser.notifications_enabled ? "Habilitadas" : "Desabilitadas"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Cadastrado em</Label>
                  <p className="text-sm">{new Date(selectedUser.created_at!).toLocaleString("pt-BR")}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Última atualização</Label>
                  <p className="text-sm">{new Date(selectedUser.updated_at!).toLocaleString("pt-BR")}</p>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Roles do Sistema</Label>
                <div className="flex gap-2 flex-wrap">
                  {selectedUser.roles.length > 0 ? (
                    selectedUser.roles.map((role) => (
                      <Badge
                        key={role.id}
                        variant={
                          role.role === "admin"
                            ? "destructive"
                            : role.role === "angel"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {role.role}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma role atribuída</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={!!userToEdit} onOpenChange={() => setUserToEdit(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Altere as informações do usuário
            </DialogDescription>
          </DialogHeader>
          {userToEdit && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  placeholder="Digite o nome completo"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={userToEdit.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  O email não pode ser alterado por questões de segurança
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="notifications">Notificações Habilitadas</Label>
                <Switch
                  id="notifications"
                  checked={editForm.notifications_enabled}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, notifications_enabled: checked })}
                />
              </div>

              <div className="space-y-3">
                <Label>Roles do Usuário</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="role-user"
                      checked={editForm.roles.includes('user')}
                      onCheckedChange={() => toggleRole('user')}
                    />
                    <Label htmlFor="role-user" className="font-normal cursor-pointer">
                      User (Usuário comum)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="role-angel"
                      checked={editForm.roles.includes('angel')}
                      onCheckedChange={() => toggleRole('angel')}
                    />
                    <Label htmlFor="role-angel" className="font-normal cursor-pointer">
                      Angel (Guardião/Cuidador)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="role-admin"
                      checked={editForm.roles.includes('admin')}
                      onCheckedChange={() => toggleRole('admin')}
                    />
                    <Label htmlFor="role-admin" className="font-normal cursor-pointer">
                      Admin (Administrador)
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserToEdit(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
