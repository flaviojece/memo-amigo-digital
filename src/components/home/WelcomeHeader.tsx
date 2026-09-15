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
  return <header className="bg-gradient-warm text-primary-foreground px-4 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))] rounded-b-memo shadow-card sm:p-6">
      <div className="text-center mb-3">
        <h1 className="font-bold text-primary-foreground text-senior-lg py-3 leading-tight">Dr. Memo<br />Cuidando de você</h1>
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-senior-xl font-bold text-primary-foreground mb-1 break-words">
          {getGreeting()}, {getUserName()}! 👋
        </h2>
        <p className="text-primary-foreground/80 text-senior-sm capitalize">
          {formatDate()}
        </p>
        <div className="grid grid-cols-[48px_1fr_72px] items-center gap-2">
          <div />
          <p className="text-primary-foreground/95 text-senior-lg font-semibold text-center">
            {formatTime()}
          </p>
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sair" className="min-h-[48px] px-3 bg-accent text-accent-foreground hover:bg-accent/90 transition-all font-semibold shadow-sm">
              SAIR
            </Button>
          </div>
        </div>
      </div>
    </header>;
}