import { Wifi, WifiOff, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
export function WelcomeHeader() {
  const {
    user,
    signOut
  } = useAuth();
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
      day: 'numeric',
      month: 'long'
    });
  };
  const formatTime = () => {
    return currentTime.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  return <header className="bg-gradient-warm text-primary-foreground p-6 rounded-b-memo shadow-card">
      <div className="grid grid-cols-[1fr_auto] items-center mb-3">
        <div className="text-center">
          <h1 className="text-senior-xl font-bold text-white whitespace-nowrap text-center mx-[0px] px-[0px] py-[25px]">Dr. Memo</h1>
          <p className="text-white/70 text-senior-xs whitespace-nowrap">Cuidando de você</p>
        </div>
        
        <div className="flex items-center gap-3 justify-end">
          <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sair" className="h-8 px-3 mr-3 text-white/70 hover:text-white hover:bg-white/10 transition-all font-semibold text-justify mx-[11px]">
            SAIR
          </Button>
        </div>
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-senior-xl font-bold text-white mb-1">
          {getGreeting()}, {getUserName()}! 👋
        </h2>
        <p className="text-white/80 text-senior-sm capitalize">
          {formatDate()}
        </p>
        <p className="text-white/95 text-senior-lg font-semibold">
          {formatTime()}
        </p>
      </div>
    </header>;
}