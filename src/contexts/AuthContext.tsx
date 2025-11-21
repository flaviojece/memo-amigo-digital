import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isAngel: boolean;
  hasPatients: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAngel, setIsAngel] = useState(false);
  const [hasPatients, setHasPatients] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin'
      });

      if (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(!!data);
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    }
  };

  const checkAngelRole = async (userId: string) => {
    try {
      // Check if has 'angel' role
      const { data: roleData, error: roleError } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'angel'
      });

      if (roleError) {
        console.error('Error checking angel role:', roleError);
        setIsAngel(false);
      } else {
        setIsAngel(!!roleData);
      }

      // Check if has patients linked (is a guardian)
      const { data: patientsData, error: patientsError } = await supabase.rpc('get_patients_for_guardian', {
        _guardian_id: userId
      });

      if (patientsError) {
        console.error('Error checking patients:', patientsError);
        setHasPatients(false);
      } else {
        setHasPatients((patientsData?.length || 0) > 0);
      }
    } catch (error) {
      console.error('Error checking angel role:', error);
      setIsAngel(false);
      setHasPatients(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth event:', event, 'User:', session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setSession(session);
          await checkAdminRole(session.user.id);
          await checkAngelRole(session.user.id);
          setLoading(false); // ✅ FIX: Reset loading after sign in
          console.log('[AuthContext] Sign in complete, loading=false');
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setIsAdmin(false);
          setIsAngel(false);
          setHasPatients(false);
          setLoading(false); // ✅ FIX: Reset loading after sign out
          console.log('[AuthContext] Sign out complete, loading=false');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[AuthContext] Initial session check:', session?.user?.email);
      if (session?.user) {
        setUser(session.user);
        setSession(session);
        await checkAdminRole(session.user.id);
        await checkAngelRole(session.user.id);
      }
      setLoading(false);
      console.log('[AuthContext] Initial load complete, loading=false');
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let message = "Erro ao fazer login";
        if (error.message.includes("Invalid login credentials")) {
          message = "Email ou senha incorretos";
        }
        toast({
          title: "Erro",
          description: message,
          variant: "destructive",
        });
      }

      return { error };
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        let message = "Erro ao criar conta";
        if (error.message.includes("already registered")) {
          message = "Este email já está cadastrado";
        }
        toast({
          title: "Erro",
          description: message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Conta criada!",
          description: "Bem-vindo ao Dr. Memo",
        });
      }

      return { error };
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsAngel(false);
    setHasPatients(false);
    toast({
      title: "Até logo!",
      description: "Você saiu do Dr. Memo",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        isAngel,
        hasPatients,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
