import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGuardianRelationships } from '@/hooks/useGuardianRelationships';
import { PatientSelectorCompact } from '@/components/angel/PatientSelectorCompact';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, MapPin, Pill, Calendar, Home, ArrowLeft, LogOut, UserPlus } from 'lucide-react';
import { MedicationList } from '@/components/medications/MedicationList';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { LiveLocationMap } from '@/components/location/LiveLocationMap';
import { useSuggestions } from '@/hooks/useSuggestions';
import { SuggestionCard } from '@/components/angel/SuggestionCard';
import { MedicationSuggestionDialog } from '@/components/angel/MedicationSuggestionDialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AngelDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { patients, loading: loadingPatients } = useGuardianRelationships();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'location' | 'medications' | 'appointments' | 'suggestions'>('overview');
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);

  const { suggestions, approveSuggestion, rejectSuggestion, loading: loadingSuggestions } = useSuggestions(selectedPatientId || undefined);

  const { data: medications, isLoading: loadingMeds, refetch: refetchMeds } = useQuery({
    queryKey: ['medications', selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return [];
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', selectedPatientId)
        .eq('active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(med => ({
        ...med,
        times: Array.isArray(med.times) ? med.times : JSON.parse(med.times as string)
      }));
    },
    enabled: !!selectedPatientId
  });

  const { data: appointments, isLoading: loadingAppts, refetch: refetchAppts } = useQuery({
    queryKey: ['appointments', selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return [];
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', selectedPatientId)
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedPatientId
  });

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');

  const handleSuggestMedication = () => {
    setShowSuggestionDialog(true);
  };

  // Show loading screen while auth is initializing
  if (authLoading || loadingPatients) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/10 to-accent/10">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-secondary animate-pulse mx-auto" />
          <p className="text-senior-lg text-muted-foreground">Carregando painel do anjo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/10 to-accent/10 pb-24">
      {/* Header */}
      <header className="bg-card shadow-md p-6 border-b-4 border-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-secondary" />
              <div>
                <h1 className="text-senior-2xl font-bold text-foreground">
                  Painel do Anjo
                </h1>
                <p className="text-senior-sm text-muted-foreground">
                  Gerenciando cuidados de {patients.length} paciente(s)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Voltar ao Início
              </Button>
              <Button
                onClick={signOut}
                variant="destructive"
                size="lg"
                className="gap-2"
              >
                <LogOut className="w-5 h-5" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 space-y-4">
        {patients.length === 0 ? (
          <Card className="p-8 text-center">
            <UserPlus className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">
              Bem-vindo ao Painel do Anjo!
            </h3>
            <p className="text-muted-foreground mb-4">
              Você ainda não está cuidando de nenhum paciente.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Peça para um paciente te enviar um convite através do app,
              ou compartilhe seu email: <strong>{user?.email}</strong>
            </p>
          </Card>
        ) : (
          <>
            {/* Patient Selector */}
            <PatientSelectorCompact
              selectedPatientId={selectedPatientId}
              onSelect={setSelectedPatientId}
            />

            {selectedPatientId && (
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
            <TabsList className="grid w-full grid-cols-5 h-auto">
              <TabsTrigger value="overview" className="text-senior-sm py-3 flex flex-col gap-1">
                <Home className="w-5 h-5" />
                <span>Visão Geral</span>
              </TabsTrigger>
              <TabsTrigger value="location" className="text-senior-sm py-3 flex flex-col gap-1">
                <MapPin className="w-5 h-5" />
                <span>Localização</span>
              </TabsTrigger>
              <TabsTrigger value="medications" className="text-senior-sm py-3 flex flex-col gap-1">
                <Pill className="w-5 h-5" />
                <span>Medicamentos</span>
              </TabsTrigger>
              <TabsTrigger value="appointments" className="text-senior-sm py-3 flex flex-col gap-1">
                <Calendar className="w-5 h-5" />
                <span>Consultas</span>
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="text-senior-sm py-3 flex flex-col gap-1 relative">
                <Shield className="w-5 h-5" />
                <span>Sugestões</span>
                {pendingSuggestions.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingSuggestions.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-senior-xl">Resumo do Paciente</CardTitle>
                  <CardDescription>Informações rápidas e alertas</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div className="bg-accent/10 p-4 rounded-lg border border-accent/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Pill className="w-5 h-5 text-accent" />
                      <span className="font-semibold">Medicamentos</span>
                    </div>
                    <p className="text-2xl font-bold">{medications?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Ativos</p>
                  </div>
                  <div className="bg-primary/10 p-4 rounded-lg border border-primary/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Consultas</span>
                    </div>
                    <p className="text-2xl font-bold">{appointments?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Agendadas</p>
                  </div>
                  <div className="bg-secondary/10 p-4 rounded-lg border border-secondary/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-secondary" />
                      <span className="font-semibold">Sugestões</span>
                    </div>
                    <p className="text-2xl font-bold">{pendingSuggestions.length}</p>
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="location" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-senior-xl flex items-center gap-2">
                    <MapPin className="w-6 h-6" />
                    Localização em Tempo Real
                  </CardTitle>
                  <CardDescription>
                    Acompanhe onde o paciente está agora
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <LiveLocationMap 
                    patientId={selectedPatientId} 
                    onClose={() => {}} 
                    variant="inline"
                    isVisible={activeTab === "location"}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="medications" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-senior-xl">Medicamentos</CardTitle>
                      <CardDescription>Visualização e sugestões</CardDescription>
                    </div>
                    <Button onClick={handleSuggestMedication} size="lg" className="gap-2">
                      <Pill className="w-5 h-5" />
                      Sugerir Medicamento
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <MedicationList
                    medications={medications || []}
                    isLoading={loadingMeds}
                    onEdit={() => toast.info('Como anjo, você pode apenas visualizar. Use "Sugerir" para propor mudanças.')}
                    onRefetch={refetchMeds}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appointments" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-senior-xl">Consultas</CardTitle>
                  <CardDescription>Visualização e acompanhamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <AppointmentList
                    appointments={appointments || []}
                    isLoading={loadingAppts}
                    onEdit={() => toast.info('Como anjo, você pode apenas visualizar.')}
                    onRefetch={refetchAppts}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-senior-xl">Minhas Sugestões</CardTitle>
                  <CardDescription>
                    Sugestões enviadas para este paciente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingSuggestions ? (
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 text-muted-foreground animate-pulse mx-auto mb-4" />
                      <p className="text-muted-foreground">Carregando sugestões...</p>
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-lg">
                      <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-senior-base text-muted-foreground">
                        Nenhuma sugestão ainda
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Use os botões "Sugerir" para propor mudanças
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {suggestions.map((suggestion) => (
                        <SuggestionCard
                          key={suggestion.id}
                          suggestion={suggestion}
                          isPatientView={false}
                          onApprove={approveSuggestion}
                          onReject={rejectSuggestion}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
            )}
          </>
        )}
      </div>

      {selectedPatientId && (
        <MedicationSuggestionDialog
          patientId={selectedPatientId}
          open={showSuggestionDialog}
          onOpenChange={setShowSuggestionDialog}
        />
      )}
    </div>
  );
}
