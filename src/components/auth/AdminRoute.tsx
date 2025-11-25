import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen message="Carregando painel administrativo..." />;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/patient" replace />;
  }

  return <>{children}</>;
};
