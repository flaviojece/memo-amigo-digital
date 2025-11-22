import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DevReset() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [adminData, setAdminData] = useState({
    email: "flaviojece@gmail.com",
    password: "@Flavio39",
    fullName: "Flavio Robson de Moura"
  });

  const handleReset = async () => {
    if (!confirmed) {
      toast.error("Confirme que deseja prosseguir");
      return;
    }

    setLoading(true);

    try {
      // Passo 1: Deletar todos os usuários
      const { data: deleteData, error: deleteError } = await supabase.functions.invoke('reset-all-users', {
        body: { deleteAllOnly: true }
      });

      if (deleteError) throw deleteError;

      console.log("Usuários deletados:", deleteData);
      toast.success(`${deleteData.usersDeleted || 0} usuários deletados`);

      // Aguardar um pouco para garantir que a limpeza foi concluída
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Passo 2: Criar novo admin
      const { data: createData, error: createError } = await supabase.functions.invoke('create-first-admin', {
        body: {
          email: adminData.email,
          password: adminData.password,
          fullName: adminData.fullName
        }
      });

      if (createError) throw createError;

      if (createData?.error) {
        throw new Error(createData.error);
      }

      toast.success("Admin criado com sucesso!");
      toast.info("Redirecionando para login...");

      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error: any) {
      console.error('Erro no reset:', error);
      toast.error(error.message || "Erro ao resetar banco de dados");
    } finally {
      setLoading(false);
      setConfirmed(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/5 via-background to-background p-4">
      <Card className="w-full max-w-md border-destructive/50">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2 text-destructive">
            <AlertTriangle className="h-6 w-6" />
            Reset de Desenvolvimento
          </CardTitle>
          <CardDescription className="text-center">
            Esta ação irá deletar TODOS os usuários e criar um novo admin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>ATENÇÃO:</strong> Esta ação é irreversível e deve ser usada apenas em ambiente de desenvolvimento!
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email do novo admin</Label>
              <Input
                id="email"
                type="email"
                value={adminData.email}
                onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha do novo admin</Label>
              <Input
                id="password"
                type="text"
                value={adminData.password}
                onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input
                id="fullName"
                type="text"
                value={adminData.fullName}
                onChange={(e) => setAdminData({ ...adminData, fullName: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="confirm"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                disabled={loading}
                className="h-4 w-4"
              />
              <Label htmlFor="confirm" className="text-sm font-normal cursor-pointer">
                Confirmo que quero deletar TODOS os usuários
              </Label>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/login')}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleReset}
                disabled={loading || !confirmed}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetando...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Resetar Tudo
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
