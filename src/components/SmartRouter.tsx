import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabaseStatus } from '@/hooks/useDatabaseStatus';

export function SmartRouter() {
  const { isAngel, isAdmin, hasPatients, loading } = useAuth();
  const { isEmpty, loading: dbLoading } = useDatabaseStatus();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[SmartRouter] State:', { loading, dbLoading, isEmpty, isAngel, isAdmin, hasPatients });
    
    // Aguardar ambas as verificações
    if (loading || dbLoading) {
      console.log('[SmartRouter] Still loading, waiting...');
      return;
    }

    // Se o banco está vazio, redirecionar para setup inicial
    if (isEmpty === true) {
      console.log('[SmartRouter] Database is empty, redirecting to setup...');
      navigate('/setup-inicial', { replace: true });
      return;
    }

    // Admins always go to admin dashboard first
    if (isAdmin) {
      const adminPreference = localStorage.getItem('admin-last-view');
      console.log('[SmartRouter] Admin user, preference:', adminPreference);
      
      if (adminPreference) {
        navigate(adminPreference);
      } else {
        navigate('/admin');
      }
      return;
    }

    // Check localStorage for user preference
    const preference = localStorage.getItem('interface-preference');
    console.log('[SmartRouter] User preference:', preference);
    
    if (preference === '/angel' && isAngel && hasPatients) {
      console.log('[SmartRouter] Navigating to /angel (preference)');
      navigate('/angel');
      return;
    }

    if (preference === '/patient') {
      console.log('[SmartRouter] Navigating to /patient (preference)');
      navigate('/patient');
      return;
    }

    // Auto-detect based on roles
    if (isAngel) {
      // Se é anjo, vai pro dashboard do anjo (mesmo sem pacientes ainda)
      console.log('[SmartRouter] Navigating to /angel (auto-detect)');
      navigate('/angel');
    } else {
      console.log('[SmartRouter] Navigating to /patient (default)');
      navigate('/patient');
    }
  }, [isAngel, isAdmin, hasPatients, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-senior-lg text-muted-foreground">
          {dbLoading ? "Verificando sistema..." : "Carregando..."}
        </p>
      </div>
    </div>
  );
}
