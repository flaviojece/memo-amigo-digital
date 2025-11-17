import { Heart, Wifi, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function WelcomeHeader() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const getUserName = () => {
    if (!user) return "Usuário";
    
    const fullName = user.user_metadata?.full_name;
    if (fullName) {
      return fullName.split(' ')[0];
    }
    
    return user.email?.split('@')[0] || "Usuário";
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <header className="bg-gradient-warm text-primary-foreground p-6 rounded-b-memo shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-senior-xl font-bold">Dr. Memo</h1>
            <p className="text-white/90 text-senior-sm">Cuidando de você</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-white/90">
          {isOnline ? (
            <Wifi className="w-5 h-5" />
          ) : (
            <WifiOff className="w-5 h-5" />
          )}
          <span className="text-senior-xs">
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-senior-2xl font-bold mb-2">
          {getGreeting()}, {getUserName()}! 👋
        </h2>
        <p className="text-white/90 text-senior-base capitalize mb-1">
          {formatDate()}
        </p>
        <p className="text-white/95 text-senior-lg font-semibold">
          {formatTime()}
        </p>
      </div>
    </header>
  );
}