import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function SmartRouter() {
  const { isAngel, hasPatients, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    // Check localStorage for user preference
    const preference = localStorage.getItem('interface-preference');
    
    if (preference === '/angel' && isAngel && hasPatients) {
      navigate('/angel');
      return;
    }

    if (preference === '/patient') {
      navigate('/patient');
      return;
    }

    // Auto-detect based on roles
    if (isAngel && hasPatients) {
      navigate('/angel');
    } else {
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
