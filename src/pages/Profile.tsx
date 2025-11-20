import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfilePageProps {
  onBackToMore: () => void;
}

interface ProfileData {
  full_name: string;
  email: string;
}

export default function Profile({ onBackToMore }: ProfilePageProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const loadProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const getInitials = () => {
    if (!profile?.full_name) return "U";
    const names = profile.full_name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return profile.full_name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col min-h-[60vh] p-6 pb-32 space-y-6">
      <Button
        onClick={onBackToMore}
        variant="ghost"
        size="sm"
        className="group flex items-center gap-3 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 mb-2"
      >
        <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="text-senior-sm font-medium">Voltar para Configurações</span>
      </Button>

      <div className="space-y-2">
        <h2 className="text-senior-2xl font-display text-foreground">Meu Perfil</h2>
        <p className="text-muted-foreground text-senior-sm">
          Visualize e edite suas informações pessoais
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-senior-lg">Informações Pessoais</CardTitle>
            <Button
              onClick={() => setIsEditorOpen(true)}
              size="lg"
              className="text-senior-base"
            >
              <Edit className="mr-2 h-5 w-5" />
              Editar Perfil
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <>
              <div className="flex items-center justify-center py-8">
                <Skeleton className="h-24 w-24 rounded-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center py-4">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <User className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-muted-foreground text-senior-sm mb-1">Nome Completo</p>
                    <p className="text-foreground text-senior-lg font-semibold break-words">
                      {profile?.full_name || "Não informado"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Mail className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-muted-foreground text-senior-sm mb-1">Email</p>
                    <p className="text-foreground text-senior-lg font-semibold break-all">
                      {profile?.email || "Não informado"}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {profile && (
        <ProfileEditor
          open={isEditorOpen}
          onOpenChange={setIsEditorOpen}
          currentName={profile.full_name}
          currentEmail={profile.email}
          onProfileUpdated={loadProfile}
        />
      )}
    </div>
  );
}
