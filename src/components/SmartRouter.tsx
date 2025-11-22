import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function SmartRouter() {
  const { isAngel, hasPatients, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[SmartRouter] State:', { loading, isAngel, hasPatients });
    
    if (loading) {
      console.log('[SmartRouter] Still loading, waiting...');
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
  }, [isAngel, hasPatients, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-senior-lg text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}
