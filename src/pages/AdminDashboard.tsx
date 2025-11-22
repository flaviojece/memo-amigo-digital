import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, LogOut, LayoutDashboard, Users, Heart, MapPin } from "lucide-react";
import { AdminMetrics } from "@/components/admin/AdminMetrics";
import { UsersManagement } from "@/components/admin/UsersManagement";
import { PatientsManagement } from "@/components/admin/PatientsManagement";
import { LocationsMonitoring } from "@/components/admin/LocationsMonitoring";
import { toast } from "sonner";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { signOut, isAdmin } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/patient");
      return;
    }

    loadStats();
  }, [isAdmin, navigate]);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const { data, error } = await supabase.rpc("get_admin_stats");
      
      if (error) throw error;
      
      setStats(data);
    } catch (error: any) {
      console.error("Erro ao carregar estatísticas:", error);
      toast.error("Erro ao carregar estatísticas");
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-primary">
                <Shield className="h-8 w-8" />
                <div>
                  <h1 className="text-2xl font-bold">Painel Administrativo</h1>
                  <p className="text-sm text-muted-foreground">Dr. Memo - Controle Total</p>
                </div>
              </div>
            </div>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="patients" className="gap-2">
              <Heart className="h-4 w-4" />
              Pacientes
            </TabsTrigger>
            <TabsTrigger value="locations" className="gap-2">
              <MapPin className="h-4 w-4" />
              Localizações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
              <p className="text-muted-foreground">
                Visão geral completa do sistema Dr. Memo
              </p>
            </div>
            <AdminMetrics stats={stats} loading={loadingStats} />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UsersManagement />
          </TabsContent>

          <TabsContent value="patients" className="space-y-6">
            <PatientsManagement />
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            <LocationsMonitoring />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
